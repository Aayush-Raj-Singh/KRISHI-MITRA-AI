from __future__ import annotations

import json
from datetime import datetime, timedelta, timezone
from pathlib import Path
from typing import Dict, List, Tuple

import pandas as pd
from ml.training.retrain_price_model import (
    load_model_from_artifact,
    load_or_generate_price_history,
    predict_future,
    retrain_price_models,
    train_price_model_for_pair,
)

from app.core.config import settings
from app.core.logging import get_logger
from app.schemas.recommendations import (
    PriceForecastRequest,
    PriceForecastResponse,
    PriceForecastSeries,
    PriceHistoricalSeries,
)

logger = get_logger(__name__)


class PriceForecaster:
    def __init__(self) -> None:
        self._history_path = settings.price_history_resolved_path
        self._artifact_dir = settings.price_artifact_dir_resolved_path
        self._legacy_artifact_dir = settings.price_artifact_legacy_dir
        self._metadata_path = settings.price_metadata_resolved_path
        self._legacy_metadata_path = settings.price_metadata_legacy_path
        self._model_cache: Dict[str, object] = {}
        self._history_df: pd.DataFrame | None = None

    @staticmethod
    def _key(crop: str, market: str) -> str:
        safe_crop = "".join(ch.lower() if ch.isalnum() else "_" for ch in crop).strip("_")
        safe_market = "".join(ch.lower() if ch.isalnum() else "_" for ch in market).strip("_")
        return f"{safe_crop}__{safe_market}"

    def _history(self) -> pd.DataFrame:
        if self._history_df is None:
            self._history_df = load_or_generate_price_history(self._history_path)
        return self._history_df

    def _read_metadata(self) -> dict:
        metadata_path = (
            self._metadata_path if self._metadata_path.exists() else self._legacy_metadata_path
        )
        if not metadata_path.exists():
            return {"models": [], "failures": []}
        try:
            return json.loads(metadata_path.read_text(encoding="utf-8"))
        except Exception:
            return {"models": [], "failures": []}

    def _write_metadata(self, metadata: dict) -> None:
        self._metadata_path.parent.mkdir(parents=True, exist_ok=True)
        self._metadata_path.write_text(json.dumps(metadata, indent=2), encoding="utf-8")

    def _upsert_model_metadata(self, entry: dict) -> None:
        metadata = self._read_metadata()
        models: List[dict] = metadata.get("models", [])
        models = [item for item in models if item.get("key") != entry.get("key")]
        models.append(entry)
        metadata["models"] = models
        metadata["generated_at"] = datetime.now(timezone.utc).isoformat()
        self._write_metadata(metadata)

    def _resolve_artifact_path(self, key: str) -> Path | None:
        for base_dir in (self._artifact_dir, self._legacy_artifact_dir):
            candidates = [
                base_dir / f"{key}.joblib",
                base_dir / f"{key}.json",
            ]
            for candidate in candidates:
                if candidate.exists():
                    return candidate
        return None

    def _ensure_model(self, crop: str, market: str) -> Tuple[object, dict]:
        crop_key = crop.strip().lower()
        market_key = market.strip().lower()
        key = self._key(crop_key, market_key)

        if key in self._model_cache:
            metadata = self._find_metadata(key)
            return self._model_cache[key], metadata

        model_path = self._resolve_artifact_path(key)
        if not model_path:
            history = self._history()
            try:
                result = train_price_model_for_pair(
                    history, crop_key, market_key, self._artifact_dir
                )
            except ValueError:
                retrain_price_models(
                    csv_path=self._history_path,
                    artifact_dir=self._artifact_dir,
                    metadata_path=self._metadata_path,
                    requested_pairs=[(crop_key, market_key)],
                )
                result = self._find_metadata(key)
                model_path = self._resolve_artifact_path(key)
                if not model_path:
                    available = sorted(self._artifact_dir.glob(f"{crop_key}__*.joblib"))
                    if not available:
                        available = sorted(self._artifact_dir.glob(f"{crop_key}__*.json"))
                    if not available:
                        available = sorted(self._artifact_dir.glob("*.joblib"))
                    if not available:
                        available = sorted(self._artifact_dir.glob("*.json"))
                    if not available:
                        raise ValueError("No price model artifacts available after retraining")
                    model_path = available[0]
                    key = model_path.stem
                    logger.warning(
                        "price_pair_model_missing_using_fallback_model",
                        requested=self._key(crop_key, market_key),
                        used=key,
                    )
                    result = self._find_metadata(key)
            else:
                self._upsert_model_metadata(result)
                model_path = self._resolve_artifact_path(key)

        if not model_path:
            raise ValueError(f"No model artifact resolved for key={key}")

        model = load_model_from_artifact(model_path)
        self._model_cache[key] = model
        metadata = self._find_metadata(key)
        return model, metadata

    def _find_metadata(self, key: str) -> dict:
        metadata = self._read_metadata()
        for item in metadata.get("models", []):
            if item.get("key") == key:
                return item
        return {"key": key, "version": "prophet-unknown", "mape": 0.0}

    def _historical_window(
        self, crop: str, market: str, days: int = 90
    ) -> PriceHistoricalSeries | None:
        history = self._history()
        crop_key = crop.strip().lower()
        market_key = market.strip().lower()

        pair = history[(history["crop"] == crop_key) & (history["market"] == market_key)].copy()
        if pair.empty:
            pair = history[history["crop"] == crop_key].copy()
        if pair.empty:
            return None

        pair = pair.sort_values("ds").tail(days)
        pair["ds"] = pd.to_datetime(pair["ds"]).dt.date
        return PriceHistoricalSeries(
            dates=pair["ds"].tolist(),
            prices=[round(float(value), 2) for value in pair["y"].tolist()],
        )

    def forecast(self, request: PriceForecastRequest) -> PriceForecastResponse:
        model, metadata = self._ensure_model(request.crop, request.market)
        prediction = predict_future(model, periods=90)
        prediction = prediction.sort_values("ds").head(90)

        prediction["ds"] = pd.to_datetime(prediction["ds"]).dt.date
        prediction["yhat"] = prediction["yhat"].clip(lower=1.0)
        prediction["yhat_lower"] = prediction["yhat_lower"].clip(lower=1.0)
        prediction["yhat_upper"] = prediction[["yhat_upper", "yhat"]].max(axis=1)

        series: List[PriceForecastSeries] = []
        for horizon in (30, 60, 90):
            subset = prediction.head(horizon)
            series.append(
                PriceForecastSeries(
                    horizon_days=horizon,
                    dates=subset["ds"].tolist(),
                    forecast=[round(float(value), 2) for value in subset["yhat"].tolist()],
                    lower=[round(float(value), 2) for value in subset["yhat_lower"].tolist()],
                    upper=[round(float(value), 2) for value in subset["yhat_upper"].tolist()],
                )
            )

        response = PriceForecastResponse(
            crop=request.crop,
            market=request.market,
            currency=request.currency,
            series=series,
            historical=self._historical_window(request.crop, request.market, days=90),
            mape=round(float(metadata.get("mape", 0.0)), 3),
            model_version=str(metadata.get("version", "prophet-unknown")),
            created_at=datetime.now(timezone.utc),
            confidence_interval={
                "level": 0.90,
                "description": "Posterior predictive interval (Prophet or seasonal fallback)",
            },
        )
        logger.info(
            "price_forecast_generated",
            model_version=response.model_version,
            crop=request.crop,
            market=request.market,
            mape=response.mape,
        )
        return response
