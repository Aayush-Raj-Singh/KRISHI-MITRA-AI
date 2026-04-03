from __future__ import annotations

from datetime import datetime
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query, Request, status

from app.core.database import Database
from app.core.dependencies import get_db, require_roles
from app.models.user import UserInDB
from app.schemas.market_profile import (
    MarketProfileCreate,
    MarketProfileDB,
    MarketProfileUpdate,
)
from app.schemas.response import APIResponse
from app.utils.audit import log_audit_event
from app.utils.query_filters import build_case_insensitive_contains_filter
from app.utils.responses import success_response

router = APIRouter()


def _coerce_id(raw_id: str):
    return raw_id


def _normalize(doc: dict) -> dict:
    if not doc:
        return doc
    doc["_id"] = str(doc.get("_id"))
    return doc


@router.get("", response_model=APIResponse[list[MarketProfileDB]])
async def list_profiles(
    state: Optional[str] = None,
    district: Optional[str] = None,
    market: Optional[str] = None,
    commodity: Optional[str] = None,
    limit: int = Query(default=50, ge=1, le=200),
    db: Database = Depends(get_db),
) -> APIResponse[list[MarketProfileDB]]:
    query: dict = {}
    if state:
        query["state"] = state
    if district:
        query["district"] = district
    if market:
        query["name"] = build_case_insensitive_contains_filter(market)
    if commodity:
        query["commodities"] = commodity

    cursor = db["market_profiles"].find(query).sort("name", 1).limit(limit)
    items = [MarketProfileDB(**_normalize(doc)) for doc in await cursor.to_list(length=limit)]
    return success_response(items, message="Market profiles")


@router.get("/{profile_id}", response_model=APIResponse[MarketProfileDB])
async def get_profile(
    profile_id: str,
    db: Database = Depends(get_db),
) -> APIResponse[MarketProfileDB]:
    profile = await db["market_profiles"].find_one({"_id": _coerce_id(profile_id)})
    if not profile:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Profile not found")
    return success_response(MarketProfileDB(**_normalize(profile)), message="Market profile")


@router.post("", response_model=APIResponse[MarketProfileDB])
async def create_profile(
    payload: MarketProfileCreate,
    request: Request,
    db: Database = Depends(get_db),
    user: UserInDB = Depends(require_roles(["admin"])),
) -> APIResponse[MarketProfileDB]:
    record = payload.model_dump()
    now = datetime.utcnow()
    record.update({"created_at": now, "updated_at": now})
    result = await db["market_profiles"].insert_one(record)
    created = await db["market_profiles"].find_one({"_id": result.inserted_id})
    created = _normalize(created)
    await log_audit_event(
        db,
        user.id,
        user.role,
        "market_profile",
        created["_id"],
        "create",
        record,
        request.client.host,
    )
    return success_response(MarketProfileDB(**created), message="Market profile created")


@router.patch("/{profile_id}", response_model=APIResponse[MarketProfileDB])
async def update_profile(
    profile_id: str,
    payload: MarketProfileUpdate,
    request: Request,
    db: Database = Depends(get_db),
    user: UserInDB = Depends(require_roles(["admin"])),
) -> APIResponse[MarketProfileDB]:
    updates = payload.model_dump(exclude_unset=True)
    if not updates:
        profile = await db["market_profiles"].find_one({"_id": _coerce_id(profile_id)})
        if not profile:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Profile not found")
        return success_response(
            MarketProfileDB(**_normalize(profile)), message="No changes applied"
        )
    updates["updated_at"] = datetime.utcnow()
    result = await db["market_profiles"].update_one(
        {"_id": _coerce_id(profile_id)}, {"$set": updates}
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Profile not found")
    updated = await db["market_profiles"].find_one({"_id": _coerce_id(profile_id)})
    updated = _normalize(updated)
    await log_audit_event(
        db,
        user.id,
        user.role,
        "market_profile",
        updated["_id"],
        "update",
        updates,
        request.client.host,
    )
    return success_response(MarketProfileDB(**updated), message="Market profile updated")
