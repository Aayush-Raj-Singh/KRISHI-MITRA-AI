from __future__ import annotations

from datetime import datetime
from typing import Optional

from fastapi import APIRouter, Depends, Query
from app.core.database import Database

from app.core.dependencies import get_db, require_roles
from app.models.user import UserInDB
from app.schemas.response import APIResponse
from app.utils.responses import success_response

router = APIRouter()


@router.get("", response_model=APIResponse[list[dict]])
async def list_audit(
    entity: Optional[str] = None,
    actor_id: Optional[str] = None,
    action: Optional[str] = None,
    from_ts: Optional[datetime] = None,
    to_ts: Optional[datetime] = None,
    limit: int = Query(default=200, ge=1, le=500),
    db: Database = Depends(get_db),
    _: UserInDB = Depends(require_roles(["admin"])),
) -> APIResponse[list[dict]]:
    query: dict = {}
    if entity:
        query["entity"] = entity
    if actor_id:
        query["actor_id"] = actor_id
    if action:
        query["action"] = action
    if from_ts or to_ts:
        query["ts"] = {}
        if from_ts:
            query["ts"]["$gte"] = from_ts
        if to_ts:
            query["ts"]["$lte"] = to_ts
    cursor = db["audit_logs"].find(query).sort("ts", -1).limit(limit)
    items = []
    async for doc in cursor:
        doc["_id"] = str(doc.get("_id"))
        items.append(doc)
    return success_response(items, message="Audit log")
