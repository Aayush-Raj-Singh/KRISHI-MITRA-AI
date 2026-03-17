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
