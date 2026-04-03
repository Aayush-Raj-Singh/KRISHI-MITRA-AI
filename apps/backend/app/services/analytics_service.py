from __future__ import annotations

from datetime import datetime, time, timezone
from typing import Dict, List, Optional, Tuple

from app.core.database import Database
from app.core.logging import get_logger
from app.models.user import UserInDB
from app.schemas.analytics import (
    AnalyticsOverview,
    CropDistributionItem,
    FarmerAttentionItem,
    FeedbackReliabilityStats,
)
from app.schemas.dashboard import RegionalInsightsResponse

logger = get_logger(__name__)


class AnalyticsService:
    def __init__(self, db: Database) -> None:
        self._db = db
        self._users = db["users"]
        self._feedback = db["feedback"]
        self._recommendations = db["recommendations"]

    @staticmethod
    def _normalized(value: str | None) -> str:
        return (value or "").strip().lower()

    def _allowed_regions(self, actor: UserInDB | None) -> List[str]:
        if not actor or actor.role == "admin":
            return []
        assigned = [
            region.strip() for region in getattr(actor, "assigned_regions", []) if region.strip()
        ]
        if assigned:
            return assigned
        if actor.location:
            return [actor.location.strip()]
        return []

    @staticmethod
    def _region_filters(regions: List[str]) -> List[dict]:
        from app.utils.query_filters import build_case_insensitive_contains_filter

        return [
            {"location": build_case_insensitive_contains_filter(region)}
            for region in regions
            if region
        ]

    def _effective_regions(
        self, requested_location: Optional[str], actor: UserInDB | None
    ) -> List[str]:
        allowed = self._allowed_regions(actor)
        if not allowed:
            return [requested_location] if requested_location else []

        if not requested_location:
            return allowed

        requested_norm = self._normalized(requested_location)
        for region in allowed:
            if (
                requested_norm in self._normalized(region)
                or self._normalized(region) in requested_norm
            ):
                return [region]
        return []

    @staticmethod
    def _masked_identifier(user_id: str) -> str:
        if len(user_id) <= 6:
            return f"farmer-{user_id}"
        return f"farmer-{user_id[-6:]}"

    @staticmethod
    def _masked_name(name: str) -> str:
        cleaned = (name or "Farmer").strip()
        if len(cleaned) <= 2:
            return "Farmer *"
        return f"{cleaned[:2]}***"

    @staticmethod
    def _masked_location(location: str) -> str:
        cleaned = (location or "Unknown").strip()
        if "," in cleaned:
            return cleaned.split(",")[-1].strip()
        if len(cleaned) <= 3:
            return cleaned
        return f"{cleaned[:3]}***"

    async def _filtered_user_ids(
        self,
        location: Optional[str],
        crop: Optional[str],
        farm_size_min: Optional[float],
        farm_size_max: Optional[float],
        actor: UserInDB | None = None,
    ) -> List[str]:
        query: Dict[str, object] = {}
        effective_regions = self._effective_regions(location, actor)
        if effective_regions:
            query["$or"] = self._region_filters(effective_regions)
        elif self._allowed_regions(actor):
            return []
        if farm_size_min is not None or farm_size_max is not None:
            size_query: Dict[str, float] = {}
            if farm_size_min is not None:
                size_query["$gte"] = farm_size_min
            if farm_size_max is not None:
                size_query["$lte"] = farm_size_max
            query["farm_size"] = size_query
        if crop:
            query["primary_crops"] = {"$in": [crop]}

        cursor = self._users.find(query, {"_id": 1})
        users = await cursor.to_list(length=None)
        return [str(item["_id"]) for item in users]

    def _date_range(
        self, from_date: Optional[datetime], to_date: Optional[datetime]
    ) -> Dict[str, datetime]:
        if not from_date and not to_date:
            return {}
        start = from_date or datetime.now(timezone.utc)
        end = to_date or datetime.now(timezone.utc)
        return {"$gte": start, "$lte": end}

    def _parse_date_filters(
        self, from_date: Optional[str], to_date: Optional[str]
    ) -> Tuple[Optional[datetime], Optional[datetime]]:
        parsed_from = None
        parsed_to = None
        if from_date:
            parsed_from = datetime.combine(
                datetime.fromisoformat(from_date).date(), time.min, tzinfo=timezone.utc
            )
        if to_date:
            parsed_to = datetime.combine(
                datetime.fromisoformat(to_date).date(), time.max, tzinfo=timezone.utc
            )
        return parsed_from, parsed_to

    async def overview(
        self,
        location: Optional[str],
        crop: Optional[str],
        farm_size_min: Optional[float],
        farm_size_max: Optional[float],
        from_date: Optional[str],
        to_date: Optional[str],
        actor: UserInDB | None = None,
    ) -> AnalyticsOverview:
        user_ids = await self._filtered_user_ids(
            location, crop, farm_size_min, farm_size_max, actor=actor
        )
        total_farmers = len(user_ids)

        date_from, date_to = self._parse_date_filters(from_date, to_date)
        date_query = self._date_range(date_from, date_to)

        feedback_query: Dict[str, object] = (
            {"user_id": {"$in": user_ids}} if user_ids else {"user_id": "__none__"}
        )
        if date_query:
            feedback_query["created_at"] = date_query

        feedback_docs = await self._feedback.find(feedback_query).to_list(length=None)
        total_feedback = len(feedback_docs)

        def _avg(values: List[float]) -> float:
            return round(sum(values) / len(values), 2) if values else 0.0

        sustainability_scores = [doc.get("sustainability_score", 0.0) for doc in feedback_docs]
        yield_values = [
            doc.get("outcomes", {}).get("yield_kg_per_acre", 0.0) for doc in feedback_docs
        ]
        water_values = [
            doc.get("outcomes", {}).get("water_usage_l_per_acre", 0.0) for doc in feedback_docs
        ]
        fertilizer_values = [
            doc.get("outcomes", {}).get("fertilizer_kg_per_acre", 0.0) for doc in feedback_docs
        ]
        at_risk_farmers = len([score for score in sustainability_scores if score and score < 60])

        recommendation_query: Dict[str, object] = {"kind": "crop"}
        if user_ids:
            recommendation_query["user_id"] = {"$in": user_ids}
        else:
            recommendation_query["user_id"] = "__none__"
        if date_query:
            recommendation_query["created_at"] = date_query

        crop_counts: Dict[str, int] = {}
        rec_docs = await self._recommendations.find(recommendation_query).to_list(length=None)
        for rec in rec_docs:
            response = rec.get("response_payload", {})
            recommendations = response.get("recommendations", [])
            if not recommendations:
                continue
            top_crop = recommendations[0].get("crop")
            if top_crop:
                crop_counts[top_crop] = crop_counts.get(top_crop, 0) + 1

        total_crops = sum(crop_counts.values()) or 1
        top_crops = [
            CropDistributionItem(
                crop=crop_name,
                count=count,
                percentage=round(count / total_crops * 100, 2),
            )
            for crop_name, count in sorted(
                crop_counts.items(), key=lambda item: item[1], reverse=True
            )[:6]
        ]

        overview = AnalyticsOverview(
            total_farmers=total_farmers,
            total_feedback=total_feedback,
            average_sustainability=_avg(sustainability_scores),
            average_yield_kg_per_acre=_avg(yield_values),
            average_water_usage_l_per_acre=_avg(water_values),
            average_fertilizer_kg_per_acre=_avg(fertilizer_values),
            at_risk_farmers=at_risk_farmers,
            top_crops=top_crops,
            generated_at=datetime.now(timezone.utc),
            filters={
                "location": location,
                "crop": crop,
                "farm_size_min": farm_size_min,
                "farm_size_max": farm_size_max,
                "from_date": from_date,
                "to_date": to_date,
            },
        )
        logger.info(
            "analytics_overview_generated",
            total_farmers=total_farmers,
            total_feedback=total_feedback,
        )
        return overview

    async def farmers_needing_attention(
        self,
        location: Optional[str] = None,
        consent_safe: bool = True,
        limit: int = 20,
        actor: UserInDB | None = None,
    ) -> List[FarmerAttentionItem]:
        user_query: Dict[str, object] = {}
        effective_regions = self._effective_regions(location, actor)
        if effective_regions:
            user_query["$or"] = self._region_filters(effective_regions)
        elif self._allowed_regions(actor):
            return []

        users = await self._users.find(
            user_query, {"name": 1, "location": 1, "risk_view_consent": 1}
        ).to_list(length=None)
        if not users:
            return []

        output: List[FarmerAttentionItem] = []
        for user in users:
            user_id = str(user["_id"])
            feedback_docs = (
                await self._feedback.find({"user_id": user_id})
                .sort("created_at", 1)
                .limit(12)
                .to_list(length=12)
            )
            if not feedback_docs:
                continue

            sustainability_values = [
                float(item.get("sustainability_score", 0.0)) for item in feedback_docs
            ]
            latest_sustainability = sustainability_values[-1]
            ratings = [float(item.get("rating", 0.0)) for item in feedback_docs]
            avg_rating = round(sum(ratings) / len(ratings), 2) if ratings else 0.0

            yields = [
                float(item.get("outcomes", {}).get("yield_kg_per_acre", 0.0))
                for item in feedback_docs
            ]
            base_yield = yields[0] if yields else 0.0
            latest_yield = yields[-1] if yields else 0.0
            if base_yield <= 0:
                yield_trend_pct = 0.0
            else:
                yield_trend_pct = round(((latest_yield - base_yield) / base_yield) * 100, 2)

            reasons: List[str] = []
            risk_score = 0.0
            if latest_sustainability < 65:
                reasons.append("Low sustainability score")
                risk_score += (65 - latest_sustainability) * 1.2
            if yield_trend_pct < -8:
                reasons.append("Declining yield trend")
                risk_score += abs(yield_trend_pct) * 0.9
            if avg_rating <= 2.8:
                reasons.append("Negative feedback pattern")
                risk_score += (3.0 - avg_rating) * 25

            if not reasons:
                continue

            output.append(
                FarmerAttentionItem(
                    user_id=self._masked_identifier(user_id)
                    if consent_safe and not bool(user.get("risk_view_consent", False))
                    else user_id,
                    name=self._masked_name(str(user.get("name", "Unknown")))
                    if consent_safe and not bool(user.get("risk_view_consent", False))
                    else str(user.get("name", "Unknown")),
                    location=self._masked_location(str(user.get("location", "Unknown")))
                    if consent_safe and not bool(user.get("risk_view_consent", False))
                    else str(user.get("location", "Unknown")),
                    sustainability_score=round(latest_sustainability, 2),
                    yield_trend_percent=yield_trend_pct,
                    average_rating=avg_rating,
                    risk_score=round(risk_score, 2),
                    reasons=reasons,
                    is_masked=bool(consent_safe and not bool(user.get("risk_view_consent", False))),
                    consent_granted=bool(user.get("risk_view_consent", False)),
                )
            )

        output.sort(key=lambda item: item.risk_score, reverse=True)
        logger.info("farmers_needing_attention_computed", total=len(output))
        return output[:limit]

    async def feedback_reliability(
        self,
        location: Optional[str] = None,
        actor: UserInDB | None = None,
    ) -> FeedbackReliabilityStats:
        user_query: Dict[str, object] = {}
        effective_regions = self._effective_regions(location, actor)
        if effective_regions:
            user_query["$or"] = self._region_filters(effective_regions)
        elif self._allowed_regions(actor):
            return FeedbackReliabilityStats(
                total_feedback=0,
                average_rating=0.0,
                negative_outcome_rate=0.0,
                rating_distribution={str(star): 0 for star in range(1, 6)},
                expert_review_pending=0,
                generated_at=datetime.now(timezone.utc),
            )

        users = await self._users.find(user_query, {"_id": 1}).to_list(length=None)
        user_ids = [str(item["_id"]) for item in users]

        if user_ids:
            feedback_query: Dict[str, object] = {"user_id": {"$in": user_ids}}
        elif location:
            feedback_query = {"user_id": "__none__"}
        else:
            feedback_query = {}
        feedback_docs = await self._feedback.find(feedback_query).to_list(length=None)

        total_feedback = len(feedback_docs)
        ratings = [
            int(item.get("rating", 0)) for item in feedback_docs if int(item.get("rating", 0)) > 0
        ]
        average_rating = round(sum(ratings) / len(ratings), 2) if ratings else 0.0
        negative_outcomes = len(
            [item for item in feedback_docs if bool(item.get("negative_outcome", False))]
        )
        negative_outcome_rate = (
            round((negative_outcomes / total_feedback) * 100, 2) if total_feedback else 0.0
        )

        distribution = {str(star): 0 for star in range(1, 6)}
        for rating in ratings:
            if 1 <= rating <= 5:
                distribution[str(rating)] += 1

        pending_query: Dict[str, object] = {"status": "pending"}
        if user_ids:
            pending_query["user_id"] = {"$in": user_ids}
        elif location:
            pending_query["user_id"] = "__none__"
        expert_review_pending = await self._db["expert_review_queue"].count_documents(pending_query)

        stats = FeedbackReliabilityStats(
            total_feedback=total_feedback,
            average_rating=average_rating,
            negative_outcome_rate=negative_outcome_rate,
            rating_distribution=distribution,
            expert_review_pending=expert_review_pending,
            generated_at=datetime.now(timezone.utc),
        )
        logger.info(
            "feedback_reliability_computed",
            total_feedback=total_feedback,
            average_rating=average_rating,
            pending_reviews=expert_review_pending,
        )
        return stats

    async def regional_insights(
        self,
        location: Optional[str],
        crop: Optional[str],
        farm_size_min: Optional[float],
        farm_size_max: Optional[float],
        from_date: Optional[str],
        to_date: Optional[str],
        consent_safe: bool,
        limit: int,
        actor: UserInDB | None = None,
    ) -> RegionalInsightsResponse:
        overview = await self.overview(
            location,
            crop,
            farm_size_min,
            farm_size_max,
            from_date,
            to_date,
            actor=actor,
        )
        farmers = await self.farmers_needing_attention(
            location=location,
            consent_safe=consent_safe,
            limit=limit,
            actor=actor,
        )
        reliability = await self.feedback_reliability(location=location, actor=actor)
        return RegionalInsightsResponse(
            overview=overview,
            farmers_needing_attention=farmers,
            feedback_reliability=reliability,
            generated_at=datetime.now(timezone.utc),
        )
