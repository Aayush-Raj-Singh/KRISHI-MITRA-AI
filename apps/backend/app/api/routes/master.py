from __future__ import annotations

from datetime import datetime
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query, Request, status
from app.core.database import Database

from app.core.dependencies import get_db, require_roles
from app.models.user import UserInDB
from app.schemas.master import (
    CommodityCreate,
    CommodityUpdate,
    GradeCreate,
    GradeUpdate,
    MSPCreate,
    MSPUpdate,
    SeasonCreate,
    SeasonUpdate,
    UnitCreate,
    UnitUpdate,
    VarietyCreate,
    VarietyUpdate,
)
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


async def _create_doc(
    db: Database,
    collection: str,
    payload: dict,
) -> dict:
    now = datetime.utcnow()
    payload.update({"created_at": now, "updated_at": now})
    result = await db[collection].insert_one(payload)
    created = await db[collection].find_one({"_id": result.inserted_id})
    return _normalize(created)


async def _update_doc(
    db: Database,
    collection: str,
    doc_id: str,
    updates: dict,
) -> dict:
    updates["updated_at"] = datetime.utcnow()
    result = await db[collection].update_one({"_id": _coerce_id(doc_id)}, {"$set": updates})
    if result.matched_count == 0:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Record not found")
    updated = await db[collection].find_one({"_id": _coerce_id(doc_id)})
    return _normalize(updated)


@router.post("/commodities", response_model=APIResponse[dict])
async def create_commodity(
    payload: CommodityCreate,
    request: Request,
    db: Database = Depends(get_db),
    user: UserInDB = Depends(require_roles(["admin"])),
) -> APIResponse[dict]:
    created = await _create_doc(db, "commodities", payload.model_dump())
    await log_audit_event(db, user.id, user.role, "commodity", created["_id"], "create", created, request.client.host)
    return success_response(created, message="Commodity created")


@router.get("/commodities", response_model=APIResponse[list[dict]])
async def list_commodities(
    active: Optional[bool] = None,
    limit: int = Query(default=200, ge=1, le=500),
    db: Database = Depends(get_db),
    user: UserInDB = Depends(require_roles(["admin"])),
) -> APIResponse[list[dict]]:
    query: dict = {}
    if active is not None:
        query["active"] = active
    cursor = db["commodities"].find(query).sort("name", 1).limit(limit)
    items = [_normalize(doc) for doc in await cursor.to_list(length=limit)]
    return success_response(items, message="Commodities")


@router.patch("/commodities/{commodity_id}", response_model=APIResponse[dict])
async def update_commodity(
    commodity_id: str,
    payload: CommodityUpdate,
    request: Request,
    db: Database = Depends(get_db),
    user: UserInDB = Depends(require_roles(["admin"])),
) -> APIResponse[dict]:
    updates = payload.model_dump(exclude_unset=True)
    if not updates:
        record = await db["commodities"].find_one({"_id": _coerce_id(commodity_id)})
        if not record:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Record not found")
        return success_response(_normalize(record), message="No changes applied")
    updated = await _update_doc(db, "commodities", commodity_id, updates)
    await log_audit_event(db, user.id, user.role, "commodity", updated["_id"], "update", updates, request.client.host)
    return success_response(updated, message="Commodity updated")


@router.post("/varieties", response_model=APIResponse[dict])
async def create_variety(
    payload: VarietyCreate,
    request: Request,
    db: Database = Depends(get_db),
    user: UserInDB = Depends(require_roles(["admin"])),
) -> APIResponse[dict]:
    created = await _create_doc(db, "varieties", payload.model_dump())
    await log_audit_event(db, user.id, user.role, "variety", created["_id"], "create", created, request.client.host)
    return success_response(created, message="Variety created")


@router.get("/varieties", response_model=APIResponse[list[dict]])
async def list_varieties(
    commodity_id: Optional[str] = None,
    active: Optional[bool] = None,
    limit: int = Query(default=200, ge=1, le=500),
    db: Database = Depends(get_db),
    user: UserInDB = Depends(require_roles(["admin"])),
) -> APIResponse[list[dict]]:
    query: dict = {}
    if commodity_id:
        query["commodity_id"] = commodity_id
    if active is not None:
        query["active"] = active
    cursor = db["varieties"].find(query).sort("name", 1).limit(limit)
    items = [_normalize(doc) for doc in await cursor.to_list(length=limit)]
    return success_response(items, message="Varieties")


@router.patch("/varieties/{variety_id}", response_model=APIResponse[dict])
async def update_variety(
    variety_id: str,
    payload: VarietyUpdate,
    request: Request,
    db: Database = Depends(get_db),
    user: UserInDB = Depends(require_roles(["admin"])),
) -> APIResponse[dict]:
    updates = payload.model_dump(exclude_unset=True)
    if not updates:
        record = await db["varieties"].find_one({"_id": _coerce_id(variety_id)})
        if not record:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Record not found")
        return success_response(_normalize(record), message="No changes applied")
    updated = await _update_doc(db, "varieties", variety_id, updates)
    await log_audit_event(db, user.id, user.role, "variety", updated["_id"], "update", updates, request.client.host)
    return success_response(updated, message="Variety updated")


@router.post("/grades", response_model=APIResponse[dict])
async def create_grade(
    payload: GradeCreate,
    request: Request,
    db: Database = Depends(get_db),
    user: UserInDB = Depends(require_roles(["admin"])),
) -> APIResponse[dict]:
    created = await _create_doc(db, "grades", payload.model_dump())
    await log_audit_event(db, user.id, user.role, "grade", created["_id"], "create", created, request.client.host)
    return success_response(created, message="Grade created")


@router.get("/grades", response_model=APIResponse[list[dict]])
async def list_grades(
    commodity_id: Optional[str] = None,
    active: Optional[bool] = None,
    limit: int = Query(default=200, ge=1, le=500),
    db: Database = Depends(get_db),
    user: UserInDB = Depends(require_roles(["admin"])),
) -> APIResponse[list[dict]]:
    query: dict = {}
    if commodity_id:
        query["commodity_id"] = commodity_id
    if active is not None:
        query["active"] = active
    cursor = db["grades"].find(query).sort("name", 1).limit(limit)
    items = [_normalize(doc) for doc in await cursor.to_list(length=limit)]
    return success_response(items, message="Grades")


@router.patch("/grades/{grade_id}", response_model=APIResponse[dict])
async def update_grade(
    grade_id: str,
    payload: GradeUpdate,
    request: Request,
    db: Database = Depends(get_db),
    user: UserInDB = Depends(require_roles(["admin"])),
) -> APIResponse[dict]:
    updates = payload.model_dump(exclude_unset=True)
    if not updates:
        record = await db["grades"].find_one({"_id": _coerce_id(grade_id)})
        if not record:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Record not found")
        return success_response(_normalize(record), message="No changes applied")
    updated = await _update_doc(db, "grades", grade_id, updates)
    await log_audit_event(db, user.id, user.role, "grade", updated["_id"], "update", updates, request.client.host)
    return success_response(updated, message="Grade updated")


@router.post("/units", response_model=APIResponse[dict])
async def create_unit(
    payload: UnitCreate,
    request: Request,
    db: Database = Depends(get_db),
    user: UserInDB = Depends(require_roles(["admin"])),
) -> APIResponse[dict]:
    created = await _create_doc(db, "units", payload.model_dump())
    await log_audit_event(db, user.id, user.role, "unit", created["_id"], "create", created, request.client.host)
    return success_response(created, message="Unit created")


@router.get("/units", response_model=APIResponse[list[dict]])
async def list_units(
    limit: int = Query(default=200, ge=1, le=500),
    db: Database = Depends(get_db),
    user: UserInDB = Depends(require_roles(["admin"])),
) -> APIResponse[list[dict]]:
    cursor = db["units"].find({}).sort("name", 1).limit(limit)
    items = [_normalize(doc) for doc in await cursor.to_list(length=limit)]
    return success_response(items, message="Units")


@router.patch("/units/{unit_id}", response_model=APIResponse[dict])
async def update_unit(
    unit_id: str,
    payload: UnitUpdate,
    request: Request,
    db: Database = Depends(get_db),
    user: UserInDB = Depends(require_roles(["admin"])),
) -> APIResponse[dict]:
    updates = payload.model_dump(exclude_unset=True)
    if not updates:
        record = await db["units"].find_one({"_id": _coerce_id(unit_id)})
        if not record:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Record not found")
        return success_response(_normalize(record), message="No changes applied")
    updated = await _update_doc(db, "units", unit_id, updates)
    await log_audit_event(db, user.id, user.role, "unit", updated["_id"], "update", updates, request.client.host)
    return success_response(updated, message="Unit updated")


@router.post("/seasons", response_model=APIResponse[dict])
async def create_season(
    payload: SeasonCreate,
    request: Request,
    db: Database = Depends(get_db),
    user: UserInDB = Depends(require_roles(["admin"])),
) -> APIResponse[dict]:
    created = await _create_doc(db, "seasons", payload.model_dump())
    await log_audit_event(db, user.id, user.role, "season", created["_id"], "create", created, request.client.host)
    return success_response(created, message="Season created")


@router.get("/seasons", response_model=APIResponse[list[dict]])
async def list_seasons(
    active: Optional[bool] = None,
    limit: int = Query(default=200, ge=1, le=500),
    db: Database = Depends(get_db),
    user: UserInDB = Depends(require_roles(["admin"])),
) -> APIResponse[list[dict]]:
    query: dict = {}
    if active is not None:
        query["active"] = active
    cursor = db["seasons"].find(query).sort("name", 1).limit(limit)
    items = [_normalize(doc) for doc in await cursor.to_list(length=limit)]
    return success_response(items, message="Seasons")


@router.patch("/seasons/{season_id}", response_model=APIResponse[dict])
async def update_season(
    season_id: str,
    payload: SeasonUpdate,
    request: Request,
    db: Database = Depends(get_db),
    user: UserInDB = Depends(require_roles(["admin"])),
) -> APIResponse[dict]:
    updates = payload.model_dump(exclude_unset=True)
    if not updates:
        record = await db["seasons"].find_one({"_id": _coerce_id(season_id)})
        if not record:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Record not found")
        return success_response(_normalize(record), message="No changes applied")
    updated = await _update_doc(db, "seasons", season_id, updates)
    await log_audit_event(db, user.id, user.role, "season", updated["_id"], "update", updates, request.client.host)
    return success_response(updated, message="Season updated")


@router.post("/msp", response_model=APIResponse[dict])
async def create_msp(
    payload: MSPCreate,
    request: Request,
    db: Database = Depends(get_db),
    user: UserInDB = Depends(require_roles(["admin"])),
) -> APIResponse[dict]:
    created = await _create_doc(db, "msp_rates", payload.model_dump())
    await log_audit_event(db, user.id, user.role, "msp", created["_id"], "create", created, request.client.host)
    return success_response(created, message="MSP created")


@router.get("/msp", response_model=APIResponse[list[dict]])
async def list_msp(
    commodity_id: Optional[str] = None,
    season: Optional[str] = None,
    limit: int = Query(default=200, ge=1, le=500),
    db: Database = Depends(get_db),
    user: UserInDB = Depends(require_roles(["admin"])),
) -> APIResponse[list[dict]]:
    query: dict = {}
    if commodity_id:
        query["commodity_id"] = commodity_id
    if season:
        query["season"] = season
    cursor = db["msp_rates"].find(query).sort("effective_from", -1).limit(limit)
    items = [_normalize(doc) for doc in await cursor.to_list(length=limit)]
    return success_response(items, message="MSP rates")


@router.patch("/msp/{msp_id}", response_model=APIResponse[dict])
async def update_msp(
    msp_id: str,
    payload: MSPUpdate,
    request: Request,
    db: Database = Depends(get_db),
    user: UserInDB = Depends(require_roles(["admin"])),
) -> APIResponse[dict]:
    updates = payload.model_dump(exclude_unset=True)
    if not updates:
        record = await db["msp_rates"].find_one({"_id": _coerce_id(msp_id)})
        if not record:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Record not found")
        return success_response(_normalize(record), message="No changes applied")
    updated = await _update_doc(db, "msp_rates", msp_id, updates)
    await log_audit_event(db, user.id, user.role, "msp", updated["_id"], "update", updates, request.client.host)
    return success_response(updated, message="MSP updated")
