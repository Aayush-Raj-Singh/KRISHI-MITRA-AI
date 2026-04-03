from __future__ import annotations

from app.api.routes import feedback, recommendations
from app.core.config import settings
from app.factory import RouterSpec, create_app

app = create_app(
    title="KrishiMitra Recommendation Service",
    routers=[
        RouterSpec(
            router=recommendations.router,
            prefix=f"{settings.api_v1_prefix}/recommendations",
            tags=["recommendations"],
        ),
        RouterSpec(
            router=feedback.router, prefix=f"{settings.api_v1_prefix}/feedback", tags=["feedback"]
        ),
    ],
)
