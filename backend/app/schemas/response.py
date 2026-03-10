from __future__ import annotations

from typing import Generic, Optional, TypeVar

from pydantic import BaseModel

T = TypeVar("T")


class APIResponse(BaseModel, Generic[T]):
    success: bool
    data: Optional[T] = None
    message: str = ""
