from __future__ import annotations

from typing import Any, Dict, Optional

from pydantic import Field, field_validator

from app.schemas.base import StrictSchema


def _normalize_text(value: Optional[str], *, field_name: str, max_length: int) -> Optional[str]:
    if value is None:
        return None
    cleaned = " ".join(value.strip().split())
    if not cleaned:
        return None
    if len(cleaned) > max_length:
        raise ValueError(f"{field_name} must be {max_length} characters or fewer")
    return cleaned


class ClientErrorEventRequest(StrictSchema):
    source: str = Field(min_length=3, max_length=16, description="web or mobile")
    message: str = Field(min_length=3, max_length=500)
    stack: Optional[str] = Field(default=None, max_length=5000)
    route: Optional[str] = Field(default=None, max_length=300)
    url: Optional[str] = Field(default=None, max_length=500)
    user_agent: Optional[str] = Field(default=None, max_length=300)
    release: Optional[str] = Field(default=None, max_length=64)
    extra: Optional[Dict[str, Any]] = None

    @field_validator("source")
    @classmethod
    def validate_source(cls, value: str) -> str:
        normalized = (value or "").strip().lower()
        if normalized not in {"web", "mobile"}:
            raise ValueError("source must be either 'web' or 'mobile'")
        return normalized

    @field_validator("message")
    @classmethod
    def validate_message(cls, value: str) -> str:
        normalized = _normalize_text(value, field_name="message", max_length=500)
        if not normalized:
            raise ValueError("message is required")
        return normalized

    @field_validator("stack")
    @classmethod
    def validate_stack(cls, value: Optional[str]) -> Optional[str]:
        return _normalize_text(value, field_name="stack", max_length=5000)

    @field_validator("route")
    @classmethod
    def validate_route(cls, value: Optional[str]) -> Optional[str]:
        return _normalize_text(value, field_name="route", max_length=300)

    @field_validator("url")
    @classmethod
    def validate_url(cls, value: Optional[str]) -> Optional[str]:
        return _normalize_text(value, field_name="url", max_length=500)

    @field_validator("user_agent")
    @classmethod
    def validate_user_agent(cls, value: Optional[str]) -> Optional[str]:
        return _normalize_text(value, field_name="user_agent", max_length=300)

    @field_validator("release")
    @classmethod
    def validate_release(cls, value: Optional[str]) -> Optional[str]:
        return _normalize_text(value, field_name="release", max_length=64)


class ClientErrorEventResponse(StrictSchema):
    accepted: bool
    event_id: str
