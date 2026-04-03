from __future__ import annotations

from app.api.routes import (
    alerts,
    data,
    integrations,
    mandi,
    mandi_directory,
    market_profiles,
    public,
    quality,
)
from app.core.config import settings
from app.factory import RouterSpec, create_app

app = create_app(
    title="KrishiMitra Market Service",
    routers=[
        RouterSpec(
            router=integrations.router,
            prefix=f"{settings.api_v1_prefix}/integrations",
            tags=["integrations"],
        ),
        RouterSpec(router=data.router, prefix=f"{settings.api_v1_prefix}/data", tags=["data"]),
        RouterSpec(router=mandi.router, prefix=f"{settings.api_v1_prefix}/mandi", tags=["mandi"]),
        RouterSpec(
            router=mandi_directory.router,
            prefix=f"{settings.api_v1_prefix}/mandi-directory",
            tags=["mandi_directory"],
        ),
        RouterSpec(
            router=market_profiles.router,
            prefix=f"{settings.api_v1_prefix}/market-profiles",
            tags=["market_profiles"],
        ),
        RouterSpec(
            router=quality.router, prefix=f"{settings.api_v1_prefix}/quality", tags=["quality"]
        ),
        RouterSpec(
            router=alerts.router, prefix=f"{settings.api_v1_prefix}/alerts", tags=["alerts"]
        ),
        RouterSpec(
            router=public.router, prefix=f"{settings.api_v1_prefix}/public", tags=["public"]
        ),
    ],
)
