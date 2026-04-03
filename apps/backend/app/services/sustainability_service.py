from __future__ import annotations

from dataclasses import dataclass
from typing import Dict, List

from app.core.logging import get_logger

logger = get_logger(__name__)


@dataclass
class SustainabilityResult:
    overall_score: float
    sub_scores: Dict[str, float]
    recommendations: List[str]
    regional_benchmark: Dict[str, float]
    regional_comparison: Dict[str, float]
    badge: str
    trend: str


class SustainabilityService:
    def __init__(self) -> None:
        self._regional_benchmarks: Dict[str, Dict[str, float]] = {
            "default": {
                "water_usage_l_per_acre": 450000.0,
                "fertilizer_kg_per_acre": 110.0,
                "yield_kg_per_acre": 2200.0,
            },
            "bihar": {
                "water_usage_l_per_acre": 430000.0,
                "fertilizer_kg_per_acre": 105.0,
                "yield_kg_per_acre": 2350.0,
            },
            "maharashtra": {
                "water_usage_l_per_acre": 420000.0,
                "fertilizer_kg_per_acre": 115.0,
                "yield_kg_per_acre": 2450.0,
            },
            "punjab": {
                "water_usage_l_per_acre": 460000.0,
                "fertilizer_kg_per_acre": 130.0,
                "yield_kg_per_acre": 2750.0,
            },
            "karnataka": {
                "water_usage_l_per_acre": 410000.0,
                "fertilizer_kg_per_acre": 100.0,
                "yield_kg_per_acre": 2250.0,
            },
        }

    @staticmethod
    def _clamp(value: float) -> float:
        return max(0.0, min(100.0, value))

    def _benchmark_for_location(self, location: str | None) -> Dict[str, float]:
        if not location:
            return self._regional_benchmarks["default"]
        normalized = location.strip().lower()
        for key in self._regional_benchmarks:
            if key != "default" and key in normalized:
                return self._regional_benchmarks[key]
        return self._regional_benchmarks["default"]

    @staticmethod
    def _trend(current: float, history_scores: List[float]) -> str:
        if not history_scores:
            return "no_history"
        recent = history_scores[-1]
        if current - recent >= 3:
            return "improving"
        if recent - current >= 3:
            return "declining"
        return "stable"

    @staticmethod
    def _badge(score: float) -> str:
        if score >= 85:
            return "Gold"
        if score >= 70:
            return "Silver"
        return "Bronze"

    def score(
        self,
        water_usage_l_per_acre: float,
        fertilizer_kg_per_acre: float,
        yield_kg_per_acre: float,
        location: str | None = None,
        history_scores: List[float] | None = None,
    ) -> SustainabilityResult:
        benchmark = self._benchmark_for_location(location)
        history_scores = history_scores or []

        water_efficiency = self._clamp(
            100 * (benchmark["water_usage_l_per_acre"] / water_usage_l_per_acre)
        )
        fertilizer_efficiency = self._clamp(
            100 * (benchmark["fertilizer_kg_per_acre"] / fertilizer_kg_per_acre)
        )
        yield_optimization = self._clamp(100 * (yield_kg_per_acre / benchmark["yield_kg_per_acre"]))

        overall = 0.4 * water_efficiency + 0.3 * fertilizer_efficiency + 0.3 * yield_optimization
        overall = round(overall, 2)

        recommendations: List[str] = []
        if water_efficiency < 70:
            recommendations.append(
                "Reduce water usage through stage-wise irrigation and rain-adjusted scheduling."
            )
        if fertilizer_efficiency < 70:
            recommendations.append(
                "Improve nutrient efficiency with soil-test based split fertilizer application."
            )
        if yield_optimization < 70:
            recommendations.append(
                "Review sowing window, seed quality and crop management for yield recovery."
            )
        if not recommendations:
            recommendations.append(
                "Performance is aligned with regional best practices. Continue current strategy."
            )

        comparison = {
            "water_vs_region_percent": round(
                (water_usage_l_per_acre - benchmark["water_usage_l_per_acre"])
                / benchmark["water_usage_l_per_acre"]
                * 100,
                2,
            ),
            "fertilizer_vs_region_percent": round(
                (fertilizer_kg_per_acre - benchmark["fertilizer_kg_per_acre"])
                / benchmark["fertilizer_kg_per_acre"]
                * 100,
                2,
            ),
            "yield_vs_region_percent": round(
                (yield_kg_per_acre - benchmark["yield_kg_per_acre"])
                / benchmark["yield_kg_per_acre"]
                * 100,
                2,
            ),
        }

        result = SustainabilityResult(
            overall_score=overall,
            sub_scores={
                "water_efficiency": round(water_efficiency, 2),
                "fertilizer_efficiency": round(fertilizer_efficiency, 2),
                "yield_optimization": round(yield_optimization, 2),
            },
            recommendations=recommendations,
            regional_benchmark=benchmark,
            regional_comparison=comparison,
            badge=self._badge(overall),
            trend=self._trend(overall, history_scores),
        )
        logger.info(
            "sustainability_scored",
            overall_score=result.overall_score,
            badge=result.badge,
            trend=result.trend,
        )
        return result
