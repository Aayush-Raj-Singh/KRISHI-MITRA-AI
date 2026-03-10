from __future__ import annotations

from datetime import datetime
from typing import List, Optional

from pydantic import BaseModel, Field


class OutcomeFeedbackRequest(BaseModel):
    recommendation_id: str
    rating: int = Field(ge=1, le=5)
    yield_kg_per_acre: float = Field(gt=0)
    income_inr: float = Field(gt=0)
    water_usage_l_per_acre: float = Field(gt=0)
    fertilizer_kg_per_acre: float = Field(gt=0)
    notes: Optional[str] = None
    season: Optional[str] = Field(default=None, description="kharif/rabi/zaid")


class SustainabilityScores(BaseModel):
    water_efficiency: float
    fertilizer_efficiency: float
    yield_optimization: float


class OutcomeFeedbackResponse(BaseModel):
    feedback_id: str
    sustainability_score: float
    sub_scores: SustainabilityScores
    recommendations: List[str]
    recognition_badge: Optional[str] = None
    trend: Optional[str] = None
    regional_comparison: Optional[dict] = None
    queued_for_expert_review: bool = False
    retrain_triggered: bool = False
    created_at: datetime


class QuickFeedbackRequest(BaseModel):
    recommendation_id: Optional[str] = None
    rating: int = Field(ge=1, le=5)
    service: str = Field(description="crop|price|water|advisory")
    notes: Optional[str] = None
    source: Optional[str] = None


class QuickFeedbackResponse(BaseModel):
    feedback_id: str
    recommendation_id: Optional[str] = None
    rating: int
    service: str
    notes: Optional[str] = None
    created_at: datetime
