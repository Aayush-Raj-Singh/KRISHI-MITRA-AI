from __future__ import annotations

from datetime import datetime
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query, Request, status
from app.core.database import Database

from app.core.dependencies import get_db, require_roles
from app.models.user import UserInDB
from app.schemas.response import APIResponse
from app.schemas.ticket import TicketCreate, TicketDB, TicketListResponse, TicketReply, TicketStatusUpdate
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


@router.post("", response_model=APIResponse[TicketDB])
async def create_ticket(
    payload: TicketCreate,
    request: Request,
    db: Database = Depends(get_db),
    user: UserInDB = Depends(require_roles(["farmer", "extension_officer", "admin"])),
) -> APIResponse[TicketDB]:
    now = datetime.utcnow()
    record = {
        "subject": payload.subject,
        "body": payload.body,
        "category": payload.category,
        "status": "open",
        "created_by": user.id,
        "assignee": None,
        "messages": [{"sender": user.id, "body": payload.body, "ts": now}],
        "attachments": [],
        "created_at": now,
        "updated_at": now,
    }
    if payload.attachment_ids:
        record["attachments"] = [{"url": item, "name": item} for item in payload.attachment_ids]
    result = await db["tickets"].insert_one(record)
    created = await db["tickets"].find_one({"_id": result.inserted_id})
    created = _normalize(created)
    await log_audit_event(db, user.id, user.role, "ticket", created["_id"], "create", record, request.client.host)
    return success_response(TicketDB(**created), message="Ticket created")


@router.get("", response_model=APIResponse[TicketListResponse])
async def list_tickets(
    scope: Optional[str] = Query(default="assigned"),
    status_filter: Optional[str] = Query(default=None, alias="status"),
    limit: int = Query(default=50, ge=1, le=200),
    skip: int = Query(default=0, ge=0),
    db: Database = Depends(get_db),
    user: UserInDB = Depends(require_roles(["farmer", "extension_officer", "admin"])),
) -> APIResponse[TicketListResponse]:
    query: dict = {}
    if status_filter:
        query["status"] = status_filter

    if user.role == "farmer":
        query["created_by"] = user.id
    elif user.role == "extension_officer" and scope != "all":
        query["$or"] = [{"assignee": user.id}, {"created_by": user.id}]

    cursor = db["tickets"].find(query).sort("updated_at", -1).skip(skip).limit(limit)
    items = [TicketDB(**_normalize(doc)) for doc in await cursor.to_list(length=limit)]
    total = await db["tickets"].count_documents(query)
    return success_response(TicketListResponse(items=items, total=total), message="Tickets")


@router.post("/{ticket_id}/reply", response_model=APIResponse[TicketDB])
async def reply_ticket(
    ticket_id: str,
    payload: TicketReply,
    request: Request,
    db: Database = Depends(get_db),
    user: UserInDB = Depends(require_roles(["farmer", "extension_officer", "admin"])),
) -> APIResponse[TicketDB]:
    ticket = await db["tickets"].find_one({"_id": _coerce_id(ticket_id)})
    if not ticket:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Ticket not found")

    if user.role == "farmer" and ticket.get("created_by") != user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not allowed")
    if user.role == "extension_officer" and ticket.get("assignee") not in {None, user.id} and ticket.get("created_by") != user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not allowed")

    now = datetime.utcnow()
    message = {"sender": user.id, "body": payload.body, "ts": now}
    await db["tickets"].update_one(
        {"_id": _coerce_id(ticket_id)},
        {"$push": {"messages": message}, "$set": {"updated_at": now}},
    )
    updated = await db["tickets"].find_one({"_id": _coerce_id(ticket_id)})
    updated = _normalize(updated)
    await log_audit_event(db, user.id, user.role, "ticket", updated["_id"], "reply", message, request.client.host)
    return success_response(TicketDB(**updated), message="Reply added")


@router.post("/{ticket_id}/status", response_model=APIResponse[TicketDB])
async def update_ticket_status(
    ticket_id: str,
    payload: TicketStatusUpdate,
    request: Request,
    db: Database = Depends(get_db),
    user: UserInDB = Depends(require_roles(["extension_officer", "admin"])),
) -> APIResponse[TicketDB]:
    ticket = await db["tickets"].find_one({"_id": _coerce_id(ticket_id)})
    if not ticket:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Ticket not found")
    if user.role == "extension_officer" and ticket.get("assignee") not in {None, user.id}:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not allowed")

    updates = {"status": payload.status, "updated_at": datetime.utcnow()}
    if payload.assignee is not None:
        updates["assignee"] = payload.assignee
    await db["tickets"].update_one({"_id": _coerce_id(ticket_id)}, {"$set": updates})
    updated = await db["tickets"].find_one({"_id": _coerce_id(ticket_id)})
    updated = _normalize(updated)
    await log_audit_event(db, user.id, user.role, "ticket", updated["_id"], "status", updates, request.client.host)
    return success_response(TicketDB(**updated), message="Ticket updated")
