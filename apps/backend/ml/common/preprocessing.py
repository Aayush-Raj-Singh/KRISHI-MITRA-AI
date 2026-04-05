from __future__ import annotations

from datetime import date, datetime
from typing import Iterable

import pandas as pd


def ensure_numeric_frame(frame: pd.DataFrame, columns: Iterable[str]) -> pd.DataFrame:
    output = frame.copy()
    for column in columns:
        output[column] = pd.to_numeric(output.get(column), errors="coerce")
    medians = output[list(columns)].median(numeric_only=True)
    return output.fillna(medians.to_dict())


def parse_date_column(series: pd.Series) -> pd.Series:
    return pd.to_datetime(series, errors="coerce", dayfirst=True)


def normalize_label(value: object) -> str:
    return " ".join(str(value or "").replace("_", " ").replace("-", " ").split()).strip()


def season_index(value: str | None) -> float:
    mapping = {"kharif": 1.0, "rabi": 2.0, "zaid": 3.0}
    return mapping.get((value or "").strip().lower(), 0.0)


def location_score(value: str | None) -> float:
    return (sum(ord(ch) for ch in str(value or "")) % 1000) / 1000.0


def to_date(value: object) -> date | None:
    if isinstance(value, date):
        return value
    if isinstance(value, datetime):
        return value.date()
    try:
        parsed = pd.to_datetime(value, errors="coerce")
    except Exception:
        return None
    if pd.isna(parsed):
        return None
    return parsed.date()
