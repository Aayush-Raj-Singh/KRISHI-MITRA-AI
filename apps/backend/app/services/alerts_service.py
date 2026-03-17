from __future__ import annotations

from typing import List, Optional

from app.core.database import Database

from app.schemas.trends import PriceSpikeAlert, TrendFilters
from app.services.trend_service import TrendAnalyticsService


class MarketAlertsService:
    def __init__(self, db: Database) -> None:
        self._db = db

    async def price_spike_alerts(self, filters: TrendFilters) -> List[PriceSpikeAlert]:
        service = TrendAnalyticsService(self._db)
        result = await service.trends(filters)
        return result.alerts
