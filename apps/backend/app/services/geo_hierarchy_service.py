from __future__ import annotations

import asyncio
import csv
import io
from dataclasses import dataclass
from typing import Iterable, Optional

import httpx

from app.core.config import settings
from app.core.database import Database
from app.core.logging import get_logger
from app.data.india_state_registry import INDIA_STATE_REGISTRY, STATE_NAME_ALIASES

logger = get_logger(__name__)


@dataclass
class ResolvedHierarchy:
    state: Optional[str] = None
    district: Optional[str] = None
    block: Optional[str] = None
    village: Optional[str] = None
    postal_code: Optional[str] = None
    label: str = "India"
    source: str = "request"
    latitude: Optional[float] = None
    longitude: Optional[float] = None


class GeoHierarchyService:
    _FIELD_ALIASES = {
        "state": ("state", "state_name", "state_ut", "stateut", "ut_name"),
        "district": ("district", "district_name"),
        "block": ("block", "block_name", "subdistrict", "sub_district", "tehsil", "taluk"),
        "village": ("village", "village_name", "lgd_village_name", "gram_panchayat", "locality"),
        "postal_code": ("postal_code", "postcode", "pincode", "pin_code", "pin"),
        "latitude": ("latitude", "lat"),
        "longitude": ("longitude", "lon", "lng", "longitude_deg"),
    }

    def __init__(self, db: Database | None = None) -> None:
        self._db = db
        self._collection = db["geo_hierarchy_nodes"] if db is not None else None
        self._state_seed_map = {
            self._normalize(item["name"]): item["name"] for item in INDIA_STATE_REGISTRY
        }

    @staticmethod
    def _normalize(value: object) -> str:
        return " ".join(str(value or "").strip().lower().replace("&", "and").split())

    @staticmethod
    def _clean(value: object) -> Optional[str]:
        text = str(value or "").strip()
        return text or None

    def _normalize_state(self, value: object) -> Optional[str]:
        key = self._normalize(value)
        if not key:
            return None
        alias = STATE_NAME_ALIASES.get(key)
        if alias:
            return alias
        return self._state_seed_map.get(key)

    @classmethod
    def _pick_field(cls, row: dict, field_name: str) -> Optional[str]:
        for candidate in cls._FIELD_ALIASES[field_name]:
            if candidate in row:
                return cls._clean(row.get(candidate))
            for actual_name, actual_value in row.items():
                if cls._normalize(actual_name) == cls._normalize(candidate):
                    return cls._clean(actual_value)
        return None

    @staticmethod
    def _coerce_float(value: object) -> Optional[float]:
        if value in (None, ""):
            return None
        try:
            return float(value)
        except (TypeError, ValueError):
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

    async def _fetch_csv_rows(self, url: str) -> list[dict]:
        headers = {"User-Agent": "KrishiMitra-AI/1.0"}
        async with httpx.AsyncClient(
            timeout=settings.external_http_timeout_seconds, headers=headers, follow_redirects=True
        ) as client:
            last_error: Exception | None = None
            for attempt in range(1, 4):
                try:
                    response = await client.get(url)
                    response.raise_for_status()
                    reader = csv.DictReader(io.StringIO(response.text))
                    return [dict(row) for row in reader]
                except Exception as exc:
                    last_error = exc
                    if attempt >= 3 or not self._is_retryable_http_error(exc):
                        break
                    await asyncio.sleep(min(0.25 * attempt, 1.0))
        if last_error is not None:
            raise last_error
        raise RuntimeError(f"Unable to fetch CSV from {url}")

    def _row_to_doc(self, level: str, row: dict, source_url: str) -> Optional[dict]:
        state = self._normalize_state(self._pick_field(row, "state"))
        district = self._clean(self._pick_field(row, "district"))
        block = self._clean(self._pick_field(row, "block"))
        village = self._clean(self._pick_field(row, "village"))
        postal_code = self._clean(self._pick_field(row, "postal_code"))
        latitude = self._coerce_float(self._pick_field(row, "latitude"))
        longitude = self._coerce_float(self._pick_field(row, "longitude"))

        if level == "district" and not district:
            return None
        if level == "block" and not (district and block):
            return None
        if level == "village" and not (district and village):
            return None
        if not (state or district or block or village or postal_code):
            return None

        return {
            "level": level,
            "source_url": source_url,
            "state": state,
            "district": district,
            "block": block,
            "village": village,
            "postal_code": postal_code,
            "latitude": latitude,
            "longitude": longitude,
            "state_norm": self._normalize(state),
            "district_norm": self._normalize(district),
            "block_norm": self._normalize(block),
            "village_norm": self._normalize(village),
        }

    async def _persist_doc(self, doc: dict) -> None:
        if self._collection is None:
            return
        filter_spec = {
            "level": doc["level"],
            "state_norm": doc["state_norm"],
            "district_norm": doc["district_norm"],
            "block_norm": doc["block_norm"],
            "village_norm": doc["village_norm"],
            "postal_code": doc["postal_code"],
        }
        await self._collection.update_one(filter_spec, {"$set": doc}, upsert=True)

    async def sync_from_sources(self, *, force: bool = False) -> dict:
        source_specs = [
            ("district", settings.geo_hierarchy_district_csv_url),
            ("block", settings.geo_hierarchy_block_csv_url),
            ("village", settings.geo_hierarchy_village_csv_url),
        ]
        total_rows = 0
        synced_rows = 0
        loaded_levels: list[str] = []

        for level, url in source_specs:
            if not url:
                continue
            rows = await self._fetch_csv_rows(url)
            loaded_levels.append(level)
            for row in rows:
                total_rows += 1
                doc = self._row_to_doc(level, row, url)
                if doc is None:
                    continue
                await self._persist_doc(doc)
                synced_rows += 1

        return {
            "levels": loaded_levels,
            "configured_sources": len([url for _, url in source_specs if url]),
            "rows_seen": total_rows,
            "rows_synced": synced_rows,
            "forced": force,
        }

    async def _lookup_by_postal_code(self, postal_code: Optional[str]) -> dict | None:
        if self._collection is None or not postal_code:
            return None
        return await self._collection.find_one({"postal_code": str(postal_code).strip()})

    async def _lookup_exact(
        self,
        *,
        state: Optional[str],
        district: Optional[str],
        block: Optional[str],
        village: Optional[str],
    ) -> dict | None:
        if self._collection is None:
            return None
        filter_spec = {}
        if state:
            filter_spec["state_norm"] = self._normalize(state)
        if district:
            filter_spec["district_norm"] = self._normalize(district)
        if block:
            filter_spec["block_norm"] = self._normalize(block)
        if village:
            filter_spec["village_norm"] = self._normalize(village)
        if not filter_spec:
            return None
        return await self._collection.find_one(filter_spec)

    async def resolve(
        self,
        *,
        state: Optional[str] = None,
        district: Optional[str] = None,
        block: Optional[str] = None,
        village: Optional[str] = None,
        postal_code: Optional[str] = None,
        lat: Optional[float] = None,
        lon: Optional[float] = None,
        source: str = "request",
    ) -> ResolvedHierarchy:
        resolved_state = self._normalize_state(state) or self._clean(state)
        resolved_district = self._clean(district)
        resolved_block = self._clean(block)
        resolved_village = self._clean(village)
        resolved_postal_code = self._clean(postal_code)

        matched = await self._lookup_by_postal_code(resolved_postal_code)
        if matched is None and (resolved_state or resolved_district):
            matched = await self._lookup_exact(
                state=resolved_state,
                district=resolved_district,
                block=resolved_block,
                village=resolved_village,
            )

        if matched:
            resolved_state = self._normalize_state(matched.get("state")) or resolved_state
            resolved_district = self._clean(matched.get("district")) or resolved_district
            resolved_block = self._clean(matched.get("block")) or resolved_block
            resolved_village = self._clean(matched.get("village")) or resolved_village
            resolved_postal_code = self._clean(matched.get("postal_code")) or resolved_postal_code
            source = f"{source}+hierarchy" if source else "hierarchy"

        label = (
            ", ".join(
                part
                for part in [resolved_village, resolved_block, resolved_district, resolved_state]
                if part
            )
            or "India"
        )

        return ResolvedHierarchy(
            state=resolved_state,
            district=resolved_district,
            block=resolved_block,
            village=resolved_village,
            postal_code=resolved_postal_code,
            label=label,
            source=source or "request",
            latitude=lat,
            longitude=lon,
        )
