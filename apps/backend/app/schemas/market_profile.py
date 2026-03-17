from __future__ import annotations

from typing import List, Optional

from pydantic import BaseModel, ConfigDict, Field


class GeoPoint(BaseModel):
    lat: float = Field(..., ge=-90, le=90)
    lng: float = Field(..., ge=-180, le=180)


class MarketProfileBase(BaseModel):
    name: str = Field(..., min_length=2)
    code: Optional[str] = Field(None, min_length=2)
    state: str = Field(..., min_length=2)
    district: Optional[str] = None
    address: Optional[str] = None
    geo: Optional[GeoPoint] = None
    facilities: List[str] = Field(default_factory=list)
    timings: Optional[str] = None
    contact_person: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    commodities: List[str] = Field(default_factory=list)
    last_mile: Optional[str] = None
    transport: List[str] = Field(default_factory=list)


class MarketProfileCreate(MarketProfileBase):
    pass


class MarketProfileUpdate(BaseModel):
    name: Optional[str]
    code: Optional[str]
    state: Optional[str]
    district: Optional[str]
    address: Optional[str]
    geo: Optional[GeoPoint]
    facilities: Optional[List[str]]
    timings: Optional[str]
    contact_person: Optional[str]
    phone: Optional[str]
    email: Optional[str]
    commodities: Optional[List[str]]
    last_mile: Optional[str]
    transport: Optional[List[str]]


class MarketProfileDB(MarketProfileBase):
    id: str = Field(..., alias="_id")

    model_config = ConfigDict(validate_by_name=True)
