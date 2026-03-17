from __future__ import annotations

import asyncio
from typing import Any, Dict, Set

from fastapi import WebSocket

from app.core.logging import get_logger

logger = get_logger(__name__)


class RealtimeManager:
    def __init__(self) -> None:
        self._connections: Set[WebSocket] = set()
        self._lock = asyncio.Lock()

    async def connect(self, websocket: WebSocket) -> None:
        async with self._lock:
            self._connections.add(websocket)
        logger.info("realtime_connected", total=len(self._connections))

    async def disconnect(self, websocket: WebSocket) -> None:
        async with self._lock:
            self._connections.discard(websocket)
        logger.info("realtime_disconnected", total=len(self._connections))

    async def broadcast(self, payload: Dict[str, Any]) -> None:
        async with self._lock:
            connections = list(self._connections)

        if not connections:
            return

        dead_connections: list[WebSocket] = []
        for websocket in connections:
            try:
                await websocket.send_json(payload)
            except Exception as exc:
                logger.warning("realtime_broadcast_failed", error=str(exc))
                dead_connections.append(websocket)

        if dead_connections:
            async with self._lock:
                for websocket in dead_connections:
                    self._connections.discard(websocket)
