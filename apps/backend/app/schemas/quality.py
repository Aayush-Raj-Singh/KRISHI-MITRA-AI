from __future__ import annotations

from datetime import datetime
from typing import List, Optional

from pydantic import BaseModel


class DataQualityIssue(BaseModel):
    issue_type: str
    severity: str
    message: str
    entry_id: Optional[str] = None
    fields: Optional[dict] = None
    detected_at: datetime


class DataQualitySummary(BaseModel):
    total: int
    by_severity: dict
    by_type: dict


class DataQualityReport(BaseModel):
    issues: List[DataQualityIssue]
    summary: DataQualitySummary
    generated_at: datetime
