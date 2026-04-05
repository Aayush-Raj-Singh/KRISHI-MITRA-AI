from __future__ import annotations

import io
import json
from dataclasses import dataclass
from typing import List, Tuple

import numpy as np
from PIL import Image, ImageFilter

from app.core.logging import get_logger
from ml.common.config import DISEASE_PATHS
from ml.common.feature_engineering import preprocess_disease_image, reduce_background_noise
from ml.common.model_registry import resolve_artifact_path

logger = get_logger(__name__)


@dataclass
class DiseasePrediction:
    crop: str
    disease: str
    confidence: float


class DiseasePredictor:
    def __init__(self) -> None:
        self._model = None
        self._secondary_model = None
        self._transforms = None
        self._labels: List[Tuple[str, str]] = [
            ("Rice", "Leaf Blight"),
            ("Rice", "Healthy"),
            ("Wheat", "Rust"),
            ("Wheat", "Healthy"),
            ("Tomato", "Early Blight"),
            ("Tomato", "Healthy"),
            ("Maize", "Leaf Blight"),
            ("Maize", "Healthy"),
            ("Potato", "Early Blight"),
            ("Potato", "Healthy"),
        ]
        self._load_label_overrides()
        self._load_optional_model()

    def _load_label_overrides(self) -> None:
        labels_path = DISEASE_PATHS.labels_path
        if not labels_path.exists():
            return
        try:
            data = json.loads(labels_path.read_text(encoding="utf-8"))
            labels: List[Tuple[str, str]] = []
            for item in data:
                if isinstance(item, dict) and item.get("crop") and item.get("disease"):
                    labels.append((str(item["crop"]), str(item["disease"])))
                elif isinstance(item, (list, tuple)) and len(item) == 2:
                    labels.append((str(item[0]), str(item[1])))
            if labels:
                self._labels = labels
                logger.info("disease_labels_loaded", count=len(labels), path=str(labels_path))
        except Exception as exc:
            logger.warning("disease_labels_load_failed", error=str(exc))

    def _load_optional_model(self) -> None:
        try:
            import torch  # type: ignore

            from ml.disease.model import build_model, build_transforms

            weight_path = resolve_artifact_path("disease") or DISEASE_PATHS.weights_path
            if not weight_path.exists() or weight_path.stat().st_size < 100_000:
                raise FileNotFoundError
            self._transforms = build_transforms(train=False)
            self._model = build_model(len(self._labels))
            self._model.load_state_dict(torch.load(weight_path, map_location="cpu"))
            self._model.eval()
            secondary_path = DISEASE_PATHS.secondary_weights_path
            if secondary_path.exists() and secondary_path.stat().st_size >= 100_000:
                from ml.disease.model import build_backbone_model

                self._secondary_model = build_backbone_model(
                    "mobilenet_v3_small", len(self._labels)
                )
                self._secondary_model.load_state_dict(
                    torch.load(secondary_path, map_location="cpu")
                )
                self._secondary_model.eval()
            logger.info("disease_model_loaded", path=str(weight_path))
        except FileNotFoundError:
            logger.warning("disease_model_weights_missing", path=str(DISEASE_PATHS.weights_path))
            self._model = None
            self._secondary_model = None
            self._transforms = None
        except Exception as exc:
            logger.warning("disease_model_optional_load_failed", error=str(exc))
            self._model = None
            self._secondary_model = None
            self._transforms = None

    @staticmethod
    def _calibrate_confidence(confidence: float) -> float:
        calibrated = 0.8 * confidence + 0.1
        return max(0.05, min(0.95, calibrated))

    def _preprocess(self, image_bytes: bytes) -> Image.Image:
        image = Image.open(io.BytesIO(image_bytes)).convert("RGB")
        image = preprocess_disease_image(image)
        return reduce_background_noise(image)

    def _heuristic_predict(self, image: Image.Image) -> DiseasePrediction:
        resized = image.resize((128, 128))
        arr = np.asarray(resized).astype("float32") / 255.0
        green_ratio = float(np.mean(arr[..., 1]))
        red_ratio = float(np.mean(arr[..., 0]))
        blue_ratio = float(np.mean(arr[..., 2]))

        if green_ratio > 0.5 and red_ratio < 0.35:
            return DiseasePrediction("Maize", "Healthy", self._calibrate_confidence(0.68))
        if green_ratio > 0.45 and red_ratio < 0.4:
            return DiseasePrediction("Rice", "Healthy", self._calibrate_confidence(0.62))
        if red_ratio > 0.5 and green_ratio < 0.4:
            return DiseasePrediction("Wheat", "Rust", self._calibrate_confidence(0.58))
        if blue_ratio > 0.45:
            return DiseasePrediction("Tomato", "Early Blight", self._calibrate_confidence(0.55))
        return DiseasePrediction("Rice", "Leaf Blight", self._calibrate_confidence(0.42))

    def predict(self, image_bytes: bytes) -> DiseasePrediction:
        image = self._preprocess(image_bytes)
        if self._model is None or self._transforms is None:
            return self._heuristic_predict(image)
        try:
            import torch  # type: ignore

            tensor = self._transforms(image).unsqueeze(0)
            with torch.no_grad():
                logits = self._model(tensor)
                probs = torch.softmax(logits, dim=1).cpu().numpy()[0]
                if self._secondary_model is not None:
                    secondary_logits = self._secondary_model(tensor)
                    secondary_probs = torch.softmax(secondary_logits, dim=1).cpu().numpy()[0]
                    probs = (probs * 0.65) + (secondary_probs * 0.35)
            idx = int(np.argmax(probs))
            crop, disease = self._labels[idx]
            return DiseasePrediction(
                crop=crop, disease=disease, confidence=self._calibrate_confidence(float(probs[idx]))
            )
        except Exception as exc:
            logger.warning("disease_model_inference_failed", error=str(exc))
            return self._heuristic_predict(image)
