from __future__ import annotations

import re
from datetime import date, datetime, timezone
from typing import Optional
from urllib.parse import urlsplit, urlunsplit

from fastapi import APIRouter, Depends, HTTPException, Query, Request, status

from app.core.config import settings
from app.core.database import Database
from app.core.dependencies import (
    get_db,
    get_platform_service,
    get_public_external_data_service,
    require_public_api_key,
)
from app.core.observability import get_observability
from app.schemas.integrations import WeatherResponse
from app.schemas.mandi import PublicMandiPrice, PublicMandiPricesResponse
from app.schemas.platform import PlatformBlueprintResponse, PlatformWorkspaceResponse
from app.schemas.public import (
    PublicArrivalPoint,
    PublicArrivalsResponse,
    PublicMandiItem,
    PublicMandisResponse,
    PublicPricePoint,
    PublicPricesResponse,
)
from app.schemas.response import APIResponse
from app.schemas.telemetry import ClientErrorEventRequest, ClientErrorEventResponse
from app.services.external_data_service import ExternalDataService
from app.services.platform_service import PlatformService
from app.utils.responses import success_response

router = APIRouter()
SENSITIVE_CLIENT_ERROR_KEYS = {
    "authorization",
    "access_token",
    "api_key",
    "password",
    "refresh_token",
    "secret",
    "token",
    "x_api_key",
}
SENSITIVE_TEXT_PATTERNS = (
    (re.compile(r"Bearer\s+[A-Za-z0-9\-._~+/]+=*", flags=re.IGNORECASE), "Bearer [REDACTED]"),
    (
        re.compile(
            r"(?i)\b(access_token|refresh_token|token|api[_-]?key|password|secret)=([^&\s]+)"
        ),
        r"\1=[REDACTED]",
    ),
)


def _sanitize_free_text(value: Optional[str]) -> Optional[str]:
    if not value:
        return value
    sanitized = value
    for pattern, replacement in SENSITIVE_TEXT_PATTERNS:
        sanitized = pattern.sub(replacement, sanitized)
    return sanitized


def _sanitize_url(value: Optional[str]) -> Optional[str]:
    if not value:
        return value
    parsed = urlsplit(value)
    return urlunsplit((parsed.scheme, parsed.netloc, parsed.path, "", ""))


def _sanitize_client_extra(value):
    if isinstance(value, dict):
        sanitized = {}
        for key, item in value.items():
            normalized_key = str(key).strip().lower().replace("-", "_")
            sanitized[str(key)] = (
                "[REDACTED]"
                if normalized_key in SENSITIVE_CLIENT_ERROR_KEYS
                else _sanitize_client_extra(item)
            )
        return sanitized
    if isinstance(value, list):
        return [_sanitize_client_extra(item) for item in value]
    if isinstance(value, str):
        return _sanitize_free_text(value)
    return value


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


@router.get("/weather", response_model=APIResponse[WeatherResponse])
async def public_weather(
    location: str,
    days: int = Query(default=5, ge=1, le=10),
    __: str = Depends(require_public_api_key),
    service: ExternalDataService = Depends(get_public_external_data_service),
) -> APIResponse[WeatherResponse]:
    payload = await service.fetch_weather(location=location, days=days)
    return success_response(payload, message="public weather")


@router.get("/state-intelligence", response_model=APIResponse[PlatformWorkspaceResponse])
async def public_state_intelligence(
    persona: str = Query(default="farmer"),
    state: Optional[str] = None,
    district: Optional[str] = None,
    crop: Optional[str] = None,
    lat: Optional[float] = Query(default=None, ge=-90, le=90),
    lon: Optional[float] = Query(default=None, ge=-180, le=180),
    __: str = Depends(require_public_api_key),
    service: PlatformService = Depends(get_platform_service),
) -> APIResponse[PlatformWorkspaceResponse]:
    payload = await service.workspace(
        persona=persona, state=state, district=district, crop=crop, lat=lat, lon=lon
    )
    return success_response(payload, message="public state intelligence")


@router.get("/api-catalog", response_model=APIResponse[PlatformBlueprintResponse])
async def public_api_catalog(
    __: str = Depends(require_public_api_key),
    service: PlatformService = Depends(get_platform_service),
) -> APIResponse[PlatformBlueprintResponse]:
    payload = service.blueprint()
    return success_response(
        payload.model_copy(
            update={
                "microservices": [],
                "pipeline_jobs": [],
                "subscriptions": [],
            }
        ),
        message="public api catalog",
    )


@router.post("/client-errors", response_model=APIResponse[ClientErrorEventResponse])
async def ingest_client_error(
    payload: ClientErrorEventRequest,
    request: Request,
    db: Database = Depends(get_db),
) -> APIResponse[ClientErrorEventResponse]:
    if not settings.client_error_ingest_enabled:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail="Client error ingest disabled"
        )

    event = {
        **payload.model_dump(),
        "message": _sanitize_free_text(payload.message),
        "stack": _sanitize_free_text(payload.stack),
        "route": _sanitize_free_text(payload.route),
        "url": _sanitize_url(payload.url),
        "extra": _sanitize_client_extra(payload.extra),
        "request_id": request.headers.get("x-request-id")
        or getattr(request.state, "request_id", None),
        "source_ip": request.client.host if request.client else "unknown",
        "created_at": datetime.now(timezone.utc),
    }
    result = await db["client_error_events"].insert_one(event)
    get_observability(request.app).record_client_error(source=payload.source)
    return success_response(
        ClientErrorEventResponse(accepted=True, event_id=str(result.inserted_id)),
        message="client error recorded",
    )
