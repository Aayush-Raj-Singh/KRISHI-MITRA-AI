from __future__ import annotations

import asyncio
from typing import Any, Dict, List

from fastapi import APIRouter, Depends, Query, Request

from app.core.config import settings
from app.core.database import Database
from app.core.dependencies import get_db, require_roles
from app.core.observability import get_observability
from app.models.user import UserInDB
from app.schemas.response import APIResponse
from app.services.aws_validation_service import AWSValidationService
from app.services.bedrock_service import BedrockService
from app.services.llm_factory import get_llm_runtime_profile, get_llm_service
from app.services.ml_runtime_service import MLRuntimeService
from app.services.translation_service import TranslationService
from app.utils.responses import success_response

router = APIRouter()


@router.get("/llm", response_model=APIResponse[Dict[str, Any]])
async def llm_diagnostics(
    test_fallback: bool = Query(
        default=False, description="Also test the fallback model when supported"
    ),
    _: UserInDB = Depends(require_roles(["admin"])),
) -> APIResponse[Dict[str, Any]]:
    try:
        service = get_llm_service()
    except Exception as exc:
        return success_response(
            {"available": False, "provider": settings.llm_provider, "error": str(exc)},
            message="llm diagnostics",
        )

    result = await asyncio.to_thread(service.health_check, test_fallback)
    result.update(service.describe_runtime())
    return success_response(result, message="llm diagnostics")


@router.get("/runtime-profile", response_model=APIResponse[Dict[str, Any]])
async def runtime_profile_diagnostics(
    _: UserInDB = Depends(require_roles(["admin"])),
) -> APIResponse[Dict[str, Any]]:
    result = {
        "environment": settings.environment,
        "allow_runtime_fallbacks": settings.allow_runtime_fallbacks,
        "runtime_validation_mock_mode": settings.should_mock_runtime_validation,
        "llm": get_llm_runtime_profile(),
        "translation": {
            "provider": settings.translation_provider,
            "aws_translate_enabled": settings.aws_translate_enabled,
        },
    }
    return success_response(result, message="runtime profile diagnostics")


@router.get("/bedrock", response_model=APIResponse[Dict[str, Any]])
async def bedrock_diagnostics(
    test_fallback: bool = Query(default=False, description="Also test the fallback model"),
    _: UserInDB = Depends(require_roles(["admin"])),
) -> APIResponse[Dict[str, Any]]:
    if settings.llm_provider != "bedrock":
        return success_response(
            {
                "available": False,
                "configured": False,
                "inactive": True,
                "active_provider": settings.llm_provider,
                "reason": "LLM provider is not Bedrock",
            },
            message="bedrock diagnostics",
        )

    try:
        service = BedrockService()
    except Exception as exc:
        return success_response(
            {"available": False, "error": str(exc)},
            message="bedrock diagnostics",
        )

    result = await asyncio.to_thread(service.health_check, test_fallback)
    result["active_provider"] = settings.llm_provider
    return success_response(result, message="bedrock diagnostics")


@router.get("/aws-runtime", response_model=APIResponse[Dict[str, Any]])
async def aws_runtime_diagnostics(
    _: UserInDB = Depends(require_roles(["admin"])),
) -> APIResponse[Dict[str, Any]]:
    service = AWSValidationService()
    result = await asyncio.to_thread(service.validate)
    return success_response(result, message="aws runtime diagnostics")


@router.get("/translation", response_model=APIResponse[Dict[str, Any]])
async def translation_diagnostics(
    _: UserInDB = Depends(require_roles(["admin"])),
) -> APIResponse[Dict[str, Any]]:
    service = TranslationService()
    result = await service.health_check()
    return success_response(result, message="translation diagnostics")


@router.get("/observability", response_model=APIResponse[Dict[str, Any]])
async def observability_diagnostics(
    request: Request,
    _: UserInDB = Depends(require_roles(["admin"])),
) -> APIResponse[Dict[str, Any]]:
    registry = get_observability(request.app)
    snapshot = registry.snapshot(
        db_connected=getattr(request.app.state, "db", None) is not None,
        redis_connected=getattr(request.app.state, "redis", None) is not None,
    )
    return success_response(snapshot, message="observability diagnostics")


@router.get("/client-errors", response_model=APIResponse[List[Dict[str, Any]]])
async def recent_client_errors(
    limit: int = Query(default=25, ge=1, le=100),
    db: Database = Depends(get_db),
    _: UserInDB = Depends(require_roles(["admin"])),
) -> APIResponse[List[Dict[str, Any]]]:
    docs = (
        await db["client_error_events"]
        .find({})
        .sort("created_at", -1)
        .limit(limit)
        .to_list(length=limit)
    )
    return success_response(docs, message="recent client errors")


@router.get("/ml/dashboard", response_model=APIResponse[Dict[str, Any]])
async def ml_dashboard_diagnostics(
    _: UserInDB = Depends(require_roles(["admin"])),
) -> APIResponse[Dict[str, Any]]:
    data = MLRuntimeService().dashboard()
    return success_response(data, message="ml evaluation dashboard")


@router.get("/ml/registry", response_model=APIResponse[Dict[str, Any]])
async def ml_registry_diagnostics(
    _: UserInDB = Depends(require_roles(["admin"])),
) -> APIResponse[Dict[str, Any]]:
    data = MLRuntimeService().registry()
    return success_response(data, message="ml model registry")


@router.get("/ml/datasets", response_model=APIResponse[Dict[str, Any]])
async def ml_dataset_diagnostics(
    _: UserInDB = Depends(require_roles(["admin"])),
) -> APIResponse[Dict[str, Any]]:
    data = MLRuntimeService().datasets()
    return success_response(data, message="ml dataset manifests")


@router.get("/ml/summary", response_model=APIResponse[Dict[str, Any]])
async def ml_summary_diagnostics(
    _: UserInDB = Depends(require_roles(["admin"])),
) -> APIResponse[Dict[str, Any]]:
    data = MLRuntimeService().summary()
    return success_response(data, message="ml runtime summary")
