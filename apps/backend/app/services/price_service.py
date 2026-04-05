from __future__ import annotations

from datetime import datetime, timedelta, timezone
from time import perf_counter
from typing import List

import pandas as pd
from ml.monitoring.metrics_logger import log_inference_metrics
from ml.price.dataset_loader import build_price_history_dataset
from ml.price.predict import predict_price

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
        self._history_df: pd.DataFrame | None = None

    @staticmethod
    def _key(crop: str, market: str) -> str:
        safe_crop = "".join(ch.lower() if ch.isalnum() else "_" for ch in crop).strip("_")
        safe_market = "".join(ch.lower() if ch.isalnum() else "_" for ch in market).strip("_")
        return f"{safe_crop}__{safe_market}"

    def _history(self) -> pd.DataFrame:
        if self._history_df is None:
            self._history_df = build_price_history_dataset(
                force_refresh=False,
                processed_path=self._history_path,
            )
        return self._history_df

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

    def _location_enriched_market_label(
        self,
        crop: str,
        market: str,
        market_context: dict | None = None,
    ) -> str:
        if market_context and market_context.get("district") and market_context.get("state"):
            return f"{market}, {market_context['district']}, {market_context['state']}"
        history = self._history()
        pair = history[
            (history["crop"] == crop.strip().lower())
            & (history["market"] == market.strip().lower())
        ]
        if pair.empty:
            return market
        latest = pair.sort_values("ds").iloc[-1]
        district = str(latest.get("district", "")).strip()
        state = str(latest.get("state", "")).strip()
        return ", ".join(part for part in [market, district, state] if part)

    def forecast_many(self, requests: List[PriceForecastRequest]) -> List[PriceForecastResponse]:
        return [self.forecast(request) for request in requests]

    def forecast(
        self,
        request: PriceForecastRequest,
        market_context: dict | None = None,
    ) -> PriceForecastResponse:
        started_at = perf_counter()
        prediction, metadata = predict_price(request.crop, request.market, periods=90)
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
            model_version=str(metadata.get("version", "prophet-untrained")),
            created_at=datetime.now(timezone.utc),
            confidence_interval={
                "level": 0.90,
                "description": "Posterior predictive interval (Prophet hybrid forecast)",
            },
        )
        location_label = self._location_enriched_market_label(
            request.crop, request.market, market_context
        )
        if location_label != request.market:
            response.confidence_interval["market_context"] = location_label
        if market_context and market_context.get("latest_prices"):
            response.confidence_interval["live_points"] = int(len(market_context["latest_prices"]))
        log_inference_metrics(
            "price",
            latency_ms=(perf_counter() - started_at) * 1000,
            batch_size=1,
            success=True,
        )
        logger.info(
            "price_forecast_generated",
            model_version=response.model_version,
            crop=request.crop,
            market=request.market,
            mape=response.mape,
        )
        return response
