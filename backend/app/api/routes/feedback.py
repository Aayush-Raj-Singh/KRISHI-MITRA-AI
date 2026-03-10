from __future__ import annotations

from fastapi import APIRouter, Depends, Request
from motor.motor_asyncio import AsyncIOMotorDatabase

from app.core.dependencies import get_db, require_roles
from app.models.user import UserInDB
from app.schemas.feedback import (
    OutcomeFeedbackRequest,
    OutcomeFeedbackResponse,
    QuickFeedbackRequest,
    QuickFeedbackResponse,
)
from app.schemas.response import APIResponse
from app.services.feedback_service import FeedbackService
from app.utils.responses import success_response

router = APIRouter()


@router.post("/outcome", response_model=APIResponse[OutcomeFeedbackResponse])
async def submit_outcome(
    payload: OutcomeFeedbackRequest,
    db: AsyncIOMotorDatabase = Depends(get_db),
    user: UserInDB = Depends(require_roles(["farmer", "admin"])),
    request: Request = None,
) -> APIResponse[OutcomeFeedbackResponse]:
    service = FeedbackService(db)
    result = await service.submit_feedback(user.id, payload.model_dump())
    response = OutcomeFeedbackResponse(
        feedback_id=result["feedback_id"],
        sustainability_score=result["sustainability_score"],
        sub_scores=result["sub_scores"],
        recommendations=result["recommendations"],
        recognition_badge=result.get("recognition_badge"),
        trend=result.get("trend"),
        regional_comparison=result.get("regional_comparison"),
        queued_for_expert_review=result.get("queued_for_expert_review", False),
        retrain_triggered=result.get("retrain_triggered", False),
        created_at=result["created_at"],
    )
    if request is not None:
        manager = getattr(request.app.state, "realtime_manager", None)
        if manager is not None:
            await manager.broadcast(
                {
                    "event": "feedback.submitted",
                    "feedback_id": response.feedback_id,
                    "recommendation_id": payload.recommendation_id,
                    "rating": payload.rating,
                    "trend": response.trend,
                    "created_at": response.created_at.isoformat(),
                }
            )
    return success_response(response, message="feedback recorded")


@router.post("/quick", response_model=APIResponse[QuickFeedbackResponse])
async def submit_quick_feedback(
    payload: QuickFeedbackRequest,
    db: AsyncIOMotorDatabase = Depends(get_db),
    user: UserInDB = Depends(require_roles(["farmer", "admin"])),
    request: Request = None,
) -> APIResponse[QuickFeedbackResponse]:
    service = FeedbackService(db)
    result = await service.submit_quick_feedback(user.id, payload.model_dump())
    response = QuickFeedbackResponse(
        feedback_id=result["feedback_id"],
        recommendation_id=result.get("recommendation_id"),
        rating=result["rating"],
        service=result["service"],
        notes=result.get("notes"),
        created_at=result["created_at"],
    )
    if request is not None:
        manager = getattr(request.app.state, "realtime_manager", None)
        if manager is not None:
            await manager.broadcast(
                {
                    "event": "feedback.quick_submitted",
                    "feedback_id": response.feedback_id,
                    "recommendation_id": response.recommendation_id,
                    "rating": response.rating,
                    "service": response.service,
                    "created_at": response.created_at.isoformat(),
                }
            )
    return success_response(response, message="quick feedback recorded")
