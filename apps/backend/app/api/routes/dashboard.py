from __future__ import annotations

from datetime import date
from typing import Optional

from fastapi import APIRouter, Depends, Query
from app.core.database import Database

from app.core.cache import Cache, get_cache
from app.core.dependencies import get_db, require_roles
from app.models.user import UserInDB
from app.schemas.analytics import AnalyticsOverview
from app.schemas.dashboard import PriceArrivalDashboardResponse, PriceArrivalFilters, RegionalInsightsResponse
from app.schemas.response import APIResponse
from app.services.analytics_service import AnalyticsService
from app.services.dashboard_service import DashboardService
from app.utils.responses import success_response

router = APIRouter()


@router.get("/price-arrival", response_model=APIResponse[PriceArrivalDashboardResponse])
async def price_arrival_dashboard(
    state: Optional[str] = None,
    district: Optional[str] = None,
    mandi: Optional[str] = None,
    commodity: Optional[str] = None,
    variety: Optional[str] = None,
    grade: Optional[str] = None,
    date_from: Optional[date] = Query(default=None),
    date_to: Optional[date] = Query(default=None),
    db: Database = Depends(get_db),
    cache: Cache = Depends(get_cache),
    __: str = Depends(require_roles(["farmer", "extension_officer", "admin"])),
) -> APIResponse[PriceArrivalDashboardResponse]:
    filters = PriceArrivalFilters(
        state=state,
        district=district,
        mandi=mandi,
        commodity=commodity,
        variety=variety,
        grade=grade,
        date_from=date_from,
        date_to=date_to,
    )
    service = DashboardService(db, cache)
    result = await service.price_arrival_dashboard(filters)
    return success_response(result, message="price arrival dashboard")


@router.get("/metrics", response_model=APIResponse[AnalyticsOverview])
async def dashboard_metrics(
    location: Optional[str] = None,
    crop: Optional[str] = None,
    farm_size_min: Optional[float] = Query(default=None, ge=0),
    farm_size_max: Optional[float] = Query(default=None, ge=0),
    from_date: Optional[str] = None,
    to_date: Optional[str] = None,
    db: Database = Depends(get_db),
    user: UserInDB = Depends(require_roles(["extension_officer", "admin"])),
) -> APIResponse[AnalyticsOverview]:
    service = AnalyticsService(db)
    overview = await service.overview(
        location,
        crop,
        farm_size_min,
        farm_size_max,
        from_date,
        to_date,
        actor=user,
    )
    return success_response(overview, message="dashboard metrics")


@router.get("/regional-insights", response_model=APIResponse[RegionalInsightsResponse])
async def regional_insights(
    location: Optional[str] = None,
    crop: Optional[str] = None,
    farm_size_min: Optional[float] = Query(default=None, ge=0),
    farm_size_max: Optional[float] = Query(default=None, ge=0),
    from_date: Optional[str] = None,
    to_date: Optional[str] = None,
    consent_safe: bool = Query(default=True),
    limit: int = Query(default=20, ge=1, le=200),
    db: Database = Depends(get_db),
    user: UserInDB = Depends(require_roles(["extension_officer", "admin"])),
) -> APIResponse[RegionalInsightsResponse]:
    service = AnalyticsService(db)
    response = await service.regional_insights(
        location,
        crop,
        farm_size_min,
        farm_size_max,
        from_date,
        to_date,
        consent_safe=consent_safe,
        limit=limit,
        actor=user,
    )
    return success_response(response, message="regional insights")
