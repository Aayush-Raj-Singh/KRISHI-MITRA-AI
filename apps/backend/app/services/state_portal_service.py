from __future__ import annotations

import asyncio
from dataclasses import dataclass
from datetime import datetime, timedelta, timezone
from typing import Iterable, List, Optional
from urllib.parse import urlparse

import httpx

from app.core.config import settings
from app.core.database import Database
from app.core.logging import get_logger
from app.data.india_state_registry import INDIA_STATE_REGISTRY, STATE_NAME_ALIASES
from app.schemas.state_engine import (
    StatePortalLinkSummary,
    StatePortalNoticeSummary,
    StatePortalUpdateSummary,
)
from app.utils.html_extract import (
    ExtractedLink,
    HtmlSnapshot,
    extract_html_snapshot,
    normalize_space,
    same_domain,
)

logger = get_logger(__name__)


@dataclass(frozen=True)
class _PortalSource:
    source_id: str
    name: str
    category: str
    url: str
    discovered_from: str
    state_filtered: bool = False


class StatePortalService:
    _NOTICE_KEYWORDS = (
        "notice",
        "notification",
        "circular",
        "press",
        "release",
        "advisory",
        "order",
        "update",
    )
    _LINK_CATEGORY_KEYWORDS = {
        "scheme": ("scheme", "subsidy", "benefit", "grant", "pm-kisan", "pmfby"),
        "mandi": ("mandi", "market", "agmarknet", "enam", "trading"),
        "weather": ("weather", "rain", "forecast", "meghdoot", "imd"),
        "soil": ("soil", "fertility", "nutrient", "soil health"),
        "advisory": ("advisory", "crop", "disease", "pest", "extension"),
        "department": ("agriculture", "horticulture", "department", "directorate"),
        "support": ("help", "helpline", "contact", "support"),
    }
    _AGRI_KEYWORDS = tuple(
        sorted(
            {keyword for values in _LINK_CATEGORY_KEYWORDS.values() for keyword in values}
            | {"farmer", "kisan", "agri", "agriculture", "horticulture", "livestock", "fisheries"}
        )
    )

    def __init__(self, db: Database | None = None) -> None:
        self._db = db
        self._collection = db["state_portal_snapshots"] if db is not None else None

    @staticmethod
    def _normalize(value: object) -> str:
        return " ".join(str(value or "").strip().lower().replace("&", "and").split())

    @staticmethod
    def _coerce_datetime(value: object) -> datetime | None:
        if isinstance(value, datetime):
            return value if value.tzinfo is not None else value.replace(tzinfo=timezone.utc)
        if not value:
            return None
        raw = str(value).strip()
        if not raw:
            return None
        for candidate in (raw, raw.replace("Z", "+00:00")):
            try:
                parsed = datetime.fromisoformat(candidate)
                return parsed if parsed.tzinfo is not None else parsed.replace(tzinfo=timezone.utc)
            except ValueError:
                continue
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

    def _state_terms(self, seed: dict) -> set[str]:
        terms = {
            self._normalize(seed.get("name")),
            self._normalize(seed.get("code")),
            self._normalize(seed.get("capital")),
        }
        for alias, canonical in STATE_NAME_ALIASES.items():
            if canonical == seed["name"]:
                terms.add(self._normalize(alias))
        return {term for term in terms if term}

    def _source_definitions(self, seed: dict) -> list[_PortalSource]:
        sources = [
            _PortalSource(
                source_id=f"state_portal_{str(seed['code']).lower()}",
                name=f"{seed['name']} State Portal",
                category="portal",
                url=seed["official_portal_url"],
                discovered_from="state_registry",
                state_filtered=False,
            ),
            _PortalSource(
                source_id=f"state_agriculture_directory_{str(seed['code']).lower()}",
                name=f"{seed['name']} Agriculture Directory",
                category="directory",
                url=seed["agriculture_directory_url"],
                discovered_from="india_gov_directory",
                state_filtered=True,
            ),
        ]
        if settings.state_portal_directory_url:
            sources.append(
                _PortalSource(
                    source_id=f"state_portal_useful_links_{str(seed['code']).lower()}",
                    name=f"{seed['name']} Useful Links Directory",
                    category="directory",
                    url=settings.state_portal_directory_url,
                    discovered_from="national_agri_directory",
                    state_filtered=True,
                )
            )
        return sources[: max(settings.state_portal_max_sources_per_state, 1)]

    async def _fetch_snapshot(self, source: _PortalSource) -> HtmlSnapshot:
        headers = {"User-Agent": "KrishiMitra-AI/1.0"}
        last_error: Exception | None = None
        async with httpx.AsyncClient(
            timeout=settings.external_http_timeout_seconds, headers=headers, follow_redirects=True
        ) as client:
            for attempt in range(1, 4):
                try:
                    response = await client.get(source.url)
                    response.raise_for_status()
                    return extract_html_snapshot(response.text, base_url=str(response.url))
                except Exception as exc:
                    last_error = exc
                    if attempt >= 3 or not self._is_retryable_http_error(exc):
                        break
                    await asyncio.sleep(min(0.25 * attempt, 1.0))
        if last_error is not None:
            raise last_error
        raise RuntimeError(f"Unable to load {source.url}")

    async def _load_cached_doc(self, seed: dict, source: _PortalSource) -> dict | None:
        if self._collection is None:
            return None
        return await self._collection.find_one(
            {"state_code": seed["code"], "source_id": source.source_id}
        )

    @staticmethod
    def _is_stale(doc: dict) -> bool:
        synced_at = StatePortalService._coerce_datetime(doc.get("last_synced_at"))
        if synced_at is None:
            return True
        return synced_at < datetime.now(timezone.utc) - timedelta(
            hours=settings.state_portal_snapshot_stale_hours
        )

    def _classify_link(self, title: str, url: str) -> str:
        haystack = self._normalize(f"{title} {urlparse(url).path} {url}")
        for category, keywords in self._LINK_CATEGORY_KEYWORDS.items():
            if any(keyword in haystack for keyword in keywords):
                return category
        return "resource"

    def _link_score(self, seed: dict, source: _PortalSource, link: ExtractedLink) -> int:
        href = str(link.href or "").strip()
        if not href.startswith(("http://", "https://")):
            return -1

        text = normalize_space(link.text or urlparse(href).path)
        haystack = self._normalize(f"{text} {href}")
        score = 0

        if source.category == "portal" and same_domain(source.url, href):
            score += 5
        elif source.state_filtered and any(
            term and term in haystack for term in self._state_terms(seed)
        ):
            score += 4

        if any(keyword in haystack for keyword in self._AGRI_KEYWORDS):
            score += 3

        category = self._classify_link(text, href)
        if category != "resource":
            score += 2

        if not text:
            score -= 1
        return score

    def _selected_links(
        self, seed: dict, source: _PortalSource, snapshot: HtmlSnapshot
    ) -> list[StatePortalLinkSummary]:
        ranked: list[tuple[int, str, str]] = []
        seen: set[str] = set()
        for link in snapshot.links:
            href = str(link.href or "").strip()
            if not href or href in seen:
                continue
            seen.add(href)
            score = self._link_score(seed, source, link)
            if score < 2:
                continue
            text = normalize_space(link.text or urlparse(href).path.strip("/").replace("-", " "))
            if not text:
                continue
            ranked.append((score, text, href))

        ranked.sort(key=lambda item: (-item[0], item[1].lower()))
        return [
            StatePortalLinkSummary(
                title=text,
                url=href,
                category=self._classify_link(text, href),
            )
            for _, text, href in ranked[: settings.state_portal_snapshot_link_limit]
        ]

    def _selected_notices(
        self,
        source: _PortalSource,
        selected_links: list[StatePortalLinkSummary],
    ) -> list[StatePortalNoticeSummary]:
        items: list[StatePortalNoticeSummary] = []
        for link in selected_links:
            haystack = self._normalize(f"{link.title} {link.url}")
            if any(keyword in haystack for keyword in self._NOTICE_KEYWORDS):
                items.append(StatePortalNoticeSummary(title=link.title, url=link.url))
        if items:
            return items[:3]
        if source.category == "portal":
            return [
                StatePortalNoticeSummary(title=link.title, url=link.url)
                for link in selected_links[:2]
            ]
        return []

    def _build_doc(
        self,
        seed: dict,
        source: _PortalSource,
        *,
        status: str,
        description: Optional[str],
        last_synced_at: Optional[datetime],
        notices: Iterable[StatePortalNoticeSummary],
        links: Iterable[StatePortalLinkSummary],
    ) -> dict:
        return {
            "state_code": seed["code"],
            "state_name": seed["name"],
            "source_id": source.source_id,
            "name": source.name,
            "category": source.category,
            "url": source.url,
            "discovered_from": source.discovered_from,
            "status": status,
            "description": description,
            "last_synced_at": last_synced_at,
            "notices": [item.model_dump() for item in notices],
            "links": [item.model_dump() for item in links],
        }

    async def _persist(self, seed: dict, source: _PortalSource, doc: dict) -> None:
        if self._collection is None:
            return
        await self._collection.update_one(
            {"state_code": seed["code"], "source_id": source.source_id},
            {"$set": doc},
            upsert=True,
        )

    @staticmethod
    def _to_summary(doc: dict) -> StatePortalUpdateSummary:
        return StatePortalUpdateSummary(
            source_id=str(doc.get("source_id") or ""),
            name=str(doc.get("name") or ""),
            category=str(doc.get("category") or "resource"),
            url=str(doc.get("url") or ""),
            discovered_from=str(doc.get("discovered_from") or "runtime"),
            status=str(doc.get("status") or "pending"),
            description=str(doc.get("description") or "").strip() or None,
            last_synced_at=StatePortalService._coerce_datetime(doc.get("last_synced_at")),
            notices=[StatePortalNoticeSummary(**item) for item in (doc.get("notices") or [])],
            links=[StatePortalLinkSummary(**item) for item in (doc.get("links") or [])],
        )

    async def sync_source(
        self, seed: dict, source: _PortalSource, *, force: bool = False
    ) -> StatePortalUpdateSummary:
        cached_doc = await self._load_cached_doc(seed, source)
        if cached_doc and not force and not self._is_stale(cached_doc):
            return self._to_summary(cached_doc)

        try:
            snapshot = await self._fetch_snapshot(source)
            links = self._selected_links(seed, source, snapshot)
            notices = self._selected_notices(source, links)
            description = snapshot.description or (snapshot.lines[0] if snapshot.lines else None)
            live_doc = self._build_doc(
                seed,
                source,
                status="live",
                description=description,
                last_synced_at=datetime.now(timezone.utc),
                notices=notices,
                links=links,
            )
            await self._persist(seed, source, live_doc)
            return self._to_summary(live_doc)
        except Exception as exc:
            logger.warning(
                "state_portal_sync_failed",
                state=seed["name"],
                source_id=source.source_id,
                url=source.url,
                error=str(exc),
            )
            if cached_doc:
                degraded_doc = dict(cached_doc)
                degraded_doc["status"] = "degraded"
                if not degraded_doc.get("description"):
                    degraded_doc["description"] = "Using last cached state portal snapshot."
                return self._to_summary(degraded_doc)

            pending_doc = self._build_doc(
                seed,
                source,
                status="pending",
                description="Live state portal snapshot not available yet.",
                last_synced_at=None,
                notices=[],
                links=[],
            )
            await self._persist(seed, source, pending_doc)
            return self._to_summary(pending_doc)

    async def sync_state(
        self, seed: dict, *, force: bool = False
    ) -> list[StatePortalUpdateSummary]:
        summaries: list[StatePortalUpdateSummary] = []
        for source in self._source_definitions(seed):
            summaries.append(await self.sync_source(seed, source, force=force))
        return summaries

    async def sync_all_states(self, *, force: bool = False) -> dict:
        semaphore = asyncio.Semaphore(4)

        async def _run(seed: dict) -> list[StatePortalUpdateSummary]:
            async with semaphore:
                return await self.sync_state(seed, force=force)

        grouped = await asyncio.gather(
            *(_run(seed) for seed in INDIA_STATE_REGISTRY), return_exceptions=True
        )

        synced = 0
        degraded = 0
        pending = 0
        for result in grouped:
            if isinstance(result, Exception):
                pending += 1
                continue
            for item in result:
                if item.status == "live":
                    synced += 1
                elif item.status == "degraded":
                    degraded += 1
                else:
                    pending += 1

        return {
            "states": len(INDIA_STATE_REGISTRY),
            "sources": synced + degraded + pending,
            "live_sources": synced,
            "degraded_sources": degraded,
            "pending_sources": pending,
            "forced": force,
        }
