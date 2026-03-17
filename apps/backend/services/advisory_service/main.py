from __future__ import annotations

from app.api.routes import advisory
from app.core.config import settings
from app.factory import RouterSpec, create_app

app = create_app(
    title="KrishiMitra Advisory Service",
    routers=[
        RouterSpec(router=advisory.router, prefix=f"{settings.api_v1_prefix}/advisory", tags=["advisory"]),
    ],
)
