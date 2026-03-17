from __future__ import annotations

from collections import defaultdict
import hashlib
import json
import math
from datetime import date, datetime, timezone
from typing import Any, List, Optional

from app.core.database import Database

from app.core.cache import Cache
from app.core.logging import get_logger
from app.schemas.trends import (
    PriceSpikeAlert,
    SeasonalComparisonItem,
    TrendAnalyticsResponse,
    TrendFilters,
    TrendPoint,
    TrendWindow,
)
from app.utils.mandi_sql import build_mandi_where, match_mandi_document, merge_where, table_ref

logger = get_logger(__name__)


class TrendAnalyticsService:
    def __init__(self, db: Database, cache: Optional[Cache] = None) -> None:
        self._db = db
        self._cache = cache

    @staticmethod
    def _cache_key(filters: TrendFilters) -> str:
        payload = json.dumps(filters.model_dump(), sort_keys=True, default=str)
        digest = hashlib.sha256(payload.encode("utf-8")).hexdigest()
        return f"analytics:trends:{digest}"

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

    async def _daily_series(self, filters: TrendFilters) -> List[TrendPoint]:
        if getattr(self._db, "pool", None) is not None:
            where_sql, params = build_mandi_where(filters)
            where_sql = merge_where(where_sql, ["doc->>'arrival_date' IS NOT NULL"])
            table = table_ref(self._db.schema, "mandi_entries")

            sql = f"""
                SELECT
                    (doc->>'arrival_date')::date AS day,
                    AVG(NULLIF(doc->>'modal_price','')::double precision) AS avg_modal,
                    SUM(NULLIF(doc->>'arrivals_qtl','')::double precision) AS arrivals_qtl
                FROM {table}
                WHERE {where_sql}
                GROUP BY day
                ORDER BY day ASC
            """

            async with self._db.pool.acquire() as conn:
                rows = await conn.fetch(sql, *params)
            items = [dict(row) for row in rows]
        else:
            docs = await self._db["mandi_entries"].find({}).to_list(length=None)
            grouped: dict[date, dict[str, float]] = defaultdict(lambda: {"price_sum": 0.0, "price_count": 0.0, "arrivals_qtl": 0.0})
            for doc in docs:
                if not match_mandi_document(doc, filters):
                    continue
                day = self._parse_date(doc.get("arrival_date"))
                row = grouped[day]
                modal_price = self._as_float(doc.get("modal_price"))
                if modal_price > 0:
                    row["price_sum"] += modal_price
                    row["price_count"] += 1
                row["arrivals_qtl"] += self._as_float(doc.get("arrivals_qtl"))
            items = [
                {
                    "day": day,
                    "avg_modal": values["price_sum"] / values["price_count"] if values["price_count"] else 0.0,
                    "arrivals_qtl": values["arrivals_qtl"],
                }
                for day, values in sorted(grouped.items(), key=lambda item: item[0])
            ]

        points: List[TrendPoint] = []
        for row in items:
            points.append(
                TrendPoint(
                    date=self._parse_date(row.get("day")),
                    avg_price=round(float(row.get("avg_modal", 0.0) or 0.0), 2),
                    arrivals_qtl=round(float(row.get("arrivals_qtl", 0.0) or 0.0), 2),
                )
            )
        return points

    @staticmethod
    def _stddev(values: List[float]) -> float:
        if len(values) < 2:
            return 0.0
        mean = sum(values) / len(values)
        variance = sum((value - mean) ** 2 for value in values) / (len(values) - 1)
        return round(math.sqrt(variance), 3)

    @staticmethod
    def _window_metrics(points: List[TrendPoint], window_days: int) -> TrendWindow:
        if not points:
            return TrendWindow(window_days=window_days, points=[], change_pct=0.0, average_price=0.0, volatility=0.0)
        window_points = points[-window_days:]
        prices = [point.avg_price for point in window_points]
        average_price = round(sum(prices) / len(prices), 2) if prices else 0.0
        change_pct = 0.0
        if len(prices) >= 2 and prices[0] > 0:
            change_pct = round(((prices[-1] - prices[0]) / prices[0]) * 100, 2)
        volatility = TrendAnalyticsService._stddev(prices)
        return TrendWindow(
            window_days=window_days,
            points=window_points,
            change_pct=change_pct,
            average_price=average_price,
            volatility=volatility,
        )

    @staticmethod
    def _season_for_month(month: int) -> str:
        if 6 <= month <= 10:
            return "Kharif"
        if month >= 11 or month <= 3:
            return "Rabi"
        return "Zaid"

    @staticmethod
    def _seasonal(points: List[TrendPoint]) -> List[SeasonalComparisonItem]:
        if not points:
            return []
        buckets: Dict[str, List[TrendPoint]] = {}
        for point in points:
            season = TrendAnalyticsService._season_for_month(point.date.month)
            buckets.setdefault(season, []).append(point)
        output: List[SeasonalComparisonItem] = []
        for season, items in buckets.items():
            avg_price = round(sum(p.avg_price for p in items) / len(items), 2)
            avg_arrivals = round(sum(p.arrivals_qtl for p in items) / len(items), 2)
            output.append(
                SeasonalComparisonItem(
                    season=season,
                    average_price=avg_price,
                    average_arrivals_qtl=avg_arrivals,
                    count=len(items),
                )
            )
        output.sort(key=lambda item: item.season)
        return output

    @staticmethod
    def _spike_alerts(points: List[TrendPoint]) -> List[PriceSpikeAlert]:
        if len(points) < 3:
            return []
        recent = points[-30:]
        changes = []
        for idx in range(1, len(recent)):
            prev = recent[idx - 1].avg_price
            current = recent[idx].avg_price
            if prev <= 0:
                continue
            changes.append(((current - prev) / prev) * 100)
        if not changes:
            return []
        threshold = max(15.0, TrendAnalyticsService._stddev(changes) * 2.5)
        alerts: List[PriceSpikeAlert] = []
        for idx in range(1, len(recent)):
            prev = recent[idx - 1].avg_price
            current = recent[idx].avg_price
            if prev <= 0:
                continue
            pct = ((current - prev) / prev) * 100
            if abs(pct) >= threshold:
                alerts.append(
                    PriceSpikeAlert(
                        date=recent[idx].date,
                        change_pct=round(pct, 2),
                        change_abs=round(current - prev, 2),
                        note="Sudden price movement detected",
                    )
                )
        return alerts

    async def trends(self, filters: TrendFilters) -> TrendAnalyticsResponse:
        cache_key = self._cache_key(filters)
        if self._cache is not None:
            cached = await self._cache.get(cache_key)
            if cached:
                payload = json.loads(cached)
                return TrendAnalyticsResponse(**payload, cached=True)

        points = await self._daily_series(filters)
        windows = [
            self._window_metrics(points, 7),
            self._window_metrics(points, 30),
            self._window_metrics(points, 90),
        ]
        volatility = self._stddev([point.avg_price for point in points[-30:]])
        seasonal = self._seasonal(points[-365:] if len(points) > 365 else points)
        alerts = self._spike_alerts(points)

        response = TrendAnalyticsResponse(
            filters=filters,
            windows=windows,
            seasonal=seasonal,
            volatility=volatility,
            alerts=alerts,
            generated_at=datetime.now(timezone.utc),
        )

        if self._cache is not None:
            await self._cache.set(cache_key, json.dumps(response.model_dump(), default=str), ttl_seconds=60 * 20)
        logger.info("trend_analytics_generated", points=len(points))
        return response
