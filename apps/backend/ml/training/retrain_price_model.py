from __future__ import annotations

import argparse
import json
from datetime import datetime, timedelta, timezone
from pathlib import Path
from typing import Iterable, Optional

import joblib
import numpy as np
import pandas as pd
from prophet import Prophet
from prophet.serialize import model_from_json


DEFAULT_PAIRS = [
    ("rice", "patna"),
    ("rice", "pune"),
    ("wheat", "patna"),
    ("wheat", "lucknow"),
    ("maize", "nagpur"),
    ("mustard", "jaipur"),
]


def _slug(value: str) -> str:
    return "".join(ch.lower() if ch.isalnum() else "_" for ch in value).strip("_")


def _model_key(crop: str, market: str) -> str:
    return f"{_slug(crop)}__{_slug(market)}"


def _safe_mape(actual: np.ndarray, predicted: np.ndarray) -> float:
    denominator = np.where(np.abs(actual) < 1e-6, 1.0, np.abs(actual))
    return float(np.mean(np.abs((actual - predicted) / denominator)) * 100)


def _design_matrix(t: np.ndarray) -> np.ndarray:
    return np.column_stack(
        [
            np.ones_like(t),
            t,
            np.sin(2 * np.pi * t / 7),
            np.cos(2 * np.pi * t / 7),
            np.sin(2 * np.pi * t / 30),
            np.cos(2 * np.pi * t / 30),
            np.sin(2 * np.pi * t / 365),
            np.cos(2 * np.pi * t / 365),
        ]
    )


def _fit_seasonal_linear(train_df: pd.DataFrame) -> dict:
    start = pd.to_datetime(train_df["ds"]).min()
    t = (pd.to_datetime(train_df["ds"]) - start).dt.days.to_numpy(dtype=float)
    y = train_df["y"].to_numpy(dtype=float)
    x = _design_matrix(t)
    coef, *_ = np.linalg.lstsq(x, y, rcond=None)
    residuals = y - (x @ coef)
    sigma = float(np.std(residuals)) if len(residuals) else 1.0
    return {
        "artifact_type": "seasonal_linear",
        "start_date": start.date().isoformat(),
        "last_date": pd.to_datetime(train_df["ds"]).max().date().isoformat(),
        "coef": [float(value) for value in coef.tolist()],
        "sigma": max(sigma, 1.0),
        "interval_width": 0.90,
    }


def _predict_seasonal_linear(artifact: dict, dates: pd.Series) -> pd.DataFrame:
    start = pd.to_datetime(artifact["start_date"])
    t = (pd.to_datetime(dates) - start).dt.days.to_numpy(dtype=float)
    x = _design_matrix(t)
    coef = np.array(artifact["coef"], dtype=float)
    yhat = x @ coef
    sigma = float(artifact.get("sigma", 1.0))
    z = 1.64
    lower = yhat - z * sigma
    upper = yhat + z * sigma
    return pd.DataFrame(
        {
            "ds": pd.to_datetime(dates),
            "yhat": yhat,
            "yhat_lower": lower,
            "yhat_upper": upper,
        }
    )


def load_or_generate_price_history(csv_path: Path) -> pd.DataFrame:
    if csv_path.exists():
        data = pd.read_csv(csv_path)
    else:
        rng = np.random.default_rng(42)
        start_date = datetime.now(timezone.utc).date() - timedelta(days=900)
        rows = []
        crop_base = {
            "rice": 2200,
            "wheat": 2450,
            "maize": 1950,
            "mustard": 5600,
            "chana": 5200,
            "soybean": 4200,
        }
        markets = ["patna", "pune", "lucknow", "jaipur", "nagpur"]
        for crop, base_price in crop_base.items():
            for market in markets:
                offset = (abs(hash(f"{crop}:{market}")) % 130) - 65
                for day in range(900):
                    ds = start_date + timedelta(days=day)
                    seasonal = 130 * np.sin(2 * np.pi * day / 30)
                    yearly = 200 * np.sin(2 * np.pi * day / 365)
                    trend = day * 0.35
                    noise = rng.normal(0, 55)
                    price = max(100.0, base_price + offset + seasonal + yearly + trend + noise)
                    rows.append(
                        {
                            "ds": ds.isoformat(),
                            "y": round(float(price), 2),
                            "crop": crop,
                            "market": market,
                        }
                    )
        data = pd.DataFrame(rows)
        csv_path.parent.mkdir(parents=True, exist_ok=True)
        data.to_csv(csv_path, index=False)

    required_cols = {"ds", "y", "crop", "market"}
    missing = required_cols - set(data.columns)
    if missing:
        raise ValueError(f"Price history file missing columns: {', '.join(sorted(missing))}")

    data = data.copy()
    data["crop"] = data["crop"].astype(str).str.strip().str.lower()
    data["market"] = data["market"].astype(str).str.strip().str.lower()
    data["ds"] = pd.to_datetime(data["ds"], errors="coerce")
    data["y"] = pd.to_numeric(data["y"], errors="coerce")
    data = data.dropna(subset=["ds", "y", "crop", "market"])
    data = data.sort_values(["crop", "market", "ds"]).reset_index(drop=True)
    return data


def train_price_model_for_pair(
    history_df: pd.DataFrame,
    crop: str,
    market: str,
    artifact_dir: Path,
) -> dict:
    crop_key = crop.strip().lower()
    market_key = market.strip().lower()
    pair_df = history_df[(history_df["crop"] == crop_key) & (history_df["market"] == market_key)][["ds", "y"]].copy()
    if len(pair_df) < 120:
        raise ValueError(f"Not enough historical data for {crop_key}/{market_key}: {len(pair_df)} rows")

    pair_df = pair_df.sort_values("ds").reset_index(drop=True)
    holdout_days = min(60, max(30, int(len(pair_df) * 0.15)))
    train_df = pair_df.iloc[:-holdout_days]
    holdout_df = pair_df.iloc[-holdout_days:]

    model_type = "prophet"
    prophet_model = None
    fallback_artifact: dict | None = None
    try:
        model = Prophet(
            daily_seasonality=False,
            weekly_seasonality=True,
            yearly_seasonality=True,
            interval_width=0.9,
        )
        model.fit(train_df)

        backtest_future = model.make_future_dataframe(periods=holdout_days, include_history=False)
        backtest_forecast = model.predict(backtest_future)
        backtest_yhat = backtest_forecast["yhat"].to_numpy()
        mape = _safe_mape(holdout_df["y"].to_numpy(), backtest_yhat)

        final_model = Prophet(
            daily_seasonality=False,
            weekly_seasonality=True,
            yearly_seasonality=True,
            interval_width=0.9,
        )
        final_model.fit(pair_df)
        prophet_model = final_model
    except Exception as exc:
        model_type = "seasonal_linear_fallback"
        linear_model = _fit_seasonal_linear(train_df)
        backtest_forecast = _predict_seasonal_linear(linear_model, holdout_df["ds"])
        mape = _safe_mape(holdout_df["y"].to_numpy(), backtest_forecast["yhat"].to_numpy())
        fallback_artifact = _fit_seasonal_linear(pair_df)
        fallback_artifact["fallback_reason"] = str(exc)

    key = _model_key(crop_key, market_key)
    artifact_dir.mkdir(parents=True, exist_ok=True)
    if prophet_model is not None:
        model_path = artifact_dir / f"{key}.joblib"
        joblib.dump(prophet_model, model_path)
    else:
        model_path = artifact_dir / f"{key}.json"
        model_path.write_text(json.dumps(fallback_artifact, indent=2), encoding="utf-8")

    return {
        "key": key,
        "crop": crop_key,
        "market": market_key,
        "model_path": str(model_path),
        "model_type": model_type,
        "version": f"{'prophet' if model_type == 'prophet' else 'fallback'}-{datetime.now(timezone.utc).strftime('%Y%m%d%H%M%S')}",
        "mape": round(mape, 3),
        "history_rows": int(len(pair_df)),
        "trained_at": datetime.now(timezone.utc).isoformat(),
    }


def _iter_pairs(history_df: pd.DataFrame, requested_pairs: Optional[Iterable[tuple[str, str]]] = None):
    if requested_pairs:
        for crop, market in requested_pairs:
            yield crop.strip().lower(), market.strip().lower()
        return
    available = history_df[["crop", "market"]].drop_duplicates()
    for _, row in available.iterrows():
        yield row["crop"], row["market"]


def retrain_price_models(
    csv_path: Path | None = None,
    artifact_dir: Path | None = None,
    metadata_path: Path | None = None,
    requested_pairs: Optional[Iterable[tuple[str, str]]] = None,
) -> dict:
    root = Path(__file__).resolve().parents[2]
    csv_path = csv_path or root / "ml" / "price_model" / "price_history.csv"
    artifact_dir = artifact_dir or root / "ml" / "price_model" / "artifacts"
    metadata_path = metadata_path or root / "ml" / "price_model" / "models_metadata.json"

    history = load_or_generate_price_history(csv_path)
    results = []
    for crop, market in _iter_pairs(history, requested_pairs):
        try:
            result = train_price_model_for_pair(history, crop, market, artifact_dir)
            results.append(result)
        except Exception as exc:
            results.append(
                {
                    "crop": crop,
                    "market": market,
                    "error": str(exc),
                }
            )

    payload = {
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "models": [item for item in results if "error" not in item],
        "failures": [item for item in results if "error" in item],
    }
    metadata_path.parent.mkdir(parents=True, exist_ok=True)
    metadata_path.write_text(json.dumps(payload, indent=2), encoding="utf-8")
    return payload


def load_model_from_artifact(model_path: Path):
    if model_path.suffix.lower() == ".joblib":
        return joblib.load(model_path)
    content = model_path.read_text(encoding="utf-8")
    try:
        payload = json.loads(content)
    except json.JSONDecodeError:
        payload = None

    if isinstance(payload, dict) and payload.get("artifact_type") == "seasonal_linear":
        return payload
    return model_from_json(content)


def predict_future(model, periods: int) -> pd.DataFrame:
    if isinstance(model, dict) and model.get("artifact_type") == "seasonal_linear":
        last_date = pd.to_datetime(model["last_date"])
        dates = pd.date_range(start=last_date + timedelta(days=1), periods=periods, freq="D")
        return _predict_seasonal_linear(model, pd.Series(dates))

    future = model.make_future_dataframe(periods=periods, include_history=False)
    return model.predict(future)[["ds", "yhat", "yhat_lower", "yhat_upper"]].copy()


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Retrain Prophet price models")
    parser.add_argument("--crop", type=str, default=None, help="Optional crop for single pair retrain")
    parser.add_argument("--market", type=str, default=None, help="Optional market for single pair retrain")
    args = parser.parse_args()

    if args.crop and args.market:
        output = retrain_price_models(requested_pairs=[(args.crop, args.market)])
    else:
        output = retrain_price_models(requested_pairs=DEFAULT_PAIRS)
    print(json.dumps(output, indent=2))
