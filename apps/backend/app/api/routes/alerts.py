from __future__ import annotations

from datetime import date
from typing import Optional

from fastapi import APIRouter, Depends

from app.core.database import Database
from app.core.dependencies import get_db, require_roles
from app.schemas.response import APIResponse
from app.schemas.trends import PriceSpikeAlert, TrendFilters
from app.services.alerts_service import MarketAlertsService
from app.utils.responses import success_response

router = APIRouter()


@router.get("/market", response_model=APIResponse[list[PriceSpikeAlert]])
async def market_alerts(
    state: Optional[str] = None,
    district: Optional[str] = None,
    mandi: Optional[str] = None,
    commodity: Optional[str] = None,
    variety: Optional[str] = None,
    grade: Optional[str] = None,
    date_from: Optional[date] = None,
    date_to: Optional[date] = None,
    db: Database = Depends(get_db),
    __: str = Depends(require_roles(["farmer", "extension_officer", "admin"])),
) -> APIResponse[list[PriceSpikeAlert]]:
    filters = TrendFilters(
        state=state,
        district=district,
        mandi=mandi,
        commodity=commodity,
        variety=variety,
        grade=grade,
        date_from=date_from,
        date_to=date_to,
    )
    service = MarketAlertsService(db)
    alerts = await service.price_spike_alerts(filters)
    return success_response(alerts, message="market alerts")
