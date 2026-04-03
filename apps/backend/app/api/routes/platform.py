from __future__ import annotations

from typing import Optional

from fastapi import APIRouter, Depends, Query

from app.core.dependencies import get_platform_service, require_roles
from app.schemas.platform import (
    HierarchyNode,
    PlatformBlueprintResponse,
    PlatformSubscriptionTier,
    PlatformWorkspaceResponse,
)
from app.schemas.response import APIResponse
from app.services.platform_service import PlatformService
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


@router.get("/blueprint", response_model=APIResponse[PlatformBlueprintResponse])
async def platform_blueprint(
    __: str = Depends(require_roles(PLATFORM_ROLES)),
    service: PlatformService = Depends(get_platform_service),
) -> APIResponse[PlatformBlueprintResponse]:
    return success_response(service.blueprint(), message="platform blueprint")


@router.get("/subscriptions", response_model=APIResponse[list[PlatformSubscriptionTier]])
async def platform_subscriptions(
    __: str = Depends(require_roles(PLATFORM_ROLES)),
    service: PlatformService = Depends(get_platform_service),
) -> APIResponse[list[PlatformSubscriptionTier]]:
    return success_response(service.blueprint().subscriptions, message="platform subscriptions")


@router.get("/hierarchy", response_model=APIResponse[HierarchyNode])
async def platform_hierarchy(
    state: Optional[str] = None,
    district: Optional[str] = None,
    lat: Optional[float] = Query(default=None, ge=-90, le=90),
    lon: Optional[float] = Query(default=None, ge=-180, le=180),
    __: str = Depends(require_roles(PLATFORM_ROLES)),
    service: PlatformService = Depends(get_platform_service),
) -> APIResponse[HierarchyNode]:
    payload = await service.resolve_hierarchy(state=state, district=district, lat=lat, lon=lon)
    return success_response(payload, message="platform hierarchy")


@router.get("/workspace", response_model=APIResponse[PlatformWorkspaceResponse])
async def platform_workspace(
    persona: str = Query(default="farmer"),
    state: Optional[str] = None,
    district: Optional[str] = None,
    crop: Optional[str] = None,
    lat: Optional[float] = Query(default=None, ge=-90, le=90),
    lon: Optional[float] = Query(default=None, ge=-180, le=180),
    __: str = Depends(require_roles(PLATFORM_ROLES)),
    service: PlatformService = Depends(get_platform_service),
) -> APIResponse[PlatformWorkspaceResponse]:
    payload = await service.workspace(
        persona=persona, state=state, district=district, crop=crop, lat=lat, lon=lon
    )
    return success_response(payload, message="platform workspace")
