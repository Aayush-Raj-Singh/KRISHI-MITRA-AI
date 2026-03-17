from __future__ import annotations

from fastapi import FastAPI, HTTPException, Request
from fastapi.encoders import jsonable_encoder
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse

from app.core.exceptions import DatabaseConnectionError, ExternalServiceUnavailableError
from app.core.logging import get_logger
from app.utils.responses import error_response

logger = get_logger(__name__)


def register_exception_handlers(app: FastAPI) -> None:
    @app.exception_handler(HTTPException)
    async def http_exception_handler(_: Request, exc: HTTPException) -> JSONResponse:
        payload = error_response(str(exc.detail), data={"detail": exc.detail})
        return JSONResponse(status_code=exc.status_code, content=payload.model_dump())

    @app.exception_handler(RequestValidationError)
    async def validation_exception_handler(_: Request, exc: RequestValidationError) -> JSONResponse:
        safe_errors = jsonable_encoder(exc.errors())
        payload = error_response("Validation error", data={"errors": safe_errors})
        return JSONResponse(status_code=422, content=payload.model_dump())

    @app.exception_handler(DatabaseConnectionError)
    async def database_exception_handler(_: Request, exc: DatabaseConnectionError) -> JSONResponse:
        payload = error_response(str(exc))
        return JSONResponse(status_code=503, content=payload.model_dump())

    @app.exception_handler(ExternalServiceUnavailableError)
    async def external_service_exception_handler(_: Request, exc: ExternalServiceUnavailableError) -> JSONResponse:
        payload = error_response(str(exc))
        return JSONResponse(status_code=503, content=payload.model_dump())

    @app.exception_handler(Exception)
    async def unhandled_exception_handler(_: Request, exc: Exception) -> JSONResponse:
        logger.exception("unhandled_exception", error=str(exc))
        payload = error_response("Internal server error")
        return JSONResponse(status_code=500, content=payload.model_dump())
