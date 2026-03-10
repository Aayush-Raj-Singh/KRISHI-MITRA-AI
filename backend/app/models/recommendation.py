from __future__ import annotations

from datetime import datetime, timezone
from typing import Any, Dict, Optional

from pydantic import BaseModel, Field


class RecommendationRecord(BaseModel):
    id: Optional[str] = Field(default=None, alias="_id")
    user_id: str
    kind: str
    request_payload: Dict[str, Any]
    response_payload: Dict[str, Any]
    created_at: datetime

    model_config = {
        "populate_by_name": True,
        "arbitrary_types_allowed": True,
    }

    @classmethod
    def from_mongo(cls, data: Dict[str, Any]) -> "RecommendationRecord":
        data = dict(data)
        data["_id"] = str(data.get("_id"))
        return cls(**data)


def default_recommendation_record(user_id: str, kind: str, request_payload: Dict[str, Any], response_payload: Dict[str, Any]) -> Dict[str, Any]:
    return {
        "user_id": user_id,
        "kind": kind,
        "request_payload": request_payload,
        "response_payload": response_payload,
        "created_at": datetime.now(timezone.utc),
    }
