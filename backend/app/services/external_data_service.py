from __future__ import annotations

import hashlib
import math
from datetime import date, datetime, timedelta, timezone
from typing import Dict, List, Optional

import httpx
from motor.motor_asyncio import AsyncIOMotorDatabase

from app.core.config import settings
from app.core.logging import get_logger
from app.data.mandi_catalog import MANDI_CROP_CATEGORIES, MANDI_MARKETS, crop_to_category_map
from app.schemas.integrations import (
    MandiCatalogResponse,
    MandiCropCatalogItem,
    MandiPricePoint,
    MandiPriceResponse,
    WeatherResponse,
)
from app.schemas.recommendations import WeatherDay

logger = get_logger(__name__)


class ExternalDataService:
    DEFAULT_MANDI_API_URL = "https://api.data.gov.in/resource/9ef84268-d588-465a-a308-a864a43d0070"

    def __init__(self, db: AsyncIOMotorDatabase | None = None) -> None:
        self._db = db
        self._audit_collection = db["integration_audit"] if db is not None else None

    async def _audit_event(self, event: str, payload: dict) -> None:
        if self._audit_collection is None:
            return
        try:
            document = {
                "event": event,
                "payload": payload,
                "created_at": datetime.now(timezone.utc),
            }
            await self._audit_collection.insert_one(document)
        except Exception as exc:  # noqa: BLE001
            logger.warning("integration_audit_write_failed", event=event, error=str(exc))

    @staticmethod
    def _validate_weather_points(points: List[WeatherDay]) -> List[WeatherDay]:
        valid: List[WeatherDay] = []
        for item in points:
            if item.temperature_c < -15 or item.temperature_c > 60:
                continue
            if item.rainfall_mm < 0 or item.rainfall_mm > 1200:
                continue
            valid.append(item)
        return valid

    @staticmethod
    def _validate_mandi_points(points: List[MandiPricePoint]) -> List[MandiPricePoint]:
        valid: List[MandiPricePoint] = []
        for item in points:
            if item.price <= 0 or item.price > 100000:
                continue
            valid.append(item)
        return valid

    async def fetch_weather(self, location: str, days: int = 5) -> WeatherResponse:
        if settings.weather_api_url:
            try:
                async with httpx.AsyncClient(timeout=10) as client:
                    response = await client.get(
                        settings.weather_api_url,
                        params={"q": location, "days": days, "key": settings.weather_api_key},
                    )
                    response.raise_for_status()
                    payload = response.json()
                forecast = self._validate_weather_points(self._parse_weather(payload, days))
                if forecast:
                    logger.info("weather_data_fetched", source=settings.weather_api_url, location=location, points=len(forecast))
                    await self._audit_event(
                        "weather_fetch",
                        {
                            "location": location,
                            "days": days,
                            "source": settings.weather_api_url,
                            "cached": False,
                            "points": len(forecast),
                            "status": "success",
                        },
                    )
                    return WeatherResponse(
                        location=location,
                        source=settings.weather_api_url,
                        forecast=forecast,
                        fetched_at=datetime.now(timezone.utc),
                    )
            except Exception as exc:  # noqa: BLE001
                logger.warning("weather_api_failed", error=str(exc))
                await self._audit_event(
                    "weather_fetch",
                    {
                        "location": location,
                        "days": days,
                        "source": settings.weather_api_url,
                        "cached": True,
                        "status": "upstream_error",
                        "error": str(exc),
                    },
                )

        forecast = self._validate_weather_points(self._stub_weather(days))
        logger.warning("weather_data_stale_using_cache", location=location, points=len(forecast))
        await self._audit_event(
            "weather_fetch",
            {
                "location": location,
                "days": days,
                "source": "stub",
                "cached": True,
                "points": len(forecast),
                "status": "fallback",
            },
        )
        return WeatherResponse(
            location=location,
            source="stub",
            forecast=forecast,
            fetched_at=datetime.now(timezone.utc),
            cached=True,
            stale_data_warning="Live weather feed unavailable. Showing cached/stub weather data.",
        )

    async def fetch_mandi_prices(self, crop: str, market: str, days: int = 7) -> MandiPriceResponse:
        prices: List[MandiPricePoint] = []
        source = ""
        cached = False

        custom_prices = await self._fetch_custom_mandi(crop=crop, market=market, days=days)
        if custom_prices:
            prices = self._validate_mandi_points(custom_prices)
            source = settings.mandi_api_url or "custom"

        if not prices:
            data_gov_prices = await self._fetch_data_gov_mandi(crop=crop, market=market, days=days)
            if data_gov_prices:
                prices = self._validate_mandi_points(data_gov_prices)
                source = self.DEFAULT_MANDI_API_URL

        if not prices:
            prices = self._validate_mandi_points(self._stub_mandi(crop=crop, market=market, days=days))
            source = "stub"
            cached = True
            logger.warning("mandi_data_stale_using_cache", crop=crop, market=market, points=len(prices))
            await self._audit_event(
                "mandi_fetch",
                {
                    "crop": crop,
                    "market": market,
                    "days": days,
                    "source": source,
                    "cached": cached,
                    "points": len(prices),
                    "status": "fallback",
                },
            )
        else:
            logger.info("mandi_data_fetched", source=source, crop=crop, market=market, points=len(prices))
            await self._audit_event(
                "mandi_fetch",
                {
                    "crop": crop,
                    "market": market,
                    "days": days,
                    "source": source,
                    "cached": False,
                    "points": len(prices),
                    "status": "success",
                },
            )

        return MandiPriceResponse(
            crop=crop,
            market=market,
            source=source,
            prices=prices,
            fetched_at=datetime.now(timezone.utc),
            cached=cached,
            stale_data_warning=(
                "Live mandi source unavailable. Showing cached/stub market prices."
                if cached
                else None
            ),
        )

    def get_mandi_catalog(
        self,
        category: Optional[str] = None,
        search: Optional[str] = None,
        limit: int = 500,
    ) -> MandiCatalogResponse:
        category_filter = (category or "").strip().lower()
        search_filter = (search or "").strip().lower()

        items: List[MandiCropCatalogItem] = []
        for crop_category, crops in MANDI_CROP_CATEGORIES.items():
            if category_filter and category_filter != "all" and crop_category != category_filter:
                continue
            for crop_name in crops:
                if search_filter and search_filter not in crop_name.lower():
                    continue
                items.append(MandiCropCatalogItem(crop=crop_name, category=crop_category))

        items.sort(key=lambda row: (row.category, row.crop))
        if limit > 0:
            items = items[:limit]

        return MandiCatalogResponse(crops=items, markets=sorted(MANDI_MARKETS))

    def _parse_weather(self, payload: dict, days: int) -> List[WeatherDay]:
        forecast = []
        items = payload.get("forecast", payload.get("daily", []))
        for idx in range(min(days, len(items))):
            item = items[idx]
            date_value = item.get("date") or item.get("dt") or ""
            if not date_value:
                continue
            forecast.append(
                WeatherDay(
                    date=date.fromisoformat(str(date_value)[:10]),
                    rainfall_mm=float(item.get("rainfall_mm", item.get("rain", 0))),
                    temperature_c=float(item.get("temperature_c", item.get("temp", 0))),
                )
            )
        return forecast

    def _parse_mandi(self, payload: dict, days: int) -> List[MandiPricePoint]:
        items = payload.get("prices", payload.get("data", payload.get("records", [])))
        prices = []
        for item in items:
            date_value = (
                item.get("date")
                or item.get("day")
                or item.get("arrival_date")
                or item.get("arrival date")
                or ""
            )
            parsed_date = self._parse_date_value(str(date_value))
            if not parsed_date:
                continue
            prices.append(
                MandiPricePoint(
                    date=parsed_date,
                    price=self._parse_price_value(item.get("price", item.get("modal_price", 0))),
                )
            )
        prices.sort(key=lambda row: row.date)
        return prices[-days:]

    def _stub_weather(self, days: int) -> List[WeatherDay]:
        start = datetime.now(timezone.utc).date() + timedelta(days=1)
        return [
            WeatherDay(
                date=start + timedelta(days=offset),
                rainfall_mm=round(2 + offset * 0.6, 1),
                temperature_c=round(28 + offset * 0.4, 1),
            )
            for offset in range(days)
        ]

    def _stub_mandi(self, crop: str, market: str, days: int) -> List[MandiPricePoint]:
        category_map = crop_to_category_map()
        category = category_map.get(crop.strip().lower(), "vegetables")
        category_base: Dict[str, float] = {
            "cereals": 2200,
            "millet": 2000,
            "pseudo-cereal": 2300,
            "pulses": 6200,
            "oilseeds": 5200,
            "vegetables": 1800,
            "fruit vegetable": 2400,
            "leafy": 1200,
            "fruits": 3200,
            "spices": 7600,
            "cash_crops": 3600,
            "flowers": 2800,
        }
        base = category_base.get(category, 2400)

        key = f"{crop.lower()}::{market.lower()}"
        seed = int(hashlib.sha256(key.encode("utf-8")).hexdigest()[:8], 16)
        start = datetime.now(timezone.utc).date() - timedelta(days=days - 1)

        trend = (seed % 9) - 4
        volatility = 0.012 + ((seed % 5) * 0.003)
        return [
            MandiPricePoint(
                date=start + timedelta(days=offset),
                price=round(
                    max(
                        100,
                        base
                        + trend * offset * 5
                        + math.sin((offset + (seed % 11)) / 2.5) * base * volatility
                        + (((seed >> (offset % 16)) & 0x0F) - 7) * 6,
                    ),
                    2,
                ),
            )
            for offset in range(days)
        ]

    async def _fetch_custom_mandi(self, crop: str, market: str, days: int) -> List[MandiPricePoint]:
        if not settings.mandi_api_url:
            return []

        try:
            async with httpx.AsyncClient(timeout=10) as client:
                response = await client.get(
                    settings.mandi_api_url,
                    params={
                        "crop": crop,
                        "market": market,
                        "days": days,
                        "key": settings.mandi_api_key,
                    },
                )
                response.raise_for_status()
                payload = response.json()
            prices = self._parse_mandi(payload, days)
            if prices:
                return prices
        except Exception as exc:  # noqa: BLE001
            logger.warning("mandi_custom_api_failed", error=str(exc))
        return []

    async def _fetch_data_gov_mandi(self, crop: str, market: str, days: int) -> List[MandiPricePoint]:
        mandi_url = self.DEFAULT_MANDI_API_URL
        base_params = {
            "format": "json",
            "offset": 0,
            "limit": max(40, days * 15),
            "sort[0][arrival_date]": "desc",
        }
        if settings.mandi_api_key:
            base_params["api-key"] = settings.mandi_api_key

        async with httpx.AsyncClient(timeout=10) as client:
            records = await self._fetch_data_gov_records(
                client,
                mandi_url,
                {**base_params, "filters[commodity]": crop, "filters[market]": market},
            )
            if not records:
                records = await self._fetch_data_gov_records(
                    client,
                    mandi_url,
                    {**base_params, "filters[commodity]": crop},
                )
            if not records:
                return []

        grouped: Dict[date, float] = {}
        for record in records:
            dt = self._parse_date_value(str(record.get("arrival_date", "")))
            if not dt:
                continue
            if dt in grouped:
                continue
            price = self._parse_price_value(record.get("modal_price", record.get("price", 0)))
            grouped[dt] = price
            if len(grouped) >= days:
                break

        if not grouped:
            return []

        ordered_dates = sorted(grouped.keys())
        return [MandiPricePoint(date=dt, price=grouped[dt]) for dt in ordered_dates[-days:]]

    async def _fetch_data_gov_records(
        self,
        client: httpx.AsyncClient,
        url: str,
        params: dict,
    ) -> List[dict]:
        try:
            response = await client.get(url, params=params)
            response.raise_for_status()
            payload = response.json()
            records = payload.get("records", payload.get("data", []))
            if isinstance(records, list):
                return records
        except Exception as exc:  # noqa: BLE001
            logger.warning("mandi_data_gov_failed", error=str(exc))
        return []

    def _parse_price_value(self, raw: object) -> float:
        if raw is None:
            return 0.0
        if isinstance(raw, (int, float)):
            return float(raw)
        cleaned = str(raw).replace(",", "").strip()
        try:
            return float(cleaned)
        except ValueError:
            return 0.0

    def _parse_date_value(self, raw: str) -> Optional[date]:
        if not raw:
            return None
        value = raw.strip()
        for fmt in ("%Y-%m-%d", "%d/%m/%Y", "%d-%m-%Y", "%Y/%m/%d"):
            try:
                return datetime.strptime(value[:10], fmt).date()
            except ValueError:
                continue
        try:
            return date.fromisoformat(value[:10])
        except ValueError:
            return None
