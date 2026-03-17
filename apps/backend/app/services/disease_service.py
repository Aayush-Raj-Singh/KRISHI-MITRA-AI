from __future__ import annotations

import base64
from typing import List, Tuple

from app.core.logging import get_logger
from app.data.disease_catalog import get_disease_info
from app.ml.disease_model import DiseasePredictor
from app.schemas.disease import DiseasePredictionResponse
from app.services.bedrock_service import BedrockService

logger = get_logger(__name__)


class DiseaseDetectionService:
    CONFIDENCE_THRESHOLD = 0.6

    def __init__(self) -> None:
        self._predictor = DiseasePredictor()
        try:
            self._bedrock = BedrockService()
        except Exception as exc:
            logger.warning("bedrock_init_failed", error=str(exc))
            self._bedrock = None

    def _severity_from_confidence(self, confidence: float) -> str:
        if confidence >= 0.8:
            return "high"
        if confidence >= 0.6:
            return "medium"
        return "low"

    def _build_llm_fallback(self, crop: str, disease: str) -> Tuple[str, List[str]]:
        if not self._bedrock:
            return (
                "Low confidence. Please upload a clearer image or consult a local expert.",
                ["Could you share close-up leaf photos?", "Are there visible spots, holes, or yellowing?"],
            )
        try:
            system_prompt = "You are an agronomy expert helping farmers diagnose crop diseases."
            user_context = {"crop": crop, "suspected_disease": disease}
            conversation: List[dict] = []
            user_message = (
                "The model confidence is low. Provide likely diseases, ask clarifying questions, and give immediate care advice."
            )
            reply, _, _ = self._bedrock.generate_reply(
                system_prompt=system_prompt,
                user_context=user_context,
                conversation=conversation,
                user_message=user_message,
                language="en",
                retrieved_context=None,
            )
        except Exception as exc:
            logger.warning("disease_low_confidence_llm_fallback_failed", error=str(exc))
            reply = "Low confidence. Please upload a clearer image or consult a local expert."
        questions = [
            "Can you share the crop variety and growth stage?",
            "Are spots circular, powdery, or water-soaked?",
        ]
        return reply, questions

    def _build_advisory(self, crop: str, disease: str) -> str:
        if not self._bedrock:
            return f"Based on detected {disease} on {crop}, follow treatment and prevention steps provided."
        try:
            system_prompt = "You are an agronomy advisor providing concise disease management guidance."
            user_context = {"crop": crop, "disease": disease}
            conversation: List[dict] = []
            user_message = "Provide 3 concise action steps for immediate treatment and 2 prevention tips."
            reply, _, _ = self._bedrock.generate_reply(
                system_prompt=system_prompt,
                user_context=user_context,
                conversation=conversation,
                user_message=user_message,
                language="en",
                retrieved_context=None,
            )
            return reply
        except Exception as exc:
            logger.warning("disease_advisory_bedrock_unavailable", error=str(exc), crop=crop, disease=disease)
            return f"Based on detected {disease} on {crop}, follow treatment and prevention steps provided."

    def predict(self, image_bytes: bytes) -> DiseasePredictionResponse:
        prediction = self._predictor.predict(image_bytes)
        info = get_disease_info(prediction.crop, prediction.disease)
        severity = self._severity_from_confidence(prediction.confidence)

        advisory = self._build_advisory(prediction.crop, prediction.disease)
        clarifying_questions: List[str] = []
        if prediction.confidence < self.CONFIDENCE_THRESHOLD:
            advisory, clarifying_questions = self._build_llm_fallback(prediction.crop, prediction.disease)

        return DiseasePredictionResponse(
            crop=prediction.crop,
            disease=prediction.disease,
            confidence=round(prediction.confidence, 4),
            severity=severity,
            treatment=info.get("treatment", []),
            prevention=info.get("prevention", []),
            organic_solutions=info.get("organic_solutions", []),
            recommended_products=info.get("recommended_products", []),
            advisory=advisory,
            clarifying_questions=clarifying_questions,
        )
