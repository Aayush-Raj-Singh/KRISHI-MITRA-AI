from __future__ import annotations

from typing import Optional

from motor.motor_asyncio import AsyncIOMotorClient, AsyncIOMotorDatabase
from pymongo import ASCENDING

from app.core.config import settings
from app.core.exceptions import DatabaseConnectionError
from app.core.logging import get_logger

logger = get_logger(__name__)

_client: Optional[AsyncIOMotorClient] = None


def get_client() -> AsyncIOMotorClient:
    if _client is None:
        raise RuntimeError("Mongo client is not initialized")
    return _client


async def connect_to_mongo() -> AsyncIOMotorDatabase:
    global _client
    try:
        _client = AsyncIOMotorClient(
            settings.mongodb_uri,
            serverSelectionTimeoutMS=settings.mongodb_server_selection_timeout_ms,
        )
        db = _client[settings.mongodb_db]
        await db.command("ping")
        await _ensure_indexes(db)
        return db
    except Exception as exc:  # noqa: BLE001
        _client = None
        logger.error("mongo_connection_failed", error=str(exc))
        raise DatabaseConnectionError("Failed to connect to MongoDB") from exc


async def close_mongo() -> None:
    global _client
    if _client is not None:
        _client.close()
        _client = None


def get_db(db: AsyncIOMotorDatabase) -> AsyncIOMotorDatabase:
    return db


async def _ensure_indexes(db: AsyncIOMotorDatabase) -> None:
    await db["users"].create_index([("phone", ASCENDING)], unique=True)
    await db["recommendations"].create_index([("user_id", ASCENDING), ("created_at", ASCENDING)])
    await db["feedback"].create_index([("user_id", ASCENDING), ("created_at", ASCENDING)])
    await db["integration_audit"].create_index([("created_at", ASCENDING)])
