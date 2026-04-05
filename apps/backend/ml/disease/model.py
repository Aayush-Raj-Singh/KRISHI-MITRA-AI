from __future__ import annotations

from pathlib import Path
from typing import List

try:
    import torch
    from torch.utils.data import Dataset
    from torchvision import models, transforms
    from torchvision.models import EfficientNet_B0_Weights
except Exception:  # pragma: no cover - optional dependency guard
    torch = None
    Dataset = object
    models = None
    transforms = None
    EfficientNet_B0_Weights = None

from PIL import Image


def ensure_torch_available() -> None:
    if torch is None or models is None or transforms is None:
        raise RuntimeError("torch and torchvision are required for disease model training")


def build_transforms(*, train: bool):
    ensure_torch_available()
    if train:
        return transforms.Compose(
            [
                transforms.Resize((256, 256)),
                transforms.RandomResizedCrop(224, scale=(0.8, 1.0)),
                transforms.RandomHorizontalFlip(),
                transforms.RandomRotation(12),
                transforms.ColorJitter(brightness=0.1, contrast=0.1, saturation=0.1),
                transforms.GaussianBlur(kernel_size=3, sigma=(0.1, 1.0)),
                transforms.ToTensor(),
            ]
        )
    return transforms.Compose(
        [
            transforms.Resize((224, 224)),
            transforms.ToTensor(),
        ]
    )


def build_model(num_classes: int):
    return build_backbone_model("efficientnet_b0", num_classes)


def build_backbone_model(architecture: str, num_classes: int):
    ensure_torch_available()
    architecture_key = (architecture or "efficientnet_b0").strip().lower()
    if architecture_key == "mobilenet_v3_small":
        model = models.mobilenet_v3_small(weights=models.MobileNet_V3_Small_Weights.DEFAULT)
        model.classifier[3] = torch.nn.Linear(model.classifier[3].in_features, num_classes)
        return model
    weights = EfficientNet_B0_Weights.DEFAULT if EfficientNet_B0_Weights is not None else None
    model = models.efficientnet_b0(weights=weights)
    model.classifier[1] = torch.nn.Linear(model.classifier[1].in_features, num_classes)
    return model


class PlantDiseaseDataset(Dataset):
    def __init__(self, frame, labels: List[str], transform) -> None:
        ensure_torch_available()
        self._frame = frame.reset_index(drop=True)
        self._transform = transform
        self._label_to_idx = {label: idx for idx, label in enumerate(labels)}

    def __len__(self) -> int:
        return len(self._frame)

    def __getitem__(self, index: int):
        row = self._frame.iloc[index]
        image = Image.open(Path(row["image_path"])).convert("RGB")
        tensor = self._transform(image)
        label_idx = self._label_to_idx[str(row["label"])]
        return tensor, label_idx
