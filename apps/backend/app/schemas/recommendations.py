from __future__ import annotations

from datetime import date, datetime
from typing import List, Optional

from pydantic import Field

from app.schemas.base import StrictSchema


class CropRecommendationRequest(StrictSchema):
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


class CropRecommendationItem(StrictSchema):
    crop: str
    confidence: float
    explanation: str


class CropRecommendationResponse(StrictSchema):
    recommendations: List[CropRecommendationItem]
    model_version: str
    created_at: datetime
    cached: bool = False
    recommendation_id: Optional[str] = None


class PriceForecastRequest(StrictSchema):
    crop: str
    market: str
    currency: str = "INR"


class PriceForecastSeries(StrictSchema):
    horizon_days: int
    dates: List[date]
    forecast: List[float]
    lower: List[float]
    upper: List[float]


class PriceHistoricalSeries(StrictSchema):
    dates: List[date]
    prices: List[float]


class PriceForecastResponse(StrictSchema):
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


class WeatherDay(StrictSchema):
    date: date
    rainfall_mm: float = Field(ge=0)
    temperature_c: float


class WaterOptimizationRequest(StrictSchema):
    crop: str
    growth_stage: str
    soil_moisture_pct: float = Field(ge=0, le=100)
    water_source: str
    field_area_acres: float = Field(gt=0)
    forecast: Optional[List[WeatherDay]] = None
    location: Optional[str] = None
    days: int = Field(default=5, ge=1, le=14)


class IrrigationScheduleItem(StrictSchema):
    date: date
    irrigation_mm: float
    irrigation_liters: float
    reason: str


class WaterOptimizationResponse(StrictSchema):
    crop: str
    schedule: List[IrrigationScheduleItem]
    total_volume_liters: float
    water_savings_percent: float
    notes: List[str]
    model_version: str
    created_at: datetime
    cached: bool = False
    recommendation_id: Optional[str] = None
    weather_location: Optional[str] = None
    weather_source: Optional[str] = None
    weather_cached: Optional[bool] = None
    weather_fetched_at: Optional[datetime] = None
