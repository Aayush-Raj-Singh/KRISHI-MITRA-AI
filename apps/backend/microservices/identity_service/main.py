from __future__ import annotations

from app.api.routes import auth, users
from app.core.config import settings
from app.factory import RouterSpec, create_app

app = create_app(
    title="KrishiMitra Identity Service",
    routers=[
        RouterSpec(router=auth.router, prefix=f"{settings.api_v1_prefix}/auth", tags=["auth"]),
        RouterSpec(router=users.router, prefix=f"{settings.api_v1_prefix}/users", tags=["users"]),
    ],
)
