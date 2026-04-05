from __future__ import annotations

import shutil
import subprocess
from pathlib import Path
from typing import Iterable

import pandas as pd
from sklearn.model_selection import train_test_split

from ml.common.config import DISEASE_DATASET_GIT_URL, DISEASE_PATHS, ensure_ml_directories
from ml.common.preprocessing import normalize_label

IMAGE_EXTENSIONS = {".jpg", ".jpeg", ".png"}


def _clone_dataset(target_dir: Path) -> None:
    if shutil.which("git") is None:
        raise RuntimeError("git is required to fetch the PlantVillage dataset automatically")
    subprocess.run(
        ["git", "clone", "--depth", "1", DISEASE_DATASET_GIT_URL, str(target_dir)],
        check=True,
        capture_output=True,
        text=True,
    )


def ensure_disease_dataset(*, allow_download: bool = True) -> Path:
    ensure_ml_directories()
    dataset_dir = DISEASE_PATHS.dataset_dir
    if dataset_dir.exists():
        return dataset_dir
    if not allow_download:
        raise FileNotFoundError(f"Disease dataset not found at {dataset_dir}")
    _clone_dataset(dataset_dir)
    return dataset_dir


def _iter_images(dataset_dir: Path) -> Iterable[tuple[Path, str, str]]:
    for class_dir in sorted(dataset_dir.iterdir()):
        if not class_dir.is_dir():
            continue
        label = class_dir.name
        if "___" in label:
            crop_raw, disease_raw = label.split("___", 1)
        else:
            crop_raw, disease_raw = "Unknown", label
        crop = normalize_label(crop_raw)
        disease = normalize_label(disease_raw)
        for image_path in class_dir.rglob("*"):
            if image_path.suffix.lower() not in IMAGE_EXTENSIONS:
                continue
            yield image_path, crop, disease


def build_disease_manifest(
    *,
    dataset_dir: Path | None = None,
    manifest_path: Path | None = None,
    allow_download: bool = True,
) -> pd.DataFrame:
    manifest_path = manifest_path or DISEASE_PATHS.manifest_path
    if manifest_path.exists():
        return pd.read_csv(manifest_path)

    dataset_dir = dataset_dir or ensure_disease_dataset(allow_download=allow_download)
    records = [
        {
            "image_path": str(image_path),
            "crop": crop,
            "disease": disease,
            "label": f"{crop}::{disease}",
        }
        for image_path, crop, disease in _iter_images(dataset_dir)
    ]
    if not records:
        raise RuntimeError("No disease images were found in the dataset directory")

    frame = pd.DataFrame(records).drop_duplicates().reset_index(drop=True)
    train_df, test_df = train_test_split(
        frame,
        test_size=0.15,
        random_state=42,
        stratify=frame["label"],
    )
    train_df, val_df = train_test_split(
        train_df,
        test_size=0.15,
        random_state=42,
        stratify=train_df["label"],
    )
    split_frame = pd.concat(
        [
            train_df.assign(split="train"),
            val_df.assign(split="val"),
            test_df.assign(split="test"),
        ],
        ignore_index=True,
    )
    manifest_path.parent.mkdir(parents=True, exist_ok=True)
    split_frame.to_csv(manifest_path, index=False)
    return split_frame
