from __future__ import annotations

from app.services.bedrock_service import BedrockService
from app.services.llm_provider import BaseLLMService


def get_llm_service() -> BaseLLMService:
    return BedrockService()


def get_llm_runtime_profile() -> dict:
    service = get_llm_service()
    return service.describe_runtime()
