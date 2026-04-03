from __future__ import annotations

import time
from contextlib import asynccontextmanager
from dataclasses import dataclass
from typing import Iterable, Optional
from uuid import uuid4

from fastapi import APIRouter, FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, PlainTextResponse

from app.core.cache import close_redis, connect_to_redis
from app.core.config import settings
from app.core.database import DB_HEALTH_REQUIRED_TABLES, close_postgres, connect_to_postgres
from app.core.exception_handlers import register_exception_handlers
from app.core.exceptions import DatabaseConnectionError
from app.core.logging import bind_log_context, clear_log_context, configure_logging, get_logger
from app.core.memory_database import get_in_memory_database
from app.core.observability import get_observability
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
        application.state.observability = get_observability(application)
        if settings.jwt_secret_key in {
            "change-me",
            "change-me-refresh",
        } or settings.jwt_refresh_secret_key in {
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
        application.state.started_at = time.time()
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
        allow_credentials=settings.cors_origin_list != ["*"],
        allow_methods=settings.cors_method_list,
        allow_headers=settings.cors_header_list,
    )

    @app.middleware("http")
    async def enforce_rate_limits(request: Request, call_next):
        violation = await rate_limiter.check(request)
        if violation is not None:
            payload = error_response(
                "Rate limit exceeded",
                data={
                    **violation,
                    "request_id": request.headers.get("x-request-id") or uuid4().hex,
                },
            )
            response = JSONResponse(status_code=429, content=payload.model_dump())
            response.headers["Retry-After"] = str(violation["retry_after_seconds"])
            return response
        return await call_next(request)

    @app.middleware("http")
    async def log_requests(request: Request, call_next):
        request_id = request.headers.get("x-request-id", uuid4().hex)
        request.state.request_id = request_id
        clear_log_context()
        bind_log_context(
            request_id=request_id,
            method=request.method,
            path=request.url.path,
            client_ip=request.client.host if request.client else "unknown",
        )
        start_time = time.perf_counter()
        observability = get_observability(request.app)
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
                payload = error_response("Internal server error", data={"request_id": request_id})
                response = JSONResponse(status_code=500, content=payload.model_dump())
                observability.record_exception(kind="RuntimeError", path=request.url.path)
            else:
                raise
        duration_ms = round((time.perf_counter() - start_time) * 1000, 2)
        response.headers["x-request-id"] = request_id
        response.headers["x-process-time-ms"] = str(duration_ms)
        route = request.scope.get("route")
        route_path = getattr(route, "path", request.url.path)
        observability.observe_request(
            method=request.method,
            path=route_path,
            status_code=response.status_code,
            duration_ms=duration_ms,
        )
        logger.info(
            "request_complete",
            request_id=request_id,
            method=request.method,
            path=route_path,
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
        response.headers["Permissions-Policy"] = "geolocation=(self), microphone=(), camera=(self)"
        response.headers["Content-Security-Policy"] = (
            "default-src 'self'; base-uri 'self'; object-src 'none'; frame-ancestors 'none';"
        )
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
        uptime_seconds = round(
            max(time.time() - getattr(app.state, "started_at", time.time()), 0.0), 2
        )
        return success_response(
            {
                "status": "ok",
                "environment": settings.environment,
                "version": "runtime",
                "uptime_seconds": uptime_seconds,
            },
            message="healthy",
        )

    @app.get("/ready")
    @app.get("/readyz")
    async def readiness_check(request: Request):
        db_connected = getattr(request.app.state, "db", None) is not None
        redis_required = bool(settings.redis_url)
        redis_connected = getattr(request.app.state, "redis", None) is not None
        ready = db_connected and (redis_connected or not redis_required)
        if ready:
            return success_response(
                {
                    "status": "ready",
                    "database_connected": db_connected,
                    "redis_connected": redis_connected,
                    "redis_required": redis_required,
                },
                message="ready",
            )
        payload = error_response(
            "not ready",
            data={
                "status": "degraded",
                "database_connected": db_connected,
                "redis_connected": redis_connected,
                "redis_required": redis_required,
            },
        )
        return JSONResponse(status_code=503, content=payload.model_dump())

    @app.get("/health/db")
    async def database_health_check(request: Request):
        db = getattr(request.app.state, "db", None)
        if db is None:
            payload = error_response(
                "database unavailable",
                data={
                    "status": "error",
                    "required_tables": {table: False for table in DB_HEALTH_REQUIRED_TABLES},
                },
            )
            return JSONResponse(status_code=503, content=payload.model_dump())

        try:
            health = await db.health_status(DB_HEALTH_REQUIRED_TABLES)
        except Exception as exc:
            logger.exception("database_health_check_failed", error=str(exc))
            payload = error_response(
                "database unavailable",
                data={
                    "status": "error",
                    "error": str(exc),
                    "required_tables": {table: False for table in DB_HEALTH_REQUIRED_TABLES},
                },
            )
            return JSONResponse(status_code=503, content=payload.model_dump())

        return success_response(health, message="database healthy")

    @app.get("/metrics", include_in_schema=False)
    async def metrics(request: Request):
        if not settings.metrics_enabled:
            payload = error_response("Metrics disabled")
            return JSONResponse(status_code=404, content=payload.model_dump())
        if settings.metrics_api_key:
            provided = request.headers.get("x-metrics-key")
            if provided != settings.metrics_api_key:
                payload = error_response("Invalid metrics key")
                return JSONResponse(status_code=401, content=payload.model_dump())

        observability = get_observability(request.app)
        body = observability.render_prometheus(
            db_connected=getattr(request.app.state, "db", None) is not None,
            redis_connected=getattr(request.app.state, "redis", None) is not None,
        )
        return PlainTextResponse(body, media_type="text/plain; version=0.0.4; charset=utf-8")

    for spec in routers:
        if spec.prefix is None and spec.tags is None:
            app.include_router(spec.router)
        elif spec.tags is None:
            app.include_router(spec.router, prefix=spec.prefix or "")
        else:
            app.include_router(spec.router, prefix=spec.prefix or "", tags=spec.tags)

    return app
