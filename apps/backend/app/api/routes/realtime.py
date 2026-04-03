from __future__ import annotations

import asyncio
import time
from datetime import datetime, timezone
from typing import Optional

from fastapi import APIRouter, WebSocket, WebSocketDisconnect, status
from jose import JWTError

from app.core.config import settings
from app.core.logging import get_logger
from app.core.security import decode_token
from app.schemas.response import APIResponse
from app.utils.responses import success_response

logger = get_logger(__name__)

router = APIRouter()
_ws_memory_counters: dict[str, tuple[int, float]] = {}
_ws_memory_lock = asyncio.Lock()


def _extract_bearer_token(websocket: WebSocket, token: Optional[str]) -> Optional[str]:
    if token:
        return token
    auth_header = websocket.headers.get("authorization", "")
    if auth_header.lower().startswith("bearer "):
        return auth_header[7:].strip()
    return None


async def _allowed_by_ws_rate_limit(websocket: WebSocket) -> bool:
    if not settings.rate_limit_enabled:
        return True

    ip = websocket.client.host if websocket.client else "unknown"
    key = f"{settings.rate_limit_storage_prefix}:ws:{ip}"
    redis_client = getattr(websocket.app.state, "redis", None)
    if redis_client is not None:
        hits = await redis_client.incr(key)
        if hits == 1:
            await redis_client.expire(key, 60)
        return int(hits) <= settings.rate_limit_ws_per_minute

    now = time.time()
    async with _ws_memory_lock:
        hits, reset_at = _ws_memory_counters.get(key, (0, now + 60))
        if now >= reset_at:
            hits = 0
            reset_at = now + 60
        hits += 1
        _ws_memory_counters[key] = (hits, reset_at)
    return hits <= settings.rate_limit_ws_per_minute


@router.websocket("/ws/updates")
async def websocket_updates(websocket: WebSocket, token: Optional[str] = None) -> None:
    if not settings.feature_realtime_enabled:
        await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
        return

    if not await _allowed_by_ws_rate_limit(websocket):
        await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
        return

    await websocket.accept()
    manager = getattr(websocket.app.state, "realtime_manager", None)
    access_token = _extract_bearer_token(websocket, token)
    if not access_token:
        try:
            auth_payload = await asyncio.wait_for(websocket.receive_json(), timeout=10)
            if isinstance(auth_payload, dict) and auth_payload.get("type") == "auth":
                access_token = str(auth_payload.get("token", "")).strip()
        except Exception:
            access_token = None

    if not access_token:
        await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
        return

    try:
        payload = decode_token(access_token, token_type="access")
        if payload.get("type") != "access":
            await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
            return
    except JWTError:
        await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
        return

    if manager is not None:
        await manager.connect(websocket)

    await websocket.send_json(
        {
            "event": "connected",
            "server_time": datetime.now(timezone.utc).isoformat(),
        }
    )

    try:
        while True:
            data = await websocket.receive_text()
            if data.strip().lower() == "ping":
                await websocket.send_json(
                    {
                        "event": "pong",
                        "server_time": datetime.now(timezone.utc).isoformat(),
                    }
                )
                continue
            await websocket.send_json(
                {
                    "event": "echo",
                    "message": data,
                    "server_time": datetime.now(timezone.utc).isoformat(),
                }
            )
    except WebSocketDisconnect:
        logger.info("websocket_disconnected")
    finally:
        if manager is not None:
            await manager.disconnect(websocket)


@router.get("/ws/health", response_model=APIResponse[dict])
async def websocket_health() -> APIResponse[dict]:
    return success_response(
        {
            "websocket_enabled": settings.feature_realtime_enabled,
            "rate_limit_per_minute": settings.rate_limit_ws_per_minute,
        },
        message="websocket healthy",
    )
