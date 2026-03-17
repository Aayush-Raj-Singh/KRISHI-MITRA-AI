from __future__ import annotations

from app.api.api_v1 import api_router
from app.api.routes import links
from app.core.config import settings
from app.factory import RouterSpec, create_app

app = create_app(
    title=settings.project_name,
    routers=[
        RouterSpec(router=api_router),
        RouterSpec(router=links.router),
    ],
    enable_scheduler=True,
    enable_realtime=True,
)
