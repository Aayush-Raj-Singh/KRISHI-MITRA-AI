from __future__ import annotations

from pathlib import Path

import pandas as pd

from data_pipeline.versioning import load_dataset_manifest
from ml.common.model_registry import load_registry
from ml.crop.train import train_crop_model
from ml.price.model import forecast_from_bundle, load_bundle
from ml.price.train import retrain_price_models


def _write_crop_dataset(path: Path) -> None:
    rows = []
    profiles = {
        "rice": (88, 44, 42, 30, 82, 6.4, 220),
        "wheat": (62, 31, 26, 21, 58, 7.1, 80),
        "maize": (75, 38, 34, 27, 68, 6.7, 140),
    }
    for crop, (n, p, k, temp, humidity, ph, rainfall) in profiles.items():
        for offset in range(45):
            rows.append(
                {
                    "soil_n": n + (offset % 6),
                    "soil_p": p + (offset % 5),
                    "soil_k": k + (offset % 4),
                    "temperature_c": temp + (offset % 3) * 0.5,
                    "humidity_pct": humidity + (offset % 4),
                    "soil_ph": ph + (offset % 3) * 0.05,
                    "rainfall_mm": rainfall + (offset % 10) * 2,
                    "crop": crop,
                }
            )
    pd.DataFrame(rows).to_csv(path, index=False)


def _write_price_dataset(path: Path) -> None:
    rows = []
    start = pd.Timestamp("2024-01-01")
    for day in range(220):
        rows.append(
            {
                "ds": (start + pd.Timedelta(days=day)).date().isoformat(),
                "y": round(2200 + day * 0.8 + (day % 7) * 11 + (day % 30) * 1.5, 2),
                "crop": "rice",
                "market": "patna",
                "state": "Bihar",
                "district": "Patna",
            }
        )
    pd.DataFrame(rows).to_csv(path, index=False)


def test_crop_training_produces_model_bundle(tmp_path: Path) -> None:
    dataset_path = tmp_path / "crop.csv"
    model_path = tmp_path / "crop.joblib"
    metadata_path = tmp_path / "crop_metadata.json"
    _write_crop_dataset(dataset_path)

    metadata = train_crop_model(
        csv_path=dataset_path,
        model_path=model_path,
        metadata_path=metadata_path,
        force_refresh_dataset=False,
    )

    assert model_path.exists()
    assert metadata_path.exists()
    assert metadata["accuracy"] > 0.6
    registry = load_registry()
    assert registry["models"]["crop"]["active_version"] == metadata["version"]
    dataset_manifest = load_dataset_manifest("crop_training")
    assert dataset_manifest["active_version"] is not None


def test_price_retraining_produces_forecast_artifact(tmp_path: Path) -> None:
    history_path = tmp_path / "price_history.csv"
    artifact_dir = tmp_path / "artifacts"
    metadata_path = tmp_path / "metadata.json"
    _write_price_dataset(history_path)

    result = retrain_price_models(
        csv_path=history_path,
        artifact_dir=artifact_dir,
        metadata_path=metadata_path,
        requested_pairs=[("rice", "patna")],
        force_refresh_dataset=False,
    )

    assert result["models"]
    bundle = load_bundle(artifact_dir / "rice__patna.joblib")
    forecast = forecast_from_bundle(bundle, periods=30)
    assert len(forecast) == 30
    assert float(forecast["yhat"].iloc[0]) > 0
    assert bundle.model_type in {"prophet", "prophet_arima_hybrid", "prophet_lstm_hybrid"}
