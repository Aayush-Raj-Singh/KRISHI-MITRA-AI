from __future__ import annotations

from typing import Optional

from redis.asyncio import Redis

from app.core.config import settings
from app.core.logging import get_logger

logger = get_logger(__name__)

_redis: Optional[Redis] = None


async def connect_to_redis() -> Optional[Redis]:
    global _redis
    if not settings.redis_url:
        return None
    try:
        _redis = Redis.from_url(settings.redis_url, decode_responses=True)
        await _redis.ping()
        return _redis
    except Exception as exc:  # noqa: BLE001
        logger.warning("redis_connection_failed", error=str(exc))
        _redis = None
        return None


async def close_redis() -> None:
    global _redis
    if _redis is not None:
        await _redis.close()
        _redis = None


def get_redis() -> Optional[Redis]:
    return _redis


class Cache:
    def __init__(self, client: Optional[Redis]):
        self._client = client

    async def get(self, key: str) -> Optional[str]:
        if not self._client:
            return None
        return await self._client.get(key)

    async def set(self, key: str, value: str, ttl_seconds: int) -> None:
        if not self._client:
            return None
        await self._client.set(key, value, ex=ttl_seconds)


def get_cache() -> Cache:
    return Cache(_redis)
