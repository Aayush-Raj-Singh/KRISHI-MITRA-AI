from __future__ import annotations

import json
from datetime import datetime, timezone
from pathlib import Path
from typing import Dict, Tuple

import joblib
import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import train_test_split


FEATURE_COLUMNS = [
    "soil_n",
    "soil_p",
    "soil_k",
    "soil_ph",
    "temperature_c",
    "humidity_pct",
    "rainfall_mm",
    "season_index",
    "location_score",
    "historical_yield",
]

TARGET_COLUMN = "crop"


def _season_index(name: str) -> float:
    mapping = {"kharif": 1.0, "rabi": 2.0, "zaid": 3.0}
    return mapping.get(str(name).strip().lower(), 0.0)


def _location_score(location: str) -> float:
    return (sum(ord(ch) for ch in str(location)) % 1000) / 1000.0


def _generate_synthetic_dataset(path: Path, rows_per_crop: int = 160) -> pd.DataFrame:
    rng = np.random.default_rng(42)
    crop_profiles: Dict[str, Dict[str, Tuple[float, float]]] = {
        "rice": {
            "soil_n": (55, 95),
            "soil_p": (20, 55),
            "soil_k": (20, 65),
            "soil_ph": (5.2, 7.2),
            "temperature_c": (22, 35),
            "humidity_pct": (68, 95),
            "rainfall_mm": (120, 350),
            "historical_yield": (1800, 3400),
        },
        "wheat": {
            "soil_n": (45, 85),
            "soil_p": (25, 55),
            "soil_k": (20, 60),
            "soil_ph": (6.0, 8.0),
            "temperature_c": (12, 28),
            "humidity_pct": (40, 75),
            "rainfall_mm": (20, 120),
            "historical_yield": (1600, 3000),
        },
        "maize": {
            "soil_n": (50, 90),
            "soil_p": (22, 50),
            "soil_k": (25, 70),
            "soil_ph": (5.8, 7.6),
            "temperature_c": (18, 33),
            "humidity_pct": (50, 85),
            "rainfall_mm": (40, 180),
            "historical_yield": (1500, 3200),
        },
        "cotton": {
            "soil_n": (35, 75),
            "soil_p": (18, 45),
            "soil_k": (30, 80),
            "soil_ph": (6.0, 8.2),
            "temperature_c": (21, 36),
            "humidity_pct": (45, 75),
            "rainfall_mm": (30, 140),
            "historical_yield": (1000, 2400),
        },
        "sugarcane": {
            "soil_n": (60, 110),
            "soil_p": (30, 70),
            "soil_k": (35, 90),
            "soil_ph": (6.0, 8.0),
            "temperature_c": (23, 36),
            "humidity_pct": (55, 85),
            "rainfall_mm": (60, 220),
            "historical_yield": (2500, 5000),
        },
    }
    seasons = ["kharif", "rabi", "zaid"]
    locations = ["Patna", "Pune", "Lucknow", "Bhopal", "Nagpur", "Ranchi", "Varanasi"]

    records = []
    for crop_name, profile in crop_profiles.items():
        for _ in range(rows_per_crop):
            location = str(rng.choice(locations))
            season = str(rng.choice(seasons))
            row = {
                "soil_n": round(float(rng.uniform(*profile["soil_n"])), 2),
                "soil_p": round(float(rng.uniform(*profile["soil_p"])), 2),
                "soil_k": round(float(rng.uniform(*profile["soil_k"])), 2),
                "soil_ph": round(float(rng.uniform(*profile["soil_ph"])), 2),
                "temperature_c": round(float(rng.uniform(*profile["temperature_c"])), 2),
                "humidity_pct": round(float(rng.uniform(*profile["humidity_pct"])), 2),
                "rainfall_mm": round(float(rng.uniform(*profile["rainfall_mm"])), 2),
                "location": location,
                "season": season,
                "historical_yield": round(float(rng.uniform(*profile["historical_yield"])), 2),
                "crop": crop_name,
            }
            records.append(row)

    df = pd.DataFrame.from_records(records)
    path.parent.mkdir(parents=True, exist_ok=True)
    df.to_csv(path, index=False)
    return df


def _load_dataset(csv_path: Path) -> pd.DataFrame:
    if csv_path.exists():
        frame = pd.read_csv(csv_path)
        if len(frame) >= 600:
            return frame
        synthetic_seed_path = csv_path.parent / "crop_training_data_seed.csv"
        synthetic = _generate_synthetic_dataset(synthetic_seed_path)
        merged = pd.concat([frame, synthetic], ignore_index=True).drop_duplicates()
        merged.to_csv(csv_path, index=False)
        return merged
    return _generate_synthetic_dataset(csv_path)


def train_crop_model(
    csv_path: Path | None = None,
    model_path: Path | None = None,
    metadata_path: Path | None = None,
) -> dict:
    root = Path(__file__).resolve().parents[2]
    csv_path = csv_path or root / "ml" / "crop_model" / "crop_training_data.csv"
    model_path = model_path or root / "ml" / "crop_model" / "crop_model.joblib"
    metadata_path = metadata_path or root / "ml" / "crop_model" / "crop_model_metadata.json"

    df = _load_dataset(csv_path)
    if TARGET_COLUMN not in df.columns:
        raise ValueError("Crop training CSV must include a 'crop' column")

    if "season_index" not in df.columns:
        df["season_index"] = df.get("season", "").map(_season_index)
    if "location_score" not in df.columns:
        df["location_score"] = df.get("location", "").map(_location_score)

    feature_frame = df[FEATURE_COLUMNS].copy()
    for col in FEATURE_COLUMNS:
        feature_frame[col] = pd.to_numeric(feature_frame[col], errors="coerce")
    feature_frame = feature_frame.fillna(feature_frame.median(numeric_only=True))

    target = df[TARGET_COLUMN].astype(str)
    x_train, x_test, y_train, y_test = train_test_split(
        feature_frame,
        target,
        test_size=0.2,
        random_state=42,
        stratify=target,
    )

    model = RandomForestClassifier(
        n_estimators=260,
        max_depth=18,
        min_samples_leaf=2,
        random_state=42,
        n_jobs=-1,
    )
    model.fit(x_train, y_train)
    accuracy = float(model.score(x_test, y_test))

    model_bundle = {
        "model": model,
        "feature_columns": FEATURE_COLUMNS,
        "feature_medians": feature_frame.median(numeric_only=True).to_dict(),
        "version": f"rf-crop-v{datetime.now(timezone.utc).strftime('%Y%m%d%H%M%S')}",
    }

    model_path.parent.mkdir(parents=True, exist_ok=True)
    joblib.dump(model_bundle, model_path)

    metadata = {
        "version": model_bundle["version"],
        "accuracy": round(accuracy, 4),
        "trained_at": datetime.now(timezone.utc).isoformat(),
        "samples": int(len(df)),
        "feature_columns": FEATURE_COLUMNS,
        "classes": sorted(target.unique().tolist()),
    }
    metadata_path.write_text(json.dumps(metadata, indent=2), encoding="utf-8")
    return metadata


if __name__ == "__main__":
    result = train_crop_model()
    print(json.dumps(result, indent=2))
