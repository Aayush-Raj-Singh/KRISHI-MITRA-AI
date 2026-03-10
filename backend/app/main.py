from __future__ import annotations

import time
from uuid import uuid4
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.api.api_v1 import api_router
from app.core.cache import close_redis, connect_to_redis
from app.core.config import settings
from app.core.database import close_mongo, connect_to_mongo
from app.core.exceptions import DatabaseConnectionError
from app.core.exception_handlers import register_exception_handlers
from app.core.logging import configure_logging, get_logger
from app.core.rate_limiter import RateLimiter
from app.core.realtime import RealtimeManager
from app.core.scheduler import SchedulerRunner
from app.schemas.response import APIResponse
from app.utils.responses import error_response, success_response

configure_logging(settings.log_level)
logger = get_logger(__name__)
rate_limiter = RateLimiter()
_scheduler = SchedulerRunner()


@asynccontextmanager
async def lifespan(application: FastAPI):
    if settings.jwt_secret_key in {"change-me", "change-me-refresh"} or settings.jwt_refresh_secret_key in {
        "change-me",
        "change-me-refresh",
    }:
        logger.warning("insecure_jwt_secrets_detected", environment=settings.environment)

    try:
        application.state.db = await connect_to_mongo()
    except DatabaseConnectionError:
        if settings.is_production:
            logger.error("startup_failed_db_unavailable", environment=settings.environment)
            raise
        application.state.db = None

    application.state.redis = await connect_to_redis()
    application.state.realtime_manager = RealtimeManager()
    await _scheduler.start(application)
    logger.info("startup_complete")

    try:
        yield
    finally:
        await _scheduler.shutdown()
        await close_mongo()
        await close_redis()
        logger.info("shutdown_complete")


app = FastAPI(title=settings.project_name, lifespan=lifespan)

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
    response = await call_next(request)
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


register_exception_handlers(app)


@app.get("/health")
async def health_check() -> APIResponse[dict]:
    return success_response({"status": "ok"}, message="healthy")


app.include_router(api_router)
