from __future__ import annotations

from datetime import datetime
from typing import List, Optional

from pydantic import BaseModel, ConfigDict, Field


class TicketMessage(BaseModel):
    sender: str
    body: str = Field(..., min_length=1)
    ts: datetime = Field(default_factory=datetime.utcnow)


class TicketCreate(BaseModel):
    subject: str = Field(..., min_length=3)
    body: str = Field(..., min_length=1)
    category: Optional[str] = None
    attachment_ids: Optional[List[str]] = None


class TicketReply(BaseModel):
    body: str = Field(..., min_length=1)


class TicketStatusUpdate(BaseModel):
    status: str = Field(..., pattern="^(open|pending|in_progress|resolved|closed)$")
    assignee: Optional[str] = None


class TicketDB(BaseModel):
    id: str = Field(..., alias="_id")
    subject: str
    body: str
    category: Optional[str]
    status: str
    created_by: str
    assignee: Optional[str] = None
    messages: List[TicketMessage] = Field(default_factory=list)
    attachments: List[dict] = Field(default_factory=list)
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(
        validate_by_name=True,
        json_encoders={datetime: lambda v: v.isoformat()}
    )


class TicketListResponse(BaseModel):
    items: List[TicketDB]
    total: int
