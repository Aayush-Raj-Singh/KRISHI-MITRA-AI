from __future__ import annotations

from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status

from app.core.database import Database
from app.core.dependencies import get_db, require_roles
from app.schemas.mandi_directory import MandiContact, MandiDirectoryItem
from app.schemas.response import APIResponse
from app.utils.query_filters import build_case_insensitive_contains_filter
from app.utils.responses import success_response

router = APIRouter()


def _coerce_id(raw_id: str):
    return raw_id


def _to_directory_item(doc: dict) -> MandiDirectoryItem:
    return MandiDirectoryItem(
        mandi_id=str(doc.get("_id")),
        name=str(doc.get("name", "")),
        state=str(doc.get("state", "")),
        district=doc.get("district"),
        timings=doc.get("timings"),
        facilities=list(doc.get("facilities", []) or []),
        contact=MandiContact(
            person=doc.get("contact_person"),
            phone=doc.get("phone"),
            email=doc.get("email"),
        ),
        major_commodities=list(doc.get("commodities", []) or []),
        transport_info=doc.get("last_mile") or ", ".join(doc.get("transport", []) or []) or None,
    )


@router.get("", response_model=APIResponse[list[MandiDirectoryItem]])
async def list_mandi_directory(
    state: Optional[str] = None,
    district: Optional[str] = None,
    mandi: Optional[str] = None,
    commodity: Optional[str] = None,
    limit: int = Query(default=50, ge=1, le=1000),
    db: Database = Depends(get_db),
    __: str = Depends(require_roles(["farmer", "extension_officer", "admin"])),
) -> APIResponse[list[MandiDirectoryItem]]:
    query: dict = {}
    if state:
        query["state"] = state
    if district:
        query["district"] = district
    if mandi:
        query["name"] = build_case_insensitive_contains_filter(mandi)
    if commodity:
        query["commodities"] = commodity
    cursor = db["market_profiles"].find(query).sort("name", 1).limit(limit)
    items = [_to_directory_item(doc) for doc in await cursor.to_list(length=limit)]
    return success_response(items, message="mandi directory")


@router.get("/{mandi_id}", response_model=APIResponse[MandiDirectoryItem])
async def get_mandi_directory(
    mandi_id: str,
    db: Database = Depends(get_db),
    __: str = Depends(require_roles(["farmer", "extension_officer", "admin"])),
) -> APIResponse[MandiDirectoryItem]:
    doc = await db["market_profiles"].find_one({"_id": _coerce_id(mandi_id)})
    if not doc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Mandi not found")
    return success_response(_to_directory_item(doc), message="mandi profile")
