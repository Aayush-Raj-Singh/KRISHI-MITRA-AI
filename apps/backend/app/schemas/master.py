from __future__ import annotations

from typing import Optional

from pydantic import BaseModel, Field


class CommodityCreate(BaseModel):
    name: str = Field(..., min_length=2)
    code: str = Field(..., min_length=2)
    categories: list[str] = Field(default_factory=list)
    active: bool = True


class CommodityUpdate(BaseModel):
    name: Optional[str]
    code: Optional[str]
    categories: Optional[list[str]]
    active: Optional[bool]


class VarietyCreate(BaseModel):
    commodity_id: str
    name: str
    code: str
    active: bool = True


class VarietyUpdate(BaseModel):
    commodity_id: Optional[str]
    name: Optional[str]
    code: Optional[str]
    active: Optional[bool]


class GradeCreate(BaseModel):
    commodity_id: str
    name: str
    code: str
    active: bool = True


class GradeUpdate(BaseModel):
    commodity_id: Optional[str]
    name: Optional[str]
    code: Optional[str]
    active: Optional[bool]


class UnitCreate(BaseModel):
    name: str
    symbol: str
    type: str


class UnitUpdate(BaseModel):
    name: Optional[str]
    symbol: Optional[str]
    type: Optional[str]


class SeasonCreate(BaseModel):
    name: str
    start_month: int = Field(..., ge=1, le=12)
    end_month: int = Field(..., ge=1, le=12)
    active: bool = True


class SeasonUpdate(BaseModel):
    name: Optional[str]
    start_month: Optional[int]
    end_month: Optional[int]
    active: Optional[bool]


class MSPCreate(BaseModel):
    commodity_id: str
    variety_id: Optional[str] = None
    season: str
    price_per_quintal: float
    source: Optional[str] = None
    effective_from: Optional[str] = None


class MSPUpdate(BaseModel):
    commodity_id: Optional[str]
    variety_id: Optional[str]
    season: Optional[str]
    price_per_quintal: Optional[float]
    source: Optional[str]
    effective_from: Optional[str]
