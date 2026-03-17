from __future__ import annotations

from datetime import datetime
from typing import List, Optional

from pydantic import Field

from app.schemas.base import StrictSchema


class DiseasePredictionResponse(StrictSchema):
    crop: str
    disease: str
    confidence: float
    severity: str = Field(pattern="^(low|medium|high)$")
    treatment: List[str]
    prevention: List[str]
    organic_solutions: List[str]
    recommended_products: List[str]
    advisory: Optional[str] = None
    clarifying_questions: List[str] = Field(default_factory=list)


class DiseaseHistoryItem(StrictSchema):
    prediction_id: str
    user_id: str
    crop: str
    disease: str
    confidence: float
    severity: str
    created_at: datetime
    advisory: Optional[str] = None
