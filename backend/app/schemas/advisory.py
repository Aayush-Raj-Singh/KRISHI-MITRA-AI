from __future__ import annotations

from datetime import datetime
from typing import List, Optional

from pydantic import BaseModel, Field, field_validator

SUPPORTED_ADVISORY_LANGUAGES = {
    "en",
    "hi",
    "bn",
    "ta",
    "te",
    "mr",
    "gu",
    "kn",
    "pa",
    "as",
    "ml",
    "or",
    "ur",
    "ne",
    "sa",
}


class ChatRequest(BaseModel):
    message: str = Field(min_length=3, max_length=4000)
    language: Optional[str] = None

    @field_validator("language")
    @classmethod
    def validate_language(cls, value: Optional[str]) -> Optional[str]:
        if value is None:
            return value
        normalized = value.strip().lower()
        if normalized not in SUPPORTED_ADVISORY_LANGUAGES:
            raise ValueError(f"Unsupported language '{value}'.")
        return normalized


class TranslationRequest(BaseModel):
    texts: List[str] = Field(min_length=1, max_length=200)
    target_language: str = Field(min_length=2, max_length=5)
    source_language: str = Field(default="auto", min_length=2, max_length=5)

    @field_validator("texts")
    @classmethod
    def validate_texts(cls, value: List[str]) -> List[str]:
        cleaned: List[str] = []
        for item in value:
            content = item.strip()
            if not content:
                continue
            if len(content) > 4000:
                raise ValueError("Text entries must be 4000 characters or fewer.")
            cleaned.append(content)
        if not cleaned:
            raise ValueError("At least one non-empty text is required.")
        return cleaned

    @field_validator("target_language")
    @classmethod
    def validate_target_language(cls, value: str) -> str:
        normalized = value.strip().lower()
        if normalized not in SUPPORTED_ADVISORY_LANGUAGES:
            raise ValueError(f"Unsupported target language '{value}'.")
        return normalized

    @field_validator("source_language")
    @classmethod
    def validate_source_language(cls, value: str) -> str:
        normalized = value.strip().lower()
        if normalized != "auto" and normalized not in SUPPORTED_ADVISORY_LANGUAGES:
            raise ValueError(f"Unsupported source language '{value}'.")
        return normalized


class ChatSource(BaseModel):
    title: str
    reference: str


class ChatResponse(BaseModel):
    reply: str
    language: str
    model: str
    sources: List[ChatSource]
    is_fallback: bool
    latency_ms: float
    conversation_id: str
    created_at: datetime


class ChatMessage(BaseModel):
    role: str
    content: str
    timestamp: Optional[str] = None


class ChatHistoryResponse(BaseModel):
    messages: List[ChatMessage]


class AdvisorySlaTelemetry(BaseModel):
    window_minutes: int
    total_requests: int
    successful_requests: int
    fallback_responses: int
    p50_latency_ms: float
    p95_latency_ms: float
    sla_target_ms: float
    sla_compliant: bool
    language_distribution: dict[str, int]
    generated_at: datetime


class TranslationResponse(BaseModel):
    target_language: str
    source_language: str
    translations: dict[str, str]
