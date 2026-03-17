from __future__ import annotations

import math
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional, Tuple

from app.core.database import Database

from app.schemas.quality import DataQualityIssue, DataQualityReport, DataQualitySummary


class DataQualityService:
    def __init__(self, db: Database) -> None:
        self._db = db
        self._entries = db["mandi_entries"]
        self._grades = db["grades"]
        self._issues = db["data_quality_issues"]

    async def _grade_set(self) -> set[str]:
        docs = await self._grades.find({}, {"name": 1}).to_list(length=None)
        return {str(doc.get("name", "")).strip().lower() for doc in docs if doc.get("name")}

    @staticmethod
    def _stddev(values: List[float]) -> float:
        if len(values) < 2:
            return 0.0
        mean = sum(values) / len(values)
        variance = sum((value - mean) ** 2 for value in values) / (len(values) - 1)
        return math.sqrt(variance)

    async def _rolling_stats(self, commodity: str, market: str) -> Tuple[float, float]:
        query = {"commodity": commodity, "market": market, "status": "approved"}
        docs = await (
            self._entries.find(query, {"modal_price": 1})
            .sort("arrival_date", -1)
            .limit(30)
            .to_list(length=30)
        )
        prices = [float(doc.get("modal_price", 0.0) or 0.0) for doc in docs if doc.get("modal_price")]
        if not prices:
            return 0.0, 0.0
        mean = sum(prices) / len(prices)
        return mean, self._stddev(prices)

    async def run_mandi_checks(self, filters: Optional[dict] = None) -> DataQualityReport:
        query = {"status": "approved"}
        if filters:
            query.update(filters)
        docs = await self._entries.find(query).to_list(length=None)
        grade_set = await self._grade_set()
        issues: List[DataQualityIssue] = []
        now = datetime.now(timezone.utc)

        for doc in docs:
            entry_id = str(doc.get("_id"))
            min_price = float(doc.get("min_price", 0.0) or 0.0)
            max_price = float(doc.get("max_price", 0.0) or 0.0)
            modal_price = float(doc.get("modal_price", 0.0) or 0.0)
            arrivals_qtl = float(doc.get("arrivals_qtl", 0.0) or 0.0)
            grade = str(doc.get("grade", "") or "").strip().lower()

            if modal_price <= 0 or min_price <= 0 or max_price <= 0:
                issues.append(
                    DataQualityIssue(
                        issue_type="missing_price",
                        severity="high",
                        message="Price fields are missing or zero",
                        entry_id=entry_id,
                        fields={"min_price": min_price, "max_price": max_price, "modal_price": modal_price},
                        detected_at=now,
                    )
                )
            if min_price > max_price:
                issues.append(
                    DataQualityIssue(
                        issue_type="invalid_price_range",
                        severity="high",
                        message="Minimum price exceeds maximum price",
                        entry_id=entry_id,
                        fields={"min_price": min_price, "max_price": max_price},
                        detected_at=now,
                    )
                )
            if modal_price < min_price or modal_price > max_price:
                issues.append(
                    DataQualityIssue(
                        issue_type="modal_outside_range",
                        severity="medium",
                        message="Modal price is outside min/max range",
                        entry_id=entry_id,
                        fields={"min_price": min_price, "max_price": max_price, "modal_price": modal_price},
                        detected_at=now,
                    )
                )
            if arrivals_qtl <= 0:
                issues.append(
                    DataQualityIssue(
                        issue_type="missing_arrivals",
                        severity="medium",
                        message="Arrivals volume is missing or zero",
                        entry_id=entry_id,
                        fields={"arrivals_qtl": arrivals_qtl},
                        detected_at=now,
                    )
                )
            if grade and grade_set and grade not in grade_set:
                issues.append(
                    DataQualityIssue(
                        issue_type="invalid_grade",
                        severity="low",
                        message="Grade is not mapped in master data",
                        entry_id=entry_id,
                        fields={"grade": grade},
                        detected_at=now,
                    )
                )
            if modal_price > 0:
                mean, stddev = await self._rolling_stats(str(doc.get("commodity", "")), str(doc.get("market", "")))
                if stddev > 0 and abs(modal_price - mean) > stddev * 3:
                    issues.append(
                        DataQualityIssue(
                            issue_type="price_anomaly",
                            severity="high",
                            message="Modal price deviates significantly from recent trend",
                            entry_id=entry_id,
                            fields={"modal_price": modal_price, "mean": round(mean, 2), "stddev": round(stddev, 2)},
                            detected_at=now,
                        )
                    )

        summary = DataQualitySummary(
            total=len(issues),
            by_severity=self._count_by(issues, "severity"),
            by_type=self._count_by(issues, "issue_type"),
        )
        report = DataQualityReport(issues=issues, summary=summary, generated_at=now)

        if issues:
            await self._issues.insert_many([issue.model_dump() for issue in issues])

        return report

    @staticmethod
    def _count_by(issues: List[DataQualityIssue], attr: str) -> dict:
        counts: Dict[str, int] = {}
        for issue in issues:
            key = str(getattr(issue, attr))
            counts[key] = counts.get(key, 0) + 1
        return counts
