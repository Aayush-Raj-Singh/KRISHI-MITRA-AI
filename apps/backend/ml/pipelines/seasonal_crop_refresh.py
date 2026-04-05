from __future__ import annotations

import argparse
import json
from datetime import datetime, timezone
from ml.crop.train import train_crop_model


def _current_season() -> str:
    month = datetime.now(timezone.utc).month
    if month in {6, 7, 8, 9, 10}:
        return "kharif"
    if month in {11, 12, 1, 2, 3}:
        return "rabi"
    return "zaid"


def run_seasonal_refresh(season: str | None = None) -> dict:
    season_key = (season or _current_season()).strip().lower()
    metadata = train_crop_model(force_refresh_dataset=False)
    metadata.update(
        {
            "season_refresh": season_key,
            "dataset_used": "dynamic remote crop dataset",
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
