from __future__ import annotations

from datetime import date, datetime
from typing import Any, Dict, List, Optional

from pydantic import BaseModel, Field

from app.schemas.recommendations import WeatherDay


class WeatherResponse(BaseModel):
    location: str
    source: str
    forecast: List[WeatherDay]
    fetched_at: datetime
    cached: bool = False
    stale_data_warning: Optional[str] = None


class LocationLookupResponse(BaseModel):
    latitude: float
    longitude: float
    label: str
    source: str
    city: Optional[str] = None
    state: Optional[str] = None
    country: Optional[str] = None


class LocationSearchResponse(BaseModel):
    label: str
    source: str
    city: Optional[str] = None
    state: Optional[str] = None
    country: Optional[str] = None
    latitude: float
    longitude: float


class MandiPricePoint(BaseModel):
    date: date
    price: float = Field(ge=0)


class MandiPriceResponse(BaseModel):
    crop: str
    market: str
    source: str
    prices: List[MandiPricePoint]
    fetched_at: datetime
    cached: bool = False
    stale_data_warning: Optional[str] = None


class MandiCropCatalogItem(BaseModel):
    crop: str
    category: str


class MandiCatalogResponse(BaseModel):
    crops: List[MandiCropCatalogItem]
    markets: List[str]


class IntegrationAuditItem(BaseModel):
    event: str
    payload: Dict[str, Any]
    created_at: datetime


class IntegrationAuditResponse(BaseModel):
    items: List[IntegrationAuditItem]
