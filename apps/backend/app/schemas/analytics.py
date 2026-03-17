from __future__ import annotations

from datetime import date, datetime
from enum import Enum
from typing import List, Optional

from pydantic import BaseModel


class CropDistributionItem(BaseModel):
    crop: str
    count: int
    percentage: float


class AnalyticsOverview(BaseModel):
    total_farmers: int
    total_feedback: int
    average_sustainability: float
    average_yield_kg_per_acre: float
    average_water_usage_l_per_acre: float
    average_fertilizer_kg_per_acre: float
    at_risk_farmers: int
    top_crops: List[CropDistributionItem]
    generated_at: datetime
    filters: Optional[dict] = None


class FarmerAttentionItem(BaseModel):
    user_id: str
    name: str
    location: str
    sustainability_score: float
    yield_trend_percent: float
    average_rating: float
    risk_score: float
    reasons: List[str]
    is_masked: bool = False
    consent_granted: bool = False


class FeedbackReliabilityStats(BaseModel):
    total_feedback: int
    average_rating: float
    negative_outcome_rate: float
    rating_distribution: dict[str, int]
    expert_review_pending: int
    generated_at: datetime


class PriceAccuracyItem(BaseModel):
    crop: str
    market: str
    recommendation_id: str
    horizon_days: int
    points: int
    coverage_pct: float
    mape: float
    mae: float
    model_version: Optional[str] = None
    forecast_created_at: Optional[datetime] = None
    actuals_from: Optional[date] = None
    actuals_to: Optional[date] = None
    updated_at: datetime


class AnalyticsReportFormat(str, Enum):
    pdf = "pdf"
    xlsx = "xlsx"
