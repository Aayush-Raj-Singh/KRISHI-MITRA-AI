from __future__ import annotations

from datetime import datetime
from typing import Any, Dict, List, Optional

from pydantic import BaseModel


class SchedulerHook(BaseModel):
    key: str
    title: str
    cadence: str
    schedule_expression: str
    command: str
    eventbridge_ready_note: str
    last_status: Optional[str] = None
    last_run_at: Optional[datetime] = None


class TriggerOperationResponse(BaseModel):
    run_id: str
    operation: str
    status: str
    triggered_at: datetime
    triggered_by: str
    mode: str
    result: Optional[Dict[str, Any]] = None


class OperationRunItem(BaseModel):
    run_id: str
    operation: str
    status: str
    triggered_by: str
    mode: str
    triggered_at: datetime
    started_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    error: Optional[str] = None
    result: Optional[Dict[str, Any]] = None


class SchedulerOverviewResponse(BaseModel):
    hooks: List[SchedulerHook]
    recent_runs: List[OperationRunItem]
