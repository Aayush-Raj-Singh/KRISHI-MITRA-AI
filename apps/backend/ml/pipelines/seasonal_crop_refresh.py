from __future__ import annotations

import argparse
import json
from datetime import datetime, timezone
from pathlib import Path

import pandas as pd

from ml.training.train_crop_model import train_crop_model


def _current_season() -> str:
    month = datetime.now(timezone.utc).month
    if month in {6, 7, 8, 9, 10}:
        return "kharif"
    if month in {11, 12, 1, 2, 3}:
        return "rabi"
    return "zaid"


def run_seasonal_refresh(season: str | None = None) -> dict:
    root = Path(__file__).resolve().parents[2]
    season_key = (season or _current_season()).strip().lower()
    csv_path = root / "ml" / "crop_model" / "crop_training_data.csv"
    seasonal_csv = root / "ml" / "crop_model" / f"crop_training_data_{season_key}.csv"

    if csv_path.exists():
        frame = pd.read_csv(csv_path)
        if "season" in frame.columns:
            seasonal_frame = frame[frame["season"].astype(str).str.lower() == season_key]
            if len(seasonal_frame) >= 120:
                seasonal_frame.to_csv(seasonal_csv, index=False)
                train_input = seasonal_csv
            else:
                train_input = csv_path
        else:
            train_input = csv_path
    else:
        train_input = csv_path

    metadata = train_crop_model(csv_path=train_input)
    metadata.update(
        {
            "season_refresh": season_key,
            "dataset_used": str(train_input),
            "refreshed_at": datetime.now(timezone.utc).isoformat(),
        }
    )
    return metadata


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Run seasonal crop model refresh")
    parser.add_argument("--season", type=str, default=None, help="Optional: kharif, rabi or zaid")
    args = parser.parse_args()

    result = run_seasonal_refresh(args.season)
    print(json.dumps(result, indent=2))
