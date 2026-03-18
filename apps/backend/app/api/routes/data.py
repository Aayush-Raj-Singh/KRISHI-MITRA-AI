from __future__ import annotations

from fastapi import APIRouter, Depends, Query

from app.core.dependencies import (
    get_external_data_service,
    get_public_external_data_service,
    require_roles,
)
from app.schemas.integrations import LocationLookupResponse, LocationSearchResponse, MandiPriceResponse, WeatherResponse
from app.schemas.response import APIResponse
from app.services.external_data_service import ExternalDataService
from app.utils.responses import success_response

router = APIRouter()


@router.get("/weather", response_model=APIResponse[WeatherResponse])
async def weather(
    location: str = Query(min_length=2),
    days: int = Query(default=5, ge=1, le=14),
    __: str = Depends(require_roles(["farmer", "extension_officer", "admin"])),
    service: ExternalDataService = Depends(get_external_data_service),
) -> APIResponse[WeatherResponse]:
    result = await service.fetch_weather(location, days=days)
    return success_response(result, message="weather data")


@router.get("/location/reverse", response_model=APIResponse[LocationLookupResponse])
async def reverse_location(
    lat: float = Query(ge=-90, le=90),
    lon: float = Query(ge=-180, le=180),
    service: ExternalDataService = Depends(get_public_external_data_service),
) -> APIResponse[LocationLookupResponse]:
    result = await service.reverse_geocode(lat, lon)
    return success_response(result, message="location resolved")


@router.get("/location/search", response_model=APIResponse[LocationSearchResponse])
async def search_location(
    query: str = Query(min_length=2),
    service: ExternalDataService = Depends(get_public_external_data_service),
) -> APIResponse[LocationSearchResponse]:
    result = await service.geocode_location(query)
    return success_response(result, message="location resolved")


@router.get("/market-prices", response_model=APIResponse[MandiPriceResponse])
async def market_prices(
    crop: str = Query(min_length=2),
    market: str = Query(min_length=2),
    days: int = Query(default=7, ge=1, le=30),
    __: str = Depends(require_roles(["farmer", "extension_officer", "admin"])),
    service: ExternalDataService = Depends(get_external_data_service),
) -> APIResponse[MandiPriceResponse]:
    result = await service.fetch_mandi_prices(crop, market, days=days)
    return success_response(result, message="market prices")
