from __future__ import annotations

import json
from datetime import datetime, timezone
from pathlib import Path
from typing import Iterable

import numpy as np
import pandas as pd
from prophet import Prophet

from data_pipeline.versioning import load_dataset_manifest
from ml.common.config import PRICE_PATHS, ensure_ml_directories
from ml.common.feature_engineering import add_price_features
from ml.common.model_registry import register_model
from ml.common.utils import atomic_write_json, read_json, slugify, utcnow_iso
from ml.price.dataset_loader import build_price_history_dataset
from ml.price.model import PriceResidualLSTM
from ml.price.model import save_bundle
from ml.monitoring.metrics_logger import log_training_metrics

try:
    from statsmodels.tsa.arima.model import ARIMA
except Exception as exc:  # pragma: no cover - optional import
    ARIMA = None
    ARIMA_IMPORT_ERROR = exc
else:
    ARIMA_IMPORT_ERROR = None

try:
    import torch
except Exception:  # pragma: no cover - optional dependency guard
    torch = None


def _safe_mape(actual: np.ndarray, predicted: np.ndarray) -> float:
    denominator = np.where(np.abs(actual) < 1e-6, 1.0, np.abs(actual))
    return float(np.mean(np.abs((actual - predicted) / denominator)) * 100)


def _pair_key(crop: str, market: str) -> str:
    return f"{slugify(crop)}__{slugify(market)}"


def _fit_prophet(train_df: pd.DataFrame) -> Prophet:
    model = Prophet(
        daily_seasonality=False,
        weekly_seasonality=True,
        yearly_seasonality=True,
        interval_width=0.9,
    )
    model.fit(train_df[["ds", "y"]])
    return model


def _fit_residual_model(residuals: pd.Series):
    if ARIMA is None or len(residuals) < 60:
        return None
    try:
        fitted = ARIMA(
            residuals.astype(float),
            order=(2, 0, 2),
            seasonal_order=(1, 0, 1, 7),
            enforce_stationarity=False,
            enforce_invertibility=False,
        ).fit()
        return fitted
    except Exception:
        return None


def _fit_lstm_residual_model(residuals: pd.Series) -> dict | None:
    if torch is None or len(residuals) < 120:
        return None
    sequence_length = 21
    values = residuals.astype("float32").to_numpy()
    if len(values) <= sequence_length + 10:
        return None

    windows = []
    targets = []
    for idx in range(sequence_length, len(values)):
        windows.append(values[idx - sequence_length : idx])
        targets.append(values[idx])
    if not windows:
        return None

    x_train = torch.tensor(np.asarray(windows, dtype=np.float32)).unsqueeze(-1)
    y_train = torch.tensor(np.asarray(targets, dtype=np.float32)).unsqueeze(-1)
    model = PriceResidualLSTM(hidden_size=24, num_layers=1)
    optimizer = torch.optim.Adam(model.parameters(), lr=0.001)
    criterion = torch.nn.SmoothL1Loss()

    model.train()
    for _ in range(12):
        optimizer.zero_grad()
        predictions = model(x_train)
        loss = criterion(predictions, y_train)
        loss.backward()
        optimizer.step()

    return {
        "state_dict": model.state_dict(),
        "sequence_length": sequence_length,
        "hidden_size": 24,
        "num_layers": 1,
        "history_tail": values[-sequence_length:].tolist(),
        "training_loss": round(float(loss.item()), 6),
    }


def _evaluate_hybrid(
    train_df: pd.DataFrame,
    holdout_df: pd.DataFrame,
) -> tuple[Prophet, object | None, dict | None, float, float]:
    prophet_model = _fit_prophet(train_df)
    history_forecast = prophet_model.predict(train_df[["ds"]])[["ds", "yhat"]]
    residuals = train_df["y"].to_numpy(dtype=float) - history_forecast["yhat"].to_numpy(dtype=float)
    residual_model = _fit_residual_model(pd.Series(residuals))
    lstm_payload = _fit_lstm_residual_model(pd.Series(residuals))

    future = prophet_model.make_future_dataframe(periods=len(holdout_df), include_history=False)
    prophet_prediction = prophet_model.predict(future)[["ds", "yhat"]]
    predicted = prophet_prediction["yhat"].to_numpy(dtype=float)
    residual_sigma = float(np.std(residuals)) if len(residuals) else 1.0
    adjustments: list[np.ndarray] = []
    if residual_model is not None:
        adjustments.append(
            residual_model.get_forecast(steps=len(holdout_df)).predicted_mean.to_numpy()
        )
    if lstm_payload is not None and torch is not None:
        from ml.price.model import PriceModelBundle, _forecast_lstm_residuals

        adjustments.append(
            _forecast_lstm_residuals(
                PriceModelBundle(
                    crop="",
                    market="",
                    prophet_model=prophet_model,
                    residual_model=None,
                    residual_sigma=residual_sigma,
                    lstm_payload=lstm_payload,
                    model_type="prophet_lstm_hybrid",
                    history_rows=len(train_df),
                    mape=0.0,
                    version="temp",
                    last_date=str(train_df["ds"].max().date()),
                ),
                len(holdout_df),
            )
        )
    if adjustments:
        predicted = predicted + np.mean(np.vstack(adjustments), axis=0)
    mape = _safe_mape(holdout_df["y"].to_numpy(dtype=float), predicted)
    return prophet_model, residual_model, lstm_payload, residual_sigma, mape


def train_price_model_for_pair(
    history_df: pd.DataFrame,
    crop: str,
    market: str,
    artifact_dir: Path,
) -> dict:
    crop_key = crop.strip().lower()
    market_key = market.strip().lower()
    pair_df = history_df[(history_df["crop"] == crop_key) & (history_df["market"] == market_key)][
        ["ds", "y", "crop", "market", "state", "district"]
    ].copy()
    if len(pair_df) < 60:
        raise ValueError(
            f"Not enough historical data for {crop_key}/{market_key}: {len(pair_df)} rows"
        )

    pair_df = pair_df.sort_values("ds").reset_index(drop=True)
    pair_df = add_price_features(pair_df)
    holdout_days = min(45, max(14, int(len(pair_df) * 0.15)))
    train_df = pair_df.iloc[:-holdout_days].copy()
    holdout_df = pair_df.iloc[-holdout_days:].copy()

    prophet_model, residual_model, lstm_payload, residual_sigma, mape = _evaluate_hybrid(
        train_df,
        holdout_df,
    )
    final_prophet = _fit_prophet(pair_df)
    final_history_forecast = final_prophet.predict(pair_df[["ds"]])[["ds", "yhat"]]
    final_residuals = pair_df["y"].to_numpy(dtype=float) - final_history_forecast["yhat"].to_numpy(
        dtype=float
    )
    final_residual_model = _fit_residual_model(pd.Series(final_residuals))
    final_lstm_payload = _fit_lstm_residual_model(pd.Series(final_residuals))
    model_type = (
        "prophet_lstm_hybrid"
        if final_lstm_payload is not None
        else "prophet_arima_hybrid"
        if final_residual_model is not None
        else "prophet"
    )
    key = _pair_key(crop_key, market_key)
    model_path = artifact_dir / f"{key}.joblib"

    version = f"{model_type}-{datetime.now(timezone.utc).strftime('%Y%m%d%H%M%S')}"
    save_bundle(
        model_path,
        {
            "crop": crop_key,
            "market": market_key,
            "prophet_model": final_prophet,
            "residual_model": final_residual_model,
            "residual_sigma": float(np.std(final_residuals)) if len(final_residuals) else 1.0,
            "lstm_payload": final_lstm_payload,
            "model_type": model_type,
            "history_rows": int(len(pair_df)),
            "mape": round(float(mape), 3),
            "version": version,
            "last_date": pd.to_datetime(pair_df["ds"]).max().date().isoformat(),
        },
    )
    register_model(
        f"price/{key}",
        version=version,
        artifact_path=model_path,
        metrics={"mape": round(float(mape), 3)},
        extra={"model_type": model_type, "history_rows": int(len(pair_df))},
    )

    return {
        "key": key,
        "crop": crop_key,
        "market": market_key,
        "model_path": str(model_path),
        "model_type": model_type,
        "version": version,
        "mape": round(float(mape), 3),
        "history_rows": int(len(pair_df)),
        "feature_columns": [
            "lag_1",
            "lag_7",
            "lag_30",
            "ma_7",
            "ma_30",
            "volatility_7",
            "month",
            "day_of_week",
            "week_of_year",
            "quarter",
            "is_monsoon",
        ],
        "engines": {
            "prophet": True,
            "arima": final_residual_model is not None,
            "lstm": final_lstm_payload is not None,
        },
        "trained_at": utcnow_iso(),
    }


def retrain_price_models(
    *,
    csv_path: Path | None = None,
    artifact_dir: Path | None = None,
    metadata_path: Path | None = None,
    requested_pairs: Iterable[tuple[str, str]] | None = None,
    force_refresh_dataset: bool = False,
) -> dict:
    ensure_ml_directories()
    csv_path = csv_path or PRICE_PATHS.processed_dataset_path
    artifact_dir = artifact_dir or PRICE_PATHS.artifact_dir
    metadata_path = metadata_path or PRICE_PATHS.metadata_path

    history = build_price_history_dataset(
        force_refresh=force_refresh_dataset,
        processed_path=csv_path,
    )
    if requested_pairs:
        pairs = [(crop.strip().lower(), market.strip().lower()) for crop, market in requested_pairs]
    else:
        grouped = history.groupby(["crop", "market"]).size().sort_values(ascending=False)
        pairs = [(str(crop), str(market)) for crop, market in grouped.index.tolist()]

    models = []
    failures = []
    for crop, market in pairs:
        try:
            models.append(train_price_model_for_pair(history, crop, market, artifact_dir))
        except Exception as exc:
            failures.append({"crop": crop, "market": market, "error": str(exc)})

    payload = {
        "generated_at": utcnow_iso(),
        "models": models,
        "failures": failures,
        "dataset_path": str(csv_path),
        "dataset_version": load_dataset_manifest("price_history").get("active_version"),
    }
    atomic_write_json(metadata_path, payload)
    aggregate_mape = round(
        float(np.mean([item["mape"] for item in models])) if models else 0.0,
        3,
    )
    log_training_metrics(
        "price",
        version=payload["generated_at"],
        metrics={"mape": aggregate_mape},
        dataset_version=payload["dataset_version"],
        extra={"models": len(models), "failures": len(failures)},
    )
    return payload


def load_metadata(path: Path | None = None) -> dict:
    return read_json(path or PRICE_PATHS.metadata_path, {"models": [], "failures": []})


if __name__ == "__main__":
    result = retrain_price_models(force_refresh_dataset=False)
    print(json.dumps(result, indent=2))
