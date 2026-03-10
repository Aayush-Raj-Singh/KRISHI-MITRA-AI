from __future__ import annotations

from datetime import date, datetime
from typing import List, Optional

from pydantic import BaseModel, Field


class CropRecommendationRequest(BaseModel):
    soil_n: float = Field(ge=0)
    soil_p: float = Field(ge=0)
    soil_k: float = Field(ge=0)
    soil_ph: float = Field(ge=0, le=14)
    temperature_c: float
    humidity_pct: float = Field(ge=0, le=100)
    rainfall_mm: float = Field(ge=0)
    location: str
    season: Optional[str] = None
    historical_yield: Optional[float] = None


class CropRecommendationItem(BaseModel):
    crop: str
    confidence: float
    explanation: str


class CropRecommendationResponse(BaseModel):
    recommendations: List[CropRecommendationItem]
    model_version: str
    created_at: datetime
    cached: bool = False
    recommendation_id: Optional[str] = None


class PriceForecastRequest(BaseModel):
    crop: str
    market: str
    currency: str = "INR"


class PriceForecastSeries(BaseModel):
    horizon_days: int
    dates: List[date]
    forecast: List[float]
    lower: List[float]
    upper: List[float]


class PriceHistoricalSeries(BaseModel):
    dates: List[date]
    prices: List[float]


class PriceForecastResponse(BaseModel):
    crop: str
    market: str
    currency: str
    series: List[PriceForecastSeries]
    historical: Optional[PriceHistoricalSeries] = None
    mape: float
    confidence_interval: dict
    model_version: str
    created_at: datetime
    cached: bool = False
    recommendation_id: Optional[str] = None


class WeatherDay(BaseModel):
    date: date
    rainfall_mm: float = Field(ge=0)
    temperature_c: float


class WaterOptimizationRequest(BaseModel):
    crop: str
    growth_stage: str
    soil_moisture_pct: float = Field(ge=0, le=100)
    water_source: str
    field_area_acres: float = Field(gt=0)
    forecast: List[WeatherDay] = Field(min_length=1)


class IrrigationScheduleItem(BaseModel):
    date: date
    irrigation_mm: float
    irrigation_liters: float
    reason: str


class WaterOptimizationResponse(BaseModel):
    crop: str
    schedule: List[IrrigationScheduleItem]
    total_volume_liters: float
    water_savings_percent: float
    notes: List[str]
    model_version: str
    created_at: datetime
    cached: bool = False
    recommendation_id: Optional[str] = None
