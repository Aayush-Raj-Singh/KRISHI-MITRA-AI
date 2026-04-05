from __future__ import annotations

import os
from dataclasses import dataclass
from pathlib import Path
from typing import Iterable, List

BACKEND_ROOT = Path(__file__).resolve().parents[2]
ML_ROOT = BACKEND_ROOT / "ml"
MODELS_ROOT = BACKEND_ROOT / "models"
DATA_ROOT = BACKEND_ROOT / "data"
RAW_DATA_ROOT = DATA_ROOT / "raw"
PROCESSED_DATA_ROOT = DATA_ROOT / "processed"


def _env_list(name: str, default: Iterable[str]) -> List[str]:
    raw = os.getenv(name, "").strip()
    if not raw:
        return [item for item in default if item]
    return [item.strip() for item in raw.split(",") if item.strip()]


@dataclass(frozen=True)
class CropPaths:
    raw_dir: Path = RAW_DATA_ROOT / "crop"
    processed_dir: Path = PROCESSED_DATA_ROOT / "crop"
    model_dir: Path = MODELS_ROOT / "crop"

    @property
    def raw_dataset_path(self) -> Path:
        return self.raw_dir / "crop_recommendation.csv"

    @property
    def processed_dataset_path(self) -> Path:
        return self.processed_dir / "crop_recommendation.csv"

    @property
    def model_path(self) -> Path:
        return self.model_dir / "crop_recommender.joblib"

    @property
    def metadata_path(self) -> Path:
        return self.model_dir / "metadata.json"

    @property
    def dataset_manifest_path(self) -> Path:
        return DATA_ROOT / "versioning" / "crop_training.json"


@dataclass(frozen=True)
class PricePaths:
    raw_dir: Path = RAW_DATA_ROOT / "price"
    processed_dir: Path = PROCESSED_DATA_ROOT / "price"
    model_dir: Path = MODELS_ROOT / "price"

    @property
    def raw_dataset_path(self) -> Path:
        return self.raw_dir / "mandi_prices.csv"

    @property
    def processed_dataset_path(self) -> Path:
        return self.processed_dir / "price_history.csv"

    @property
    def artifact_dir(self) -> Path:
        return self.model_dir / "artifacts"

    @property
    def metadata_path(self) -> Path:
        return self.model_dir / "models_metadata.json"

    @property
    def dataset_manifest_path(self) -> Path:
        return DATA_ROOT / "versioning" / "price_history.json"


@dataclass(frozen=True)
class DiseasePaths:
    raw_dir: Path = RAW_DATA_ROOT / "disease"
    processed_dir: Path = PROCESSED_DATA_ROOT / "disease"
    model_dir: Path = MODELS_ROOT / "disease"

    @property
    def dataset_dir(self) -> Path:
        return self.raw_dir / "PlantVillage-Dataset"

    @property
    def manifest_path(self) -> Path:
        return self.processed_dir / "plantvillage_manifest.csv"

    @property
    def weights_path(self) -> Path:
        return self.model_dir / "plantvillage_efficientnet_b0.pt"

    @property
    def secondary_weights_path(self) -> Path:
        return self.model_dir / "plantvillage_mobilenet_v3_small.pt"

    @property
    def labels_path(self) -> Path:
        return self.model_dir / "labels.json"

    @property
    def metadata_path(self) -> Path:
        return self.model_dir / "metadata.json"

    @property
    def dataset_manifest_path(self) -> Path:
        return DATA_ROOT / "versioning" / "disease_manifest.json"


REGISTRY_PATH = MODELS_ROOT / "registry.json"


CROP_PATHS = CropPaths()
PRICE_PATHS = PricePaths()
DISEASE_PATHS = DiseasePaths()

CROP_DATASET_URLS = _env_list(
    "CROP_DATASET_URLS",
    [
        "https://raw.githubusercontent.com/nileshely/Crop-Recommendation/main/Crop_Recommendation.csv",
        "https://raw.githubusercontent.com/Ibrahim-Hegazi/Crop-Recomendation-System/main/Crop_recommendation.csv",
    ],
)

PRICE_DATA_GOV_RESOURCE_URL = (
    "https://api.data.gov.in/resource/9ef84268-d588-465a-a308-a864a43d0070"
)

DISEASE_DATASET_GIT_URL = os.getenv(
    "DISEASE_DATASET_GIT_URL",
    "https://github.com/spMohanty/PlantVillage-Dataset.git",
)


def ensure_ml_directories() -> None:
    for path in (
        CROP_PATHS.raw_dir,
        CROP_PATHS.processed_dir,
        CROP_PATHS.model_dir,
        PRICE_PATHS.raw_dir,
        PRICE_PATHS.processed_dir,
        PRICE_PATHS.artifact_dir,
        DISEASE_PATHS.raw_dir,
        DISEASE_PATHS.processed_dir,
        DISEASE_PATHS.model_dir,
        REGISTRY_PATH.parent,
    ):
        path.mkdir(parents=True, exist_ok=True)
