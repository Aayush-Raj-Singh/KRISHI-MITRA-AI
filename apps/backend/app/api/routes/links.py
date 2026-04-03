from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.responses import RedirectResponse

from app.core.database import Database
from app.core.dependencies import get_db
from app.schemas.links import ExternalLinkCheckResponse
from app.schemas.response import APIResponse
from app.services.external_link_service import ExternalLinkService
from app.utils.responses import success_response

router = APIRouter()


@router.get("/redirect")
async def safe_redirect(
    url: str = Query(min_length=5),
    inspect: bool = Query(default=False),
    db: Database = Depends(get_db),
):
    service = ExternalLinkService(db)
    check = await service.check(url)
    if not check.safe or not check.verified:
        raise HTTPException(
            status_code=400, detail=check.reason or "Only verified links are allowed"
        )
    if inspect:
        return success_response(check, message="link verified")
    return RedirectResponse(url=check.url, status_code=302)


@router.get("/redirect/inspect", response_model=APIResponse[ExternalLinkCheckResponse])
async def inspect_link(
    url: str = Query(min_length=5),
    db: Database = Depends(get_db),
) -> APIResponse[ExternalLinkCheckResponse]:
    service = ExternalLinkService(db)
    check = await service.check(url)
    return success_response(check, message="link inspection")
