from __future__ import annotations

from datetime import datetime, timezone

from fastapi import APIRouter, Depends, Query
from app.core.database import Database

from app.core.dependencies import get_db, require_roles
from app.schemas.integrations import (
    IntegrationAuditItem,
    IntegrationAuditResponse,
    MandiCatalogResponse,
    MandiPriceResponse,
    WeatherResponse,
)
from app.schemas.response import APIResponse
from app.services.external_data_service import ExternalDataService
from app.utils.responses import success_response

router = APIRouter()


@router.get("/weather", response_model=APIResponse[WeatherResponse])
async def weather(
    location: str = Query(min_length=2),
    days: int = Query(default=5, ge=1, le=14),
    db: Database = Depends(get_db),
    __: str = Depends(require_roles(["farmer", "extension_officer", "admin"])),
) -> APIResponse[WeatherResponse]:
    service = ExternalDataService(db)
    result = await service.fetch_weather(location, days=days)
    return success_response(result, message="weather data")


@router.get("/mandi-prices", response_model=APIResponse[MandiPriceResponse])
async def mandi_prices(
    crop: str = Query(min_length=2),
    market: str = Query(min_length=2),
    days: int = Query(default=7, ge=1, le=30),
    db: Database = Depends(get_db),
    __: str = Depends(require_roles(["farmer", "extension_officer", "admin"])),
) -> APIResponse[MandiPriceResponse]:
    service = ExternalDataService(db)
    result = await service.fetch_mandi_prices(crop, market, days=days)
    return success_response(result, message="mandi prices")


@router.get("/mandi-catalog", response_model=APIResponse[MandiCatalogResponse])
async def mandi_catalog(
    category: str | None = Query(default=None),
    search: str | None = Query(default=None),
    limit: int = Query(default=500, ge=1, le=2000),
    db: Database = Depends(get_db),
    __: str = Depends(require_roles(["farmer", "extension_officer", "admin"])),
) -> APIResponse[MandiCatalogResponse]:
    service = ExternalDataService(db)
    result = service.get_mandi_catalog(category=category, search=search, limit=limit)
    return success_response(result, message="mandi catalog")


@router.get("/audit", response_model=APIResponse[IntegrationAuditResponse])
async def integration_audit(
    limit: int = Query(default=50, ge=1, le=500),
    db: Database = Depends(get_db),
    __: str = Depends(require_roles(["admin"])),
) -> APIResponse[IntegrationAuditResponse]:
    docs = await db["integration_audit"].find({}).sort("created_at", -1).limit(limit).to_list(length=limit)
    items = [
        IntegrationAuditItem(
            event=str(item.get("event", "unknown")),
            payload=dict(item.get("payload", {})),
            created_at=item.get("created_at", datetime.now(timezone.utc)),
        )
        for item in docs
    ]
    return success_response(IntegrationAuditResponse(items=items), message="integration audit log")
