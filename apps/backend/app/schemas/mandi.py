from __future__ import annotations

from datetime import date, datetime
from typing import List, Optional

from pydantic import BaseModel, ConfigDict, Field


class MandiEntryBase(BaseModel):
    state: Optional[str] = None
    district: Optional[str] = None
    commodity: str = Field(..., min_length=2)
    variety: Optional[str] = Field(None, min_length=1)
    grade: Optional[str] = Field(None, min_length=1)
    market: str = Field(..., min_length=2)
    arrival_date: date
    min_price: float = Field(..., ge=0)
    max_price: float = Field(..., ge=0)
    modal_price: float = Field(..., ge=0)
    arrivals_qtl: float = Field(..., ge=0, description="Arrivals in quintals")
    notes: Optional[str] = Field(None, max_length=2000)


class MandiEntryCreate(MandiEntryBase):
    pass


class MandiEntryUpdate(BaseModel):
    state: Optional[str]
    district: Optional[str]
    commodity: Optional[str]
    variety: Optional[str]
    grade: Optional[str]
    market: Optional[str]
    arrival_date: Optional[date]
    min_price: Optional[float]
    max_price: Optional[float]
    modal_price: Optional[float]
    arrivals_qtl: Optional[float]
    notes: Optional[str]


class MandiEntryStatus(str):
    DRAFT = "draft"
    SUBMITTED = "submitted"
    APPROVED = "approved"
    REJECTED = "rejected"


class MandiEntryDB(MandiEntryBase):
    id: str = Field(..., alias="_id")
    status: str = Field(default=MandiEntryStatus.DRAFT)
    created_by: str
    reviewed_by: Optional[str] = None
    review_reason: Optional[str] = None
    history: List[dict] = Field(default_factory=list)
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(
        validate_by_name=True,
        json_encoders={datetime: lambda v: v.isoformat()}
    )


class MandiEntryListResponse(BaseModel):
    items: List[MandiEntryDB]
    total: int


class PublicMandiPrice(BaseModel):
    date: date
    commodity: str
    market: str
    modal_price: float
    min_price: Optional[float] = None
    max_price: Optional[float] = None


class PublicMandiPricesResponse(BaseModel):
    items: List[PublicMandiPrice]
