from __future__ import annotations

import re
from datetime import date
from typing import Any, Iterable, Tuple


def _quote_ident(name: str) -> str:
    if not re.match(r"^[A-Za-z_][A-Za-z0-9_]*$", name):
        raise ValueError(f"Unsafe identifier: {name}")
    return f'"{name}"'


def table_ref(schema: str, name: str) -> str:
    return f"{_quote_ident(schema)}.{_quote_ident(name)}"


def build_mandi_where(filters: object) -> Tuple[str, list]:
    clauses = []
    params = []

    def add_clause(sql: str, value) -> None:
        params.append(value)
        clauses.append(f"{sql} ${len(params)}")

    add_clause("doc->>'status' = ", "approved")

    state = getattr(filters, "state", None)
    if state:
        add_clause("doc->>'state' = ", state)

    district = getattr(filters, "district", None)
    if district:
        add_clause("doc->>'district' = ", district)

    mandi = getattr(filters, "mandi", None)
    if mandi:
        add_clause("doc->>'market' ILIKE", f"%{mandi}%")

    commodity = getattr(filters, "commodity", None)
    if commodity:
        add_clause("lower(doc->>'commodity') = lower(", commodity)
        clauses[-1] = clauses[-1] + ")"

    variety = getattr(filters, "variety", None)
    if variety:
        add_clause("lower(doc->>'variety') = lower(", variety)
        clauses[-1] = clauses[-1] + ")"

    grade = getattr(filters, "grade", None)
    if grade:
        add_clause("lower(doc->>'grade') = lower(", grade)
        clauses[-1] = clauses[-1] + ")"

    date_from = getattr(filters, "date_from", None)
    if date_from:
        add_clause("(doc->>'arrival_date')::date >= ", date_from)

    date_to = getattr(filters, "date_to", None)
    if date_to:
        add_clause("(doc->>'arrival_date')::date <= ", date_to)

    where_sql = " AND ".join(clauses) if clauses else "TRUE"
    return where_sql, params


def merge_where(base_where: str, extra_clauses: Iterable[str]) -> str:
    extras = [clause for clause in extra_clauses if clause]
    if not extras:
        return base_where
    return f"{base_where} AND " + " AND ".join(extras)


def _normalize(value: Any) -> str:
    return str(value or "").strip().lower()


def _parse_date(value: Any) -> date | None:
    if isinstance(value, date):
        return value
    raw = str(value or "").strip()
    if not raw:
        return None
    try:
        return date.fromisoformat(raw[:10])
    except ValueError:
        return None


def match_mandi_document(document: dict, filters: object) -> bool:
    if _normalize(document.get("status")) != "approved":
        return False

    state = getattr(filters, "state", None)
    if state and _normalize(document.get("state")) != _normalize(state):
        return False

    district = getattr(filters, "district", None)
    if district and _normalize(document.get("district")) != _normalize(district):
        return False

    mandi = getattr(filters, "mandi", None)
    if mandi and _normalize(mandi) not in _normalize(document.get("market")):
        return False

    commodity = getattr(filters, "commodity", None)
    if commodity and _normalize(document.get("commodity")) != _normalize(commodity):
        return False

    variety = getattr(filters, "variety", None)
    if variety and _normalize(document.get("variety")) != _normalize(variety):
        return False

    grade = getattr(filters, "grade", None)
    if grade and _normalize(document.get("grade")) != _normalize(grade):
        return False

    arrival_date = _parse_date(document.get("arrival_date"))
    date_from = _parse_date(getattr(filters, "date_from", None))
    date_to = _parse_date(getattr(filters, "date_to", None))
    if date_from and (arrival_date is None or arrival_date < date_from):
        return False
    if date_to and (arrival_date is None or arrival_date > date_to):
        return False
    return arrival_date is not None
