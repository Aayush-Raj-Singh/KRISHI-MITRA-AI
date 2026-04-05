from __future__ import annotations

from dataclasses import dataclass
from pathlib import Path
from typing import Any

import joblib
import numpy as np
import pandas as pd
from prophet import Prophet

try:
    from statsmodels.tsa.arima.model import ARIMAResults
except Exception:  # pragma: no cover - optional typing import
    ARIMAResults = Any

try:
    import torch
except Exception:  # pragma: no cover - optional typing import
    torch = None


class PriceResidualLSTM(torch.nn.Module if torch is not None else object):  # type: ignore[misc]
    def __init__(self, input_size: int = 1, hidden_size: int = 24, num_layers: int = 1) -> None:
        if torch is None:
            raise RuntimeError("torch is required for LSTM residual forecasting")
        super().__init__()
        self.lstm = torch.nn.LSTM(
            input_size=input_size,
            hidden_size=hidden_size,
            num_layers=num_layers,
            batch_first=True,
        )
        self.head = torch.nn.Linear(hidden_size, 1)

    def forward(self, inputs):  # pragma: no cover - exercised through training/inference
        outputs, _ = self.lstm(inputs)
        return self.head(outputs[:, -1, :])


@dataclass
class PriceModelBundle:
    crop: str
    market: str
    prophet_model: Prophet
    residual_model: ARIMAResults | None
    residual_sigma: float
    lstm_payload: dict[str, Any] | None
    model_type: str
    history_rows: int
    mape: float
    version: str
    last_date: str


def save_bundle(path: Path, bundle: dict[str, Any]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    joblib.dump(bundle, path)


def load_bundle(path: Path) -> PriceModelBundle:
    payload = joblib.load(path)
    return PriceModelBundle(
        crop=str(payload["crop"]),
        market=str(payload["market"]),
        prophet_model=payload["prophet_model"],
        residual_model=payload.get("residual_model"),
        residual_sigma=float(payload.get("residual_sigma", 0.0)),
        lstm_payload=payload.get("lstm_payload"),
        model_type=str(payload["model_type"]),
        history_rows=int(payload["history_rows"]),
        mape=float(payload["mape"]),
        version=str(payload["version"]),
        last_date=str(payload["last_date"]),
    )


def _forecast_lstm_residuals(bundle: PriceModelBundle, periods: int) -> np.ndarray:
    payload = bundle.lstm_payload
    if not payload or torch is None:
        return np.zeros(periods, dtype=float)
    try:
        device = "cpu"
        model = PriceResidualLSTM(
            input_size=1,
            hidden_size=int(payload.get("hidden_size", 24)),
            num_layers=int(payload.get("num_layers", 1)),
        ).to(device)
        model.load_state_dict(payload["state_dict"])
        model.eval()
        window = list(payload.get("history_tail", []))
        sequence_length = int(payload.get("sequence_length", 21))
        if len(window) < sequence_length:
            return np.zeros(periods, dtype=float)

        outputs: list[float] = []
        for _ in range(periods):
            values = np.array(window[-sequence_length:], dtype=np.float32).reshape(
                1, sequence_length, 1
            )
            tensor = torch.from_numpy(values).to(device)
            with torch.no_grad():
                prediction = float(model(tensor).cpu().numpy().reshape(-1)[0])
            outputs.append(prediction)
            window.append(prediction)
        return np.asarray(outputs, dtype=float)
    except Exception:
        return np.zeros(periods, dtype=float)


def forecast_from_bundle(bundle: PriceModelBundle, periods: int) -> pd.DataFrame:
    future = bundle.prophet_model.make_future_dataframe(periods=periods, include_history=False)
    prophet_forecast = bundle.prophet_model.predict(future)[
        ["ds", "yhat", "yhat_lower", "yhat_upper"]
    ].copy()

    residual_adjustments: list[np.ndarray] = []
    if bundle.residual_model is not None:
        residual_forecast = bundle.residual_model.get_forecast(steps=periods).predicted_mean
        residual_adjustments.append(residual_forecast.to_numpy())
    if bundle.lstm_payload:
        residual_adjustments.append(_forecast_lstm_residuals(bundle, periods))
    if residual_adjustments:
        prophet_forecast["yhat"] = prophet_forecast["yhat"] + np.mean(
            np.vstack(residual_adjustments),
            axis=0,
        )

    sigma = max(bundle.residual_sigma, 1.0)
    prophet_forecast["yhat_lower"] = prophet_forecast["yhat"] - 1.64 * sigma
    prophet_forecast["yhat_upper"] = prophet_forecast["yhat"] + 1.64 * sigma
    return prophet_forecast
