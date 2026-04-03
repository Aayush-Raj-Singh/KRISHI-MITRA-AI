from __future__ import annotations

from datetime import date, datetime
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query, Request, status

from app.core.database import Database
from app.core.dependencies import get_db, require_roles
from app.models.user import UserInDB
from app.schemas.mandi import (
    MandiEntryCreate,
    MandiEntryDB,
    MandiEntryListResponse,
    MandiEntryUpdate,
)
from app.schemas.response import APIResponse
from app.utils.audit import log_audit_event
from app.utils.query_filters import build_case_insensitive_exact_filter
from app.utils.responses import success_response

router = APIRouter()


def _coerce_id(raw_id: str):
    return raw_id


def _normalize(doc: dict) -> dict:
    if not doc:
        return doc
    doc["_id"] = str(doc.get("_id"))
    return doc


@router.post("/entries", response_model=APIResponse[MandiEntryDB])
async def create_entry(
    payload: MandiEntryCreate,
    request: Request,
    db: Database = Depends(get_db),
    user: UserInDB = Depends(require_roles(["extension_officer", "admin"])),
) -> APIResponse[MandiEntryDB]:
    now = datetime.utcnow()
    record = payload.model_dump()
    if not record.get("state") or not record.get("district"):
        profile = await db["market_profiles"].find_one(
            {"name": build_case_insensitive_exact_filter(payload.market)}
        )
        if profile:
            record["state"] = record.get("state") or profile.get("state")
            record["district"] = record.get("district") or profile.get("district")
    record.update(
        {
            "status": "draft",
            "created_by": user.id,
            "reviewed_by": None,
            "review_reason": None,
            "history": [{"ts": now.isoformat(), "actor": user.id, "action": "create"}],
            "created_at": now,
            "updated_at": now,
        }
    )
    result = await db["mandi_entries"].insert_one(record)
    created = await db["mandi_entries"].find_one({"_id": result.inserted_id})
    created = _normalize(created)
    await log_audit_event(
        db, user.id, user.role, "mandi_entry", created["_id"], "create", record, request.client.host
    )
    return success_response(MandiEntryDB(**created), message="Mandi entry created")


@router.patch("/entries/{entry_id}", response_model=APIResponse[MandiEntryDB])
async def update_entry(
    entry_id: str,
    payload: MandiEntryUpdate,
    request: Request,
    db: Database = Depends(get_db),
    user: UserInDB = Depends(require_roles(["extension_officer", "admin"])),
) -> APIResponse[MandiEntryDB]:
    entry = await db["mandi_entries"].find_one({"_id": _coerce_id(entry_id)})
    if not entry:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Entry not found")
    if user.role != "admin" and entry.get("created_by") != user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not allowed")
    if entry.get("status") not in {"draft", "rejected"}:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only draft/rejected entries can be edited",
        )

    updates = payload.model_dump(exclude_unset=True)
    if not updates:
        return success_response(MandiEntryDB(**_normalize(entry)), message="No changes applied")

    now = datetime.utcnow()
    if ("state" not in updates or "district" not in updates) and updates.get(
        "market", entry.get("market")
    ):
        market_name = updates.get("market") or entry.get("market")
        profile = await db["market_profiles"].find_one(
            {"name": build_case_insensitive_exact_filter(market_name)}
        )
        if profile:
            updates.setdefault("state", profile.get("state"))
            updates.setdefault("district", profile.get("district"))
    updates["updated_at"] = now
    await db["mandi_entries"].update_one(
        {"_id": _coerce_id(entry_id)},
        {
            "$set": updates,
            "$push": {"history": {"ts": now.isoformat(), "actor": user.id, "action": "update"}},
        },
    )
    updated = await db["mandi_entries"].find_one({"_id": _coerce_id(entry_id)})
    updated = _normalize(updated)
    await log_audit_event(
        db,
        user.id,
        user.role,
        "mandi_entry",
        updated["_id"],
        "update",
        updates,
        request.client.host,
    )
    return success_response(MandiEntryDB(**updated), message="Mandi entry updated")


@router.post("/entries/{entry_id}/submit", response_model=APIResponse[MandiEntryDB])
async def submit_entry(
    entry_id: str,
    request: Request,
    db: Database = Depends(get_db),
    user: UserInDB = Depends(require_roles(["extension_officer", "admin"])),
) -> APIResponse[MandiEntryDB]:
    entry = await db["mandi_entries"].find_one({"_id": _coerce_id(entry_id)})
    if not entry:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Entry not found")
    if user.role != "admin" and entry.get("created_by") != user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not allowed")
    if entry.get("status") not in {"draft", "rejected"}:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only draft/rejected entries can be submitted",
        )

    now = datetime.utcnow()
    await db["mandi_entries"].update_one(
        {"_id": _coerce_id(entry_id)},
        {
            "$set": {"status": "submitted", "updated_at": now},
            "$push": {"history": {"ts": now.isoformat(), "actor": user.id, "action": "submit"}},
        },
    )
    updated = await db["mandi_entries"].find_one({"_id": _coerce_id(entry_id)})
    updated = _normalize(updated)
    await log_audit_event(
        db, user.id, user.role, "mandi_entry", updated["_id"], "submit", {}, request.client.host
    )
    return success_response(MandiEntryDB(**updated), message="Mandi entry submitted")


@router.post("/entries/{entry_id}/approve", response_model=APIResponse[MandiEntryDB])
async def approve_entry(
    entry_id: str,
    request: Request,
    db: Database = Depends(get_db),
    user: UserInDB = Depends(require_roles(["admin"])),
) -> APIResponse[MandiEntryDB]:
    entry = await db["mandi_entries"].find_one({"_id": _coerce_id(entry_id)})
    if not entry:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Entry not found")
    if entry.get("status") != "submitted":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="Only submitted entries can be approved"
        )

    now = datetime.utcnow()
    await db["mandi_entries"].update_one(
        {"_id": _coerce_id(entry_id)},
        {
            "$set": {
                "status": "approved",
                "reviewed_by": user.id,
                "review_reason": None,
                "updated_at": now,
            },
            "$push": {"history": {"ts": now.isoformat(), "actor": user.id, "action": "approve"}},
        },
    )
    updated = await db["mandi_entries"].find_one({"_id": _coerce_id(entry_id)})
    updated = _normalize(updated)
    await log_audit_event(
        db, user.id, user.role, "mandi_entry", updated["_id"], "approve", {}, request.client.host
    )
    return success_response(MandiEntryDB(**updated), message="Mandi entry approved")


@router.post("/entries/{entry_id}/reject", response_model=APIResponse[MandiEntryDB])
async def reject_entry(
    entry_id: str,
    request: Request,
    reason: Optional[str] = Query(default=None),
    db: Database = Depends(get_db),
    user: UserInDB = Depends(require_roles(["admin"])),
) -> APIResponse[MandiEntryDB]:
    entry = await db["mandi_entries"].find_one({"_id": _coerce_id(entry_id)})
    if not entry:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Entry not found")
    if entry.get("status") != "submitted":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="Only submitted entries can be rejected"
        )

    now = datetime.utcnow()
    await db["mandi_entries"].update_one(
        {"_id": _coerce_id(entry_id)},
        {
            "$set": {
                "status": "rejected",
                "reviewed_by": user.id,
                "review_reason": reason,
                "updated_at": now,
            },
            "$push": {
                "history": {
                    "ts": now.isoformat(),
                    "actor": user.id,
                    "action": "reject",
                    "reason": reason,
                }
            },
        },
    )
    updated = await db["mandi_entries"].find_one({"_id": _coerce_id(entry_id)})
    updated = _normalize(updated)
    await log_audit_event(
        db,
        user.id,
        user.role,
        "mandi_entry",
        updated["_id"],
        "reject",
        {"reason": reason},
        request.client.host,
    )
    return success_response(MandiEntryDB(**updated), message="Mandi entry rejected")


@router.get("/entries", response_model=APIResponse[MandiEntryListResponse])
async def list_entries(
    status_filter: Optional[str] = Query(default=None, alias="status"),
    market: Optional[str] = None,
    commodity: Optional[str] = None,
    date_from: Optional[date] = None,
    date_to: Optional[date] = None,
    limit: int = Query(default=50, ge=1, le=200),
    skip: int = Query(default=0, ge=0),
    db: Database = Depends(get_db),
    user: UserInDB = Depends(require_roles(["extension_officer", "admin"])),
) -> APIResponse[MandiEntryListResponse]:
    query: dict = {}
    if status_filter:
        query["status"] = status_filter
    if market:
        query["market"] = market
    if commodity:
        query["commodity"] = commodity
    if date_from or date_to:
        query["arrival_date"] = {}
        if date_from:
            query["arrival_date"]["$gte"] = date_from
        if date_to:
            query["arrival_date"]["$lte"] = date_to
    if user.role != "admin":
        query["created_by"] = user.id

    cursor = db["mandi_entries"].find(query).sort("arrival_date", -1).skip(skip).limit(limit)
    items = [MandiEntryDB(**_normalize(doc)) for doc in await cursor.to_list(length=limit)]
    total = await db["mandi_entries"].count_documents(query)
    return success_response(
        MandiEntryListResponse(items=items, total=total), message="Mandi entries"
    )
