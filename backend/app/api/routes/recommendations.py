from __future__ import annotations

import hashlib
import json

from fastapi import APIRouter, Depends, HTTPException, status
from motor.motor_asyncio import AsyncIOMotorDatabase

from app.core.cache import Cache, get_cache
from app.core.dependencies import get_db, require_roles
from app.models.user import UserInDB
from app.schemas.recommendations import (
    CropRecommendationRequest,
    CropRecommendationResponse,
    PriceForecastRequest,
    PriceForecastResponse,
    WaterOptimizationRequest,
    WaterOptimizationResponse,
)
from app.schemas.response import APIResponse
from app.services.crop_service import CropRecommender
from app.services.price_service import PriceForecaster
from app.services.recommendation_service import RecommendationService
from app.services.water_service import WaterOptimizer
from app.utils.responses import success_response

router = APIRouter()


crop_model = CropRecommender()
price_model = PriceForecaster()
water_model = WaterOptimizer()


def _cache_key(prefix: str, user_id: str, payload: dict) -> str:
    digest = hashlib.sha256(json.dumps(payload, sort_keys=True, default=str).encode("utf-8")).hexdigest()
    return f"{prefix}:{user_id}:{digest}"


@router.post("/crop", response_model=APIResponse[CropRecommendationResponse])
async def crop_recommendations(
    payload: CropRecommendationRequest,
    db: AsyncIOMotorDatabase = Depends(get_db),
    user: UserInDB = Depends(require_roles(["farmer", "extension_officer", "admin"])),
    cache: Cache = Depends(get_cache),
) -> APIResponse[CropRecommendationResponse]:
    cache_key = _cache_key("crop", user.id, payload.model_dump())
    cached = await cache.get(cache_key)
    if cached:
        cached_payload = json.loads(cached)
        return success_response(CropRecommendationResponse(**cached_payload, cached=True), message="cache hit")

    recommendation_service = RecommendationService(db)
    personalization_context = await recommendation_service.get_crop_personalization_context(
        user_id=user.id,
        season=payload.season,
    )
    try:
        result = crop_model.recommend(payload, personalization_context=personalization_context)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc

    rec_id = await recommendation_service.store(user.id, "crop", payload.model_dump(), {
        "recommendations": [item.model_dump() for item in result["recommendations"]],
        "model_version": result["model_version"],
        "personalization_context": personalization_context,
    })

    response = CropRecommendationResponse(
        recommendations=result["recommendations"],
        model_version=result["model_version"],
        created_at=result["created_at"],
        recommendation_id=rec_id,
    )
    await cache.set(cache_key, json.dumps(response.model_dump(), default=str), ttl_seconds=60 * 60 * 24)
    return success_response(response, message="recommendation generated")


@router.post("/price-forecast", response_model=APIResponse[PriceForecastResponse])
async def price_forecast(
    payload: PriceForecastRequest,
    db: AsyncIOMotorDatabase = Depends(get_db),
    user: UserInDB = Depends(require_roles(["farmer", "extension_officer", "admin"])),
    cache: Cache = Depends(get_cache),
) -> APIResponse[PriceForecastResponse]:
    cache_key = _cache_key("price", user.id, payload.model_dump())
    cached = await cache.get(cache_key)
    if cached:
        cached_payload = json.loads(cached)
        return success_response(PriceForecastResponse(**cached_payload, cached=True), message="cache hit")

    try:
        response = price_model.forecast(payload)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc
    recommendation_service = RecommendationService(db)
    rec_id = await recommendation_service.store(user.id, "price", payload.model_dump(), response.model_dump())
    response.recommendation_id = rec_id
    await cache.set(cache_key, json.dumps(response.model_dump(), default=str), ttl_seconds=60 * 60 * 24 * 7)
    return success_response(response, message="forecast generated")


@router.post("/water-optimization", response_model=APIResponse[WaterOptimizationResponse])
async def water_optimization(
    payload: WaterOptimizationRequest,
    db: AsyncIOMotorDatabase = Depends(get_db),
    user: UserInDB = Depends(require_roles(["farmer", "extension_officer", "admin"])),
    cache: Cache = Depends(get_cache),
) -> APIResponse[WaterOptimizationResponse]:
    cache_key = _cache_key("water", user.id, payload.model_dump())
    cached = await cache.get(cache_key)
    if cached:
        cached_payload = json.loads(cached)
        return success_response(WaterOptimizationResponse(**cached_payload, cached=True), message="cache hit")

    try:
        response = water_model.optimize(payload)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc
    recommendation_service = RecommendationService(db)
    rec_id = await recommendation_service.store(user.id, "water", payload.model_dump(), response.model_dump())
    response.recommendation_id = rec_id
    await cache.set(cache_key, json.dumps(response.model_dump(), default=str), ttl_seconds=60 * 60 * 24)
    return success_response(response, message="schedule generated")
