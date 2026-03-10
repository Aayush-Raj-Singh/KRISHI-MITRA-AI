from fastapi import APIRouter

from app.api.routes import advisory, analytics, auth, feedback, integrations, operations, realtime, recommendations
from app.core.config import settings

api_router = APIRouter(prefix=settings.api_v1_prefix)

api_router.include_router(auth.router, tags=["auth"], prefix="/auth")
api_router.include_router(recommendations.router, tags=["recommendations"], prefix="/recommendations")
api_router.include_router(advisory.router, tags=["advisory"], prefix="/advisory")
api_router.include_router(feedback.router, tags=["feedback"], prefix="/feedback")
api_router.include_router(analytics.router, tags=["analytics"], prefix="/analytics")
api_router.include_router(integrations.router, tags=["integrations"], prefix="/integrations")
api_router.include_router(operations.router, tags=["operations"], prefix="/operations")
api_router.include_router(realtime.router, tags=["realtime"])
