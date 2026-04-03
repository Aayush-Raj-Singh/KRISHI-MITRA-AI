from __future__ import annotations

import json
from collections import Counter
from datetime import datetime, timedelta, timezone
from typing import Any, Dict

from app.core.database import Database
from app.core.logging import get_logger
from app.models.recommendation import default_recommendation_record

logger = get_logger(__name__)


class RecommendationService:
    def __init__(self, db: Database) -> None:
        self._db = db
        self._collection = db["recommendations"]
        self._feedback_collection = db["feedback"]

    async def store(
        self,
        user_id: str,
        kind: str,
        request_payload: Dict[str, Any],
        response_payload: Dict[str, Any],
    ) -> str:
        safe_request = json.loads(json.dumps(request_payload, default=str))
        safe_response = json.loads(json.dumps(response_payload, default=str))
        record = default_recommendation_record(user_id, kind, safe_request, safe_response)
        result = await self._collection.insert_one(record)
        logger.info("recommendation_stored", recommendation_id=str(result.inserted_id), kind=kind)
        return str(result.inserted_id)

    async def get_crop_personalization_context(
        self, user_id: str, season: str | None = None
    ) -> Dict[str, Any]:
        """
        Build lightweight personalization signals from historical outcomes.
        """
        from_date = datetime.now(timezone.utc) - timedelta(days=540)
        feedback_docs = (
            await self._feedback_collection.find(
                {"user_id": user_id, "created_at": {"$gte": from_date}}
            )
            .sort("created_at", -1)
            .limit(60)
            .to_list(length=60)
        )

        if not feedback_docs:
            return {
                "historical_yield_hint": None,
                "preferred_crops": {},
                "seasonal_preference": {},
            }

        yields = [
            float(item.get("outcomes", {}).get("yield_kg_per_acre", 0.0))
            for item in feedback_docs
            if float(item.get("outcomes", {}).get("yield_kg_per_acre", 0.0)) > 0
        ]
        historical_yield_hint = round(sum(yields) / len(yields), 2) if yields else None

        positive_feedback = [
            item
            for item in feedback_docs
            if int(item.get("rating", 0)) >= 4 and not bool(item.get("negative_outcome", False))
        ]
        recommendation_ids = [
            str(item.get("recommendation_id"))
            for item in positive_feedback
            if str(item.get("recommendation_id", "")).strip()
        ]

        preferred_counter: Counter[str] = Counter()
        seasonal_counter: Counter[str] = Counter()
        if recommendation_ids:
            rec_docs = await self._collection.find(
                {"_id": {"$in": recommendation_ids}, "kind": "crop"}
            ).to_list(length=None)
            season_key = (season or "").strip().lower()
            for recommendation in rec_docs:
                response_payload = recommendation.get("response_payload", {})
                recommendations = response_payload.get("recommendations", [])
                if not recommendations:
                    continue
                top_crop = str(recommendations[0].get("crop", "")).strip().lower()
                if not top_crop:
                    continue
                preferred_counter[top_crop] += 1

                request_payload = recommendation.get("request_payload", {})
                rec_season = str(request_payload.get("season", "")).strip().lower()
                if season_key and rec_season and rec_season == season_key:
                    seasonal_counter[top_crop] += 1

        preferred_total = sum(preferred_counter.values()) or 1
        seasonal_total = sum(seasonal_counter.values()) or 1
        preferred_crops = {
            crop: round(count / preferred_total, 4) for crop, count in preferred_counter.items()
        }
        seasonal_preference = {
            crop: round(count / seasonal_total, 4) for crop, count in seasonal_counter.items()
        }

        return {
            "historical_yield_hint": historical_yield_hint,
            "preferred_crops": preferred_crops,
            "seasonal_preference": seasonal_preference,
        }
