from __future__ import annotations

from fastapi import APIRouter, Depends, Query
from app.core.database import Database

from app.core.dependencies import get_db, require_roles
from app.schemas.integrations import MandiPriceResponse, WeatherResponse
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


@router.get("/market-prices", response_model=APIResponse[MandiPriceResponse])
async def market_prices(
    crop: str = Query(min_length=2),
    market: str = Query(min_length=2),
    days: int = Query(default=7, ge=1, le=30),
    db: Database = Depends(get_db),
    __: str = Depends(require_roles(["farmer", "extension_officer", "admin"])),
) -> APIResponse[MandiPriceResponse]:
    service = ExternalDataService(db)
    result = await service.fetch_mandi_prices(crop, market, days=days)
    return success_response(result, message="market prices")
