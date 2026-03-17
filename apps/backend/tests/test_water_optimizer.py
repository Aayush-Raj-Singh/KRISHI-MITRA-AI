from __future__ import annotations

from datetime import date, timedelta

import pytest

from app.schemas.recommendations import WaterOptimizationRequest, WeatherDay
from app.services.water_service import WaterOptimizer


def _forecast(days: int, rain: float = 0.0):
    start = date.today()
    return [
        WeatherDay(
            date=start + timedelta(days=idx + 1),
            rainfall_mm=rain,
            temperature_c=30.0,
        )
        for idx in range(days)
    ]


def test_water_optimization_contains_schedule_volume_and_savings():
    service = WaterOptimizer()
    payload = WaterOptimizationRequest(
        crop="rice",
        growth_stage="vegetative",
        soil_moisture_pct=55,
        water_source="canal",
        field_area_acres=2.0,
        forecast=_forecast(5, rain=1.0),
    )
    result = service.optimize(payload)
    assert len(result.schedule) == 5
    assert result.total_volume_liters > 0
    assert result.water_savings_percent >= 0


def test_rainfall_delay_reduces_irrigation():
    service = WaterOptimizer()
    dry_payload = WaterOptimizationRequest(
        crop="wheat",
        growth_stage="flowering",
        soil_moisture_pct=45,
        water_source="borewell",
        field_area_acres=1.5,
        forecast=_forecast(3, rain=0.0),
    )
    rainy_payload = WaterOptimizationRequest(
        crop="wheat",
        growth_stage="flowering",
        soil_moisture_pct=45,
        water_source="borewell",
        field_area_acres=1.5,
        forecast=_forecast(3, rain=10.0),
    )
    dry = service.optimize(dry_payload)
    rainy = service.optimize(rainy_payload)
    assert rainy.total_volume_liters < dry.total_volume_liters


def test_invalid_growth_stage_raises():
    service = WaterOptimizer()
    payload = WaterOptimizationRequest(
        crop="rice",
        growth_stage="invalid-stage",
        soil_moisture_pct=50,
        water_source="canal",
        field_area_acres=1,
        forecast=_forecast(2),
    )
    with pytest.raises(ValueError):
        service.optimize(payload)
