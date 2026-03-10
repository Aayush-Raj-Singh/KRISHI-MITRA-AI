from __future__ import annotations

import asyncio
from datetime import datetime, timezone
from typing import Any, Callable, Dict, List, Optional

from bson import ObjectId
from motor.motor_asyncio import AsyncIOMotorDatabase

from app.core.background_tasks import TaskDispatcher, get_task_dispatcher
from app.core.config import settings
from app.core.logging import get_logger
from app.schemas.operations import OperationRunItem, SchedulerHook, SchedulerOverviewResponse, TriggerOperationResponse
from app.services.external_data_service import ExternalDataService
from ml.pipelines.retrain_all import run_pipeline
from ml.training.retrain_price_model import DEFAULT_PAIRS, retrain_price_models

logger = get_logger(__name__)


class OperationsService:
    def __init__(self, db: AsyncIOMotorDatabase, dispatcher: Optional[TaskDispatcher] = None) -> None:
        self._db = db
        self._runs = db["operations_runs"]
        self._dispatcher = dispatcher or get_task_dispatcher()

    async def scheduler_overview(self, limit: int = 20) -> SchedulerOverviewResponse:
        hooks = await self._build_hooks()
        run_docs = await self._runs.find({}).sort("triggered_at", -1).limit(limit).to_list(length=limit)
        recent_runs = [self._to_run_item(item) for item in run_docs]
        return SchedulerOverviewResponse(hooks=hooks, recent_runs=recent_runs)

    async def trigger_weekly_price_refresh(self, triggered_by: str, async_mode: bool = True) -> TriggerOperationResponse:
        return await self._trigger_operation(
            operation="weekly_price_refresh",
            task_name="weekly_price_refresh",
            triggered_by=triggered_by,
            task=lambda: retrain_price_models(requested_pairs=DEFAULT_PAIRS),
            async_mode=async_mode,
        )

    async def trigger_quarterly_retrain(self, triggered_by: str, async_mode: bool = True) -> TriggerOperationResponse:
        return await self._trigger_operation(
            operation="quarterly_full_retrain",
            task_name="quarterly_full_retrain",
            triggered_by=triggered_by,
            task=run_pipeline,
            async_mode=async_mode,
        )

    async def trigger_daily_data_refresh(self, triggered_by: str, async_mode: bool = True) -> TriggerOperationResponse:
        async def _refresh() -> dict:
            service = ExternalDataService(self._db)
            markets = ["Patna", "Pune", "Lucknow"]
            crops = ["Rice", "Wheat", "Maize"]

            weather_results = []
            mandi_results = []
            for market in markets:
                weather = await service.fetch_weather(location=market, days=5)
                weather_results.append({"location": market, "cached": weather.cached, "source": weather.source})
            for market in markets:
                for crop in crops:
                    mandi = await service.fetch_mandi_prices(crop=crop, market=market, days=7)
                    mandi_results.append(
                        {"crop": crop, "market": market, "cached": mandi.cached, "source": mandi.source}
                    )
            return {
                "weather_jobs": len(weather_results),
                "mandi_jobs": len(mandi_results),
                "weather": weather_results,
                "mandi": mandi_results,
            }

        return await self._trigger_operation(
            operation="daily_external_data_refresh",
            task_name="daily_external_data_refresh",
            triggered_by=triggered_by,
            task=_refresh,
            async_mode=async_mode,
        )

    async def trigger_feedback_threshold_retrain(
        self,
        triggered_by: str,
        negative_count: int,
        async_mode: bool = True,
    ) -> Optional[TriggerOperationResponse]:
        if negative_count < settings.negative_outcome_retrain_threshold:
            return None
        return await self._trigger_quarterly_retrain_internal(
            triggered_by=triggered_by,
            async_mode=async_mode,
            operation="feedback_threshold_retrain",
        )

    async def _trigger_quarterly_retrain_internal(
        self,
        triggered_by: str,
        async_mode: bool,
        operation: str,
    ) -> TriggerOperationResponse:
        return await self._trigger_operation(
            operation=operation,
            task_name=operation,
            triggered_by=triggered_by,
            task=run_pipeline,
            async_mode=async_mode,
        )

    async def _trigger_operation(
        self,
        operation: str,
        task_name: str,
        triggered_by: str,
        task: Callable[..., Any],
        async_mode: bool,
    ) -> TriggerOperationResponse:
        now = datetime.now(timezone.utc)
        mode = "async" if async_mode and settings.feature_background_jobs_enabled else "sync"
        run_doc = {
            "operation": operation,
            "status": "queued",
            "triggered_by": triggered_by,
            "mode": mode,
            "triggered_at": now,
            "started_at": None,
            "completed_at": None,
            "result": None,
            "error": None,
        }
        insert_result = await self._runs.insert_one(run_doc)
        run_id = str(insert_result.inserted_id)

        if mode == "async":
            asyncio.create_task(
                self._execute_operation(
                    run_id=run_id,
                    task_name=task_name,
                    task=task,
                )
            )
            return TriggerOperationResponse(
                run_id=run_id,
                operation=operation,
                status="queued",
                triggered_at=now,
                triggered_by=triggered_by,
                mode=mode,
            )

        result = await self._execute_operation(run_id=run_id, task_name=task_name, task=task)
        return TriggerOperationResponse(
            run_id=run_id,
            operation=operation,
            status=result["status"],
            triggered_at=now,
            triggered_by=triggered_by,
            mode=mode,
            result=result.get("result"),
        )

    async def _execute_operation(
        self,
        run_id: str,
        task_name: str,
        task: Callable[..., Any],
    ) -> Dict[str, Any]:
        started_at = datetime.now(timezone.utc)
        await self._update_run(
            run_id,
            {
                "status": "running",
                "started_at": started_at,
            },
        )

        try:
            result = await self._dispatcher.dispatch(task_name, task)
            completed_at = datetime.now(timezone.utc)
            await self._update_run(
                run_id,
                {
                    "status": "completed",
                    "completed_at": completed_at,
                    "result": result if isinstance(result, dict) else {"output": result},
                    "error": None,
                },
            )
            logger.info("operation_completed", run_id=run_id, task_name=task_name)
            return {"status": "completed", "result": result if isinstance(result, dict) else {"output": result}}
        except Exception as exc:  # noqa: BLE001
            completed_at = datetime.now(timezone.utc)
            await self._update_run(
                run_id,
                {
                    "status": "failed",
                    "completed_at": completed_at,
                    "error": str(exc),
                },
            )
            logger.error("operation_failed", run_id=run_id, task_name=task_name, error=str(exc))
            return {"status": "failed", "error": str(exc)}

    async def _build_hooks(self) -> List[SchedulerHook]:
        latest_by_operation: Dict[str, dict] = {}
        docs = await self._runs.find({}).sort("triggered_at", -1).to_list(length=100)
        for doc in docs:
            key = str(doc.get("operation"))
            if key not in latest_by_operation:
                latest_by_operation[key] = doc

        hooks_meta = [
            {
                "key": "weekly_price_refresh",
                "title": "Weekly Price Model Refresh",
                "cadence": "weekly",
                "schedule_expression": "cron(0 2 ? * SUN *)",
                "command": "python -m ml.training.retrain_price_model",
                "eventbridge_ready_note": "Attach this cron to EventBridge rule for Sunday 02:00 UTC",
            },
            {
                "key": "quarterly_full_retrain",
                "title": "Quarterly Full Model Retrain",
                "cadence": "quarterly",
                "schedule_expression": "cron(30 1 1 JAN,APR,JUL,OCT ? *)",
                "command": "python -m ml.pipelines.retrain_all",
                "eventbridge_ready_note": "Attach this cron to EventBridge rule at quarter start",
            },
            {
                "key": "daily_external_data_refresh",
                "title": "Daily External Data Refresh",
                "cadence": "daily",
                "schedule_expression": "cron(0 1 * * ? *)",
                "command": "POST /api/v1/operations/schedule/trigger/daily-data-refresh",
                "eventbridge_ready_note": "Attach this cron to EventBridge and invoke admin trigger endpoint",
            },
        ]

        hooks: List[SchedulerHook] = []
        for meta in hooks_meta:
            latest = latest_by_operation.get(meta["key"])
            hooks.append(
                SchedulerHook(
                    **meta,
                    last_status=latest.get("status") if latest else None,
                    last_run_at=latest.get("triggered_at") if latest else None,
                )
            )
        return hooks

    async def _update_run(self, run_id: str, payload: Dict[str, Any]) -> None:
        run_key: ObjectId | str
        run_key = ObjectId(run_id) if ObjectId.is_valid(run_id) else run_id
        await self._runs.update_one({"_id": run_key}, {"$set": payload})

    @staticmethod
    def _to_run_item(doc: dict) -> OperationRunItem:
        return OperationRunItem(
            run_id=str(doc.get("_id")),
            operation=str(doc.get("operation", "")),
            status=str(doc.get("status", "unknown")),
            triggered_by=str(doc.get("triggered_by", "system")),
            mode=str(doc.get("mode", "sync")),
            triggered_at=doc.get("triggered_at", datetime.now(timezone.utc)),
            started_at=doc.get("started_at"),
            completed_at=doc.get("completed_at"),
            error=doc.get("error"),
            result=doc.get("result"),
        )
