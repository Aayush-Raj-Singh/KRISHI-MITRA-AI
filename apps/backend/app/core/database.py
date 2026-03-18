from __future__ import annotations

import asyncio
import json
import re
from dataclasses import dataclass
from datetime import date, datetime, timezone
from decimal import Decimal
from typing import Any, Dict, Iterable, List, Optional, Sequence, Tuple
from uuid import UUID, uuid4

import asyncpg

from app.core.config import settings
from app.core.exceptions import DatabaseConnectionError
from app.core.logging import get_logger

logger = get_logger(__name__)

_pool: Optional[asyncpg.Pool] = None

COLLECTIONS = [
    "advisory_telemetry",
    "audit_logs",
    "commodities",
    "conversations",
    "data_quality_issues",
    "disease_history",
    "expert_review_queue",
    "external_links",
    "faqs",
    "feedback",
    "grades",
    "integration_audit",
    "mandi_entries",
    "market_profiles",
    "mfa_challenges",
    "model_events",
    "msp_rates",
    "operations_runs",
    "outcomes",
    "password_resets",
    "price_accuracy",
    "price_actuals",
    "quick_feedback",
    "recommendations",
    "refresh_tokens",
    "seasons",
    "tickets",
    "units",
    "users",
    "varieties",
]

DB_HEALTH_REQUIRED_TABLES = ("users", "recommendations", "feedback", "conversations", "outcomes")

DATE_FIELDS = {
    "created_at",
    "updated_at",
    "arrival_date",
    "next_run_at",
    "last_run_at",
    "triggered_at",
    "ts",
    "checked_at",
    "detected_at",
    "expires_at",
    "forecast_created_at",
    "actuals_from",
    "actuals_to",
    "fetched_at",
    "last_failed_login_at",
    "lockout_until",
    "last_login",
    "generated_date",
    "revoked_at",
    "used_at",
}

DATE_ONLY_FIELDS = {
    "arrival_date",
    "actuals_from",
    "actuals_to",
}

NUMERIC_FIELDS = {
    "order",
    "farm_size",
    "modal_price",
    "min_price",
    "max_price",
    "arrivals_qtl",
    "coverage_pct",
    "mape",
    "mae",
    "points",
    "horizon_days",
    "ts_epoch",
}


def _quote_ident(name: str) -> str:
    if not re.match(r"^[A-Za-z_][A-Za-z0-9_]*$", name):
        raise ValueError(f"Unsafe identifier: {name}")
    return f'"{name}"'


def _table_ref(schema: str, name: str) -> str:
    return f"{_quote_ident(schema)}.{_quote_ident(name)}"


def _json_path(key: str) -> str:
    parts = key.split(".")
    path = ",".join(parts)
    return f"{{{path}}}"


def _json_text_expr(key: str) -> str:
    return f"doc #>> '{_json_path(key)}'"


def _json_value_expr(key: str) -> str:
    return f"doc #> '{_json_path(key)}'"


def _cast_expr(expr: str, cast_type: str) -> str:
    return f"NULLIF({expr}, '')::{cast_type}"


def _normalize_value(value: Any) -> Any:
    if isinstance(value, datetime):
        if value.tzinfo is None:
            value = value.replace(tzinfo=timezone.utc)
        return value.isoformat()
    if isinstance(value, date):
        return value.isoformat()
    if isinstance(value, Decimal):
        return float(value)
    if isinstance(value, UUID):
        return str(value)
    return value


def _normalize_document(document: Any) -> Any:
    if isinstance(document, dict):
        return {key: _normalize_document(_normalize_value(val)) for key, val in document.items()}
    if isinstance(document, list):
        return [_normalize_document(_normalize_value(item)) for item in document]
    return _normalize_value(document)


def _coerce_doc(raw: Any) -> dict:
    if raw is None:
        return {}
    if isinstance(raw, dict):
        return raw
    if isinstance(raw, str):
        try:
            parsed = json.loads(raw)
        except json.JSONDecodeError:
            return {}
        return parsed if isinstance(parsed, dict) else {"value": parsed}
    if isinstance(raw, list):
        if all(isinstance(item, (list, tuple)) and len(item) == 2 for item in raw):
            try:
                return dict(raw)
            except Exception:
                return {}
        return {"value": raw}
    if hasattr(raw, "items"):
        try:
            return dict(raw.items())
        except Exception:
            return {}
    try:
        return dict(raw)
    except Exception:
        return {}


def _set_nested(document: dict, path: str, value: Any) -> None:
    parts = path.split(".")
    cursor = document
    for key in parts[:-1]:
        if not isinstance(cursor.get(key), dict):
            cursor[key] = {}
        cursor = cursor[key]
    cursor[parts[-1]] = value


def _push_nested(document: dict, path: str, value: Any) -> None:
    parts = path.split(".")
    cursor = document
    for key in parts[:-1]:
        if not isinstance(cursor.get(key), dict):
            cursor[key] = {}
        cursor = cursor[key]
    key = parts[-1]
    if not isinstance(cursor.get(key), list):
        cursor[key] = []
    cursor[key].append(value)


def _get_nested(document: dict, path: str) -> Any:
    cursor: Any = document
    for key in path.split("."):
        if not isinstance(cursor, dict):
            return None
        cursor = cursor.get(key)
    return cursor


def _apply_update(document: dict, update: dict, is_insert: bool) -> dict:
    updated = dict(document)
    set_payload = update.get("$set", {})
    for key, value in set_payload.items():
        _set_nested(updated, key, value)
    if is_insert:
        set_on_insert = update.get("$setOnInsert", {})
        for key, value in set_on_insert.items():
            _set_nested(updated, key, value)
    push_payload = update.get("$push", {})
    for key, value in push_payload.items():
        _push_nested(updated, key, value)
    return updated


def _extract_upsert_base(filter_spec: dict) -> dict:
    payload: dict = {}
    for key, value in filter_spec.items():
        if key == "$or":
            continue
        if isinstance(value, dict) and any(k.startswith("$") for k in value.keys()):
            continue
        _set_nested(payload, key, value)
    return payload


def _is_operator_dict(value: Any) -> bool:
    return isinstance(value, dict) and any(key.startswith("$") for key in value.keys())


def _normalize_query_value(value: Any) -> Any:
    if isinstance(value, (datetime, date, UUID)):
        return _normalize_value(value)
    if isinstance(value, Decimal):
        return float(value)
    return value


def _build_where(filter_spec: dict, params: list) -> str:
    if not filter_spec:
        return "TRUE"
    clauses: List[str] = []
    for key, value in filter_spec.items():
        if key == "$or":
            or_clauses = []
            for item in value or []:
                or_clause = _build_where(item, params)
                or_clauses.append(f"({or_clause})")
            if or_clauses:
                clauses.append("(" + " OR ".join(or_clauses) + ")")
            continue
        clause = _build_field_clause(key, value, params)
        clauses.append(clause)
    return " AND ".join(clauses) if clauses else "TRUE"


def _build_field_clause(key: str, value: Any, params: list) -> str:
    if key == "_id":
        field_expr = "id"
    else:
        field_expr = _json_text_expr(key)
    json_value_expr = _json_value_expr(key)

    if _is_operator_dict(value):
        sub_clauses: List[str] = []
        if "$regex" in value:
            pattern = value.get("$regex", "")
            options = value.get("$options", "")
            operator = "~*" if "i" in str(options).lower() else "~"
            params.append(pattern)
            sub_clauses.append(f"{field_expr} {operator} ${len(params)}")
        if "$in" in value:
            raw_values = value.get("$in") or []
            normalized = [_normalize_query_value(item) for item in raw_values]
            params.append(normalized)
            placeholder = f"${len(params)}"
            if key == "_id":
                sub_clauses.append(f"id = ANY({placeholder}::text[])")
            else:
                sub_clauses.append(
                    f"({field_expr} = ANY({placeholder}::text[]) OR "
                    f"(jsonb_typeof({json_value_expr}) = 'array' AND {json_value_expr} ?| {placeholder}::text[]))"
                )
        for operator_key, sql_op in (("$gte", ">="), ("$lte", "<="), ("$gt", ">"), ("$lt", "<")):
            if operator_key in value:
                raw = value.get(operator_key)
                params.append(raw)
                placeholder = f"${len(params)}"
                if isinstance(raw, datetime):
                    expr = _cast_expr(field_expr, "timestamptz")
                elif isinstance(raw, date):
                    expr = _cast_expr(field_expr, "date")
                elif isinstance(raw, (int, float, Decimal)):
                    expr = _cast_expr(field_expr, "double precision")
                else:
                    expr = field_expr
                sub_clauses.append(f"{expr} {sql_op} {placeholder}")
        if not sub_clauses:
            params.append(_normalize_query_value(value))
            return f"{field_expr} = ${len(params)}"
        return " AND ".join(sub_clauses)

    params.append(_normalize_query_value(value))
    placeholder = f"${len(params)}"
    if isinstance(value, datetime):
        expr = _cast_expr(field_expr, "timestamptz")
        return f"{expr} = {placeholder}"
    if isinstance(value, date):
        expr = _cast_expr(field_expr, "date")
        return f"{expr} = {placeholder}"
    if isinstance(value, bool):
        expr = _cast_expr(field_expr, "boolean")
        return f"{expr} = {placeholder}"
    if isinstance(value, (int, float, Decimal)):
        expr = _cast_expr(field_expr, "double precision")
        return f"{expr} = {placeholder}"
    return f"{field_expr} = {placeholder}"


def _projection_fields(projection: Optional[dict]) -> Optional[set]:
    if not projection:
        return None
    return {key for key, value in projection.items() if value}


def _apply_projection(doc: dict, projection: Optional[dict]) -> dict:
    if not projection:
        return doc
    fields = _projection_fields(projection)
    if not fields:
        return {"_id": doc.get("_id")}
    projected = {key: doc.get(key) for key in fields if key in doc}
    projected["_id"] = doc.get("_id")
    return projected


def _coerce_datetime(value: Any) -> Optional[datetime]:
    if isinstance(value, datetime):
        return value
    if isinstance(value, date):
        return datetime.combine(value, datetime.min.time(), tzinfo=timezone.utc)
    if isinstance(value, str):
        try:
            return datetime.fromisoformat(value)
        except ValueError:
            try:
                return datetime.fromisoformat(value.replace("Z", "+00:00"))
            except ValueError:
                return None
    return None


def _hydrate_document(document: dict) -> dict:
    for key in list(document.keys()):
        if key in DATE_FIELDS:
            dt = _coerce_datetime(document.get(key))
            if dt is None:
                continue
            if key in DATE_ONLY_FIELDS:
                document[key] = dt.date()
            else:
                document[key] = dt
    return document


def _match_doc(document: dict, filter_spec: dict) -> bool:
    if not filter_spec:
        return True
    for key, value in filter_spec.items():
        if key == "$or":
            if not any(_match_doc(document, item) for item in value or []):
                return False
            continue
        doc_value = document.get("_id") if key == "_id" else _get_nested(document, key)
        if _is_operator_dict(value):
            if "$in" in value:
                values = value.get("$in") or []
                if isinstance(doc_value, list):
                    if not any(item in values for item in doc_value):
                        return False
                elif doc_value not in values:
                    return False
            if "$regex" in value:
                pattern = value.get("$regex", "")
                options = value.get("$options", "")
                flags = re.IGNORECASE if "i" in str(options).lower() else 0
                if doc_value is None or re.search(pattern, str(doc_value), flags) is None:
                    return False
            for operator_key, compare in (("$gte", ">="), ("$lte", "<="), ("$gt", ">"), ("$lt", "<")):
                if operator_key in value:
                    threshold = value.get(operator_key)
                    left = doc_value
                    if isinstance(threshold, (datetime, date)):
                        left = _coerce_datetime(doc_value)
                        if isinstance(threshold, date) and not isinstance(threshold, datetime):
                            threshold = datetime.combine(threshold, datetime.min.time(), tzinfo=timezone.utc)
                    if left is None:
                        return False
                    if compare == ">=" and not (left >= threshold):
                        return False
                    if compare == "<=" and not (left <= threshold):
                        return False
                    if compare == ">" and not (left > threshold):
                        return False
                    if compare == "<" and not (left < threshold):
                        return False
            continue
        if doc_value != value:
            return False
    return True


@dataclass
class InsertOneResult:
    inserted_id: Any


@dataclass
class InsertManyResult:
    inserted_ids: List[Any]


@dataclass
class UpdateResult:
    matched_count: int
    modified_count: int
    upserted_id: Any | None = None


class Database:
    def __init__(self, pool: asyncpg.Pool, schema: str) -> None:
        self._pool = pool
        self._schema = schema

    def __getitem__(self, name: str) -> "Collection":
        return Collection(self._pool, self._schema, name)

    @property
    def pool(self) -> asyncpg.Pool:
        return self._pool

    @property
    def schema(self) -> str:
        return self._schema

    async def health_status(self, required_tables: Sequence[str] = DB_HEALTH_REQUIRED_TABLES) -> dict:
        async with self._pool.acquire() as conn:
            summary = await conn.fetchrow(
                """
                SELECT
                    current_database() AS database_name,
                    current_schema() AS current_schema,
                    NOW() AT TIME ZONE 'UTC' AS checked_at
                """
            )
            rows = await conn.fetch(
                """
                SELECT table_name
                FROM information_schema.tables
                WHERE table_schema = $1 AND table_type = 'BASE TABLE'
                ORDER BY table_name
                """,
                self._schema,
            )

        existing_tables = [str(row["table_name"]) for row in rows]
        return {
            "status": "ok",
            "database": str(summary["database_name"]),
            "schema": self._schema,
            "checked_at": summary["checked_at"].isoformat() if summary["checked_at"] else None,
            "pool": {
                "min_size": settings.postgres_min_pool_size,
                "max_size": settings.postgres_max_pool_size,
            },
            "tables": existing_tables,
            "required_tables": {table: table in existing_tables for table in required_tables},
        }


class Cursor:
    def __init__(self, collection: "Collection", filter_spec: dict, projection: Optional[dict]) -> None:
        self._collection = collection
        self._filter = filter_spec
        self._projection = projection
        self._sort: List[Tuple[str, int]] = []
        self._limit: Optional[int] = None
        self._skip: int = 0

    def sort(self, key: str | Sequence[Tuple[str, int]], direction: Optional[int] = None) -> "Cursor":
        if isinstance(key, str):
            self._sort = [(key, direction or 1)]
        else:
            self._sort = list(key)
        return self

    def limit(self, limit: int) -> "Cursor":
        self._limit = limit
        return self

    def skip(self, skip: int) -> "Cursor":
        self._skip = skip
        return self

    async def to_list(self, length: Optional[int] = None) -> List[dict]:
        effective_limit = self._limit
        if length is not None:
            effective_limit = length if effective_limit is None else min(effective_limit, length)
        return await self._collection._find_documents(
            self._filter,
            projection=self._projection,
            sort=self._sort,
            limit=effective_limit,
            skip=self._skip,
        )

    def __aiter__(self):
        async def _generator():
            items = await self.to_list(length=None)
            for item in items:
                yield item

        return _generator()


class AggregateCursor:
    def __init__(self, collection: "Collection", pipeline: list) -> None:
        self._collection = collection
        self._pipeline = pipeline
        self._cache: Optional[List[dict]] = None

    async def _ensure(self) -> None:
        if self._cache is None:
            self._cache = await self._collection._aggregate(self._pipeline)

    async def to_list(self, length: Optional[int] = None) -> List[dict]:
        await self._ensure()
        if self._cache is None:
            return []
        if length is None:
            return list(self._cache)
        return list(self._cache[:length])

    def __aiter__(self):
        async def _generator():
            await self._ensure()
            for item in self._cache or []:
                yield item

        return _generator()


class Collection:
    def __init__(self, pool: asyncpg.Pool, schema: str, name: str) -> None:
        self._pool = pool
        self._schema = schema
        self._name = name
        self._table = _table_ref(schema, name)

    def find(self, filter_spec: Optional[dict] = None, projection: Optional[dict] = None) -> Cursor:
        return Cursor(self, filter_spec or {}, projection)

    async def find_one(
        self,
        filter_spec: Optional[dict] = None,
        projection: Optional[dict] = None,
        sort: Optional[Sequence[Tuple[str, int]]] = None,
    ) -> Optional[dict]:
        cursor = self.find(filter_spec or {}, projection)
        if sort:
            cursor.sort(sort)
        cursor.limit(1)
        items = await cursor.to_list(length=1)
        return items[0] if items else None

    async def insert_one(self, document: dict) -> InsertOneResult:
        if not isinstance(document, dict) or not document:
            raise ValueError("Invalid document for insert_one")
        normalized = _normalize_document(document)
        raw_id = normalized.pop("_id", None)
        doc_id = str(raw_id) if raw_id else uuid4().hex
        payload = json.dumps(normalized, default=_normalize_value)
        async with self._pool.acquire() as conn:
            await conn.execute(
                f"INSERT INTO {self._table} (id, doc) VALUES ($1, $2::jsonb)",
                doc_id,
                payload,
            )
        return InsertOneResult(doc_id)

    async def insert_many(self, documents: Iterable[dict]) -> InsertManyResult:
        ids: List[str] = []
        records: List[Tuple[str, str]] = []
        for doc in documents:
            if not isinstance(doc, dict) or not doc:
                continue
            normalized = _normalize_document(doc)
            raw_id = normalized.pop("_id", None)
            doc_id = str(raw_id) if raw_id else uuid4().hex
            payload = json.dumps(normalized, default=_normalize_value)
            ids.append(doc_id)
            records.append((doc_id, payload))
        if not records:
            return InsertManyResult([])
        async with self._pool.acquire() as conn:
            await conn.executemany(
                f"INSERT INTO {self._table} (id, doc) VALUES ($1, $2::jsonb)",
                records,
            )
        return InsertManyResult(ids)

    async def update_one(self, filter_spec: dict, update: dict, upsert: bool = False) -> UpdateResult:
        params: List[Any] = []
        where_clause = _build_where(filter_spec, params)
        async with self._pool.acquire() as conn:
            row = await conn.fetchrow(
                f"SELECT id, doc FROM {self._table} WHERE {where_clause} LIMIT 1",
                *params,
            )
            if not row:
                if not upsert:
                    return UpdateResult(matched_count=0, modified_count=0, upserted_id=None)
                base_doc = _extract_upsert_base(filter_spec)
                base_doc = _apply_update(base_doc, update, is_insert=True)
                insert_result = await self.insert_one(base_doc)
                return UpdateResult(matched_count=0, modified_count=0, upserted_id=insert_result.inserted_id)

            doc_id = row["id"]
            existing = _coerce_doc(row["doc"])
            updated = _apply_update(existing, update, is_insert=False)
            if updated == existing:
                return UpdateResult(matched_count=1, modified_count=0, upserted_id=None)
            payload = json.dumps(_normalize_document(updated), default=_normalize_value)
            await conn.execute(
                f"UPDATE {self._table} SET doc = $2::jsonb WHERE id = $1",
                doc_id,
                payload,
            )
            return UpdateResult(matched_count=1, modified_count=1, upserted_id=None)

    async def update_many(self, filter_spec: dict, update: dict, upsert: bool = False) -> UpdateResult:
        params: List[Any] = []
        where_clause = _build_where(filter_spec, params)
        async with self._pool.acquire() as conn:
            rows = await conn.fetch(
                f"SELECT id, doc FROM {self._table} WHERE {where_clause}",
                *params,
            )
            if not rows:
                if not upsert:
                    return UpdateResult(matched_count=0, modified_count=0, upserted_id=None)
                base_doc = _extract_upsert_base(filter_spec)
                base_doc = _apply_update(base_doc, update, is_insert=True)
                insert_result = await self.insert_one(base_doc)
                return UpdateResult(matched_count=0, modified_count=0, upserted_id=insert_result.inserted_id)
            modified = 0
            for row in rows:
                doc_id = row["id"]
                existing = _coerce_doc(row["doc"])
                updated = _apply_update(existing, update, is_insert=False)
                if updated == existing:
                    continue
                payload = json.dumps(_normalize_document(updated), default=_normalize_value)
                await conn.execute(
                    f"UPDATE {self._table} SET doc = $2::jsonb WHERE id = $1",
                    doc_id,
                    payload,
                )
                modified += 1
            return UpdateResult(matched_count=len(rows), modified_count=modified, upserted_id=None)

    async def count_documents(self, filter_spec: dict) -> int:
        params: List[Any] = []
        where_clause = _build_where(filter_spec, params)
        async with self._pool.acquire() as conn:
            value = await conn.fetchval(f"SELECT COUNT(*) FROM {self._table} WHERE {where_clause}", *params)
            return int(value or 0)

    def aggregate(self, pipeline: list) -> AggregateCursor:
        return AggregateCursor(self, pipeline)

    async def _find_documents(
        self,
        filter_spec: dict,
        projection: Optional[dict],
        sort: Sequence[Tuple[str, int]] | None,
        limit: Optional[int],
        skip: int,
    ) -> List[dict]:
        params: List[Any] = []
        where_clause = _build_where(filter_spec, params)
        order_by = ""
        if sort:
            pieces = []
            for field, direction in sort:
                direction_sql = "DESC" if (direction or 1) < 0 else "ASC"
                if field == "_id":
                    expr = "id"
                else:
                    expr = _json_text_expr(field)
                    if field in DATE_FIELDS:
                        expr = _cast_expr(expr, "timestamptz")
                    elif field in NUMERIC_FIELDS:
                        expr = _cast_expr(expr, "double precision")
                pieces.append(f"{expr} {direction_sql}")
            order_by = " ORDER BY " + ", ".join(pieces)
        limit_clause = f" LIMIT {int(limit)}" if limit is not None else ""
        offset_clause = f" OFFSET {int(skip)}" if skip else ""
        sql = f"SELECT id, doc FROM {self._table} WHERE {where_clause}{order_by}{limit_clause}{offset_clause}"
        async with self._pool.acquire() as conn:
            rows = await conn.fetch(sql, *params)
        items = []
        for row in rows:
            doc = _coerce_doc(row["doc"])
            doc["_id"] = str(row["id"])
            items.append(_apply_projection(_hydrate_document(doc), projection))
        return items

    async def _aggregate(self, pipeline: list) -> List[dict]:
        docs: List[dict]
        remaining = list(pipeline or [])
        if remaining and "$match" in remaining[0]:
            docs = await self.find(remaining[0]["$match"]).to_list(length=None)
            remaining = remaining[1:]
        else:
            docs = await self.find({}).to_list(length=None)

        for stage in remaining:
            if "$match" in stage:
                docs = [doc for doc in docs if _match_doc(doc, stage["$match"])]
            elif "$addFields" in stage:
                updates = stage["$addFields"]
                new_docs = []
                for doc in docs:
                    updated = dict(doc)
                    for key, spec in updates.items():
                        if isinstance(spec, dict) and "$toDate" in spec:
                            raw = spec["$toDate"]
                            if isinstance(raw, str) and raw.startswith("$"):
                                value = _get_nested(updated, raw[1:])
                            else:
                                value = raw
                            updated[key] = _coerce_datetime(value)
                        else:
                            updated[key] = spec
                    new_docs.append(updated)
                docs = new_docs
            elif "$group" in stage:
                group_spec = stage["$group"]
                key_spec = group_spec.get("_id")
                groups: Dict[Any, dict] = {}
                sums: Dict[tuple, float] = {}
                counts: Dict[tuple, int] = {}
                for doc in docs:
                    group_key = None
                    if isinstance(key_spec, dict) and "$dateToString" in key_spec:
                        date_spec = key_spec["$dateToString"]
                        date_value = date_spec.get("date")
                        if isinstance(date_value, str) and date_value.startswith("$"):
                            raw = _get_nested(doc, date_value[1:])
                        else:
                            raw = date_value
                        dt = _coerce_datetime(raw)
                        fmt = date_spec.get("format", "%Y-%m-%d")
                        group_key = dt.strftime(fmt) if dt else None
                    elif isinstance(key_spec, str) and key_spec.startswith("$"):
                        group_key = _get_nested(doc, key_spec[1:])
                    else:
                        group_key = key_spec

                    if group_key not in groups:
                        groups[group_key] = {"_id": group_key}
                    for field, expr in group_spec.items():
                        if field == "_id":
                            continue
                        if isinstance(expr, dict) and "$avg" in expr:
                            source = expr["$avg"]
                            value = _get_nested(doc, source[1:]) if isinstance(source, str) and source.startswith("$") else source
                            if value is None:
                                continue
                            key = (group_key, field)
                            sums[key] = sums.get(key, 0.0) + float(value)
                            counts[key] = counts.get(key, 0) + 1
                        elif isinstance(expr, dict) and "$sum" in expr:
                            source = expr["$sum"]
                            if source == 1:
                                groups[group_key][field] = groups[group_key].get(field, 0) + 1
                            else:
                                value = _get_nested(doc, source[1:]) if isinstance(source, str) and source.startswith("$") else source
                                if value is None:
                                    continue
                                groups[group_key][field] = groups[group_key].get(field, 0) + float(value)
                        elif isinstance(expr, dict) and "$min" in expr:
                            source = expr["$min"]
                            value = _get_nested(doc, source[1:]) if isinstance(source, str) and source.startswith("$") else source
                            if value is None:
                                continue
                            current = groups[group_key].get(field)
                            groups[group_key][field] = value if current is None else min(current, value)
                        elif isinstance(expr, dict) and "$max" in expr:
                            source = expr["$max"]
                            value = _get_nested(doc, source[1:]) if isinstance(source, str) and source.startswith("$") else source
                            if value is None:
                                continue
                            current = groups[group_key].get(field)
                            groups[group_key][field] = value if current is None else max(current, value)
                for key, total in sums.items():
                    group_key, field = key
                    count = counts.get(key, 0)
                    if count:
                        groups[group_key][field] = round(total / count, 3)
                docs = list(groups.values())
            elif "$sort" in stage:
                sort_spec = stage["$sort"]
                for field, direction in reversed(list(sort_spec.items())):
                    reverse = (direction or 1) < 0
                    docs.sort(key=lambda item: item.get(field), reverse=reverse)
        return docs


async def connect_to_postgres() -> Database:
    global _pool
    if _pool is not None:
        return Database(_pool, settings.postgres_schema)

    dsn = settings.postgres_dsn.strip()
    if not dsn:
        raise DatabaseConnectionError("DATABASE_URL is not configured")

    last_error: Exception | None = None
    for attempt in range(1, settings.db_connect_max_attempts + 1):
        try:
            _pool = await asyncpg.create_pool(
                dsn=dsn,
                min_size=settings.postgres_min_pool_size,
                max_size=settings.postgres_max_pool_size,
                command_timeout=30,
                max_inactive_connection_lifetime=300,
                server_settings={"application_name": "krishimitra-backend"},
            )
            async with _pool.acquire() as conn:
                await conn.execute("SELECT 1")
            await _ensure_schema(_pool)
            if attempt > 1:
                logger.info("postgres_connection_recovered", attempt=attempt)
            return Database(_pool, settings.postgres_schema)
        except Exception as exc:
            last_error = exc
            if _pool is not None:
                await _pool.close()
                _pool = None
            logger.warning(
                "postgres_connection_attempt_failed",
                attempt=attempt,
                max_attempts=settings.db_connect_max_attempts,
                error=str(exc),
            )
            if attempt < settings.db_connect_max_attempts:
                await asyncio.sleep(settings.db_connect_retry_delay_seconds * attempt)

    logger.error("postgres_connection_failed", error=str(last_error) if last_error else "unknown")
    raise DatabaseConnectionError("Failed to connect to PostgreSQL after retries") from last_error


async def close_postgres() -> None:
    global _pool
    if _pool is not None:
        await _pool.close()
        _pool = None


def get_db(db: Database) -> Database:
    return db


async def _ensure_schema(pool: asyncpg.Pool) -> None:
    schema = settings.postgres_schema
    async with pool.acquire() as conn:
        await conn.execute(f"CREATE SCHEMA IF NOT EXISTS {_quote_ident(schema)}")
        for name in COLLECTIONS:
            table = _table_ref(schema, name)
            await conn.execute(
                f"CREATE TABLE IF NOT EXISTS {table} (id TEXT PRIMARY KEY, doc JSONB NOT NULL)"
            )
            await conn.execute(
                f"CREATE INDEX IF NOT EXISTS {name}_doc_gin ON {table} USING GIN (doc)"
            )
        await conn.execute(
            f"CREATE UNIQUE INDEX IF NOT EXISTS users_phone_unique ON {_table_ref(schema, 'users')} ((doc->>'phone'))"
        )
        await conn.execute(
            f"CREATE UNIQUE INDEX IF NOT EXISTS price_actuals_unique ON {_table_ref(schema, 'price_actuals')} "
            f"((doc->>'crop'), (doc->>'market'), (doc->>'date'))"
        )
        await conn.execute(
            f"CREATE UNIQUE INDEX IF NOT EXISTS price_accuracy_unique ON {_table_ref(schema, 'price_accuracy')} "
            f"((doc->>'crop'), (doc->>'market'), (doc->>'recommendation_id'), (doc->>'horizon_days'))"
        )
        await conn.execute(
            f"CREATE UNIQUE INDEX IF NOT EXISTS conversations_user_unique ON {_table_ref(schema, 'conversations')} "
            f"((doc->>'user_id'))"
        )
        await conn.execute(
            f"CREATE UNIQUE INDEX IF NOT EXISTS refresh_tokens_unique ON {_table_ref(schema, 'refresh_tokens')} "
            f"((doc->>'user_id'), (doc->>'jti'))"
        )
        await conn.execute(
            f"CREATE INDEX IF NOT EXISTS disease_history_user_idx ON {_table_ref(schema, 'disease_history')} "
            f"((doc->>'user_id'))"
        )
        await conn.execute(
            f"CREATE INDEX IF NOT EXISTS disease_history_created_idx ON {_table_ref(schema, 'disease_history')} "
            f"((doc->>'created_at'))"
        )
        await conn.execute(
            f"CREATE INDEX IF NOT EXISTS mandi_entries_status_idx ON {_table_ref(schema, 'mandi_entries')} "
            f"((doc->>'status'))"
        )
        await conn.execute(
            f"CREATE INDEX IF NOT EXISTS mandi_entries_arrival_date_idx ON {_table_ref(schema, 'mandi_entries')} "
            f"((doc->>'arrival_date'))"
        )
