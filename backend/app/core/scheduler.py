from __future__ import annotations

import asyncio
from dataclasses import dataclass, field
from datetime import datetime, timedelta, timezone
from typing import Optional

from app.core.config import settings
from app.core.logging import get_logger
from app.services.operations_service import OperationsService

try:
    from zoneinfo import ZoneInfo
except ImportError:  # pragma: no cover
    ZoneInfo = None  # type: ignore[assignment]

logger = get_logger(__name__)


def _resolve_timezone() -> timezone:
    if ZoneInfo is None:
        return timezone.utc
    try:
        return ZoneInfo(settings.scheduler_timezone)
    except Exception:  # noqa: BLE001
        return timezone.utc


def _next_daily(now: datetime, hour: int) -> datetime:
    candidate = now.replace(hour=hour, minute=0, second=0, microsecond=0)
    if candidate <= now:
        candidate += timedelta(days=1)
    return candidate


def _next_weekly(now: datetime, weekday: int, hour: int) -> datetime:
    candidate = now.replace(hour=hour, minute=0, second=0, microsecond=0)
    days_ahead = (weekday - candidate.weekday()) % 7
    if days_ahead == 0 and candidate <= now:
        days_ahead = 7
    return candidate + timedelta(days=days_ahead)


def _next_quarterly(now: datetime, hour: int) -> datetime:
    quarters = [1, 4, 7, 10]
    year = now.year
    for month in quarters:
        candidate = now.replace(year=year, month=month, day=1, hour=hour, minute=0, second=0, microsecond=0)
        if candidate > now:
            return candidate
    return now.replace(year=year + 1, month=1, day=1, hour=hour, minute=0, second=0, microsecond=0)


def _weekday_index(day: str) -> int:
    mapping = {
        "mon": 0,
        "monday": 0,
        "tue": 1,
        "tuesday": 1,
        "wed": 2,
        "wednesday": 2,
        "thu": 3,
        "thursday": 3,
        "fri": 4,
        "friday": 4,
        "sat": 5,
        "saturday": 5,
        "sun": 6,
        "sunday": 6,
    }
    return mapping.get(day.strip().lower(), 6)


@dataclass
class SchedulerRunner:
    task: Optional[asyncio.Task] = None
    _stop_event: asyncio.Event = field(default_factory=asyncio.Event)

    async def start(self, app) -> None:
        if not settings.feature_background_jobs_enabled or not settings.scheduler_enabled:
            logger.info("scheduler_disabled")
            return
        if self.task and not self.task.done():
            return
        self._stop_event = asyncio.Event()
        self.task = asyncio.create_task(self._run(app))
        logger.info("scheduler_started")

    async def shutdown(self) -> None:
        if not self.task:
            return
        self._stop_event.set()
        self.task.cancel()
        try:
            await self.task
        except asyncio.CancelledError:
            pass
        logger.info("scheduler_stopped")

    async def _run(self, app) -> None:
        tz = _resolve_timezone()
        weekday = _weekday_index(settings.scheduler_weekly_day)

        next_daily = _next_daily(datetime.now(tz), settings.scheduler_daily_hour)
        next_weekly = _next_weekly(datetime.now(tz), weekday, settings.scheduler_weekly_hour)
        next_quarterly = _next_quarterly(datetime.now(tz), settings.scheduler_quarterly_hour)

        while not self._stop_event.is_set():
            now = datetime.now(tz)
            if now >= next_daily:
                await self._trigger(app, "daily_external_data_refresh")
                next_daily = _next_daily(now + timedelta(seconds=1), settings.scheduler_daily_hour)
            if now >= next_weekly:
                await self._trigger(app, "weekly_price_refresh")
                next_weekly = _next_weekly(now + timedelta(seconds=1), weekday, settings.scheduler_weekly_hour)
            if now >= next_quarterly:
                await self._trigger(app, "quarterly_full_retrain")
                next_quarterly = _next_quarterly(now + timedelta(seconds=1), settings.scheduler_quarterly_hour)
            await asyncio.sleep(30)

    async def _trigger(self, app, operation: str) -> None:
        db = getattr(app.state, "db", None)
        if db is None:
            logger.warning("scheduler_db_unavailable", operation=operation)
            return

        service = OperationsService(db)
        if operation == "daily_external_data_refresh":
            result = await service.trigger_daily_data_refresh(triggered_by="scheduler", async_mode=True)
        elif operation == "weekly_price_refresh":
            result = await service.trigger_weekly_price_refresh(triggered_by="scheduler", async_mode=True)
        else:
            result = await service.trigger_quarterly_retrain(triggered_by="scheduler", async_mode=True)

        logger.info("scheduler_triggered", operation=result.operation, run_id=result.run_id, status=result.status)

        manager = getattr(app.state, "realtime_manager", None)
        if manager is not None:
            await manager.broadcast(
                {
                    "event": "operation.scheduled",
                    "operation": result.operation,
                    "run_id": result.run_id,
                    "status": result.status,
                    "triggered_at": result.triggered_at.isoformat(),
                    "triggered_by": result.triggered_by,
                }
            )
