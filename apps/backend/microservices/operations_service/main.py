from __future__ import annotations

from app.api.routes import diagnostics, operations, realtime
from app.core.config import settings
from app.factory import RouterSpec, create_app

app = create_app(
    title="KrishiMitra Operations Service",
    routers=[
        RouterSpec(
            router=operations.router,
            prefix=f"{settings.api_v1_prefix}/operations",
            tags=["operations"],
        ),
        RouterSpec(
            router=diagnostics.router,
            prefix=f"{settings.api_v1_prefix}/diagnostics",
            tags=["diagnostics"],
        ),
        RouterSpec(router=realtime.router),
    ],
    enable_scheduler=True,
    enable_realtime=True,
)
