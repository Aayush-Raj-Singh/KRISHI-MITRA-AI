from __future__ import annotations

import asyncio
from datetime import date, datetime, timedelta, timezone
from typing import Dict, List, Optional

import httpx

from app.core.config import settings
from app.core.database import Database
from app.core.logging import get_logger
from app.data.mandi_catalog import MANDI_CROP_CATEGORIES, MANDI_MARKETS
from app.schemas.integrations import (
    LocationLookupResponse,
    LocationSearchResponse,
    MandiCatalogResponse,
    MandiCropCatalogItem,
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
        self._price_actuals_collection = db["price_actuals"] if db is not None else None
        self._mandi_entries_collection = db["mandi_entries"] if db is not None else None

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

    @staticmethod
    def _normalize_lookup_key(value: str) -> str:
        return (value or "").strip().lower()

    @staticmethod
    def _coerce_datetime(value: object) -> datetime | None:
        if isinstance(value, datetime):
            return value if value.tzinfo is not None else value.replace(tzinfo=timezone.utc)
        if not value:
            return None
        raw = str(value).strip()
        if not raw:
            return None
        try:
            parsed = datetime.fromisoformat(raw.replace("Z", "+00:00"))
        except ValueError:
            return None
        return parsed if parsed.tzinfo is not None else parsed.replace(tzinfo=timezone.utc)

    def _resolved_mandi_api_key(self) -> str | None:
        configured_key = (settings.mandi_api_key or "").strip()
        if configured_key:
            return configured_key
        demo_key = (settings.mandi_demo_api_key or "").strip()
        if demo_key and not settings.is_production:
            return demo_key
        if not settings.is_production:
            return None
        return None

    @staticmethod
    def _is_retryable_http_error(exc: Exception) -> bool:
        if isinstance(
            exc, (httpx.TimeoutException, httpx.TransportError, httpx.RemoteProtocolError)
        ):
            return True
        if isinstance(exc, httpx.HTTPStatusError):
            return exc.response.status_code in {408, 409, 425, 429, 500, 502, 503, 504}
        return False

    async def _get_json(
        self,
        client: httpx.AsyncClient,
        url: str,
        *,
        params: Optional[dict] = None,
        attempts: int = 3,
    ):
        last_error: Exception | None = None
        for attempt in range(1, attempts + 1):
            try:
                response = await client.get(url, params=params)
                response.raise_for_status()
                return response.json()
            except Exception as exc:
                last_error = exc
                if attempt >= attempts or not self._is_retryable_http_error(exc):
                    raise
                await asyncio.sleep(min(0.25 * attempt, 1.0))
        if last_error is not None:
            raise last_error
        raise RuntimeError("External request failed without an explicit error")

    @staticmethod
    def _cached_mandi_warning(fetched_at: datetime) -> str:
        return (
            "Live mandi source temporarily unavailable. "
            f"Showing last synced market prices from {fetched_at.astimezone(timezone.utc).date().isoformat()}."
        )

    @staticmethod
    def _verified_mandi_unavailable_warning(days: int) -> str:
        return (
            "Live mandi source unavailable. "
            f"No verified {days}-day mandi history is available yet for the selected crop and market."
        )

    async def fetch_weather(self, location: str, days: int = 5) -> WeatherResponse:
        if settings.weather_api_url:
            try:
                async with httpx.AsyncClient(
                    timeout=settings.external_http_timeout_seconds
                ) as client:
                    payload = await self._get_json(
                        client,
                        settings.weather_api_url,
                        params={"q": location, "days": days, "key": settings.weather_api_key},
                    )
                forecast = self._validate_weather_points(self._parse_weather(payload, days))
                if forecast:
                    logger.info(
                        "weather_data_fetched",
                        source=settings.weather_api_url,
                        location=location,
                        points=len(forecast),
                    )
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
                    response_payload = await self._get_json(client, url, params=params)
                    payload = parser(
                        response_payload, lat=lat, lon=lon, fallback_label=coordinate_label
                    )
                    if payload.label:
                        await self._audit_event(
                            "reverse_geocode",
                            {
                                "latitude": lat,
                                "longitude": lon,
                                "source": source,
                                "label": payload.label,
                                "status": "success",
                            },
                        )
                        return payload.model_copy(update={"source": source})
                except Exception as exc:
                    logger.warning(
                        "reverse_geocode_provider_failed",
                        source=source,
                        error=str(exc),
                        latitude=lat,
                        longitude=lon,
                    )

        await self._audit_event(
            "reverse_geocode",
            {
                "latitude": lat,
                "longitude": lon,
                "source": "coordinates",
                "label": coordinate_label,
                "status": "fallback",
            },
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
                    response_payload = await self._get_json(client, url, params=params)
                    payload = parser(response_payload, fallback_label=safe_query)
                    if payload.label:
                        await self._audit_event(
                            "forward_geocode",
                            {
                                "query": safe_query,
                                "source": source,
                                "label": payload.label,
                                "status": "success",
                            },
                        )
                        return payload.model_copy(update={"source": source})
                except Exception as exc:
                    logger.warning(
                        "forward_geocode_provider_failed",
                        source=source,
                        error=str(exc),
                        query=safe_query,
                    )

        raise ValueError("Unable to resolve location name")

    async def fetch_mandi_prices(
        self, crop: str, market: str, days: int = 30
    ) -> MandiPriceResponse:
        prices: List[MandiPricePoint] = []
        source = ""
        cached = False
        fetched_at = datetime.now(timezone.utc)
        stale_data_warning: str | None = None

        custom_prices = await self._fetch_custom_mandi(crop=crop, market=market, days=days)
        if custom_prices:
            prices = self._merge_mandi_points(
                prices, self._validate_mandi_points(custom_prices), days
            )
            source = settings.mandi_api_url or "custom"

        if len(prices) < days:
            data_gov_prices = await self._fetch_data_gov_mandi(crop=crop, market=market, days=days)
            if data_gov_prices:
                prices = self._merge_mandi_points(
                    prices, self._validate_mandi_points(data_gov_prices), days
                )
                if not source:
                    source = self.DEFAULT_MANDI_API_URL

        if len(prices) < days:
            approved_prices = await self._fetch_approved_mandi_entries(
                crop=crop, market=market, days=days
            )
            if approved_prices:
                prices = self._merge_mandi_points(
                    prices, self._validate_mandi_points(approved_prices), days
                )
                if not source:
                    source = "approved_mandi_entries"

        if len(prices) < days:
            (
                cached_prices,
                cached_source,
                cached_fetched_at,
            ) = await self._fetch_cached_mandi_actuals(
                crop=crop,
                market=market,
                days=days,
            )
            if cached_prices:
                previous_count = len(prices)
                prices = self._merge_mandi_points(
                    prices, self._validate_mandi_points(cached_prices), days
                )
                source = source or cached_source or self.DEFAULT_MANDI_API_URL
                fetched_at = cached_fetched_at or fetched_at
                if len(prices) > previous_count:
                    cached = True
                    stale_data_warning = self._cached_mandi_warning(fetched_at)
                    logger.warning(
                        "mandi_data_live_cache_used",
                        crop=crop,
                        market=market,
                        points=len(prices),
                        source=source,
                    )
                    await self._audit_event(
                        "mandi_fetch",
                        {
                            "crop": crop,
                            "market": market,
                            "days": days,
                            "source": source,
                            "cached": cached,
                            "points": len(prices),
                            "status": "cached_live",
                            "last_synced_at": fetched_at,
                        },
                    )

        if not prices:
            source = "unavailable"
            cached = True
            stale_data_warning = self._verified_mandi_unavailable_warning(days)
            logger.warning("mandi_data_unavailable", crop=crop, market=market, days=days)
            await self._audit_event(
                "mandi_fetch",
                {
                    "crop": crop,
                    "market": market,
                    "days": days,
                    "source": source,
                    "cached": cached,
                    "points": 0,
                    "status": "unavailable",
                },
            )
        elif not cached:
            logger.info(
                "mandi_data_fetched", source=source, crop=crop, market=market, points=len(prices)
            )
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
            stale_data_warning=stale_data_warning,
        )
        if (
            self._db is not None
            and prices
            and not cached
            and source not in {"approved_mandi_entries", "unavailable"}
        ):

            async def _postprocess_accuracy() -> None:
                try:
                    accuracy_service = PriceAccuracyService(self._db)
                    await accuracy_service.record_actuals(
                        crop, market, prices, source=source, fetched_at=fetched_at
                    )
                    await accuracy_service.refresh_accuracy(crop, market)
                except Exception as exc:
                    logger.warning(
                        "price_actuals_persist_failed", error=str(exc), crop=crop, market=market
                    )

            asyncio.create_task(_postprocess_accuracy())

        return response

    async def _fetch_cached_mandi_actuals(
        self,
        *,
        crop: str,
        market: str,
        days: int,
    ) -> tuple[List[MandiPricePoint], str | None, datetime | None]:
        if self._price_actuals_collection is None:
            return [], None, None

        crop_key = self._normalize_lookup_key(crop)
        market_key = self._normalize_lookup_key(market)
        if not crop_key or not market_key:
            return [], None, None

        lookback_days = max(days * 6, 30)
        cutoff = (datetime.now(timezone.utc).date() - timedelta(days=lookback_days - 1)).isoformat()
        docs = (
            await self._price_actuals_collection.find(
                {
                    "crop": crop_key,
                    "market": market_key,
                    "date": {"$gte": cutoff},
                }
            )
            .sort("date", -1)
            .limit(max(days * 6, 40))
            .to_list(length=max(days * 6, 40))
        )
        if not docs:
            return [], None, None

        seen_dates: set[str] = set()
        selected_docs: List[dict] = []
        for doc in docs:
            date_key = str(doc.get("date") or "").strip()[:10]
            if not date_key or date_key in seen_dates:
                continue
            price = self._parse_price_value(doc.get("price", 0))
            if price <= 0:
                continue
            seen_dates.add(date_key)
            selected_docs.append(doc)
            if len(selected_docs) >= days:
                break

        if not selected_docs:
            return [], None, None

        selected_docs.sort(key=lambda item: str(item.get("date") or ""))
        prices: List[MandiPricePoint] = []
        for doc in selected_docs:
            parsed_date = self._parse_date_value(str(doc.get("date", "")))
            if parsed_date is None:
                continue
            prices.append(
                MandiPricePoint(
                    date=parsed_date,
                    price=self._parse_price_value(doc.get("price", 0)),
                )
            )
        if not prices:
            return [], None, None

        latest_fetched_at = max(
            (
                parsed
                for parsed in (
                    self._coerce_datetime(doc.get("fetched_at"))
                    or self._coerce_datetime(doc.get("updated_at"))
                    for doc in selected_docs
                )
                if parsed is not None
            ),
            default=None,
        )
        latest_source = next(
            (
                str(doc.get("source")).strip()
                for doc in selected_docs
                if str(doc.get("source") or "").strip()
            ),
            None,
        )
        return prices, latest_source, latest_fetched_at

    @staticmethod
    def _merge_mandi_points(
        primary: List[MandiPricePoint],
        additional: List[MandiPricePoint],
        days: int,
    ) -> List[MandiPricePoint]:
        by_date: Dict[date, MandiPricePoint] = {point.date: point for point in primary}
        for point in additional:
            if point.date not in by_date:
                by_date[point.date] = point
        ordered_dates = sorted(by_date.keys())[-days:]
        return [by_date[item_date] for item_date in ordered_dates]

    async def _fetch_approved_mandi_entries(
        self,
        *,
        crop: str,
        market: str,
        days: int,
    ) -> List[MandiPricePoint]:
        if self._mandi_entries_collection is None:
            return []

        lookback_days = max(days * 6, 45)
        docs = (
            await self._mandi_entries_collection.find({})
            .sort("arrival_date", -1)
            .limit(max(days * 12, 120))
            .to_list(length=max(days * 12, 120))
        )
        if not docs:
            return []

        crop_key = self._normalize_lookup_key(crop)
        market_key = self._normalize_lookup_key(market)
        cutoff = datetime.now(timezone.utc).date() - timedelta(days=lookback_days - 1)
        grouped: Dict[date, List[float]] = {}

        for doc in docs:
            if self._normalize_lookup_key(str(doc.get("status", ""))) != "approved":
                continue
            if self._normalize_lookup_key(str(doc.get("commodity", ""))) != crop_key:
                continue
            if not self._record_matches_market(doc, market_key):
                continue
            arrival_date = self._parse_date_value(str(doc.get("arrival_date", "")))
            if arrival_date is None or arrival_date < cutoff:
                continue
            price = self._parse_price_value(doc.get("modal_price", 0))
            if price <= 0:
                continue
            grouped.setdefault(arrival_date, []).append(price)

        if not grouped:
            return []

        ordered_dates = sorted(grouped.keys())[-days:]
        return [
            MandiPricePoint(date=dt, price=round(sum(grouped[dt]) / len(grouped[dt]), 2))
            for dt in ordered_dates
        ]

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
    def _build_location_label(
        city: Optional[str], state: Optional[str], country: Optional[str], fallback: str
    ) -> str:
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
        district: Optional[str] = None,
        block: Optional[str] = None,
        village: Optional[str] = None,
        postal_code: Optional[str] = None,
        country: Optional[str],
        source: str,
        fallback_label: str,
    ) -> LocationLookupResponse:
        label_city = village or city
        return LocationLookupResponse(
            latitude=lat,
            longitude=lon,
            city=city,
            state=state,
            district=district,
            block=block,
            village=village,
            postal_code=postal_code,
            country=country,
            label=self._build_location_label(label_city, state, country, fallback_label),
            source=source,
        )

    def _build_search_response(
        self,
        *,
        lat: float,
        lon: float,
        city: Optional[str],
        state: Optional[str],
        district: Optional[str] = None,
        block: Optional[str] = None,
        village: Optional[str] = None,
        postal_code: Optional[str] = None,
        country: Optional[str],
        source: str,
        fallback_label: str,
    ) -> LocationSearchResponse:
        label_city = village or city
        return LocationSearchResponse(
            latitude=lat,
            longitude=lon,
            city=city,
            state=state,
            district=district,
            block=block,
            village=village,
            postal_code=postal_code,
            country=country,
            label=self._build_location_label(label_city, state, country, fallback_label),
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
        result = (
            payload.get("results", [None])[0] if isinstance(payload.get("results"), list) else None
        )
        if not result:
            raise ValueError("No reverse geocode result")
        return self._build_lookup_response(
            lat=lat,
            lon=lon,
            city=str(result.get("name") or result.get("city") or result.get("admin2") or "").strip()
            or None,
            state=str(result.get("admin1") or "").strip() or None,
            district=str(result.get("admin2") or "").strip() or None,
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
        administrative = (
            locality_info.get("administrative") if isinstance(locality_info, dict) else []
        )
        district = None
        block = None
        if isinstance(administrative, list):
            for item in administrative:
                if not isinstance(item, dict):
                    continue
                description = str(item.get("description") or "").strip().lower()
                name = str(item.get("name") or "").strip() or None
                if description in {"district", "state district"} and not district:
                    district = name
                elif (
                    description
                    in {"county", "subdistrict", "development block", "block", "taluk", "tehsil"}
                    and not block
                ):
                    block = name
        village = str(payload.get("locality") or payload.get("city") or "").strip() or None
        return self._build_lookup_response(
            lat=lat,
            lon=lon,
            city=str(payload.get("city") or district or "").strip() or None,
            state=str(payload.get("principalSubdivision") or "").strip() or None,
            district=district,
            block=block,
            village=village,
            postal_code=str(payload.get("postcode") or "").strip() or None,
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
        district = address.get("state_district") or address.get("county")
        village = (
            address.get("village")
            or address.get("hamlet")
            or address.get("quarter")
            or address.get("neighbourhood")
        )
        block = address.get("suburb") or address.get("municipality") or address.get("city_district")
        state = address.get("state")
        country = address.get("country")
        return self._build_lookup_response(
            lat=lat,
            lon=lon,
            city=str(city or "").strip() or None,
            state=str(state or "").strip() or None,
            district=str(district or "").strip() or None,
            block=str(block or "").strip() or None,
            village=str(village or "").strip() or None,
            postal_code=str(address.get("postcode") or "").strip() or None,
            country=str(country or "").strip() or None,
            source="nominatim",
            fallback_label=fallback_label,
        )

    def _parse_open_meteo_search(
        self, payload: dict, *, fallback_label: str
    ) -> LocationSearchResponse:
        result = (
            payload.get("results", [None])[0] if isinstance(payload.get("results"), list) else None
        )
        if not result:
            raise ValueError("No geocode result")
        lat = float(result.get("latitude"))
        lon = float(result.get("longitude"))
        return self._build_search_response(
            lat=lat,
            lon=lon,
            city=str(result.get("name") or "").strip() or None,
            state=str(result.get("admin1") or "").strip() or None,
            district=str(result.get("admin2") or "").strip() or None,
            country=str(result.get("country") or "").strip() or None,
            source="open-meteo",
            fallback_label=fallback_label,
        )

    def _parse_nominatim_search(
        self, payload: object, *, fallback_label: str
    ) -> LocationSearchResponse:
        result = payload[0] if isinstance(payload, list) and payload else None
        if not isinstance(result, dict):
            raise ValueError("No geocode result")
        address = result.get("address") if isinstance(result.get("address"), dict) else {}
        city = (
            address.get("city")
            or address.get("town")
            or address.get("village")
            or address.get("hamlet")
        )
        state = address.get("state")
        district = address.get("state_district") or address.get("county")
        block = address.get("suburb") or address.get("municipality") or address.get("city_district")
        village = (
            address.get("village")
            or address.get("hamlet")
            or address.get("quarter")
            or address.get("neighbourhood")
        )
        country = address.get("country")
        return self._build_search_response(
            lat=float(result.get("lat")),
            lon=float(result.get("lon")),
            city=str(city or result.get("name") or "").strip() or None,
            state=str(state or "").strip() or None,
            district=str(district or "").strip() or None,
            block=str(block or "").strip() or None,
            village=str(village or "").strip() or None,
            postal_code=str(address.get("postcode") or "").strip() or None,
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

    async def _fetch_custom_mandi(self, crop: str, market: str, days: int) -> List[MandiPricePoint]:
        if not settings.mandi_api_url:
            return []

        try:
            async with httpx.AsyncClient(timeout=settings.external_http_timeout_seconds) as client:
                payload = await self._get_json(
                    client,
                    settings.mandi_api_url,
                    params={
                        "crop": crop,
                        "market": market,
                        "days": days,
                        "key": settings.mandi_api_key,
                    },
                )
            prices = self._parse_mandi(payload, days)
            if prices:
                return prices
        except Exception as exc:
            logger.warning("mandi_custom_api_failed", error=str(exc))
        return []

    async def _fetch_data_gov_mandi(
        self, crop: str, market: str, days: int
    ) -> List[MandiPricePoint]:
        mandi_url = self.DEFAULT_MANDI_API_URL
        api_key = self._resolved_mandi_api_key()
        base_params = {
            "format": "json",
            "offset": 0,
            "limit": max(120, days * 50),
        }
        if api_key:
            base_params["api-key"] = api_key

        async with httpx.AsyncClient(timeout=settings.external_http_timeout_seconds) as client:
            exact_records = await self._fetch_data_gov_records(
                client,
                mandi_url,
                {**base_params, "filters[commodity]": crop, "filters[market]": market},
            )
            commodity_records = await self._fetch_data_gov_records(
                client,
                mandi_url,
                {**base_params, "filters[commodity]": crop},
            )

        record_candidates = exact_records or []
        if commodity_records:
            record_candidates.extend(commodity_records)
        if not record_candidates:
            return []

        return self._build_verified_mandi_points(record_candidates, market=market, days=days)

    async def _fetch_data_gov_records(
        self,
        client: httpx.AsyncClient,
        url: str,
        params: dict,
    ) -> List[dict]:
        try:
            page_limit = int(params.get("limit", 100) or 100)
            collected: List[dict] = []
            for page_index in range(5):
                page_params = dict(params)
                page_params["offset"] = page_index * page_limit
                payload = await self._get_json(client, url, params=page_params)
                records = payload.get("records", payload.get("data", []))
                if not isinstance(records, list) or not records:
                    break
                collected.extend(records)
                if len(records) < page_limit:
                    break
            return collected
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

    def _record_matches_market(self, record: dict, market_key: str) -> bool:
        if not market_key:
            return False
        for field in ("market", "district"):
            value = self._normalize_lookup_key(str(record.get(field, "")))
            if not value:
                continue
            if value == market_key or market_key in value or value in market_key:
                return True
        return False

    def _build_verified_mandi_points(
        self, records: List[dict], *, market: str, days: int
    ) -> List[MandiPricePoint]:
        market_key = self._normalize_lookup_key(market)
        grouped: Dict[date, List[float]] = {}

        for record in records:
            if not self._record_matches_market(record, market_key):
                continue
            dt = self._parse_date_value(str(record.get("arrival_date", "")))
            if not dt:
                continue
            price = self._parse_price_value(record.get("modal_price", record.get("price", 0)))
            if price <= 0:
                continue
            grouped.setdefault(dt, []).append(price)

        if not grouped:
            return []

        ordered_dates = sorted(grouped.keys())[-days:]
        return [
            MandiPricePoint(date=dt, price=round(sum(grouped[dt]) / len(grouped[dt]), 2))
            for dt in ordered_dates
        ]
