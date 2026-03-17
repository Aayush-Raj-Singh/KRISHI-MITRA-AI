from __future__ import annotations

import asyncio
from dataclasses import dataclass
from datetime import datetime, timezone
from typing import Any, Dict, Iterable, List, Optional, Sequence, Tuple
from uuid import uuid4

from app.core.database import (
    COLLECTIONS,
    InsertManyResult,
    InsertOneResult,
    UpdateResult,
    _apply_projection,
    _apply_update,
    _coerce_datetime,
    _extract_upsert_base,
    _hydrate_document,
    _match_doc,
    _normalize_document,
)


def _sort_value(document: dict, field: str) -> Any:
    value = document.get("_id") if field == "_id" else document.get(field)
    coerced = _coerce_datetime(value)
    if coerced is not None:
        return coerced
    return value


class MemoryCursor:
    def __init__(self, collection: "MemoryCollection", filter_spec: dict, projection: Optional[dict]) -> None:
        self._collection = collection
        self._filter = filter_spec
        self._projection = projection
        self._sort: List[Tuple[str, int]] = []
        self._limit: Optional[int] = None
        self._skip: int = 0

    def sort(self, key: str | Sequence[Tuple[str, int]], direction: Optional[int] = None) -> "MemoryCursor":
        if isinstance(key, str):
            self._sort = [(key, direction or 1)]
        else:
            self._sort = list(key)
        return self

    def limit(self, limit: int) -> "MemoryCursor":
        self._limit = limit
        return self

    def skip(self, skip: int) -> "MemoryCursor":
        self._skip = skip
        return self

    async def to_list(self, length: Optional[int] = None) -> List[dict]:
        items = await self._collection._find_documents(self._filter, projection=self._projection)
        for field, direction in reversed(self._sort):
            items.sort(key=lambda item: _sort_value(item, field), reverse=(direction or 1) < 0)
        if self._skip:
            items = items[self._skip :]
        effective_limit = self._limit
        if length is not None:
            effective_limit = length if effective_limit is None else min(effective_limit, length)
        if effective_limit is not None:
            items = items[:effective_limit]
        return items

    def __aiter__(self):
        async def _generator():
            for item in await self.to_list(length=None):
                yield item

        return _generator()


class MemoryCollection:
    def __init__(self, database: "MemoryDatabase", name: str) -> None:
        self._database = database
        self._name = name

    async def _read_all(self) -> List[dict]:
        async with self._database._lock:
            items = list(self._database._collections[self._name].values())
        output: List[dict] = []
        for item in items:
            hydrated = _hydrate_document(dict(item))
            output.append(hydrated)
        return output

    def find(self, filter_spec: Optional[dict] = None, projection: Optional[dict] = None) -> MemoryCursor:
        return MemoryCursor(self, filter_spec or {}, projection)

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
        normalized = _normalize_document(document)
        doc_id = str(normalized.pop("_id", None) or uuid4().hex)
        stored = dict(normalized)
        stored["_id"] = doc_id
        async with self._database._lock:
            self._database._collections[self._name][doc_id] = stored
        return InsertOneResult(doc_id)

    async def insert_many(self, documents: Iterable[dict]) -> InsertManyResult:
        inserted_ids: List[str] = []
        async with self._database._lock:
            for document in documents:
                normalized = _normalize_document(document)
                doc_id = str(normalized.pop("_id", None) or uuid4().hex)
                stored = dict(normalized)
                stored["_id"] = doc_id
                self._database._collections[self._name][doc_id] = stored
                inserted_ids.append(doc_id)
        return InsertManyResult(inserted_ids)

    async def update_one(self, filter_spec: dict, update: dict, upsert: bool = False) -> UpdateResult:
        async with self._database._lock:
            for doc_id, stored in self._database._collections[self._name].items():
                if _match_doc(stored, filter_spec):
                    updated = _apply_update(dict(stored), update, is_insert=False)
                    updated["_id"] = doc_id
                    self._database._collections[self._name][doc_id] = updated
                    modified = 0 if updated == stored else 1
                    return UpdateResult(matched_count=1, modified_count=modified, upserted_id=None)

            if not upsert:
                return UpdateResult(matched_count=0, modified_count=0, upserted_id=None)

            base_doc = _extract_upsert_base(filter_spec)
            base_doc = _apply_update(base_doc, update, is_insert=True)
            doc_id = str(base_doc.pop("_id", None) or uuid4().hex)
            stored = _normalize_document(base_doc)
            stored["_id"] = doc_id
            self._database._collections[self._name][doc_id] = stored
            return UpdateResult(matched_count=0, modified_count=0, upserted_id=doc_id)

    async def update_many(self, filter_spec: dict, update: dict, upsert: bool = False) -> UpdateResult:
        matched = 0
        modified = 0
        async with self._database._lock:
            for doc_id, stored in list(self._database._collections[self._name].items()):
                if not _match_doc(stored, filter_spec):
                    continue
                matched += 1
                updated = _apply_update(dict(stored), update, is_insert=False)
                updated["_id"] = doc_id
                if updated != stored:
                    modified += 1
                self._database._collections[self._name][doc_id] = updated

            if matched or not upsert:
                return UpdateResult(matched_count=matched, modified_count=modified, upserted_id=None)

            base_doc = _extract_upsert_base(filter_spec)
            base_doc = _apply_update(base_doc, update, is_insert=True)
            doc_id = str(base_doc.pop("_id", None) or uuid4().hex)
            stored = _normalize_document(base_doc)
            stored["_id"] = doc_id
            self._database._collections[self._name][doc_id] = stored
            return UpdateResult(matched_count=0, modified_count=0, upserted_id=doc_id)

    async def count_documents(self, filter_spec: dict) -> int:
        items = await self._find_documents(filter_spec, projection=None)
        return len(items)

    async def _find_documents(self, filter_spec: dict, projection: Optional[dict]) -> List[dict]:
        items = await self._read_all()
        output: List[dict] = []
        for item in items:
            if not _match_doc(item, filter_spec):
                continue
            output.append(_apply_projection(dict(item), projection))
        return output


@dataclass
class MemoryDatabase:
    schema: str = "memory"

    def __post_init__(self) -> None:
        self._collections: Dict[str, Dict[str, dict]] = {name: {} for name in COLLECTIONS}
        self._lock = asyncio.Lock()
        self.pool = None

    def __getitem__(self, name: str) -> MemoryCollection:
        if name not in self._collections:
            self._collections[name] = {}
        return MemoryCollection(self, name)


_memory_db: MemoryDatabase | None = None


async def get_in_memory_database() -> MemoryDatabase:
    global _memory_db
    if _memory_db is None:
        _memory_db = MemoryDatabase()
    return _memory_db


async def reset_in_memory_database() -> None:
    global _memory_db
    if _memory_db is not None:
        async with _memory_db._lock:
            for name in list(_memory_db._collections.keys()):
                _memory_db._collections[name] = {}
