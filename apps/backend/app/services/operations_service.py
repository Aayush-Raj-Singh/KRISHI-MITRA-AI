from __future__ import annotations

import asyncio
from datetime import datetime, timezone
from typing import Any, Callable, Dict, List, Optional

from ml.pipelines.retrain_all import run_pipeline
from ml.pipelines.seasonal_crop_refresh import run_seasonal_refresh
from ml.training.retrain_price_model import DEFAULT_PAIRS, retrain_price_models

from app.core.background_tasks import TaskDispatcher, get_task_dispatcher
from app.core.config import settings
from app.core.database import Database
from app.core.logging import get_logger
from app.schemas.operations import (
    OperationRunItem,
    SchedulerHook,
    SchedulerOverviewResponse,
    TriggerOperationResponse,
)
from app.services.external_data_service import ExternalDataService
from app.services.geo_hierarchy_service import GeoHierarchyService
from app.services.ml_runtime_service import MLRuntimeService
from app.services.state_portal_service import StatePortalService

logger = get_logger(__name__)


class OperationsService:
    DEFAULT_MARKET_REFRESH_PAIRS = [
        ("Rice", "Muzaffarpur"),
        ("Rice", "Patna"),
        ("Rice", "Samastipur"),
        ("Rice", "Darbhanga"),
        ("Wheat", "Patna"),
        ("Wheat", "Lucknow"),
        ("Maize", "Muzaffarpur"),
        ("Maize", "Pune"),
    ]

    def __init__(self, db: Database, dispatcher: Optional[TaskDispatcher] = None) -> None:
        self._db = db
        self._runs = db["operations_runs"]
        self._dispatcher = dispatcher or get_task_dispatcher()

    @staticmethod
    def _current_season(now: Optional[datetime] = None) -> str:
        month = (now or datetime.now(timezone.utc)).month
        if month in {6, 7, 8, 9, 10}:
            return "kharif"
        if month in {11, 12, 1, 2, 3}:
            return "rabi"
        return "zaid"

    @staticmethod
    def _normalize_season(season: Optional[str]) -> str:
        key = (season or "").strip().lower()
        if key in {"kharif", "rabi", "zaid"}:
            return key
        return OperationsService._current_season()

    async def scheduler_overview(self, limit: int = 20) -> SchedulerOverviewResponse:
        hooks = await self._build_hooks()
        run_docs = (
            await self._runs.find({}).sort("triggered_at", -1).limit(limit).to_list(length=limit)
        )
        recent_runs = [self._to_run_item(item) for item in run_docs]
        return SchedulerOverviewResponse(hooks=hooks, recent_runs=recent_runs)

    async def trigger_weekly_price_refresh(
        self, triggered_by: str, async_mode: bool = True
    ) -> TriggerOperationResponse:
        return await self._trigger_operation(
            operation="weekly_price_refresh",
            task_name="weekly_price_refresh",
            triggered_by=triggered_by,
            task=lambda: retrain_price_models(requested_pairs=DEFAULT_PAIRS),
            async_mode=async_mode,
        )

    async def trigger_quarterly_retrain(
        self, triggered_by: str, async_mode: bool = True, force: bool = False
    ) -> TriggerOperationResponse:
        return await self._trigger_operation(
            operation="quarterly_full_retrain",
            task_name="quarterly_full_retrain",
            triggered_by=triggered_by,
            task=lambda: run_pipeline(db=self._db, force=force),
            async_mode=async_mode,
        )

    async def trigger_daily_data_refresh(
        self, triggered_by: str, async_mode: bool = True
    ) -> TriggerOperationResponse:
        async def _refresh() -> dict:
            service = ExternalDataService(self._db)
            mandi_pairs = await self._recent_mandi_pairs(limit_pairs=12)
            if not mandi_pairs:
                mandi_pairs = list(self.DEFAULT_MARKET_REFRESH_PAIRS)
            else:
                seen = {(crop.lower(), market.lower()) for crop, market in mandi_pairs}
                for crop, market in self.DEFAULT_MARKET_REFRESH_PAIRS:
                    key = (crop.lower(), market.lower())
                    if key in seen:
                        continue
                    mandi_pairs.append((crop, market))
                    seen.add(key)

            markets = sorted({market for _, market in mandi_pairs})

            weather_results = []
            mandi_results = []
            for market in markets:
                weather = await service.fetch_weather(location=market, days=5)
                weather_results.append(
                    {"location": market, "cached": weather.cached, "source": weather.source}
                )
            for crop, market in mandi_pairs:
                mandi = await service.fetch_mandi_prices(crop=crop, market=market, days=30)
                mandi_results.append(
                    {"crop": crop, "market": market, "cached": mandi.cached, "source": mandi.source}
                )
            return {
                "weather_jobs": len(weather_results),
                "mandi_jobs": len(mandi_results),
                "weather": weather_results,
                "mandi": mandi_results,
                "refreshed_pairs": [
                    {"crop": crop, "market": market} for crop, market in mandi_pairs
                ],
            }

        return await self._trigger_operation(
            operation="daily_external_data_refresh",
            task_name="daily_external_data_refresh",
            triggered_by=triggered_by,
            task=_refresh,
            async_mode=async_mode,
        )

    async def trigger_state_portal_sync(
        self, triggered_by: str, async_mode: bool = True
    ) -> TriggerOperationResponse:
        return await self._trigger_operation(
            operation="state_portal_sync",
            task_name="state_portal_sync",
            triggered_by=triggered_by,
            task=lambda: StatePortalService(self._db).sync_all_states(force=True),
            async_mode=async_mode,
        )

    async def trigger_geo_hierarchy_sync(
        self, triggered_by: str, async_mode: bool = True
    ) -> TriggerOperationResponse:
        return await self._trigger_operation(
            operation="geo_hierarchy_sync",
            task_name="geo_hierarchy_sync",
            triggered_by=triggered_by,
            task=lambda: GeoHierarchyService(self._db).sync_from_sources(force=True),
            async_mode=async_mode,
        )

    async def trigger_seasonal_crop_refresh(
        self,
        triggered_by: str,
        async_mode: bool = True,
        season: Optional[str] = None,
        force: bool = False,
    ) -> TriggerOperationResponse:
        season_key = self._normalize_season(season)
        if not force:
            latest = (
                await self._runs.find({"operation": "seasonal_crop_refresh"})
                .sort("triggered_at", -1)
                .limit(1)
                .to_list(length=1)
            )
            if latest:
                last_result = latest[0].get("result") or {}
                last_season = str(last_result.get("season_refresh", "")).strip().lower()
                if last_season == season_key and latest[0].get("status") in {
                    "queued",
                    "running",
                    "completed",
                }:
                    return await self._record_skipped_run(
                        operation="seasonal_crop_refresh",
                        triggered_by=triggered_by,
                        reason="already_refreshed_for_season",
                        metadata={"season_refresh": season_key},
                    )

        return await self._trigger_operation(
            operation="seasonal_crop_refresh",
            task_name="seasonal_crop_refresh",
            triggered_by=triggered_by,
            task=lambda: run_seasonal_refresh(season_key),
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
        force: bool = False,
    ) -> TriggerOperationResponse:
        return await self._trigger_operation(
            operation=operation,
            task_name=operation,
            triggered_by=triggered_by,
            task=lambda: run_pipeline(db=self._db, force=force),
            async_mode=async_mode,
        )

    async def rollback_model_version(
        self,
        *,
        model_key: str,
        version: str,
        triggered_by: str,
    ) -> dict:
        result = MLRuntimeService().rollback(model_key, version)
        await self._runs.insert_one(
            {
                "operation": "ml_model_rollback",
                "status": "completed",
                "triggered_by": triggered_by,
                "mode": "sync",
                "triggered_at": datetime.now(timezone.utc),
                "started_at": datetime.now(timezone.utc),
                "completed_at": datetime.now(timezone.utc),
                "result": result,
                "error": None,
            }
        )
        return result

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
            return {
                "status": "completed",
                "result": result if isinstance(result, dict) else {"output": result},
            }
        except Exception as exc:
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
            {
                "key": "seasonal_crop_refresh",
                "title": "Seasonal Crop Model Refresh",
                "cadence": "seasonal",
                "schedule_expression": "cron(0 1 1 MAR,JUN,OCT ? *)",
                "command": "python -m ml.pipelines.seasonal_crop_refresh",
                "eventbridge_ready_note": "Trigger at season boundaries (Mar/Jun/Oct) via EventBridge",
            },
            {
                "key": "state_portal_sync",
                "title": "State Portal Snapshot Sync",
                "cadence": "daily",
                "schedule_expression": "cron(30 2 * * ? *)",
                "command": "POST /api/v1/operations/schedule/trigger/state-portal-sync",
                "eventbridge_ready_note": "Refresh state portal and directory snapshots once per day",
            },
            {
                "key": "geo_hierarchy_sync",
                "title": "Geo Hierarchy Sync",
                "cadence": "weekly",
                "schedule_expression": "cron(15 2 ? * MON *)",
                "command": "POST /api/v1/operations/schedule/trigger/geo-hierarchy-sync",
                "eventbridge_ready_note": "Refresh block and village hierarchy datasets weekly when configured",
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

    async def _recent_mandi_pairs(self, limit_pairs: int = 12) -> List[tuple[str, str]]:
        audit = self._db["integration_audit"]
        docs = (
            await audit.find({"event": "mandi_fetch"})
            .sort("created_at", -1)
            .limit(max(limit_pairs * 10, 50))
            .to_list(length=max(limit_pairs * 10, 50))
        )
        pairs: List[tuple[str, str]] = []
        seen: set[tuple[str, str]] = set()
        for doc in docs:
            payload = doc.get("payload") or {}
            crop = str(payload.get("crop") or "").strip()
            market = str(payload.get("market") or "").strip()
            if not crop or not market:
                continue
            key = (crop.lower(), market.lower())
            if key in seen:
                continue
            seen.add(key)
            pairs.append((crop, market))
            if len(pairs) >= limit_pairs:
                break
        return pairs

    async def _update_run(self, run_id: str, payload: Dict[str, Any]) -> None:
        run_key: str
        run_key = run_id
        await self._runs.update_one({"_id": run_key}, {"$set": payload})

    async def _record_skipped_run(
        self,
        operation: str,
        triggered_by: str,
        reason: str,
        metadata: Optional[Dict[str, Any]] = None,
    ) -> TriggerOperationResponse:
        now = datetime.now(timezone.utc)
        record = {
            "operation": operation,
            "status": "skipped",
            "triggered_by": triggered_by,
            "mode": "sync",
            "triggered_at": now,
            "started_at": now,
            "completed_at": now,
            "result": {"reason": reason, **(metadata or {})},
            "error": None,
        }
        insert_result = await self._runs.insert_one(record)
        return TriggerOperationResponse(
            run_id=str(insert_result.inserted_id),
            operation=operation,
            status="skipped",
            triggered_at=now,
            triggered_by=triggered_by,
            mode="sync",
            result=record["result"],
        )

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
