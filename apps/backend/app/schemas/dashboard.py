from __future__ import annotations

from datetime import date, datetime
from typing import List, Optional

from pydantic import BaseModel

from app.schemas.analytics import AnalyticsOverview, FarmerAttentionItem, FeedbackReliabilityStats

class PriceArrivalFilters(BaseModel):
    state: Optional[str] = None
    district: Optional[str] = None
    mandi: Optional[str] = None
    commodity: Optional[str] = None
    variety: Optional[str] = None
    grade: Optional[str] = None
    date_from: Optional[date] = None
    date_to: Optional[date] = None


class PriceArrivalPoint(BaseModel):
    date: date
    avg_price: float
    modal_price: float
    min_price: float
    max_price: float
    price_spread: float
    arrivals_qtl: float
    records: int


class PriceArrivalSummary(BaseModel):
    average_price: float
    modal_price: float
    min_price: float
    max_price: float
    price_spread: float
    total_arrivals_qtl: float
    total_records: int


class PriceArrivalDashboardResponse(BaseModel):
    filters: PriceArrivalFilters
    summary: PriceArrivalSummary
    series: List[PriceArrivalPoint]
    generated_at: datetime
    cached: bool = False


class RegionalInsightsResponse(BaseModel):
    overview: AnalyticsOverview
    farmers_needing_attention: List[FarmerAttentionItem]
    feedback_reliability: FeedbackReliabilityStats
    generated_at: datetime
