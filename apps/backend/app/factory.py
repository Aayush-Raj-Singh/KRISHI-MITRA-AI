from __future__ import annotations

import time
from contextlib import asynccontextmanager
from dataclasses import dataclass
from typing import Iterable, Optional
from uuid import uuid4

from fastapi import APIRouter, FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.core.cache import close_redis, connect_to_redis
from app.core.config import settings
from app.core.database import close_postgres, connect_to_postgres
from app.core.memory_database import get_in_memory_database
from app.core.exception_handlers import register_exception_handlers
from app.core.exceptions import DatabaseConnectionError
from app.core.logging import configure_logging, get_logger
from app.core.rate_limiter import RateLimiter
from app.core.realtime import RealtimeManager
from app.core.scheduler import SchedulerRunner
from app.schemas.response import APIResponse
from app.utils.responses import error_response, success_response

logger = get_logger(__name__)


@dataclass(frozen=True)
class RouterSpec:
    router: APIRouter
    prefix: Optional[str] = None
    tags: Optional[list[str]] = None


def create_app(
    *,
    title: str,
    routers: Iterable[RouterSpec],
    enable_scheduler: bool = False,
    enable_realtime: bool = False,
) -> FastAPI:
    configure_logging(settings.log_level)
    rate_limiter = RateLimiter()
    scheduler = SchedulerRunner() if enable_scheduler else None

    @asynccontextmanager
    async def lifespan(application: FastAPI):
        if settings.jwt_secret_key in {"change-me", "change-me-refresh"} or settings.jwt_refresh_secret_key in {
            "change-me",
            "change-me-refresh",
        }:
            logger.warning("insecure_jwt_secrets_detected", environment=settings.environment)

        try:
            application.state.db = await connect_to_postgres()
        except DatabaseConnectionError:
            if settings.is_production:
                logger.error("startup_failed_db_unavailable", environment=settings.environment)
                raise
            if settings.allow_inmemory_db_fallback and settings.allow_runtime_fallbacks:
                application.state.db = await get_in_memory_database()
                logger.warning(
                    "startup_using_inmemory_database_fallback",
                    environment=settings.environment,
                )
            else:
                application.state.db = None

        application.state.redis = await connect_to_redis()
        if enable_realtime:
            application.state.realtime_manager = RealtimeManager()
        if scheduler is not None:
            await scheduler.start(application)
        logger.info("startup_complete")

        try:
            yield
        finally:
            if scheduler is not None:
                await scheduler.shutdown()
            await close_postgres()
            await close_redis()
            logger.info("shutdown_complete")

    app = FastAPI(title=title, lifespan=lifespan)

    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origin_list,
        allow_credentials=True,
        allow_methods=settings.cors_method_list,
        allow_headers=settings.cors_header_list,
    )

    @app.middleware("http")
    async def enforce_rate_limits(request: Request, call_next):
        violation = await rate_limiter.check(request)
        if violation is not None:
            payload = error_response("Rate limit exceeded", data=violation)
            response = JSONResponse(status_code=429, content=payload.model_dump())
            response.headers["Retry-After"] = str(violation["retry_after_seconds"])
            return response
        return await call_next(request)

    @app.middleware("http")
    async def log_requests(request: Request, call_next):
        request_id = request.headers.get("x-request-id", uuid4().hex)
        start_time = time.perf_counter()
        try:
            response = await call_next(request)
        except RuntimeError as exc:
            if "No response returned" in str(exc):
                logger.exception(
                    "no_response_returned",
                    request_id=request_id,
                    method=request.method,
                    path=request.url.path,
                )
                payload = error_response("Internal server error")
                response = JSONResponse(status_code=500, content=payload.model_dump())
            else:
                raise
        duration_ms = round((time.perf_counter() - start_time) * 1000, 2)
        response.headers["x-request-id"] = request_id
        logger.info(
            "request_complete",
            request_id=request_id,
            method=request.method,
            path=request.url.path,
            status_code=response.status_code,
            duration_ms=duration_ms,
        )
        return response

    @app.middleware("http")
    async def add_security_headers(request: Request, call_next):
        try:
            response = await call_next(request)
        except RuntimeError as exc:
            if "No response returned" in str(exc):
                payload = error_response("Internal server error")
                response = JSONResponse(status_code=500, content=payload.model_dump())
            else:
                raise
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["X-Frame-Options"] = "DENY"
        response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
        response.headers["Permissions-Policy"] = "geolocation=(), microphone=(), camera=()"
        response.headers["Content-Security-Policy"] = "default-src 'self'; frame-ancestors 'none';"
        response.headers["Cross-Origin-Opener-Policy"] = "same-origin"
        response.headers["Cross-Origin-Resource-Policy"] = "same-site"
        if request.url.path.startswith(f"{settings.api_v1_prefix}/auth"):
            response.headers["Cache-Control"] = "no-store"
            response.headers["Pragma"] = "no-cache"
        if settings.is_production:
            response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
        return response

    register_exception_handlers(app)

    @app.get("/health")
    async def health_check() -> APIResponse[dict]:
        return success_response({"status": "ok"}, message="healthy")

    for spec in routers:
        if spec.prefix is None and spec.tags is None:
            app.include_router(spec.router)
        elif spec.tags is None:
            app.include_router(spec.router, prefix=spec.prefix or "")
        else:
            app.include_router(spec.router, prefix=spec.prefix or "", tags=spec.tags)

    return app
