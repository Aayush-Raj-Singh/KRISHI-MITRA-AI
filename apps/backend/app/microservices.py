from __future__ import annotations

from app.api.routes import (
    auth,
    dashboard,
    integrations,
    links,
    mandi,
    mandi_directory,
    market_profiles,
    platform,
    public,
    state_engine,
    users,
)
from app.core.config import settings
from app.factory import RouterSpec, create_app


def _service_title(name: str) -> str:
    return f"{settings.project_name} {name}".strip()


auth_service_app = create_app(
    title=_service_title("Auth Service"),
    routers=[
        RouterSpec(router=auth.router, prefix=f"{settings.api_v1_prefix}/auth"),
        RouterSpec(router=users.router, prefix=f"{settings.api_v1_prefix}/users"),
    ],
)

state_engine_app = create_app(
    title=_service_title("State Engine"),
    routers=[
        RouterSpec(router=platform.router, prefix=f"{settings.api_v1_prefix}/platform"),
        RouterSpec(router=state_engine.router, prefix=f"{settings.api_v1_prefix}/state-engine"),
    ],
)

mandi_service_app = create_app(
    title=_service_title("Mandi Service"),
    routers=[
        RouterSpec(router=dashboard.router, prefix=f"{settings.api_v1_prefix}/dashboard"),
        RouterSpec(router=integrations.router, prefix=f"{settings.api_v1_prefix}/integrations"),
        RouterSpec(router=mandi.router, prefix=f"{settings.api_v1_prefix}/mandi"),
        RouterSpec(
            router=market_profiles.router, prefix=f"{settings.api_v1_prefix}/market-profiles"
        ),
        RouterSpec(
            router=mandi_directory.router, prefix=f"{settings.api_v1_prefix}/mandi-directory"
        ),
    ],
    enable_realtime=True,
)

developer_api_app = create_app(
    title=_service_title("Developer API"),
    routers=[
        RouterSpec(router=public.router, prefix=f"{settings.api_v1_prefix}/public"),
        RouterSpec(router=links.router),
    ],
)
