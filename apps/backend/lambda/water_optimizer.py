from __future__ import annotations

from datetime import datetime

LITERS_PER_MM_ACRE = 4046.86

CROP_COEFFICIENTS = {
    "rice": {"initial": 1.1, "vegetative": 1.2, "flowering": 1.25, "maturity": 0.9},
    "wheat": {"initial": 0.9, "vegetative": 1.0, "flowering": 1.15, "maturity": 0.8},
    "maize": {"initial": 0.95, "vegetative": 1.05, "flowering": 1.2, "maturity": 0.85},
    "cotton": {"initial": 0.85, "vegetative": 1.0, "flowering": 1.15, "maturity": 0.9},
    "sugarcane": {"initial": 1.0, "vegetative": 1.1, "flowering": 1.2, "maturity": 1.0},
}


def _kc(crop: str, stage: str) -> float:
    crop_data = CROP_COEFFICIENTS.get(crop.lower())
    if not crop_data:
        return 1.0
    return crop_data.get(stage.lower(), 1.0)


def handler(event, context):
    crop = event.get("crop")
    growth_stage = event.get("growth_stage")
    soil_moisture_pct = float(event.get("soil_moisture_pct", 50))
    field_area_acres = float(event.get("field_area_acres", 1))
    forecast = event.get("forecast", [])

    kc = _kc(crop, growth_stage)
    schedule = []
    total_needed = 0.0
    total_recommended = 0.0

    for day in forecast:
        rainfall_mm = float(day.get("rainfall_mm", 0))
        temperature_c = float(day.get("temperature_c", 25))
        base_et0 = 4.5 + max(temperature_c - 25, 0) * 0.05
        soil_factor = max(0.2, 1 - soil_moisture_pct / 100)
        daily_need = base_et0 * kc * soil_factor
        effective_rain = rainfall_mm * 0.7
        irrigation_mm = max(0.0, daily_need - effective_rain)

        liters = irrigation_mm * LITERS_PER_MM_ACRE * field_area_acres
        schedule.append(
            {
                "date": day.get("date"),
                "irrigation_mm": round(irrigation_mm, 2),
                "irrigation_liters": round(liters, 2),
            }
        )
        total_needed += daily_need
        total_recommended += irrigation_mm

    savings = 0.0
    if total_needed > 0:
        savings = max(0.0, (total_needed - total_recommended) / total_needed * 100)

    return {
        "crop": crop,
        "schedule": schedule,
        "water_savings_percent": round(savings, 2),
        "generated_at": datetime.utcnow().isoformat() + "Z",
    }
