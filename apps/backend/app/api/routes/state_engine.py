from __future__ import annotations

from typing import Optional

from fastapi import APIRouter, Depends, Query

from app.core.dependencies import get_state_engine_service, require_roles
from app.schemas.response import APIResponse
from app.schemas.state_engine import (
    StateCatalogResponse,
    StateIntelligenceResponse,
    StateResolutionResponse,
)
from app.services.state_engine_service import StateEngineService
from app.utils.responses import success_response

router = APIRouter()
PLATFORM_ROLES = [
    "farmer",
    "extension_officer",
    "fpo",
    "agri_business",
    "government_agency",
    "admin",
]


@router.get("/catalog", response_model=APIResponse[StateCatalogResponse])
async def state_catalog(
    __: str = Depends(require_roles(PLATFORM_ROLES)),
    service: StateEngineService = Depends(get_state_engine_service),
) -> APIResponse[StateCatalogResponse]:
    payload = await service.catalog()
    return success_response(payload, message="state engine catalog")


@router.get("/resolve", response_model=APIResponse[StateResolutionResponse])
async def state_resolution(
    state: Optional[str] = None,
    district: Optional[str] = None,
    lat: Optional[float] = Query(default=None, ge=-90, le=90),
    lon: Optional[float] = Query(default=None, ge=-180, le=180),
    __: str = Depends(require_roles(PLATFORM_ROLES)),
    service: StateEngineService = Depends(get_state_engine_service),
) -> APIResponse[StateResolutionResponse]:
    payload = await service.resolve_context(state=state, district=district, lat=lat, lon=lon)
    return success_response(payload, message="state engine resolution")


@router.get("/intelligence", response_model=APIResponse[StateIntelligenceResponse])
async def state_intelligence(
    state: Optional[str] = None,
    district: Optional[str] = None,
    crop: Optional[str] = None,
    lat: Optional[float] = Query(default=None, ge=-90, le=90),
    lon: Optional[float] = Query(default=None, ge=-180, le=180),
    __: str = Depends(require_roles(PLATFORM_ROLES)),
    service: StateEngineService = Depends(get_state_engine_service),
) -> APIResponse[StateIntelligenceResponse]:
    payload = await service.intelligence(
        state=state, district=district, crop=crop, lat=lat, lon=lon
    )
    return success_response(payload, message="state engine intelligence")
