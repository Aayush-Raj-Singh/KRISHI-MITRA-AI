from __future__ import annotations

import math
from collections.abc import Sequence
from typing import Any

import numpy as np
import pandas as pd
from PIL import Image, ImageEnhance, ImageFilter


def stable_bucket(value: Any, buckets: int = 16) -> float:
    normalized = str(value or "").strip().lower()
    if not normalized:
        return 0.0
    return float(sum(ord(ch) for ch in normalized) % buckets)


def soil_fertility_index(soil_n: float, soil_p: float, soil_k: float, soil_ph: float) -> float:
    nutrient_score = (0.42 * float(soil_n)) + (0.28 * float(soil_p)) + (0.30 * float(soil_k))
    ph_penalty = max(0.0, abs(float(soil_ph) - 6.8) * 12.5)
    return round(max(0.0, nutrient_score - ph_penalty), 4)


def nutrient_balance_score(soil_n: float, soil_p: float, soil_k: float) -> float:
    values = np.array([float(soil_n), float(soil_p), float(soil_k)], dtype=float)
    if np.allclose(values.sum(), 0.0):
        return 0.0
    return round(float(1.0 / (1.0 + np.std(values))), 6)


def weather_rolling_average(
    temperature_c: float,
    humidity_pct: float,
    rainfall_mm: float,
    *,
    weather_history: Sequence[dict[str, Any]] | None = None,
    window_days: int = 7,
) -> float:
    if weather_history:
        frame = pd.DataFrame(weather_history)
        numeric_columns = [
            column
            for column in ("temperature_c", "humidity_pct", "rainfall_mm")
            if column in frame.columns
        ]
        if numeric_columns:
            frame = frame[numeric_columns].apply(pd.to_numeric, errors="coerce").dropna(how="all")
            if not frame.empty:
                window = frame.tail(max(1, window_days))
                values = []
                if "temperature_c" in window:
                    values.append(window["temperature_c"].mean())
                if "humidity_pct" in window:
                    values.append(window["humidity_pct"].mean())
                if "rainfall_mm" in window:
                    values.append(window["rainfall_mm"].mean() / 10.0)
                if values:
                    return round(float(np.mean(values)), 4)
    return round(float(np.mean([temperature_c, humidity_pct, rainfall_mm / 10.0])), 4)


def add_crop_features(
    frame: pd.DataFrame,
    *,
    location_column: str | None = None,
    weather_history: Sequence[dict[str, Any]] | None = None,
) -> pd.DataFrame:
    engineered = frame.copy()
    engineered["soil_fertility_index"] = engineered.apply(
        lambda row: soil_fertility_index(
            row["soil_n"], row["soil_p"], row["soil_k"], row["soil_ph"]
        ),
        axis=1,
    )
    engineered["nutrient_balance_score"] = engineered.apply(
        lambda row: nutrient_balance_score(row["soil_n"], row["soil_p"], row["soil_k"]),
        axis=1,
    )
    engineered["weather_7d_avg"] = engineered.apply(
        lambda row: weather_rolling_average(
            row["temperature_c"],
            row["humidity_pct"],
            row["rainfall_mm"],
            weather_history=weather_history,
            window_days=7,
        ),
        axis=1,
    )
    engineered["weather_30d_avg"] = engineered.apply(
        lambda row: weather_rolling_average(
            row["temperature_c"],
            row["humidity_pct"],
            row["rainfall_mm"],
            weather_history=weather_history,
            window_days=30,
        ),
        axis=1,
    )
    if location_column and location_column in engineered.columns:
        engineered["region_cluster"] = engineered[location_column].map(stable_bucket).astype(float)
    else:
        engineered["region_cluster"] = (
            (
                engineered["rainfall_mm"].astype(float) * 0.025
                + engineered["temperature_c"].astype(float) * 0.8
                + engineered["humidity_pct"].astype(float) * 0.05
            )
            .round()
            .mod(16)
            .astype(float)
        )
    return engineered


def add_price_features(frame: pd.DataFrame) -> pd.DataFrame:
    engineered = frame.copy()
    if "ds" in engineered.columns:
        engineered["ds"] = pd.to_datetime(engineered["ds"], errors="coerce")
    group_columns = [column for column in ("crop", "market") if column in engineered.columns]
    if group_columns:
        engineered = engineered.sort_values(group_columns + ["ds"]).reset_index(drop=True)
        grouped = engineered.groupby(group_columns, dropna=False)["y"]
    else:
        engineered = engineered.sort_values("ds").reset_index(drop=True)
        grouped = engineered.groupby(lambda _: 0)["y"]

    engineered["lag_1"] = grouped.shift(1)
    engineered["lag_7"] = grouped.shift(7)
    engineered["lag_30"] = grouped.shift(30)
    engineered["ma_7"] = grouped.transform(
        lambda series: series.shift(1).rolling(7, min_periods=1).mean()
    )
    engineered["ma_30"] = grouped.transform(
        lambda series: series.shift(1).rolling(30, min_periods=1).mean()
    )
    engineered["volatility_7"] = grouped.transform(
        lambda series: series.shift(1).rolling(7, min_periods=2).std()
    )
    engineered["month"] = engineered["ds"].dt.month.astype(float)
    engineered["day_of_week"] = engineered["ds"].dt.dayofweek.astype(float)
    engineered["week_of_year"] = engineered["ds"].dt.isocalendar().week.astype(float)
    engineered["quarter"] = engineered["ds"].dt.quarter.astype(float)
    engineered["is_monsoon"] = engineered["month"].isin([6, 7, 8, 9]).astype(float)
    numeric_columns = [
        "lag_1",
        "lag_7",
        "lag_30",
        "ma_7",
        "ma_30",
        "volatility_7",
        "month",
        "day_of_week",
        "week_of_year",
        "quarter",
        "is_monsoon",
    ]
    medians = engineered[numeric_columns].median(numeric_only=True)
    engineered[numeric_columns] = engineered[numeric_columns].fillna(medians.to_dict())
    return engineered


def preprocess_disease_image(image: Image.Image) -> Image.Image:
    output = image.convert("RGB")
    output = output.filter(ImageFilter.MedianFilter(size=3))
    output = output.filter(ImageFilter.SMOOTH_MORE)
    output = ImageEnhance.Contrast(output).enhance(1.15)
    output = ImageEnhance.Sharpness(output).enhance(1.1)
    return output


def reduce_background_noise(image: Image.Image) -> Image.Image:
    output = preprocess_disease_image(image)
    arr = np.asarray(output).astype("float32")
    green = arr[..., 1]
    red = arr[..., 0]
    blue = arr[..., 2]
    vegetation_mask = (green > red * 0.9) & (green > blue * 0.9)
    softened = arr.copy()
    softened[~vegetation_mask] *= 0.72
    softened = np.clip(softened, 0, 255).astype("uint8")
    return Image.fromarray(softened)


def normalize_price_signal(value: float, baseline: float) -> float:
    baseline = baseline if abs(baseline) > 1e-6 else 1.0
    return math.tanh((float(value) - float(baseline)) / baseline)
