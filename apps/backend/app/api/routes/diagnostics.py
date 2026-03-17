from __future__ import annotations

import asyncio
from typing import Any, Dict

from fastapi import APIRouter, Depends, Query

from app.core.dependencies import require_roles
from app.models.user import UserInDB
from app.schemas.response import APIResponse
from app.services.aws_validation_service import AWSValidationService
from app.services.bedrock_service import BedrockService
from app.utils.responses import success_response

router = APIRouter()


@router.get("/bedrock", response_model=APIResponse[Dict[str, Any]])
async def bedrock_diagnostics(
    test_fallback: bool = Query(default=False, description="Also test the fallback model"),
    _: UserInDB = Depends(require_roles(["admin"])),
) -> APIResponse[Dict[str, Any]]:
    try:
        service = BedrockService()
    except Exception as exc:
        return success_response(
            {"available": False, "error": str(exc)},
            message="bedrock diagnostics",
        )

    result = await asyncio.to_thread(service.health_check, test_fallback)
    return success_response(result, message="bedrock diagnostics")


@router.get("/aws-runtime", response_model=APIResponse[Dict[str, Any]])
async def aws_runtime_diagnostics(
    _: UserInDB = Depends(require_roles(["admin"])),
) -> APIResponse[Dict[str, Any]]:
    service = AWSValidationService()
    result = await asyncio.to_thread(service.validate)
    return success_response(result, message="aws runtime diagnostics")
