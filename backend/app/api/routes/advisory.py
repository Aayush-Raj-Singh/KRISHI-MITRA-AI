from __future__ import annotations

from fastapi import APIRouter, Depends
from motor.motor_asyncio import AsyncIOMotorDatabase

from app.core.logging import get_logger
from app.core.dependencies import get_db, require_roles
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
    db: AsyncIOMotorDatabase = Depends(get_db),
    user: UserInDB = Depends(require_roles(["farmer", "extension_officer", "admin"])),
) -> APIResponse[ChatResponse]:
    service = AdvisoryService(db)
    result = await service.chat(user, payload.message, payload.language)
    return success_response(ChatResponse(**result), message="response generated")


@router.get("/history", response_model=APIResponse[ChatHistoryResponse])
async def history(
    limit: int = 20,
    db: AsyncIOMotorDatabase = Depends(get_db),
    user: UserInDB = Depends(require_roles(["farmer", "extension_officer", "admin"])),
) -> APIResponse[ChatHistoryResponse]:
    service = AdvisoryService(db)
    records = await service.get_history(user.id, limit=limit)
    return success_response(ChatHistoryResponse(messages=records), message="history loaded")


@router.get("/telemetry/sla", response_model=APIResponse[AdvisorySlaTelemetry])
async def advisory_sla_telemetry(
    window_minutes: int = 1440,
    sla_target_ms: float = 3000.0,
    db: AsyncIOMotorDatabase = Depends(get_db),
    _: UserInDB = Depends(require_roles(["extension_officer", "admin"])),
) -> APIResponse[AdvisorySlaTelemetry]:
    service = AdvisoryService(db)
    telemetry = await service.advisory_sla_telemetry(window_minutes=window_minutes, sla_target_ms=sla_target_ms)
    return success_response(telemetry, message="advisory telemetry loaded")


@router.post("/translate", response_model=APIResponse[TranslationResponse])
async def translate(
    payload: TranslationRequest,
    _: UserInDB = Depends(require_roles(["farmer", "extension_officer", "admin"])),
) -> APIResponse[TranslationResponse]:
    translations: dict[str, str] = {}
    try:
        service = TranslationService()
        translations = await service.translate_many(
            payload.texts,
            source_language=payload.source_language,
            target_language=payload.target_language,
        )
    except Exception as exc:  # noqa: BLE001
        logger.warning("translate_service_failed", error=str(exc), target_language=payload.target_language)
        translations = {text: text for text in payload.texts}
    return success_response(
        TranslationResponse(
            target_language=payload.target_language,
            source_language=payload.source_language,
            translations=translations,
        ),
        message="text translated",
    )
