from __future__ import annotations

import argparse
import asyncio
import json
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Dict

from app.core.database import Database, close_postgres

from data_pipeline.versioning import load_dataset_manifest
from ml.common.config import MODELS_ROOT
from ml.common.utils import read_json, utcnow_iso
from ml.crop.train import train_crop_model
from ml.disease.train import train_disease_model
from ml.monitoring.metrics_logger import DASHBOARD_PATH
from ml.price.train import retrain_price_models

PIPELINE_STATE_PATH = MODELS_ROOT / "pipeline_state.json"


async def _estimate_feedback_rows(db: Database | None = None) -> int:
    if db is None:
        return 0
    try:
        feedback = await db["feedback"].find({}).to_list(length=None)
        recommendations = db["recommendations"]
    except Exception:
        return 0

    count = 0
    for item in feedback:
        rec_id = str(item.get("recommendation_id", "")).strip()
        if not rec_id:
            continue
        recommendation = await recommendations.find_one({"_id": rec_id})
        if not recommendation or recommendation.get("kind") != "crop":
            continue
        request_payload = recommendation.get("request_payload", {})
        if all(
            request_payload.get(column) is not None
            for column in (
                "soil_n",
                "soil_p",
                "soil_k",
                "soil_ph",
                "temperature_c",
                "humidity_pct",
                "rainfall_mm",
            )
        ):
            count += 1
    return count


def _load_dashboard() -> dict:
    return read_json(DASHBOARD_PATH, {"models": {}, "inference": {}})


def _load_pipeline_state() -> dict:
    return read_json(PIPELINE_STATE_PATH, {"models": {}, "updated_at": None})


def _save_pipeline_state(payload: dict) -> None:
    PIPELINE_STATE_PATH.parent.mkdir(parents=True, exist_ok=True)
    PIPELINE_STATE_PATH.write_text(json.dumps(payload, indent=2), encoding="utf-8")


def _should_retrain(
    model_key: str, *, dataset_key: str, dashboard: dict, pipeline_state: dict
) -> tuple[bool, str]:
    dataset_version = load_dataset_manifest(dataset_key).get("active_version")
    prior_version = pipeline_state.get("models", {}).get(model_key, {}).get("dataset_version")
    if dataset_version and dataset_version != prior_version:
        return True, "dataset_updated"

    latest_metrics = (
        dashboard.get("models", {}).get(model_key, {}).get("latest", {}).get("metrics", {})
    )
    if model_key == "crop" and float(latest_metrics.get("accuracy", 1.0)) < 0.72:
        return True, "performance_drop"
    if model_key == "price" and float(latest_metrics.get("mape", 0.0)) > 18.0:
        return True, "performance_drop"
    if model_key == "disease" and float(latest_metrics.get("accuracy", 1.0)) < 0.75:
        return True, "performance_drop"
    return False, "up_to_date"


async def run_pipeline(db: Database | None = None, *, force: bool = False) -> dict:
    output: Dict[str, Any] = {
        "started_at": datetime.now(timezone.utc).isoformat(),
    }
    dashboard = _load_dashboard()
    pipeline_state = _load_pipeline_state()

    output["augmented_crop_rows"] = await _estimate_feedback_rows(db)
    crop_needed, crop_reason = _should_retrain(
        "crop",
        dataset_key="crop_training",
        dashboard=dashboard,
        pipeline_state=pipeline_state,
    )
    if force or crop_needed:
        try:
            output["crop_model"] = train_crop_model()
            pipeline_state.setdefault("models", {})["crop"] = {
                "dataset_version": load_dataset_manifest("crop_training").get("active_version"),
                "model_version": output["crop_model"].get("version"),
                "updated_at": utcnow_iso(),
            }
        except Exception as exc:
            output["crop_model_error"] = str(exc)
    else:
        output["crop_model"] = {"status": "skipped", "reason": crop_reason}

    price_needed, price_reason = _should_retrain(
        "price",
        dataset_key="price_history",
        dashboard=dashboard,
        pipeline_state=pipeline_state,
    )
    if force or price_needed:
        try:
            price_result = retrain_price_models(requested_pairs=())
            output["price_models_trained"] = len(price_result.get("models", []))
            output["price_models_failed"] = len(price_result.get("failures", []))
            output["price_model_summary"] = price_result
            pipeline_state.setdefault("models", {})["price"] = {
                "dataset_version": load_dataset_manifest("price_history").get("active_version"),
                "model_version": price_result.get("generated_at"),
                "updated_at": utcnow_iso(),
            }
        except Exception as exc:
            output["price_model_error"] = str(exc)
    else:
        output["price_model_summary"] = {"status": "skipped", "reason": price_reason}

    disease_needed, disease_reason = _should_retrain(
        "disease",
        dataset_key="disease_manifest",
        dashboard=dashboard,
        pipeline_state=pipeline_state,
    )
    if force or disease_needed:
        try:
            output["disease_model"] = train_disease_model()
            pipeline_state.setdefault("models", {})["disease"] = {
                "dataset_version": load_dataset_manifest("disease_manifest").get("active_version"),
                "model_version": output["disease_model"].get("version"),
                "updated_at": utcnow_iso(),
            }
        except Exception as exc:
            output["disease_model_error"] = str(exc)
    else:
        output["disease_model"] = {"status": "skipped", "reason": disease_reason}

    output["completed_at"] = datetime.now(timezone.utc).isoformat()
    pipeline_state["updated_at"] = output["completed_at"]
    _save_pipeline_state(pipeline_state)
    return output


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Retrain all ML models")
    parser.add_argument(
        "--force", action="store_true", help="Force retraining regardless of triggers"
    )
    args = parser.parse_args()
    result = asyncio.run(run_pipeline(force=args.force))
    print(json.dumps(result, indent=2))
