from __future__ import annotations

import json
from uuid import uuid4

import asyncpg
from app.core.config import settings
from app.core.security import get_password_hash
from app.models.user import default_user_document


async def seed_user(
    *,
    payload: dict,
    dsn: str | None = None,
    schema: str | None = None,
) -> str:
    document = default_user_document(
        {
            **payload,
            "hashed_password": get_password_hash(payload["password"]),
        }
    )
    dsn = dsn or settings.postgres_dsn
    schema = schema or settings.postgres_schema
    user_id = uuid4().hex
    conn = await asyncpg.connect(dsn)
    try:
        await conn.execute(
            f'INSERT INTO "{schema}"."users" (id, doc) VALUES ($1, $2::jsonb)',
            user_id,
            json.dumps(document, default=str),
        )
    finally:
        await conn.close()
    return user_id
