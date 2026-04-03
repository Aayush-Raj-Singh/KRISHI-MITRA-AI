from __future__ import annotations

import asyncio
import time
from dataclasses import dataclass
from typing import Optional

from fastapi import Request
from redis.asyncio import Redis

from app.core.config import settings
from app.core.logging import get_logger

logger = get_logger(__name__)


@dataclass(frozen=True)
class RateLimitRule:
    name: str
    limit: int
    window_seconds: int = 60


class RateLimiter:
    def __init__(self):
        self._memory_counters: dict[str, tuple[int, float]] = {}
        self._memory_lock = asyncio.Lock()
        self._rules = (
            (
                "/api/v1/auth/login",
                RateLimitRule("auth_login", settings.rate_limit_auth_per_minute),
            ),
            (
                "/api/v1/auth/register",
                RateLimitRule("auth_register", settings.rate_limit_auth_per_minute),
            ),
            (
                "/api/v1/auth/request-password-reset",
                RateLimitRule("auth_reset_request", settings.rate_limit_auth_per_minute),
            ),
            (
                "/api/v1/auth/reset-password",
                RateLimitRule("auth_reset_confirm", settings.rate_limit_auth_per_minute),
            ),
            (
                "/api/v1/auth/refresh",
                RateLimitRule("auth_refresh", settings.rate_limit_auth_per_minute),
            ),
            (
                "/api/v1/advisory/chat",
                RateLimitRule("advisory_chat", settings.rate_limit_advisory_per_minute),
            ),
            (
                "/api/v1/disease/predict",
                RateLimitRule("disease_predict", settings.rate_limit_upload_per_minute),
            ),
            (
                "/api/v1/analytics/export",
                RateLimitRule("analytics_export", settings.rate_limit_export_per_minute),
            ),
            ("/api/v1/public", RateLimitRule("public_api", settings.rate_limit_public_per_minute)),
        )
        self._default_rule = RateLimitRule("global", settings.rate_limit_global_per_minute)

    @staticmethod
    def _is_exempt(request: Request) -> bool:
        path = request.url.path
        if request.method == "OPTIONS":
            return True
        return path in {"/health", "/ready", "/readyz", "/docs", "/openapi.json", "/redoc"}

    @staticmethod
    def _client_identifier(request: Request) -> str:
        forwarded = request.headers.get("x-forwarded-for")
        if forwarded:
            return forwarded.split(",")[0].strip()
        return request.client.host if request.client else "unknown"

    def _select_rule(self, path: str) -> RateLimitRule:
        for prefix, rule in self._rules:
            if path.startswith(prefix):
                return rule
        return self._default_rule

    async def _memory_increment(self, key: str, window_seconds: int) -> tuple[int, int]:
        now = time.time()
        async with self._memory_lock:
            count, reset_at = self._memory_counters.get(key, (0, now + window_seconds))
            if now >= reset_at:
                count = 0
                reset_at = now + window_seconds
            count += 1
            self._memory_counters[key] = (count, reset_at)

            if len(self._memory_counters) > 20_000:
                self._memory_counters = {
                    k: v for k, v in self._memory_counters.items() if v[1] > now
                }

        retry_after = max(int(reset_at - now), 1)
        return count, retry_after

    async def _redis_increment(
        self, redis_client: Redis, key: str, window_seconds: int
    ) -> tuple[int, int]:
        pipe = redis_client.pipeline()
        pipe.incr(key)
        pipe.ttl(key)
        current_hits, ttl = await pipe.execute()

        if ttl is None or int(ttl) < 0:
            await redis_client.expire(key, window_seconds)
            ttl = window_seconds

        retry_after = max(int(ttl), 1)
        return int(current_hits), retry_after

    async def check(self, request: Request) -> Optional[dict]:
        if not settings.rate_limit_enabled:
            return None
        if self._is_exempt(request):
            return None

        rule = self._select_rule(request.url.path)
        identifier = self._client_identifier(request)
        bucket_key = f"{settings.rate_limit_storage_prefix}:{rule.name}:{identifier}"
        redis_client = getattr(request.app.state, "redis", None)

        try:
            if redis_client is not None:
                hits, retry_after = await self._redis_increment(
                    redis_client, bucket_key, rule.window_seconds
                )
            else:
                hits, retry_after = await self._memory_increment(bucket_key, rule.window_seconds)
        except Exception as exc:
            logger.warning("rate_limit_storage_error", error=str(exc))
            hits, retry_after = await self._memory_increment(bucket_key, rule.window_seconds)

        if hits <= rule.limit:
            return None

        logger.warning(
            "rate_limit_exceeded",
            path=request.url.path,
            method=request.method,
            rule=rule.name,
            limit=rule.limit,
            identifier=identifier,
        )
        return {
            "limit": rule.limit,
            "window_seconds": rule.window_seconds,
            "retry_after_seconds": retry_after,
        }
