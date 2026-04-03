from __future__ import annotations

from app.api.routes import analytics, audit, dashboard
from app.core.config import settings
from app.factory import RouterSpec, create_app

app = create_app(
    title="KrishiMitra Analytics Service",
    routers=[
        RouterSpec(
            router=analytics.router,
            prefix=f"{settings.api_v1_prefix}/analytics",
            tags=["analytics"],
        ),
        RouterSpec(
            router=dashboard.router,
            prefix=f"{settings.api_v1_prefix}/dashboard",
            tags=["dashboard"],
        ),
        RouterSpec(router=audit.router, prefix=f"{settings.api_v1_prefix}/audit", tags=["audit"]),
    ],
)
