from __future__ import annotations

from datetime import datetime, timedelta, timezone
from typing import Any, Dict, List

from app.core.config import settings
from app.core.database import Database
from app.core.logging import get_logger
from app.models.feedback import default_feedback_record, default_quick_feedback_record
from app.services.operations_service import OperationsService
from app.services.sustainability_service import SustainabilityService

logger = get_logger(__name__)


class FeedbackService:
    def __init__(self, db: Database) -> None:
        self._db = db
        self._collection = db["feedback"]
        self._users = db["users"]
        self._expert_review_queue = db["expert_review_queue"]
        self._model_events = db["model_events"]
        self._sustainability = SustainabilityService()

    async def _history_scores(self, user_id: str, limit: int = 6) -> List[float]:
        docs = (
            await self._collection.find({"user_id": user_id})
            .sort("created_at", -1)
            .limit(limit)
            .to_list(length=limit)
        )
        return [float(doc.get("sustainability_score", 0.0)) for doc in reversed(docs)]

    async def _negative_outcome_count(self, days: int = 90) -> int:
        from_date = datetime.now(timezone.utc) - timedelta(days=days)
        return await self._collection.count_documents(
            {"negative_outcome": True, "created_at": {"$gte": from_date}}
        )

    @staticmethod
    def _should_flag_negative(
        payload: Dict[str, Any], sustainability_score: float, benchmark_yield: float
    ) -> bool:
        if int(payload["rating"]) <= 2:
            return True
        if sustainability_score < 55:
            return True
        if float(payload["yield_kg_per_acre"]) < benchmark_yield * 0.75:
            return True
        return False

    async def _queue_expert_review(self, user_id: str, recommendation_id: str, reason: str) -> None:
        await self._expert_review_queue.insert_one(
            {
                "user_id": user_id,
                "recommendation_id": recommendation_id,
                "reason": reason,
                "status": "pending",
                "created_at": datetime.now(timezone.utc),
            }
        )

    async def _trigger_retrain_if_needed(self) -> bool:
        negative_count = await self._negative_outcome_count()
        if negative_count < settings.negative_outcome_retrain_threshold:
            return False

        operation_service = OperationsService(self._db)
        trigger_result = await operation_service.trigger_feedback_threshold_retrain(
            triggered_by="system-feedback-loop",
            negative_count=negative_count,
            async_mode=True,
        )
        if not trigger_result:
            return False

        await self._model_events.insert_one(
            {
                "event": "auto_retrain_requested",
                "reason": "negative_outcome_threshold_exceeded",
                "negative_outcomes_last_90d": negative_count,
                "threshold": settings.negative_outcome_retrain_threshold,
                "operations_run_id": trigger_result.run_id,
                "status": trigger_result.status,
                "created_at": datetime.now(timezone.utc),
            }
        )
        return True

    async def submit_feedback(self, user_id: str, payload: Dict[str, Any]) -> Dict[str, Any]:
        user = await self._users.find_one({"_id": user_id})
        location = user.get("location") if user else None

        history_scores = await self._history_scores(user_id)
        result = self._sustainability.score(
            water_usage_l_per_acre=payload["water_usage_l_per_acre"],
            fertilizer_kg_per_acre=payload["fertilizer_kg_per_acre"],
            yield_kg_per_acre=payload["yield_kg_per_acre"],
            location=location,
            history_scores=history_scores,
        )

        is_negative = self._should_flag_negative(
            payload=payload,
            sustainability_score=result.overall_score,
            benchmark_yield=result.regional_benchmark["yield_kg_per_acre"],
        )

        record = default_feedback_record(
            user_id=user_id,
            recommendation_id=payload["recommendation_id"],
            rating=payload["rating"],
            outcomes={
                "yield_kg_per_acre": payload["yield_kg_per_acre"],
                "income_inr": payload["income_inr"],
                "water_usage_l_per_acre": payload["water_usage_l_per_acre"],
                "fertilizer_kg_per_acre": payload["fertilizer_kg_per_acre"],
                "notes": payload.get("notes"),
            },
            season=payload.get("season"),
            sustainability_score=result.overall_score,
            sustainability_sub_scores=result.sub_scores,
            badge=result.badge,
            trend=result.trend,
            regional_comparison=result.regional_comparison,
            negative_outcome=is_negative,
        )
        insert_result = await self._collection.insert_one(record)
        logger.info(
            "feedback_recorded",
            feedback_id=str(insert_result.inserted_id),
            negative_outcome=is_negative,
        )

        queued_for_review = False
        if is_negative:
            queued_for_review = True
            await self._queue_expert_review(
                user_id=user_id,
                recommendation_id=payload["recommendation_id"],
                reason="negative_outcome",
            )

        retrain_triggered = await self._trigger_retrain_if_needed()

        return {
            "feedback_id": str(insert_result.inserted_id),
            "sustainability_score": result.overall_score,
            "sub_scores": result.sub_scores,
            "recommendations": result.recommendations,
            "recognition_badge": result.badge,
            "trend": result.trend,
            "regional_comparison": result.regional_comparison,
            "queued_for_expert_review": queued_for_review,
            "retrain_triggered": retrain_triggered,
            "created_at": datetime.now(timezone.utc),
        }

    async def submit_quick_feedback(self, user_id: str, payload: Dict[str, Any]) -> Dict[str, Any]:
        service = str(payload.get("service", "")).strip().lower()
        if service not in {"crop", "price", "water", "advisory"}:
            service = "general"

        record = default_quick_feedback_record(
            user_id=user_id,
            recommendation_id=payload.get("recommendation_id"),
            rating=int(payload.get("rating", 0)),
            service=service,
            notes=payload.get("notes"),
            source=payload.get("source"),
        )
        insert_result = await self._db["quick_feedback"].insert_one(record)
        logger.info(
            "quick_feedback_recorded", feedback_id=str(insert_result.inserted_id), service=service
        )
        return {
            "feedback_id": str(insert_result.inserted_id),
            "recommendation_id": payload.get("recommendation_id"),
            "rating": int(payload.get("rating", 0)),
            "service": service,
            "notes": payload.get("notes"),
            "created_at": record["created_at"],
        }
