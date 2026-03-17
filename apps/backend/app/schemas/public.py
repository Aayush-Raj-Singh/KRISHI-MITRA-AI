from __future__ import annotations

from datetime import date
from typing import List, Optional

from pydantic import BaseModel


class PublicPricePoint(BaseModel):
    date: date
    commodity: str
    market: str
    modal_price: float
    min_price: Optional[float] = None
    max_price: Optional[float] = None


class PublicArrivalPoint(BaseModel):
    date: date
    commodity: str
    market: str
    arrivals_qtl: float


class PublicMandiItem(BaseModel):
    mandi_id: str
    name: str
    state: Optional[str] = None
    district: Optional[str] = None


class PublicPricesResponse(BaseModel):
    items: List[PublicPricePoint]


class PublicArrivalsResponse(BaseModel):
    items: List[PublicArrivalPoint]


class PublicMandisResponse(BaseModel):
    items: List[PublicMandiItem]
