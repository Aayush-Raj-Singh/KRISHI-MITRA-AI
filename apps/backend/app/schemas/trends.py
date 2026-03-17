from __future__ import annotations

from datetime import date, datetime
from typing import List, Optional

from pydantic import BaseModel


class TrendFilters(BaseModel):
    state: Optional[str] = None
    district: Optional[str] = None
    mandi: Optional[str] = None
    commodity: Optional[str] = None
    variety: Optional[str] = None
    grade: Optional[str] = None
    date_from: Optional[date] = None
    date_to: Optional[date] = None


class TrendPoint(BaseModel):
    date: date
    avg_price: float
    arrivals_qtl: float


class TrendWindow(BaseModel):
    window_days: int
    points: List[TrendPoint]
    change_pct: float
    average_price: float
    volatility: float


class SeasonalComparisonItem(BaseModel):
    season: str
    average_price: float
    average_arrivals_qtl: float
    count: int


class PriceSpikeAlert(BaseModel):
    date: date
    change_pct: float
    change_abs: float
    note: str


class TrendAnalyticsResponse(BaseModel):
    filters: TrendFilters
    windows: List[TrendWindow]
    seasonal: List[SeasonalComparisonItem]
    volatility: float
    alerts: List[PriceSpikeAlert]
    generated_at: datetime
    cached: bool = False
