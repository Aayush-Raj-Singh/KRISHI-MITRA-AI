from __future__ import annotations

from datetime import date, datetime, timezone
from typing import Optional

from fastapi import APIRouter, Depends, Query
from fastapi.responses import Response

from app.core.database import Database
from app.core.dependencies import (
    get_analytics_service,
    get_db,
    get_report_export_service,
    get_trend_analytics_service,
    require_roles,
)
from app.models.user import UserInDB
from app.schemas.analytics import (
    AnalyticsOverview,
    AnalyticsReportFormat,
    FarmerAttentionItem,
    FeedbackReliabilityStats,
    PriceAccuracyItem,
)
from app.schemas.response import APIResponse
from app.schemas.trends import TrendAnalyticsResponse, TrendFilters
from app.services.analytics_service import AnalyticsService
from app.services.report_export_service import ReportExportService
from app.services.trend_service import TrendAnalyticsService
from app.utils.responses import success_response

router = APIRouter()


@router.get("/overview", response_model=APIResponse[AnalyticsOverview])
async def overview(
    location: Optional[str] = None,
    crop: Optional[str] = None,
    farm_size_min: Optional[float] = Query(default=None, ge=0),
    farm_size_max: Optional[float] = Query(default=None, ge=0),
    from_date: Optional[str] = None,
    to_date: Optional[str] = None,
    user: UserInDB = Depends(require_roles(["extension_officer", "admin"])),
    service: AnalyticsService = Depends(get_analytics_service),
) -> APIResponse[AnalyticsOverview]:
    data = await service.overview(
        location,
        crop,
        farm_size_min,
        farm_size_max,
        from_date,
        to_date,
        actor=user,
    )
    return success_response(data, message="analytics overview")


@router.get("/farmers-needing-attention", response_model=APIResponse[list[FarmerAttentionItem]])
async def farmers_needing_attention(
    location: Optional[str] = None,
    consent_safe: bool = Query(default=True),
    limit: int = Query(default=20, ge=1, le=200),
    user: UserInDB = Depends(require_roles(["extension_officer", "admin"])),
    service: AnalyticsService = Depends(get_analytics_service),
) -> APIResponse[list[FarmerAttentionItem]]:
    data = await service.farmers_needing_attention(
        location=location,
        consent_safe=consent_safe,
        limit=limit,
        actor=user,
    )
    return success_response(data, message="risk ranking generated")


@router.get("/feedback-reliability", response_model=APIResponse[FeedbackReliabilityStats])
async def feedback_reliability(
    location: Optional[str] = None,
    user: UserInDB = Depends(require_roles(["extension_officer", "admin"])),
    service: AnalyticsService = Depends(get_analytics_service),
) -> APIResponse[FeedbackReliabilityStats]:
    data = await service.feedback_reliability(location=location, actor=user)
    return success_response(data, message="feedback reliability generated")


@router.get("/export")
async def export_analytics_report(
    format: AnalyticsReportFormat = Query(default=AnalyticsReportFormat.xlsx),
    location: Optional[str] = None,
    crop: Optional[str] = None,
    farm_size_min: Optional[float] = Query(default=None, ge=0),
    farm_size_max: Optional[float] = Query(default=None, ge=0),
    from_date: Optional[str] = None,
    to_date: Optional[str] = None,
    consent_safe: bool = Query(default=True),
    limit: int = Query(default=20, ge=1, le=200),
    user: UserInDB = Depends(require_roles(["extension_officer", "admin"])),
    service: ReportExportService = Depends(get_report_export_service),
) -> Response:
    content, media_type, filename = await service.export_regional_insights(
        report_format=format,
        location=location,
        crop=crop,
        farm_size_min=farm_size_min,
        farm_size_max=farm_size_max,
        from_date=from_date,
        to_date=to_date,
        consent_safe=consent_safe,
        limit=limit,
        actor=user,
    )
    return Response(
        content=content,
        media_type=media_type,
        headers={
            "Content-Disposition": f'attachment; filename="{filename}"',
            "Cache-Control": "no-store",
        },
    )


@router.get("/trends", response_model=APIResponse[TrendAnalyticsResponse])
async def price_trends(
    state: Optional[str] = None,
    district: Optional[str] = None,
    mandi: Optional[str] = None,
    commodity: Optional[str] = None,
    variety: Optional[str] = None,
    grade: Optional[str] = None,
    from_date: Optional[str] = None,
    to_date: Optional[str] = None,
    user: UserInDB = Depends(require_roles(["farmer", "extension_officer", "admin"])),
    service: TrendAnalyticsService = Depends(get_trend_analytics_service),
) -> APIResponse[TrendAnalyticsResponse]:
    _ = user
    filters = TrendFilters(
        state=state,
        district=district,
        mandi=mandi,
        commodity=commodity,
        variety=variety,
        grade=grade,
        date_from=_parse_date(from_date),
        date_to=_parse_date(to_date),
    )
    data = await service.trends(filters)
    return success_response(data, message="trend analytics")


def _parse_date(value: object) -> Optional[date]:
    if not value:
        return None
    if isinstance(value, date):
        return value
    try:
        return date.fromisoformat(str(value)[:10])
    except ValueError:
        return None


@router.get("/price-accuracy", response_model=APIResponse[list[PriceAccuracyItem]])
async def price_accuracy(
    crop: Optional[str] = None,
    market: Optional[str] = None,
    limit: int = Query(default=50, ge=1, le=500),
    db: Database = Depends(get_db),
    user: UserInDB = Depends(require_roles(["extension_officer", "admin"])),
) -> APIResponse[list[PriceAccuracyItem]]:
    _ = user
    query: dict = {}
    if crop:
        query["crop"] = crop.strip().lower()
    if market:
        query["market"] = market.strip().lower()
    docs = (
        await db["price_accuracy"]
        .find(query)
        .sort("updated_at", -1)
        .limit(limit)
        .to_list(length=limit)
    )
    items = [
        PriceAccuracyItem(
            crop=str(doc.get("crop", "")),
            market=str(doc.get("market", "")),
            recommendation_id=str(doc.get("recommendation_id", "")),
            horizon_days=int(doc.get("horizon_days", 0) or 0),
            points=int(doc.get("points", 0) or 0),
            coverage_pct=float(doc.get("coverage_pct", 0.0) or 0.0),
            mape=float(doc.get("mape", 0.0) or 0.0),
            mae=float(doc.get("mae", 0.0) or 0.0),
            model_version=doc.get("model_version"),
            forecast_created_at=doc.get("forecast_created_at"),
            actuals_from=_parse_date(doc.get("actuals_from")),
            actuals_to=_parse_date(doc.get("actuals_to")),
            updated_at=doc.get("updated_at", datetime.now(timezone.utc)),
        )
        for doc in docs
    ]
    return success_response(items, message="price accuracy metrics")
