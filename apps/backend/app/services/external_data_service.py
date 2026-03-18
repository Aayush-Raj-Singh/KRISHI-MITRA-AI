from __future__ import annotations

import asyncio
import hashlib
import math
from datetime import date, datetime, timedelta, timezone
from typing import Dict, List, Optional

import httpx
from app.core.database import Database

from app.core.config import settings
from app.core.logging import get_logger
from app.data.mandi_catalog import MANDI_CROP_CATEGORIES, MANDI_MARKETS, crop_to_category_map
from app.schemas.integrations import (
    MandiCatalogResponse,
    MandiCropCatalogItem,
    LocationLookupResponse,
    LocationSearchResponse,
    MandiPricePoint,
    MandiPriceResponse,
    WeatherResponse,
)
from app.schemas.recommendations import WeatherDay
from app.services.price_accuracy_service import PriceAccuracyService

logger = get_logger(__name__)


class ExternalDataService:
    DEFAULT_MANDI_API_URL = "https://api.data.gov.in/resource/9ef84268-d588-465a-a308-a864a43d0070"
    LOCATION_USER_AGENT = "KrishiMitra-AI/1.0"

    def __init__(self, db: Database | None = None) -> None:
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
        except Exception as exc:
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
                async with httpx.AsyncClient(timeout=settings.external_http_timeout_seconds) as client:
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
            except Exception as exc:
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

    async def reverse_geocode(self, lat: float, lon: float) -> LocationLookupResponse:
        coordinate_label = self._coordinate_label(lat, lon)
        providers = [
            (
                "open-meteo",
                "https://geocoding-api.open-meteo.com/v1/reverse",
                {"latitude": lat, "longitude": lon, "count": 1, "language": "en", "format": "json"},
                self._parse_open_meteo_reverse,
            ),
            (
                "bigdatacloud",
                "https://api.bigdatacloud.net/data/reverse-geocode-client",
                {"latitude": lat, "longitude": lon, "localityLanguage": "en"},
                self._parse_bigdatacloud_reverse,
            ),
            (
                "nominatim",
                "https://nominatim.openstreetmap.org/reverse",
                {"lat": lat, "lon": lon, "format": "jsonv2", "accept-language": "en"},
                self._parse_nominatim_reverse,
            ),
        ]

        async with httpx.AsyncClient(
            timeout=settings.external_http_timeout_seconds,
            headers={"User-Agent": self.LOCATION_USER_AGENT},
        ) as client:
            for source, url, params, parser in providers:
                try:
                    response = await client.get(url, params=params)
                    response.raise_for_status()
                    payload = parser(response.json(), lat=lat, lon=lon, fallback_label=coordinate_label)
                    if payload.label:
                        await self._audit_event(
                            "reverse_geocode",
                            {"latitude": lat, "longitude": lon, "source": source, "label": payload.label, "status": "success"},
                        )
                        return payload.model_copy(update={"source": source})
                except Exception as exc:
                    logger.warning("reverse_geocode_provider_failed", source=source, error=str(exc), latitude=lat, longitude=lon)

        await self._audit_event(
            "reverse_geocode",
            {"latitude": lat, "longitude": lon, "source": "coordinates", "label": coordinate_label, "status": "fallback"},
        )
        return LocationLookupResponse(
            latitude=lat,
            longitude=lon,
            label=coordinate_label,
            source="coordinates",
        )

    async def geocode_location(self, query: str) -> LocationSearchResponse:
        safe_query = (query or "").strip()
        if not safe_query:
            raise ValueError("Location query is required")

        providers = [
            (
                "open-meteo",
                "https://geocoding-api.open-meteo.com/v1/search",
                {"name": safe_query, "count": 1, "language": "en", "format": "json"},
                self._parse_open_meteo_search,
            ),
            (
                "nominatim",
                "https://nominatim.openstreetmap.org/search",
                {"q": safe_query, "format": "jsonv2", "limit": 1, "accept-language": "en"},
                self._parse_nominatim_search,
            ),
        ]

        async with httpx.AsyncClient(
            timeout=settings.external_http_timeout_seconds,
            headers={"User-Agent": self.LOCATION_USER_AGENT},
        ) as client:
            for source, url, params, parser in providers:
                try:
                    response = await client.get(url, params=params)
                    response.raise_for_status()
                    payload = parser(response.json(), fallback_label=safe_query)
                    if payload.label:
                        await self._audit_event(
                            "forward_geocode",
                            {"query": safe_query, "source": source, "label": payload.label, "status": "success"},
                        )
                        return payload.model_copy(update={"source": source})
                except Exception as exc:
                    logger.warning("forward_geocode_provider_failed", source=source, error=str(exc), query=safe_query)

        raise ValueError("Unable to resolve location name")

    async def fetch_mandi_prices(self, crop: str, market: str, days: int = 7) -> MandiPriceResponse:
        prices: List[MandiPricePoint] = []
        source = ""
        cached = False
        fetched_at = datetime.now(timezone.utc)

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

        response = MandiPriceResponse(
            crop=crop,
            market=market,
            source=source,
            prices=prices,
            fetched_at=fetched_at,
            cached=cached,
            stale_data_warning=(
                "Live mandi source unavailable. Showing cached/stub market prices."
                if cached
                else None
            ),
        )
        if self._db is not None and prices and not cached and source != "stub":
            async def _postprocess_accuracy() -> None:
                try:
                    accuracy_service = PriceAccuracyService(self._db)
                    await accuracy_service.record_actuals(crop, market, prices, source=source, fetched_at=fetched_at)
                    await accuracy_service.refresh_accuracy(crop, market)
                except Exception as exc:
                    logger.warning("price_actuals_persist_failed", error=str(exc), crop=crop, market=market)

            asyncio.create_task(_postprocess_accuracy())

        return response

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

    @staticmethod
    def _coordinate_label(lat: float, lon: float) -> str:
        return f"Lat {lat:.4f}, Lon {lon:.4f}"

    @staticmethod
    def _build_location_label(city: Optional[str], state: Optional[str], country: Optional[str], fallback: str) -> str:
        parts = [part.strip() for part in [city, state, country] if part and part.strip()]
        if not parts:
            return fallback
        return ", ".join(parts[:3])

    def _build_lookup_response(
        self,
        *,
        lat: float,
        lon: float,
        city: Optional[str],
        state: Optional[str],
        country: Optional[str],
        source: str,
        fallback_label: str,
    ) -> LocationLookupResponse:
        return LocationLookupResponse(
            latitude=lat,
            longitude=lon,
            city=city,
            state=state,
            country=country,
            label=self._build_location_label(city, state, country, fallback_label),
            source=source,
        )

    def _build_search_response(
        self,
        *,
        lat: float,
        lon: float,
        city: Optional[str],
        state: Optional[str],
        country: Optional[str],
        source: str,
        fallback_label: str,
    ) -> LocationSearchResponse:
        return LocationSearchResponse(
            latitude=lat,
            longitude=lon,
            city=city,
            state=state,
            country=country,
            label=self._build_location_label(city, state, country, fallback_label),
            source=source,
        )

    def _parse_open_meteo_reverse(
        self,
        payload: dict,
        *,
        lat: float,
        lon: float,
        fallback_label: str,
    ) -> LocationLookupResponse:
        result = payload.get("results", [None])[0] if isinstance(payload.get("results"), list) else None
        if not result:
            raise ValueError("No reverse geocode result")
        return self._build_lookup_response(
            lat=lat,
            lon=lon,
            city=str(result.get("name") or result.get("city") or result.get("admin2") or "").strip() or None,
            state=str(result.get("admin1") or "").strip() or None,
            country=str(result.get("country") or "").strip() or None,
            source="open-meteo",
            fallback_label=fallback_label,
        )

    def _parse_bigdatacloud_reverse(
        self,
        payload: dict,
        *,
        lat: float,
        lon: float,
        fallback_label: str,
    ) -> LocationLookupResponse:
        locality_info = payload.get("localityInfo") or {}
        administrative = locality_info.get("administrative") if isinstance(locality_info, dict) else []
        admin_name = None
        if isinstance(administrative, list) and len(administrative) > 2 and isinstance(administrative[2], dict):
            admin_name = administrative[2].get("name")
        return self._build_lookup_response(
            lat=lat,
            lon=lon,
            city=str(payload.get("city") or payload.get("locality") or admin_name or "").strip() or None,
            state=str(payload.get("principalSubdivision") or "").strip() or None,
            country=str(payload.get("countryName") or "").strip() or None,
            source="bigdatacloud",
            fallback_label=fallback_label,
        )

    def _parse_nominatim_reverse(
        self,
        payload: dict,
        *,
        lat: float,
        lon: float,
        fallback_label: str,
    ) -> LocationLookupResponse:
        address = payload.get("address") if isinstance(payload.get("address"), dict) else {}
        city = (
            address.get("city")
            or address.get("town")
            or address.get("village")
            or address.get("hamlet")
            or payload.get("name")
        )
        state = address.get("state") or address.get("county")
        country = address.get("country")
        return self._build_lookup_response(
            lat=lat,
            lon=lon,
            city=str(city or "").strip() or None,
            state=str(state or "").strip() or None,
            country=str(country or "").strip() or None,
            source="nominatim",
            fallback_label=fallback_label,
        )

    def _parse_open_meteo_search(self, payload: dict, *, fallback_label: str) -> LocationSearchResponse:
        result = payload.get("results", [None])[0] if isinstance(payload.get("results"), list) else None
        if not result:
            raise ValueError("No geocode result")
        lat = float(result.get("latitude"))
        lon = float(result.get("longitude"))
        return self._build_search_response(
            lat=lat,
            lon=lon,
            city=str(result.get("name") or "").strip() or None,
            state=str(result.get("admin1") or "").strip() or None,
            country=str(result.get("country") or "").strip() or None,
            source="open-meteo",
            fallback_label=fallback_label,
        )

    def _parse_nominatim_search(self, payload: object, *, fallback_label: str) -> LocationSearchResponse:
        result = payload[0] if isinstance(payload, list) and payload else None
        if not isinstance(result, dict):
            raise ValueError("No geocode result")
        address = result.get("address") if isinstance(result.get("address"), dict) else {}
        city = address.get("city") or address.get("town") or address.get("village") or address.get("hamlet")
        state = address.get("state") or address.get("county")
        country = address.get("country")
        return self._build_search_response(
            lat=float(result.get("lat")),
            lon=float(result.get("lon")),
            city=str(city or result.get("name") or "").strip() or None,
            state=str(state or "").strip() or None,
            country=str(country or "").strip() or None,
            source="nominatim",
            fallback_label=fallback_label,
        )

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
            async with httpx.AsyncClient(timeout=settings.external_http_timeout_seconds) as client:
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
        except Exception as exc:
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

        async with httpx.AsyncClient(timeout=settings.external_http_timeout_seconds) as client:
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
        except Exception as exc:
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
