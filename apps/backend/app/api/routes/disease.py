from __future__ import annotations

import hashlib
import io
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, File, HTTPException, Query, UploadFile, status
from PIL import Image, UnidentifiedImageError

from app.core.database import Database
from app.core.dependencies import get_db, get_disease_detection_service, require_roles
from app.core.logging import get_logger
from app.models.user import UserInDB
from app.schemas.disease import DiseaseHistoryItem, DiseasePredictionResponse
from app.schemas.response import APIResponse
from app.services.disease_service import DiseaseDetectionService
from app.utils.responses import success_response

router = APIRouter()
logger = get_logger(__name__)

MAX_IMAGE_BYTES = 5 * 1024 * 1024
ALLOWED_TYPES = {"image/jpeg", "image/png", "image/webp"}


@router.post("/predict", response_model=APIResponse[DiseasePredictionResponse])
async def predict_disease(
    image: UploadFile = File(...),
    db: Database = Depends(get_db),
    user: UserInDB = Depends(require_roles(["farmer", "extension_officer", "admin"])),
    service: DiseaseDetectionService = Depends(get_disease_detection_service),
) -> APIResponse[DiseasePredictionResponse]:
    if image.content_type not in ALLOWED_TYPES:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid image type")

    data = await image.read()
    if not data:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Empty image upload")
    if len(data) > MAX_IMAGE_BYTES:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE, detail="Image too large"
        )
    try:
        with Image.open(io.BytesIO(data)) as uploaded:
            uploaded.verify()
    except (UnidentifiedImageError, OSError) as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="Uploaded file is not a valid image"
        ) from exc

    try:
        result = service.predict(data)
    except Exception as exc:
        logger.exception("disease_prediction_failed", error=str(exc), user_id=user.id)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Unable to process the uploaded image right now",
        ) from exc

    record = {
        "user_id": user.id,
        "crop": result.crop,
        "disease": result.disease,
        "confidence": result.confidence,
        "severity": result.severity,
        "advisory": result.advisory,
        "created_at": datetime.now(timezone.utc),
        "image_sha256": hashlib.sha256(data).hexdigest(),
    }
    try:
        await db["disease_history"].insert_one(record)
    except Exception:
        pass

    return success_response(result, message="disease prediction")


@router.get("/history", response_model=APIResponse[list[DiseaseHistoryItem]])
async def disease_history(
    limit: int = Query(default=10, ge=1, le=50),
    db: Database = Depends(get_db),
    user: UserInDB = Depends(require_roles(["farmer", "extension_officer", "admin"])),
) -> APIResponse[list[DiseaseHistoryItem]]:
    cursor = db["disease_history"].find({"user_id": user.id}).sort("created_at", -1).limit(limit)
    items = await cursor.to_list(length=limit)
    history = [
        DiseaseHistoryItem(
            prediction_id=str(item.get("_id")),
            user_id=str(item.get("user_id")),
            crop=str(item.get("crop")),
            disease=str(item.get("disease")),
            confidence=float(item.get("confidence", 0)),
            severity=str(item.get("severity", "low")),
            created_at=item.get("created_at"),
            advisory=item.get("advisory"),
        )
        for item in items
    ]
    return success_response(history, message="disease history")
