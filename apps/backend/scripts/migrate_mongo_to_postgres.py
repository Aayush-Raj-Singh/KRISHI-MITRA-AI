from __future__ import annotations

import argparse
import asyncio
import json
import os
from datetime import date, datetime, timezone
from decimal import Decimal
from typing import Any, Iterable, List, Tuple
from uuid import uuid4

import asyncpg
from app.core.config import settings
from app.core.database import COLLECTIONS
from bson import ObjectId
from pymongo import MongoClient


def _quote_ident(name: str) -> str:
    if not name.replace("_", "").isalnum():
        raise ValueError(f"Unsafe identifier: {name}")
    return f'"{name}"'


def _table_ref(schema: str, name: str) -> str:
    return f"{_quote_ident(schema)}.{_quote_ident(name)}"


def _normalize(value: Any) -> Any:
    if isinstance(value, datetime):
        if value.tzinfo is None:
            value = value.replace(tzinfo=timezone.utc)
        return value.isoformat()
    if isinstance(value, date):
        return value.isoformat()
    if isinstance(value, Decimal):
        return float(value)
    if isinstance(value, ObjectId):
        return str(value)
    if isinstance(value, dict):
        return {key: _normalize(val) for key, val in value.items()}
    if isinstance(value, list):
        return [_normalize(item) for item in value]
    return value


def _iter_batches(
    cursor: Iterable[dict], batch_size: int, limit: int | None
) -> Iterable[List[dict]]:
    batch: List[dict] = []
    count = 0
    for doc in cursor:
        batch.append(doc)
        count += 1
        if limit is not None and count >= limit:
            yield batch
            return
        if len(batch) >= batch_size:
            yield batch
            batch = []
    if batch:
        yield batch


async def _insert_batch(conn: asyncpg.Connection, table: str, batch: List[dict]) -> None:
    records: List[Tuple[str, str]] = []
    for doc in batch:
        raw_id = doc.get("_id")
        doc_id = str(raw_id) if raw_id is not None else uuid4().hex
        payload = dict(doc)
        payload.pop("_id", None)
        normalized = _normalize(payload)
        records.append((doc_id, json.dumps(normalized, default=str)))
    if not records:
        return
    await conn.executemany(
        f"INSERT INTO {table} (id, doc) VALUES ($1, $2::jsonb) "
        f"ON CONFLICT (id) DO UPDATE SET doc = EXCLUDED.doc",
        records,
    )


async def migrate_collection(
    mongo_db,
    pg_pool: asyncpg.Pool,
    schema: str,
    collection: str,
    batch_size: int,
    truncate: bool,
    limit: int | None,
    dry_run: bool,
) -> int:
    table = _table_ref(schema, collection)
    async with pg_pool.acquire() as conn:
        if truncate and not dry_run:
            await conn.execute(f"TRUNCATE TABLE {table}")

    cursor = mongo_db[collection].find({}, no_cursor_timeout=True)
    migrated = 0
    try:
        for batch in _iter_batches(cursor, batch_size, limit):
            if dry_run:
                migrated += len(batch)
                continue
            async with pg_pool.acquire() as conn:
                await _insert_batch(conn, table, batch)
            migrated += len(batch)
    finally:
        cursor.close()
    return migrated


async def run(args: argparse.Namespace) -> None:
    mongo_uri = args.mongo_uri
    mongo_db_name = args.mongo_db
    if not mongo_uri or not mongo_db_name:
        raise ValueError("Mongo URI and DB name are required")

    client = MongoClient(mongo_uri)
    mongo_db = client[mongo_db_name]

    pg_pool = await asyncpg.create_pool(
        dsn=settings.postgres_dsn,
        min_size=settings.postgres_min_pool_size,
        max_size=settings.postgres_max_pool_size,
    )

    collections = args.collections or COLLECTIONS
    total = 0
    try:
        for name in collections:
            count = await migrate_collection(
                mongo_db=mongo_db,
                pg_pool=pg_pool,
                schema=settings.postgres_schema,
                collection=name,
                batch_size=args.batch_size,
                truncate=args.truncate,
                limit=args.limit,
                dry_run=args.dry_run,
            )
            total += count
            print(f"{name}: migrated {count} documents")
    finally:
        await pg_pool.close()
        client.close()

    print(f"Migration complete. Total documents: {total}")


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Migrate MongoDB collections to PostgreSQL JSONB tables."
    )
    parser.add_argument(
        "--mongo-uri",
        default=os.getenv("MONGO_URI") or os.getenv("MONGODB_URI", ""),
        help="MongoDB connection string.",
    )
    parser.add_argument(
        "--mongo-db",
        default=os.getenv("MONGO_DB") or os.getenv("MONGODB_DB", ""),
        help="MongoDB database name.",
    )
    parser.add_argument(
        "--collections", default="", help="Comma-separated collection list (optional)."
    )
    parser.add_argument("--batch-size", type=int, default=500, help="Batch size for inserts.")
    parser.add_argument(
        "--truncate", action="store_true", help="Truncate target tables before inserting."
    )
    parser.add_argument(
        "--limit", type=int, default=None, help="Limit documents per collection (debugging)."
    )
    parser.add_argument("--dry-run", action="store_true", help="Scan documents without inserting.")
    args = parser.parse_args()
    if args.collections:
        args.collections = [item.strip() for item in args.collections.split(",") if item.strip()]
    else:
        args.collections = []
    return args


if __name__ == "__main__":
    asyncio.run(run(parse_args()))
