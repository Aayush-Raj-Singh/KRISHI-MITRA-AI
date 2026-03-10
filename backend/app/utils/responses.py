from __future__ import annotations

from typing import Any, Optional

from app.schemas.response import APIResponse


def success_response(data: Any, message: str = "") -> APIResponse[Any]:
    return APIResponse(success=True, data=data, message=message)


def error_response(message: str, data: Optional[Any] = None) -> APIResponse[Any]:
    return APIResponse(success=False, data=data, message=message)
