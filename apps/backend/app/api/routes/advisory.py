from __future__ import annotations

from fastapi import APIRouter, Depends

from app.core.config import settings
from app.core.dependencies import (
    get_advisory_service,
    get_translation_service,
    require_roles,
)
from app.core.exceptions import ExternalServiceUnavailableError
from app.core.logging import get_logger
from app.models.user import UserInDB
from app.schemas.advisory import (
    AdvisorySlaTelemetry,
    ChatHistoryResponse,
    ChatRequest,
    ChatResponse,
    TranslationRequest,
    TranslationResponse,
)
from app.schemas.response import APIResponse
from app.services.advisory_service import AdvisoryService
from app.services.translation_service import TranslationService
from app.utils.responses import success_response

router = APIRouter()
logger = get_logger(__name__)


@router.post("/chat", response_model=APIResponse[ChatResponse])
async def chat(
    payload: ChatRequest,
    user: UserInDB = Depends(require_roles(["farmer", "extension_officer", "admin"])),
    service: AdvisoryService = Depends(get_advisory_service),
) -> APIResponse[ChatResponse]:
    result = await service.chat(user, payload.message, payload.language)
    return success_response(ChatResponse(**result), message="response generated")


@router.get("/history", response_model=APIResponse[ChatHistoryResponse])
async def history(
    limit: int = 20,
    user: UserInDB = Depends(require_roles(["farmer", "extension_officer", "admin"])),
    service: AdvisoryService = Depends(get_advisory_service),
) -> APIResponse[ChatHistoryResponse]:
    records = await service.get_history(user.id, limit=limit)
    return success_response(ChatHistoryResponse(messages=records), message="history loaded")


@router.get("/telemetry/sla", response_model=APIResponse[AdvisorySlaTelemetry])
async def advisory_sla_telemetry(
    window_minutes: int = 1440,
    sla_target_ms: float = 3000.0,
    _: UserInDB = Depends(require_roles(["extension_officer", "admin"])),
    service: AdvisoryService = Depends(get_advisory_service),
) -> APIResponse[AdvisorySlaTelemetry]:
    telemetry = await service.advisory_sla_telemetry(
        window_minutes=window_minutes, sla_target_ms=sla_target_ms
    )
    return success_response(telemetry, message="advisory telemetry loaded")


@router.post("/translate", response_model=APIResponse[TranslationResponse])
async def translate(
    payload: TranslationRequest,
    service: TranslationService = Depends(get_translation_service),
) -> APIResponse[TranslationResponse]:
    translations: dict[str, str] = {}
    try:
        translations = await service.translate_many(
            payload.texts,
            source_language=payload.source_language,
            target_language=payload.target_language,
        )
    except ExternalServiceUnavailableError:
        raise
    except Exception as exc:
        logger.warning(
            "translate_service_failed", error=str(exc), target_language=payload.target_language
        )
        if settings.is_production:
            raise ExternalServiceUnavailableError("Translation service is unavailable") from exc
        translations = {text: text for text in payload.texts}
    return success_response(
        TranslationResponse(
            target_language=payload.target_language,
            source_language=payload.source_language,
            translations=translations,
        ),
        message="text translated",
    )
