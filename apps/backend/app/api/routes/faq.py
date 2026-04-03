from __future__ import annotations

from datetime import datetime
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query, Request, status

from app.core.database import Database
from app.core.dependencies import get_db, require_roles
from app.models.user import UserInDB
from app.schemas.faq import FAQDB, FAQCreate, FAQUpdate
from app.schemas.response import APIResponse
from app.utils.audit import log_audit_event
from app.utils.responses import success_response

router = APIRouter()


def _coerce_id(raw_id: str):
    return raw_id


def _normalize(doc: dict) -> dict:
    if not doc:
        return doc
    doc["_id"] = str(doc.get("_id"))
    return doc


@router.get("", response_model=APIResponse[list[FAQDB]])
async def list_faq(
    language: Optional[str] = None,
    published: Optional[bool] = True,
    limit: int = Query(default=200, ge=1, le=500),
    db: Database = Depends(get_db),
) -> APIResponse[list[FAQDB]]:
    query: dict = {}
    if language:
        query["language"] = language
    if published is not None:
        query["published"] = published
    cursor = db["faqs"].find(query).sort("order", 1).limit(limit)
    items = [FAQDB(**_normalize(doc)) for doc in await cursor.to_list(length=limit)]
    return success_response(items, message="FAQ list")


@router.post("", response_model=APIResponse[FAQDB])
async def create_faq(
    payload: FAQCreate,
    request: Request,
    db: Database = Depends(get_db),
    user: UserInDB = Depends(require_roles(["admin"])),
) -> APIResponse[FAQDB]:
    record = payload.model_dump()
    now = datetime.utcnow()
    record.update({"created_at": now, "updated_at": now})
    result = await db["faqs"].insert_one(record)
    created = await db["faqs"].find_one({"_id": result.inserted_id})
    created = _normalize(created)
    await log_audit_event(
        db, user.id, user.role, "faq", created["_id"], "create", record, request.client.host
    )
    return success_response(FAQDB(**created), message="FAQ created")


@router.patch("/{faq_id}", response_model=APIResponse[FAQDB])
async def update_faq(
    faq_id: str,
    payload: FAQUpdate,
    request: Request,
    db: Database = Depends(get_db),
    user: UserInDB = Depends(require_roles(["admin"])),
) -> APIResponse[FAQDB]:
    updates = payload.model_dump(exclude_unset=True)
    if not updates:
        faq = await db["faqs"].find_one({"_id": _coerce_id(faq_id)})
        if not faq:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="FAQ not found")
        return success_response(FAQDB(**_normalize(faq)), message="No changes applied")
    updates["updated_at"] = datetime.utcnow()
    result = await db["faqs"].update_one({"_id": _coerce_id(faq_id)}, {"$set": updates})
    if result.matched_count == 0:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="FAQ not found")
    updated = await db["faqs"].find_one({"_id": _coerce_id(faq_id)})
    updated = _normalize(updated)
    await log_audit_event(
        db, user.id, user.role, "faq", updated["_id"], "update", updates, request.client.host
    )
    return success_response(FAQDB(**updated), message="FAQ updated")
