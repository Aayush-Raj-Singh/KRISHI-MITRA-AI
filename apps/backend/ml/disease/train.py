from __future__ import annotations

import json
from pathlib import Path

from data_pipeline.versioning import file_checksum, load_dataset_manifest, record_dataset_version
from ml.common.config import DISEASE_PATHS, ensure_ml_directories
from ml.common.model_registry import register_model
from ml.common.utils import atomic_write_json, utcnow_iso
from ml.disease.dataset_loader import build_disease_manifest
from ml.disease.model import (
    build_backbone_model,
    build_model,
    build_transforms,
    ensure_torch_available,
)
from ml.monitoring.metrics_logger import log_training_metrics

try:
    import torch
    from torch.utils.data import DataLoader
except Exception:  # pragma: no cover - optional dependency guard
    torch = None
    DataLoader = None


def train_disease_model(
    *,
    manifest_path: Path | None = None,
    weights_path: Path | None = None,
    labels_path: Path | None = None,
    metadata_path: Path | None = None,
    epochs: int = 3,
    batch_size: int = 16,
    learning_rate: float = 1e-4,
    allow_download: bool = True,
    train_secondary_model: bool = False,
) -> dict:
    ensure_torch_available()
    ensure_ml_directories()
    if torch is None or DataLoader is None:
        raise RuntimeError("torch is required for disease model training")

    manifest_path = manifest_path or DISEASE_PATHS.manifest_path
    weights_path = weights_path or DISEASE_PATHS.weights_path
    labels_path = labels_path or DISEASE_PATHS.labels_path
    metadata_path = metadata_path or DISEASE_PATHS.metadata_path

    manifest = build_disease_manifest(
        manifest_path=manifest_path,
        allow_download=allow_download,
    )
    record_dataset_version(
        "disease_manifest",
        dataset_path=manifest_path,
        row_count=len(manifest),
        checksum=file_checksum(manifest_path),
        incremental=False,
        metadata={"splits": manifest["split"].value_counts().to_dict()},
        source_ref=str(DISEASE_PATHS.dataset_dir),
    )
    labels = sorted(manifest["label"].astype(str).unique().tolist())
    train_frame = manifest[manifest["split"] == "train"].copy()
    val_frame = manifest[manifest["split"] == "val"].copy()

    from ml.disease.model import (
        PlantDiseaseDataset,
    )  # local import to keep optional torch guard clean

    train_dataset = PlantDiseaseDataset(train_frame, labels, build_transforms(train=True))
    val_dataset = PlantDiseaseDataset(val_frame, labels, build_transforms(train=False))
    train_loader = DataLoader(train_dataset, batch_size=batch_size, shuffle=True, num_workers=0)
    val_loader = DataLoader(val_dataset, batch_size=batch_size, shuffle=False, num_workers=0)

    device = "cuda" if torch.cuda.is_available() else "cpu"

    def train_architecture(architecture: str) -> tuple[dict, float]:
        model = build_backbone_model(architecture, len(labels)).to(device)
        optimizer = torch.optim.AdamW(model.parameters(), lr=learning_rate)
        criterion = torch.nn.CrossEntropyLoss()
        best_val_accuracy = 0.0
        best_state = None
        for _ in range(epochs):
            model.train()
            for inputs, targets in train_loader:
                inputs = inputs.to(device)
                targets = targets.to(device)
                optimizer.zero_grad()
                logits = model(inputs)
                loss = criterion(logits, targets)
                loss.backward()
                optimizer.step()

            model.eval()
            correct = 0
            total = 0
            with torch.no_grad():
                for inputs, targets in val_loader:
                    inputs = inputs.to(device)
                    targets = targets.to(device)
                    logits = model(inputs)
                    predictions = torch.argmax(logits, dim=1)
                    correct += int((predictions == targets).sum().item())
                    total += int(targets.size(0))
            val_accuracy = correct / total if total else 0.0
            if val_accuracy >= best_val_accuracy:
                best_val_accuracy = val_accuracy
                best_state = model.state_dict()
        if best_state is None:
            raise RuntimeError(
                f"Disease model training for {architecture} completed without weights"
            )
        return best_state, float(best_val_accuracy)

    best_state, best_val_accuracy = train_architecture("efficientnet_b0")

    weights_path.parent.mkdir(parents=True, exist_ok=True)
    torch.save(best_state, weights_path)
    secondary_accuracy = None
    if train_secondary_model:
        secondary_state, secondary_accuracy = train_architecture("mobilenet_v3_small")
        torch.save(secondary_state, DISEASE_PATHS.secondary_weights_path)
    atomic_write_json(
        labels_path,
        [{"crop": label.split("::", 1)[0], "disease": label.split("::", 1)[1]} for label in labels],
    )
    dataset_version = load_dataset_manifest("disease_manifest").get("active_version")
    metadata = {
        "version": f"disease-ensemble-{weights_path.stem}",
        "trained_at": utcnow_iso(),
        "validation_accuracy": round(float(best_val_accuracy), 4),
        "secondary_validation_accuracy": round(float(secondary_accuracy), 4)
        if secondary_accuracy is not None
        else None,
        "classes": labels,
        "weights_path": str(weights_path),
        "secondary_weights_path": str(DISEASE_PATHS.secondary_weights_path)
        if DISEASE_PATHS.secondary_weights_path.exists()
        else None,
        "labels_path": str(labels_path),
        "dataset_version": dataset_version,
    }
    atomic_write_json(metadata_path, metadata)
    register_model(
        "disease",
        version=metadata["version"],
        artifact_path=weights_path,
        metadata_path=metadata_path,
        metrics={"accuracy": metadata["validation_accuracy"]},
        extra={"dataset_version": dataset_version},
    )
    log_training_metrics(
        "disease",
        version=metadata["version"],
        metrics={
            "accuracy": metadata["validation_accuracy"],
            "precision_proxy": metadata["validation_accuracy"],
            "recall_proxy": metadata["validation_accuracy"],
        },
        dataset_version=dataset_version,
        extra={"secondary_validation_accuracy": metadata["secondary_validation_accuracy"]},
    )
    return metadata


if __name__ == "__main__":
    result = train_disease_model()
    print(json.dumps(result, indent=2))
