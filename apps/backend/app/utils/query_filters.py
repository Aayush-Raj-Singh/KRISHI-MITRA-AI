from __future__ import annotations

import re


def _normalize_search_value(value: str) -> str:
    return " ".join((value or "").strip().split())


def build_case_insensitive_contains_filter(value: str) -> dict:
    cleaned = _normalize_search_value(value)
    if not cleaned:
        raise ValueError("Search text is required")
    return {"$regex": re.escape(cleaned), "$options": "i"}


def build_case_insensitive_exact_filter(value: str) -> dict:
    cleaned = _normalize_search_value(value)
    if not cleaned:
        raise ValueError("Search text is required")
    return {"$regex": f"^{re.escape(cleaned)}$", "$options": "i"}
