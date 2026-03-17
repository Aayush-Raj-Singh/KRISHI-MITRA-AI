from __future__ import annotations

from datetime import datetime
from typing import Optional

from pydantic import BaseModel


class ExternalLinkCheckResponse(BaseModel):
    url: str
    safe: bool
    verified: bool
    domain: Optional[str] = None
    reason: Optional[str] = None
    checked_at: datetime
