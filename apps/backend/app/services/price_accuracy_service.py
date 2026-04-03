from __future__ import annotations

import re
from datetime import datetime, timezone
from typing import Iterable, List, Tuple

from app.core.database import Database
from app.schemas.integrations import MandiPricePoint


class PriceAccuracyService:
    def __init__(self, db: Database) -> None:
        self._db = db
        self._actuals = db["price_actuals"]
        self._accuracy = db["price_accuracy"]
        self._recommendations = db["recommendations"]

    @staticmethod
    def _normalize(value: str) -> str:
        return (value or "").strip().lower()

    @staticmethod
    def _safe_mape(actuals: Iterable[float], predicted: Iterable[float]) -> float:
        values = list(zip(actuals, predicted))
        if not values:
            return 0.0
        errors = []
        for actual, forecast in values:
            denom = abs(actual) if abs(actual) > 1e-6 else 1.0
            errors.append(abs(actual - forecast) / denom)
        return round(sum(errors) / len(errors) * 100, 3)

    @staticmethod
    def _mae(actuals: Iterable[float], predicted: Iterable[float]) -> float:
        values = list(zip(actuals, predicted))
        if not values:
            return 0.0
        errors = [abs(actual - forecast) for actual, forecast in values]
        return round(sum(errors) / len(errors), 3)

    async def record_actuals(
        self,
        crop: str,
        market: str,
        prices: List[MandiPricePoint],
        source: str,
        fetched_at: datetime,
    ) -> None:
        crop_key = self._normalize(crop)
        market_key = self._normalize(market)
        now = datetime.now(timezone.utc)
        for point in prices:
            date_str = point.date.isoformat()
            await self._actuals.update_one(
                {"crop": crop_key, "market": market_key, "date": date_str},
                {
                    "$set": {
                        "price": float(point.price),
                        "source": source,
                        "fetched_at": fetched_at,
                        "updated_at": now,
                    },
                    "$setOnInsert": {
                        "created_at": now,
                    },
                },
                upsert=True,
            )

    async def _latest_recommendation(self, crop_key: str, market_key: str) -> dict | None:
        direct = (
            await self._recommendations.find(
                {
                    "kind": "price",
                    "request_payload.crop_key": crop_key,
                    "request_payload.market_key": market_key,
                }
            )
            .sort("created_at", -1)
            .limit(1)
            .to_list(length=1)
        )
        if direct:
            return direct[0]

        crop_regex = {"$regex": f"^{re.escape(crop_key)}$", "$options": "i"}
        market_regex = {"$regex": f"^{re.escape(market_key)}$", "$options": "i"}
        fallback = (
            await self._recommendations.find(
                {
                    "kind": "price",
                    "request_payload.crop": crop_regex,
                    "request_payload.market": market_regex,
                }
            )
            .sort("created_at", -1)
            .limit(1)
            .to_list(length=1)
        )
        return fallback[0] if fallback else None

    @staticmethod
    def _extract_series_points(series: dict) -> Tuple[int, List[str], List[float]]:
        horizon = int(series.get("horizon_days", 0) or 0)
        dates = series.get("dates", []) or []
        forecasts = series.get("forecast", []) or []
        n = min(len(dates), len(forecasts))
        date_keys = [str(value)[:10] for value in dates[:n]]
        forecast_values = [float(value) for value in forecasts[:n]]
        return horizon, date_keys, forecast_values

    async def refresh_accuracy(self, crop: str, market: str) -> List[dict]:
        crop_key = self._normalize(crop)
        market_key = self._normalize(market)
        recommendation = await self._latest_recommendation(crop_key, market_key)
        if not recommendation:
            return []

        response_payload = recommendation.get("response_payload", {})
        series_list = response_payload.get("series", []) or []
        recommendation_id = str(recommendation.get("_id"))
        model_version = response_payload.get("model_version")
        forecast_created_at = recommendation.get("created_at")
        now = datetime.now(timezone.utc)

        results: List[dict] = []
        for series in series_list:
            horizon, date_keys, forecast_values = self._extract_series_points(series)
            if horizon <= 0 or not date_keys:
                continue
            actual_docs = await self._actuals.find(
                {"crop": crop_key, "market": market_key, "date": {"$in": date_keys}}
            ).to_list(length=None)
            if not actual_docs:
                continue

            actual_map = {
                str(doc.get("date"))[:10]: float(doc.get("price", 0.0)) for doc in actual_docs
            }
            matched = [
                (actual_map[date], forecast_values[idx])
                for idx, date in enumerate(date_keys)
                if date in actual_map
            ]
            if not matched:
                continue

            actuals, forecasts = zip(*matched)
            mape = self._safe_mape(actuals, forecasts)
            mae = self._mae(actuals, forecasts)
            coverage_pct = round(len(matched) / max(horizon, 1) * 100, 2)
            actual_dates = [date for date in date_keys if date in actual_map]
            actuals_from = min(actual_dates) if actual_dates else None
            actuals_to = max(actual_dates) if actual_dates else None

            payload = {
                "crop": crop_key,
                "market": market_key,
                "recommendation_id": recommendation_id,
                "horizon_days": horizon,
                "points": len(matched),
                "coverage_pct": coverage_pct,
                "mape": mape,
                "mae": mae,
                "model_version": model_version,
                "forecast_created_at": forecast_created_at,
                "actuals_from": actuals_from,
                "actuals_to": actuals_to,
                "updated_at": now,
            }

            await self._accuracy.update_one(
                {
                    "crop": crop_key,
                    "market": market_key,
                    "recommendation_id": recommendation_id,
                    "horizon_days": horizon,
                },
                {
                    "$set": payload,
                    "$setOnInsert": {"created_at": now},
                },
                upsert=True,
            )
            results.append(payload)

        return results
