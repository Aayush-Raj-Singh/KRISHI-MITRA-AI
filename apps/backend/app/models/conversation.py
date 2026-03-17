from __future__ import annotations

from datetime import datetime, timezone
from typing import Any, Dict, List, Optional

from pydantic import BaseModel, Field


class ConversationRecord(BaseModel):
    id: Optional[str] = Field(default=None, alias="_id")
    user_id: str
    messages: List[Dict[str, Any]]
    updated_at: datetime

    model_config = {
        "populate_by_name": True,
        "arbitrary_types_allowed": True,
    }

    @classmethod
    def from_record(cls, data: Dict[str, Any]) -> "ConversationRecord":
        data = dict(data)
        data["_id"] = str(data.get("_id"))
        return cls(**data)


def default_conversation_record(user_id: str, messages: List[Dict[str, Any]]) -> Dict[str, Any]:
    return {
        "user_id": user_id,
        "messages": messages,
        "updated_at": datetime.now(timezone.utc),
    }
