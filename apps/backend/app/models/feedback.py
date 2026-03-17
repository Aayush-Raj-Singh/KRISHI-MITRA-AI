from __future__ import annotations

from datetime import datetime, timezone
from typing import Any, Dict, Optional

from pydantic import BaseModel, Field


class FeedbackRecord(BaseModel):
    id: Optional[str] = Field(default=None, alias="_id")
    user_id: str
    recommendation_id: str
    rating: int
    outcomes: Dict[str, Any]
    sustainability_score: float
    sustainability_sub_scores: Dict[str, float]
    created_at: datetime

    model_config = {
        "populate_by_name": True,
        "arbitrary_types_allowed": True,
    }

    @classmethod
    def from_record(cls, data: Dict[str, Any]) -> "FeedbackRecord":
        data = dict(data)
        data["_id"] = str(data.get("_id"))
        return cls(**data)


def default_feedback_record(
    user_id: str,
    recommendation_id: str,
    rating: int,
    outcomes: Dict[str, Any],
    sustainability_score: float,
    sustainability_sub_scores: Dict[str, float],
    season: str | None = None,
    badge: str | None = None,
    trend: str | None = None,
    regional_comparison: Dict[str, float] | None = None,
    negative_outcome: bool = False,
) -> Dict[str, Any]:
    return {
        "user_id": user_id,
        "recommendation_id": recommendation_id,
        "rating": rating,
        "outcomes": outcomes,
        "season": season,
        "sustainability_score": sustainability_score,
        "sustainability_sub_scores": sustainability_sub_scores,
        "badge": badge,
        "trend": trend,
        "regional_comparison": regional_comparison or {},
        "negative_outcome": negative_outcome,
        "created_at": datetime.now(timezone.utc),
    }


def default_quick_feedback_record(
    user_id: str,
    recommendation_id: str | None,
    rating: int,
    service: str,
    notes: str | None = None,
    source: str | None = None,
) -> Dict[str, Any]:
    return {
        "user_id": user_id,
        "recommendation_id": recommendation_id,
        "rating": rating,
        "service": service,
        "notes": notes,
        "source": source,
        "created_at": datetime.now(timezone.utc),
    }
