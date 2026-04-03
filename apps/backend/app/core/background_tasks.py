from __future__ import annotations

import inspect
from dataclasses import dataclass
from typing import Any, Callable

from app.core.config import settings
from app.core.logging import get_logger

logger = get_logger(__name__)


class TaskDispatcher:
    async def dispatch(
        self, task_name: str, task: Callable[..., Any], *args: Any, **kwargs: Any
    ) -> Any:
        raise NotImplementedError


class LocalTaskDispatcher(TaskDispatcher):
    async def dispatch(
        self, task_name: str, task: Callable[..., Any], *args: Any, **kwargs: Any
    ) -> Any:
        logger.info("background_task_local_dispatch", task_name=task_name)
        result = task(*args, **kwargs)
        if inspect.isawaitable(result):
            return await result
        return result


@dataclass
class CeleryTaskDispatcher(TaskDispatcher):
    """
    Celery-ready adapter.
    Local mode intentionally no-ops to keep local setup lightweight.
    """

    async def dispatch(
        self, task_name: str, task: Callable[..., Any], *args: Any, **kwargs: Any
    ) -> Any:
        logger.info("background_task_celery_stub_dispatch", task_name=task_name)
        result = task(*args, **kwargs)
        if inspect.isawaitable(result):
            return await result
        return result


def get_task_dispatcher() -> TaskDispatcher:
    if settings.background_task_backend == "celery":
        return CeleryTaskDispatcher()
    return LocalTaskDispatcher()
