from fastapi import APIRouter

from app.api.routes import (
    advisory,
    alerts,
    analytics,
    audit,
    auth,
    dashboard,
    data,
    diagnostics,
    disease,
    faq,
    feedback,
    integrations,
    mandi,
    mandi_directory,
    market_profiles,
    master,
    operations,
    platform,
    public,
    quality,
    realtime,
    recommendations,
    state_engine,
    tickets,
    users,
)
from app.core.config import settings

api_router = APIRouter(prefix=settings.api_v1_prefix)

api_router.include_router(auth.router, tags=["auth"], prefix="/auth")
api_router.include_router(users.router, tags=["users"], prefix="/users")
api_router.include_router(
    recommendations.router, tags=["recommendations"], prefix="/recommendations"
)
api_router.include_router(advisory.router, tags=["advisory"], prefix="/advisory")
api_router.include_router(feedback.router, tags=["feedback"], prefix="/feedback")
api_router.include_router(analytics.router, tags=["analytics"], prefix="/analytics")
api_router.include_router(dashboard.router, tags=["dashboard"], prefix="/dashboard")
api_router.include_router(integrations.router, tags=["integrations"], prefix="/integrations")
api_router.include_router(data.router, tags=["data"], prefix="/data")
api_router.include_router(operations.router, tags=["operations"], prefix="/operations")
api_router.include_router(realtime.router, tags=["realtime"])
api_router.include_router(mandi.router, tags=["mandi"], prefix="/mandi")
api_router.include_router(
    market_profiles.router, tags=["market_profiles"], prefix="/market-profiles"
)
api_router.include_router(
    mandi_directory.router, tags=["mandi_directory"], prefix="/mandi-directory"
)
api_router.include_router(tickets.router, tags=["tickets"], prefix="/tickets")
api_router.include_router(faq.router, tags=["faq"], prefix="/faq")
api_router.include_router(master.router, tags=["master"], prefix="/master")
api_router.include_router(quality.router, tags=["quality"], prefix="/quality")
api_router.include_router(alerts.router, tags=["alerts"], prefix="/alerts")
api_router.include_router(platform.router, tags=["platform"], prefix="/platform")
api_router.include_router(public.router, tags=["public"], prefix="/public")
api_router.include_router(audit.router, tags=["audit"], prefix="/audit")
api_router.include_router(diagnostics.router, tags=["diagnostics"], prefix="/diagnostics")
api_router.include_router(disease.router, tags=["disease"], prefix="/disease")
api_router.include_router(state_engine.router, tags=["state_engine"], prefix="/state-engine")
