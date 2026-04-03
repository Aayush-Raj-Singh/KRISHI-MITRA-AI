from __future__ import annotations

from datetime import date
from typing import Optional

from fastapi import APIRouter, Depends, Query

from app.core.database import Database
from app.core.dependencies import get_db, require_roles
from app.schemas.quality import DataQualityReport
from app.schemas.response import APIResponse
from app.services.data_quality_service import DataQualityService
from app.utils.responses import success_response

router = APIRouter()


@router.get("/mandi", response_model=APIResponse[DataQualityReport])
async def mandi_quality_checks(
    state: Optional[str] = None,
    district: Optional[str] = None,
    mandi: Optional[str] = None,
    market: Optional[str] = None,
    commodity: Optional[str] = None,
    date_from: Optional[date] = None,
    date_to: Optional[date] = None,
    db: Database = Depends(get_db),
    __: str = Depends(require_roles(["extension_officer", "admin"])),
) -> APIResponse[DataQualityReport]:
    filters: dict = {}
    if state:
        filters["state"] = state
    if district:
        filters["district"] = district
    if mandi:
        filters["market"] = mandi
    elif market:
        filters["market"] = market
    if commodity:
        filters["commodity"] = commodity
    if date_from or date_to:
        filters["arrival_date"] = {}
        if date_from:
            filters["arrival_date"]["$gte"] = date_from
        if date_to:
            filters["arrival_date"]["$lte"] = date_to
    service = DataQualityService(db)
    report = await service.run_mandi_checks(filters)
    return success_response(report, message="data quality report")


@router.get("/issues", response_model=APIResponse[list[dict]])
async def list_quality_issues(
    limit: int = Query(default=200, ge=1, le=500),
    db: Database = Depends(get_db),
    __: str = Depends(require_roles(["admin"])),
) -> APIResponse[list[dict]]:
    docs = (
        await db["data_quality_issues"]
        .find({})
        .sort("detected_at", -1)
        .limit(limit)
        .to_list(length=limit)
    )
    for doc in docs:
        doc["_id"] = str(doc.get("_id"))
    return success_response(docs, message="data quality issues")
