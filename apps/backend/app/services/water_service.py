from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime, timezone
from typing import Dict, List

from app.core.logging import get_logger
from app.schemas.recommendations import (
    IrrigationScheduleItem,
    WaterOptimizationRequest,
    WaterOptimizationResponse,
)

logger = get_logger(__name__)

LITERS_PER_MM_ACRE = 4046.86
SUPPORTED_STAGES = {"initial", "vegetative", "flowering", "maturity"}


def effective_rainfall_mm(rainfall_mm: float, effectiveness: float = 0.78) -> float:
    return max(0.0, rainfall_mm * effectiveness)


def compute_crop_water_need_mm(et0_mm: float, crop_coefficient: float, soil_factor: float) -> float:
    return max(0.0, et0_mm * crop_coefficient * soil_factor)


def compute_irrigation_mm(
    crop_water_need_mm: float, effective_rain_mm: float, source_efficiency: float
) -> float:
    required_mm = max(0.0, crop_water_need_mm - effective_rain_mm)
    return required_mm / max(source_efficiency, 0.5)


def apply_source_efficiency(irrigation_mm: float, source_efficiency: float) -> float:
    return max(0.0, irrigation_mm) / max(source_efficiency, 0.5)


@dataclass
class WaterModel:
    version: str
    crop_coefficients: Dict[str, Dict[str, float]]
    water_source_efficiency: Dict[str, float]


class WaterOptimizer:
    def __init__(self) -> None:
        self.model = WaterModel(
            version="water-optimizer-v2",
            crop_coefficients={
                "rice": {"initial": 1.1, "vegetative": 1.2, "flowering": 1.25, "maturity": 0.9},
                "wheat": {"initial": 0.9, "vegetative": 1.0, "flowering": 1.15, "maturity": 0.8},
                "maize": {"initial": 0.95, "vegetative": 1.05, "flowering": 1.2, "maturity": 0.85},
                "cotton": {"initial": 0.85, "vegetative": 1.0, "flowering": 1.15, "maturity": 0.9},
                "sugarcane": {"initial": 1.0, "vegetative": 1.1, "flowering": 1.2, "maturity": 1.0},
                "mustard": {"initial": 0.7, "vegetative": 0.9, "flowering": 1.05, "maturity": 0.75},
                "chana": {"initial": 0.65, "vegetative": 0.85, "flowering": 1.0, "maturity": 0.7},
            },
            water_source_efficiency={
                "canal": 0.88,
                "borewell": 0.8,
                "groundwater": 0.8,
                "rainwater_harvesting": 0.93,
                "tank": 0.9,
            },
        )

    def _kc(self, crop: str, stage: str) -> float:
        stage_key = stage.lower().strip()
        if stage_key not in SUPPORTED_STAGES:
            raise ValueError(
                f"Unsupported growth stage '{stage}'. Supported stages: {', '.join(sorted(SUPPORTED_STAGES))}"
            )
        crop_data = self.model.crop_coefficients.get(crop.lower().strip())
        if not crop_data:
            return 1.0
        return crop_data.get(stage_key, 1.0)

    @staticmethod
    def _evapotranspiration_mm(
        temperature_c: float, humidity_pct: float = 60.0, wind_ms: float = 1.2
    ) -> float:
        t = max(0.0, temperature_c)
        humidity_factor = max(0.2, 1.0 - (humidity_pct / 100.0) * 0.45)
        wind_factor = 1.0 + min(max(wind_ms, 0.0), 6.0) * 0.08
        et0 = (0.0023 * (t + 17.8) * ((t + 15) ** 0.5)) * humidity_factor * wind_factor
        return max(1.5, min(et0 * 10, 9.5))

    def _source_efficiency(self, water_source: str) -> float:
        key = water_source.lower().strip().replace(" ", "_")
        return self.model.water_source_efficiency.get(key, 0.85)

    def optimize(self, request: WaterOptimizationRequest) -> WaterOptimizationResponse:
        if not request.forecast:
            raise ValueError("Weather forecast is required for water optimization")
        kc = self._kc(request.crop, request.growth_stage)
        source_efficiency = self._source_efficiency(request.water_source)
        soil_factor = max(0.25, 1 - request.soil_moisture_pct / 100)

        schedule: List[IrrigationScheduleItem] = []
        notes: List[str] = []

        baseline_mm_total = 0.0
        recommended_mm_total = 0.0
        running_delay = 0

        for day in request.forecast:
            et0_mm = self._evapotranspiration_mm(day.temperature_c)
            crop_water_need_mm = compute_crop_water_need_mm(et0_mm, kc, soil_factor)
            baseline_mm_total += crop_water_need_mm

            effective_rain_mm = effective_rainfall_mm(day.rainfall_mm)
            irrigation_mm = compute_irrigation_mm(
                crop_water_need_mm, effective_rain_mm, source_efficiency=1.0
            )

            if day.rainfall_mm >= max(5.0, crop_water_need_mm * 0.8):
                running_delay = max(running_delay, 1)
                notes.append(
                    f"Rain expected on {day.date}: delay irrigation by 1 day where feasible."
                )

            if running_delay > 0:
                irrigation_mm *= 0.35
                running_delay -= 1
                reason = "Irrigation reduced due to rainfall-adjusted delay plan."
            elif effective_rain_mm > 0:
                reason = "Irrigation adjusted for effective rainfall and crop stage."
            else:
                reason = "Irrigation based on evapotranspiration and crop stage."

            irrigation_mm = apply_source_efficiency(irrigation_mm, source_efficiency)
            recommended_mm_total += irrigation_mm
            liters = irrigation_mm * LITERS_PER_MM_ACRE * request.field_area_acres

            schedule.append(
                IrrigationScheduleItem(
                    date=day.date,
                    irrigation_mm=round(irrigation_mm, 2),
                    irrigation_liters=round(liters, 2),
                    reason=reason,
                )
            )

        savings_percent = 0.0
        if baseline_mm_total > 0:
            savings_percent = max(
                0.0, (baseline_mm_total - recommended_mm_total) / baseline_mm_total * 100
            )

        total_volume_liters = recommended_mm_total * LITERS_PER_MM_ACRE * request.field_area_acres
        if request.water_source.lower() in {"borewell", "groundwater"}:
            notes.append(
                "Borewell source detected: use drip/sprinkler timing to avoid over-extraction."
            )

        response = WaterOptimizationResponse(
            crop=request.crop,
            schedule=schedule,
            total_volume_liters=round(total_volume_liters, 2),
            water_savings_percent=round(savings_percent, 2),
            notes=notes,
            model_version=self.model.version,
            created_at=datetime.now(timezone.utc),
        )
        logger.info(
            "water_optimization_generated", model_version=self.model.version, crop=request.crop
        )
        return response
