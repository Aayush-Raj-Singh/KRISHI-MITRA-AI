from __future__ import annotations

import asyncio
import hashlib
import json
from collections import defaultdict
from datetime import date, datetime, timezone
from typing import Any, List, Optional

from app.core.database import Database

from app.core.cache import Cache
from app.core.logging import get_logger
from app.schemas.dashboard import (
    DashboardHeroSummary,
    PriceArrivalDashboardResponse,
    PriceArrivalFilters,
    PriceArrivalPoint,
    PriceArrivalSummary,
)
from app.utils.mandi_sql import build_mandi_where, match_mandi_document, merge_where, table_ref

logger = get_logger(__name__)


class DashboardService:
    def __init__(self, db: Database, cache: Optional[Cache] = None) -> None:
        self._db = db
        self._cache = cache

    @staticmethod
    def _cache_key(filters: PriceArrivalFilters) -> str:
        payload = json.dumps(filters.model_dump(), sort_keys=True, default=str)
        digest = hashlib.sha256(payload.encode("utf-8")).hexdigest()
        return f"dashboard:price-arrival:{digest}"

    @staticmethod
    def _parse_date(value: Any) -> date:
        if isinstance(value, date):
            return value
        try:
            return date.fromisoformat(str(value)[:10])
        except ValueError:
            return datetime.now(timezone.utc).date()

    @staticmethod
    def _as_float(value: Any) -> float:
        try:
            return float(value or 0.0)
        except (TypeError, ValueError):
            return 0.0

    @staticmethod
    def _compact_text(value: Any) -> Optional[str]:
        text = str(value or "").strip()
        return text or None

    def _recommendation_context(self, document: Optional[dict]) -> Optional[str]:
        if not document:
            return None

        kind = self._compact_text(document.get("kind"))
        request_payload = document.get("request_payload") or {}
        response_payload = document.get("response_payload") or {}

        if kind == "crop":
            recommendations = response_payload.get("recommendations") or []
            if recommendations:
                top_crop = self._compact_text(recommendations[0].get("crop"))
                if top_crop:
                    return top_crop
        if kind == "price":
            crop = self._compact_text(response_payload.get("crop") or request_payload.get("crop"))
            market = self._compact_text(response_payload.get("market") or request_payload.get("market"))
            return " · ".join(part for part in [crop, market] if part) or None
        if kind == "water":
            crop = self._compact_text(response_payload.get("crop") or request_payload.get("crop"))
            growth_stage = self._compact_text(request_payload.get("growth_stage"))
            return " · ".join(part for part in [crop, growth_stage] if part) or crop
        if kind == "advisory":
            message = self._compact_text(request_payload.get("message"))
            if message:
                return message[:60] + ("..." if len(message) > 60 else "")
        return None

    async def hero_summary(self, user_id: str) -> DashboardHeroSummary:
        recommendations = self._db["recommendations"]
        feedback = self._db["feedback"]

        (
            latest_recommendation,
            latest_water_recommendation,
            latest_feedback,
            total_recommendations,
            total_feedback,
            water_recommendation_count,
        ) = await asyncio.gather(
            recommendations.find_one({"user_id": user_id}, sort=[("created_at", -1)]),
            recommendations.find_one({"user_id": user_id, "kind": "water"}, sort=[("created_at", -1)]),
            feedback.find_one({"user_id": user_id}, sort=[("created_at", -1)]),
            recommendations.count_documents({"user_id": user_id}),
            feedback.count_documents({"user_id": user_id}),
            recommendations.count_documents({"user_id": user_id, "kind": "water"}),
        )

        latest_water_payload = (latest_water_recommendation or {}).get("response_payload") or {}
        latest_water_crop = self._compact_text(
            latest_water_payload.get("crop")
            or (latest_water_recommendation or {}).get("request_payload", {}).get("crop")
        )

        return DashboardHeroSummary(
            latest_recommendation_id=str(latest_recommendation.get("_id")) if latest_recommendation else None,
            latest_recommendation_kind=self._compact_text((latest_recommendation or {}).get("kind")),
            latest_recommendation_context=self._recommendation_context(latest_recommendation),
            latest_recommendation_created_at=(latest_recommendation or {}).get("created_at"),
            total_recommendations=total_recommendations,
            water_recommendation_count=water_recommendation_count,
            latest_water_savings_percent=(
                round(self._as_float(latest_water_payload.get("water_savings_percent")), 1)
                if latest_water_recommendation and latest_water_payload.get("water_savings_percent") is not None
                else None
            ),
            latest_water_crop=latest_water_crop,
            latest_water_created_at=(latest_water_recommendation or {}).get("created_at"),
            latest_sustainability_score=(
                round(self._as_float((latest_feedback or {}).get("sustainability_score")), 1)
                if latest_feedback and (latest_feedback or {}).get("sustainability_score") is not None
                else None
            ),
            latest_sustainability_trend=self._compact_text((latest_feedback or {}).get("trend")),
            latest_feedback_created_at=(latest_feedback or {}).get("created_at"),
            total_feedback=total_feedback,
        )

    async def _grouped_rows(self, filters: PriceArrivalFilters) -> List[dict]:
        if getattr(self._db, "pool", None) is not None:
            where_sql, params = build_mandi_where(filters)
            where_sql = merge_where(where_sql, ["doc->>'arrival_date' IS NOT NULL"])
            table = table_ref(self._db.schema, "mandi_entries")

            sql = f"""
                SELECT
                    (doc->>'arrival_date')::date AS day,
                    AVG(NULLIF(doc->>'modal_price','')::double precision) AS avg_modal,
                    MIN(NULLIF(doc->>'min_price','')::double precision) AS min_price,
                    MAX(NULLIF(doc->>'max_price','')::double precision) AS max_price,
                    SUM(NULLIF(doc->>'arrivals_qtl','')::double precision) AS arrivals_qtl,
                    COUNT(*)::int AS records
                FROM {table}
                WHERE {where_sql}
                GROUP BY day
                ORDER BY day ASC
            """

            async with self._db.pool.acquire() as conn:
                rows = await conn.fetch(sql, *params)
            return [dict(row) for row in rows]

        docs = await self._db["mandi_entries"].find({}).to_list(length=None)
        grouped: dict[date, dict[str, Any]] = defaultdict(
            lambda: {
                "modal_sum": 0.0,
                "modal_count": 0,
                "min_price": None,
                "max_price": None,
                "arrivals_qtl": 0.0,
                "records": 0,
            }
        )
        for doc in docs:
            if not match_mandi_document(doc, filters):
                continue
            day = self._parse_date(doc.get("arrival_date"))
            row = grouped[day]
            modal_price = self._as_float(doc.get("modal_price"))
            if modal_price > 0:
                row["modal_sum"] += modal_price
                row["modal_count"] += 1
            min_price = self._as_float(doc.get("min_price"))
            max_price = self._as_float(doc.get("max_price"))
            row["min_price"] = min_price if row["min_price"] is None else min(row["min_price"], min_price)
            row["max_price"] = max_price if row["max_price"] is None else max(row["max_price"], max_price)
            row["arrivals_qtl"] += self._as_float(doc.get("arrivals_qtl"))
            row["records"] += 1

        rows: List[dict] = []
        for day in sorted(grouped.keys()):
            values = grouped[day]
            avg_modal = values["modal_sum"] / values["modal_count"] if values["modal_count"] else 0.0
            rows.append(
                {
                    "day": day,
                    "avg_modal": avg_modal,
                    "min_price": values["min_price"] or 0.0,
                    "max_price": values["max_price"] or 0.0,
                    "arrivals_qtl": values["arrivals_qtl"],
                    "records": values["records"],
                }
            )
        return rows

    async def price_arrival_dashboard(self, filters: PriceArrivalFilters) -> PriceArrivalDashboardResponse:
        cache_key = self._cache_key(filters)
        if self._cache is not None:
            cached = await self._cache.get(cache_key)
            if cached:
                payload = json.loads(cached)
                return PriceArrivalDashboardResponse(**payload, cached=True)

        rows = await self._grouped_rows(filters)

        series: List[PriceArrivalPoint] = []
        for row in rows:
            min_price = float(row.get("min_price", 0.0) or 0.0)
            max_price = float(row.get("max_price", 0.0) or 0.0)
            avg_modal = float(row.get("avg_modal", 0.0) or 0.0)
            series.append(
                PriceArrivalPoint(
                    date=self._parse_date(row.get("day")),
                    avg_price=round(avg_modal, 2),
                    modal_price=round(avg_modal, 2),
                    min_price=round(min_price, 2),
                    max_price=round(max_price, 2),
                    price_spread=round(max(0.0, max_price - min_price), 2),
                    arrivals_qtl=round(float(row.get("arrivals_qtl", 0.0) or 0.0), 2),
                    records=int(row.get("records", 0) or 0),
                )
            )
        summary_row = {
            "avg_modal": sum((float(row.get("avg_modal", 0.0) or 0.0) for row in rows)) / max(len(rows), 1),
            "min_price": min((float(row.get("min_price", 0.0) or 0.0) for row in rows), default=0.0),
            "max_price": max((float(row.get("max_price", 0.0) or 0.0) for row in rows), default=0.0),
            "arrivals_qtl": sum(float(row.get("arrivals_qtl", 0.0) or 0.0) for row in rows),
            "records": sum(int(row.get("records", 0) or 0) for row in rows),
        }
        summary = PriceArrivalSummary(
            average_price=round(float(summary_row.get("avg_modal", 0.0) or 0.0), 2),
            modal_price=round(float(summary_row.get("avg_modal", 0.0) or 0.0), 2),
            min_price=round(float(summary_row.get("min_price", 0.0) or 0.0), 2),
            max_price=round(float(summary_row.get("max_price", 0.0) or 0.0), 2),
            price_spread=round(
                max(
                    0.0,
                    float(summary_row.get("max_price", 0.0) or 0.0)
                    - float(summary_row.get("min_price", 0.0) or 0.0),
                ),
                2,
            ),
            total_arrivals_qtl=round(float(summary_row.get("arrivals_qtl", 0.0) or 0.0), 2),
            total_records=int(summary_row.get("records", 0) or 0),
        )

        response = PriceArrivalDashboardResponse(
            filters=filters,
            summary=summary,
            series=series,
            generated_at=datetime.now(timezone.utc),
        )

        if self._cache is not None:
            await self._cache.set(cache_key, json.dumps(response.model_dump(), default=str), ttl_seconds=60 * 15)
        logger.info("price_arrival_dashboard_generated", records=len(series))
        return response
