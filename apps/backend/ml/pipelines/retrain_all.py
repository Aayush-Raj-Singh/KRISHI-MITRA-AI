from __future__ import annotations

import argparse
import asyncio
import json
from datetime import datetime, timedelta, timezone
from pathlib import Path
from typing import Any, Dict, List

import pandas as pd

from app.core.database import connect_to_postgres, close_postgres, Database
from ml.training.retrain_price_model import DEFAULT_PAIRS, retrain_price_models
from ml.training.train_crop_model import FEATURE_COLUMNS, train_crop_model


def _root() -> Path:
    return Path(__file__).resolve().parents[2]


async def _pull_recent_outcomes(db: Database, days: int = 180) -> List[Dict[str, Any]]:
    from_date = datetime.now(timezone.utc) - timedelta(days=days)
    feedback = await db["feedback"].find({"created_at": {"$gte": from_date}}).to_list(length=None)
    return feedback


async def _augment_crop_dataset_from_feedback() -> int:
    csv_path = _root() / "ml" / "crop_model" / "crop_training_data.csv"
    base_df = pd.read_csv(csv_path) if csv_path.exists() else pd.DataFrame()

    appended_rows: List[dict] = []
    db = await connect_to_postgres()
    try:
        feedback = await _pull_recent_outcomes(db)
        if not feedback:
            return 0
        for item in feedback:
            rec_id = str(item.get("recommendation_id", "")).strip()
            if not rec_id:
                continue
            recommendation = await db["recommendations"].find_one({"_id": rec_id})
            if not recommendation or recommendation.get("kind") != "crop":
                continue

            request_payload = recommendation.get("request_payload", {})
            response_payload = recommendation.get("response_payload", {})
            top_crop = None
            if response_payload.get("recommendations"):
                top_crop = response_payload["recommendations"][0].get("crop")
            if not top_crop:
                continue

            row = {
                "soil_n": request_payload.get("soil_n"),
                "soil_p": request_payload.get("soil_p"),
                "soil_k": request_payload.get("soil_k"),
                "soil_ph": request_payload.get("soil_ph"),
                "temperature_c": request_payload.get("temperature_c"),
                "humidity_pct": request_payload.get("humidity_pct"),
                "rainfall_mm": request_payload.get("rainfall_mm"),
                "season": request_payload.get("season", "kharif"),
                "location": request_payload.get("location", "unknown"),
                "historical_yield": float(item.get("outcomes", {}).get("yield_kg_per_acre", 0.0)),
                "crop": top_crop,
            }
            if all(
                row.get(col) is not None
                for col in ["soil_n", "soil_p", "soil_k", "soil_ph", "temperature_c", "humidity_pct", "rainfall_mm"]
            ):
                appended_rows.append(row)
    finally:
        await close_postgres()

    if not appended_rows:
        return 0

    app_df = pd.DataFrame(appended_rows).dropna()
    merged = pd.concat([base_df, app_df], ignore_index=True) if not base_df.empty else app_df
    csv_path.parent.mkdir(parents=True, exist_ok=True)
    merged.to_csv(csv_path, index=False)
    return int(len(app_df))


async def run_pipeline() -> dict:
    output: Dict[str, Any] = {
        "started_at": datetime.now(timezone.utc).isoformat(),
    }

    augmented_rows = 0
    try:
        augmented_rows = await _augment_crop_dataset_from_feedback()
    except Exception as exc:
        output["crop_data_augmentation_error"] = str(exc)

    crop_result = train_crop_model()
    price_result = retrain_price_models(requested_pairs=DEFAULT_PAIRS)

    output.update(
        {
            "augmented_crop_rows": augmented_rows,
            "crop_model": crop_result,
            "price_models_trained": len(price_result.get("models", [])),
            "price_models_failed": len(price_result.get("failures", [])),
            "completed_at": datetime.now(timezone.utc).isoformat(),
        }
    )
    return output


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Retrain all ML models")
    parser.parse_args()
    result = asyncio.run(run_pipeline())
    print(json.dumps(result, indent=2))
