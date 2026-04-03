from __future__ import annotations

from app.api.routes import faq, links, master, tickets
from app.core.config import settings
from app.factory import RouterSpec, create_app

app = create_app(
    title="KrishiMitra Support Service",
    routers=[
        RouterSpec(
            router=tickets.router, prefix=f"{settings.api_v1_prefix}/tickets", tags=["tickets"]
        ),
        RouterSpec(router=faq.router, prefix=f"{settings.api_v1_prefix}/faq", tags=["faq"]),
        RouterSpec(
            router=master.router, prefix=f"{settings.api_v1_prefix}/master", tags=["master"]
        ),
        RouterSpec(router=links.router),
    ],
)
