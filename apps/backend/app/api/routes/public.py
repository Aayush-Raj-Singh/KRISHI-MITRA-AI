from __future__ import annotations

from datetime import date
from typing import Optional

from fastapi import APIRouter, Depends, Query
from app.core.database import Database

from app.core.dependencies import get_db, require_public_api_key
from app.schemas.mandi import PublicMandiPrice, PublicMandiPricesResponse
from app.schemas.public import PublicArrivalPoint, PublicArrivalsResponse, PublicMandiItem, PublicMandisResponse, PublicPricePoint, PublicPricesResponse
from app.schemas.response import APIResponse
from app.utils.responses import success_response

router = APIRouter()


@router.get("/mandi-prices", response_model=APIResponse[PublicMandiPricesResponse])
async def public_mandi_prices(
    commodity: Optional[str] = None,
    market: Optional[str] = None,
    date_from: Optional[date] = None,
    date_to: Optional[date] = None,
    limit: int = Query(default=50, ge=1, le=200),
    db: Database = Depends(get_db),
    __: str = Depends(require_public_api_key),
) -> APIResponse[PublicMandiPricesResponse]:
    query: dict = {"status": "approved"}
    if commodity:
        query["commodity"] = commodity
    if market:
        query["market"] = market
    if date_from or date_to:
        query["arrival_date"] = {}
        if date_from:
            query["arrival_date"]["$gte"] = date_from
        if date_to:
            query["arrival_date"]["$lte"] = date_to

    cursor = db["mandi_entries"].find(query).sort("arrival_date", -1).limit(limit)
    items = []
    async for doc in cursor:
        items.append(
            PublicMandiPrice(
                date=doc.get("arrival_date"),
                commodity=doc.get("commodity"),
                market=doc.get("market"),
                modal_price=doc.get("modal_price"),
                min_price=doc.get("min_price"),
                max_price=doc.get("max_price"),
            )
        )
    return success_response(PublicMandiPricesResponse(items=items), message="Public mandi prices")


@router.get("/prices", response_model=APIResponse[PublicPricesResponse])
async def public_prices(
    commodity: Optional[str] = None,
    market: Optional[str] = None,
    date_from: Optional[date] = None,
    date_to: Optional[date] = None,
    limit: int = Query(default=50, ge=1, le=200),
    db: Database = Depends(get_db),
    __: str = Depends(require_public_api_key),
) -> APIResponse[PublicPricesResponse]:
    query: dict = {"status": "approved"}
    if commodity:
        query["commodity"] = commodity
    if market:
        query["market"] = market
    if date_from or date_to:
        query["arrival_date"] = {}
        if date_from:
            query["arrival_date"]["$gte"] = date_from
        if date_to:
            query["arrival_date"]["$lte"] = date_to

    cursor = db["mandi_entries"].find(query).sort("arrival_date", -1).limit(limit)
    items = [
        PublicPricePoint(
            date=doc.get("arrival_date"),
            commodity=doc.get("commodity"),
            market=doc.get("market"),
            modal_price=doc.get("modal_price"),
            min_price=doc.get("min_price"),
            max_price=doc.get("max_price"),
        )
        async for doc in cursor
    ]
    return success_response(PublicPricesResponse(items=items), message="public prices")


@router.get("/arrivals", response_model=APIResponse[PublicArrivalsResponse])
async def public_arrivals(
    commodity: Optional[str] = None,
    market: Optional[str] = None,
    date_from: Optional[date] = None,
    date_to: Optional[date] = None,
    limit: int = Query(default=50, ge=1, le=200),
    db: Database = Depends(get_db),
    __: str = Depends(require_public_api_key),
) -> APIResponse[PublicArrivalsResponse]:
    query: dict = {"status": "approved"}
    if commodity:
        query["commodity"] = commodity
    if market:
        query["market"] = market
    if date_from or date_to:
        query["arrival_date"] = {}
        if date_from:
            query["arrival_date"]["$gte"] = date_from
        if date_to:
            query["arrival_date"]["$lte"] = date_to

    cursor = db["mandi_entries"].find(query).sort("arrival_date", -1).limit(limit)
    items = [
        PublicArrivalPoint(
            date=doc.get("arrival_date"),
            commodity=doc.get("commodity"),
            market=doc.get("market"),
            arrivals_qtl=doc.get("arrivals_qtl"),
        )
        async for doc in cursor
    ]
    return success_response(PublicArrivalsResponse(items=items), message="public arrivals")


@router.get("/mandis", response_model=APIResponse[PublicMandisResponse])
async def public_mandis(
    state: Optional[str] = None,
    district: Optional[str] = None,
    limit: int = Query(default=100, ge=1, le=500),
    db: Database = Depends(get_db),
    __: str = Depends(require_public_api_key),
) -> APIResponse[PublicMandisResponse]:
    query: dict = {}
    if state:
        query["state"] = state
    if district:
        query["district"] = district
    cursor = db["market_profiles"].find(query).sort("name", 1).limit(limit)
    items = [
        PublicMandiItem(
            mandi_id=str(doc.get("_id")),
            name=str(doc.get("name", "")),
            state=doc.get("state"),
            district=doc.get("district"),
        )
        async for doc in cursor
    ]
    return success_response(PublicMandisResponse(items=items), message="public mandis")
