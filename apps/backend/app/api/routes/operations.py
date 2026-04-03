from __future__ import annotations

from fastapi import APIRouter, Depends, Request

from app.core.database import Database
from app.core.dependencies import get_db, require_roles
from app.models.user import UserInDB
from app.schemas.operations import SchedulerOverviewResponse, TriggerOperationResponse
from app.schemas.response import APIResponse
from app.services.operations_service import OperationsService
from app.utils.responses import success_response

router = APIRouter()


@router.get("/schedule", response_model=APIResponse[SchedulerOverviewResponse])
async def scheduler_overview(
    db: Database = Depends(get_db),
    _: UserInDB = Depends(require_roles(["admin"])),
) -> APIResponse[SchedulerOverviewResponse]:
    service = OperationsService(db)
    data = await service.scheduler_overview()
    return success_response(data, message="scheduler overview loaded")


@router.post(
    "/schedule/trigger/weekly-price-refresh", response_model=APIResponse[TriggerOperationResponse]
)
async def trigger_weekly_price_refresh(
    async_mode: bool = True,
    db: Database = Depends(get_db),
    user: UserInDB = Depends(require_roles(["admin"])),
    request: Request = None,
) -> APIResponse[TriggerOperationResponse]:
    service = OperationsService(db)
    data = await service.trigger_weekly_price_refresh(
        triggered_by=user.id or "admin", async_mode=async_mode
    )
    if request is not None:
        manager = getattr(request.app.state, "realtime_manager", None)
        if manager is not None:
            await manager.broadcast(
                {
                    "event": "operation.triggered",
                    "operation": data.operation,
                    "run_id": data.run_id,
                    "status": data.status,
                    "triggered_at": data.triggered_at.isoformat(),
                    "triggered_by": data.triggered_by,
                }
            )
    return success_response(data, message="weekly price refresh triggered")


@router.post(
    "/schedule/trigger/quarterly-retrain", response_model=APIResponse[TriggerOperationResponse]
)
async def trigger_quarterly_retrain(
    async_mode: bool = True,
    db: Database = Depends(get_db),
    user: UserInDB = Depends(require_roles(["admin"])),
    request: Request = None,
) -> APIResponse[TriggerOperationResponse]:
    service = OperationsService(db)
    data = await service.trigger_quarterly_retrain(
        triggered_by=user.id or "admin", async_mode=async_mode
    )
    if request is not None:
        manager = getattr(request.app.state, "realtime_manager", None)
        if manager is not None:
            await manager.broadcast(
                {
                    "event": "operation.triggered",
                    "operation": data.operation,
                    "run_id": data.run_id,
                    "status": data.status,
                    "triggered_at": data.triggered_at.isoformat(),
                    "triggered_by": data.triggered_by,
                }
            )
    return success_response(data, message="quarterly retrain triggered")


@router.post(
    "/schedule/trigger/daily-data-refresh", response_model=APIResponse[TriggerOperationResponse]
)
async def trigger_daily_data_refresh(
    async_mode: bool = True,
    db: Database = Depends(get_db),
    user: UserInDB = Depends(require_roles(["admin"])),
    request: Request = None,
) -> APIResponse[TriggerOperationResponse]:
    service = OperationsService(db)
    data = await service.trigger_daily_data_refresh(
        triggered_by=user.id or "admin", async_mode=async_mode
    )
    if request is not None:
        manager = getattr(request.app.state, "realtime_manager", None)
        if manager is not None:
            await manager.broadcast(
                {
                    "event": "operation.triggered",
                    "operation": data.operation,
                    "run_id": data.run_id,
                    "status": data.status,
                    "triggered_at": data.triggered_at.isoformat(),
                    "triggered_by": data.triggered_by,
                }
            )
    return success_response(data, message="daily data refresh triggered")


@router.post(
    "/schedule/trigger/state-portal-sync", response_model=APIResponse[TriggerOperationResponse]
)
async def trigger_state_portal_sync(
    async_mode: bool = True,
    db: Database = Depends(get_db),
    user: UserInDB = Depends(require_roles(["admin"])),
    request: Request = None,
) -> APIResponse[TriggerOperationResponse]:
    service = OperationsService(db)
    data = await service.trigger_state_portal_sync(
        triggered_by=user.id or "admin", async_mode=async_mode
    )
    if request is not None:
        manager = getattr(request.app.state, "realtime_manager", None)
        if manager is not None:
            await manager.broadcast(
                {
                    "event": "operation.triggered",
                    "operation": data.operation,
                    "run_id": data.run_id,
                    "status": data.status,
                    "triggered_at": data.triggered_at.isoformat(),
                    "triggered_by": data.triggered_by,
                }
            )
    return success_response(data, message="state portal sync triggered")


@router.post(
    "/schedule/trigger/geo-hierarchy-sync", response_model=APIResponse[TriggerOperationResponse]
)
async def trigger_geo_hierarchy_sync(
    async_mode: bool = True,
    db: Database = Depends(get_db),
    user: UserInDB = Depends(require_roles(["admin"])),
    request: Request = None,
) -> APIResponse[TriggerOperationResponse]:
    service = OperationsService(db)
    data = await service.trigger_geo_hierarchy_sync(
        triggered_by=user.id or "admin", async_mode=async_mode
    )
    if request is not None:
        manager = getattr(request.app.state, "realtime_manager", None)
        if manager is not None:
            await manager.broadcast(
                {
                    "event": "operation.triggered",
                    "operation": data.operation,
                    "run_id": data.run_id,
                    "status": data.status,
                    "triggered_at": data.triggered_at.isoformat(),
                    "triggered_by": data.triggered_by,
                }
            )
    return success_response(data, message="geo hierarchy sync triggered")


@router.post(
    "/schedule/trigger/seasonal-crop-refresh", response_model=APIResponse[TriggerOperationResponse]
)
async def trigger_seasonal_crop_refresh(
    async_mode: bool = True,
    season: str | None = None,
    force: bool = False,
    db: Database = Depends(get_db),
    user: UserInDB = Depends(require_roles(["admin"])),
    request: Request = None,
) -> APIResponse[TriggerOperationResponse]:
    service = OperationsService(db)
    data = await service.trigger_seasonal_crop_refresh(
        triggered_by=user.id or "admin",
        async_mode=async_mode,
        season=season,
        force=force,
    )
    if request is not None:
        manager = getattr(request.app.state, "realtime_manager", None)
        if manager is not None:
            await manager.broadcast(
                {
                    "event": "operation.triggered",
                    "operation": data.operation,
                    "run_id": data.run_id,
                    "status": data.status,
                    "triggered_at": data.triggered_at.isoformat(),
                    "triggered_by": data.triggered_by,
                }
            )
    return success_response(data, message="seasonal crop refresh triggered")
