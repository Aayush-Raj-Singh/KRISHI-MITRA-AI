from __future__ import annotations

import asyncio
import hashlib
import json

from fastapi import APIRouter, Depends, HTTPException, status

from app.core.cache import Cache, get_cache
from app.core.config import settings
from app.core.database import Database
from app.core.dependencies import (
    get_crop_recommender,
    get_db,
    get_external_data_service,
    get_price_forecaster,
    get_recommendation_service,
    get_water_optimizer,
    require_roles,
)
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
from app.services.external_data_service import ExternalDataService
from app.services.price_service import PriceForecaster
from app.services.recommendation_service import RecommendationService
from app.services.sagemaker_inference_service import SageMakerInferenceService
from app.services.water_service import WaterOptimizer
from app.utils.responses import success_response

router = APIRouter()


def _cache_key(prefix: str, user_id: str, payload: dict) -> str:
    digest = hashlib.sha256(
        json.dumps(payload, sort_keys=True, default=str).encode("utf-8")
    ).hexdigest()
    return f"{prefix}:{user_id}:{digest}"


@router.post("/crop", response_model=APIResponse[CropRecommendationResponse])
async def crop_recommendations(
    payload: CropRecommendationRequest,
    user: UserInDB = Depends(require_roles(["farmer", "extension_officer", "admin"])),
    cache: Cache = Depends(get_cache),
    recommendation_service: RecommendationService = Depends(get_recommendation_service),
    crop_model: CropRecommender = Depends(get_crop_recommender),
) -> APIResponse[CropRecommendationResponse]:
    cache_key = _cache_key("crop", user.id, payload.model_dump())
    cached = await cache.get(cache_key)
    if cached:
        cached_payload = json.loads(cached)
        return success_response(
            CropRecommendationResponse(**cached_payload, cached=True), message="cache hit"
        )

    personalization_context = await recommendation_service.get_crop_personalization_context(
        user_id=user.id,
        season=payload.season,
    )
    try:
        if settings.sagemaker_runtime_enabled:
            request_payload = payload.model_dump(mode="json")
            if personalization_context:
                request_payload["personalization_context"] = personalization_context
            response = await asyncio.to_thread(
                SageMakerInferenceService().crop_recommend, request_payload
            )
        else:
            result = crop_model.recommend(payload, personalization_context=personalization_context)
            response = CropRecommendationResponse(
                recommendations=result["recommendations"],
                model_version=result["model_version"],
                created_at=result["created_at"],
            )
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc

    rec_id = await recommendation_service.store(
        user.id,
        "crop",
        payload.model_dump(),
        {
            "recommendations": [item.model_dump(mode="json") for item in response.recommendations],
            "model_version": response.model_version,
            "personalization_context": personalization_context,
            "created_at": response.created_at,
        },
    )
    response.recommendation_id = rec_id
    await cache.set(
        cache_key, json.dumps(response.model_dump(), default=str), ttl_seconds=60 * 60 * 24
    )
    return success_response(response, message="recommendation generated")


@router.post("/price-forecast", response_model=APIResponse[PriceForecastResponse])
async def price_forecast(
    payload: PriceForecastRequest,
    user: UserInDB = Depends(require_roles(["farmer", "extension_officer", "admin"])),
    cache: Cache = Depends(get_cache),
    recommendation_service: RecommendationService = Depends(get_recommendation_service),
    price_model: PriceForecaster = Depends(get_price_forecaster),
) -> APIResponse[PriceForecastResponse]:
    cache_key = _cache_key("price", user.id, payload.model_dump())
    cached = await cache.get(cache_key)
    if cached:
        cached_payload = json.loads(cached)
        return success_response(
            PriceForecastResponse(**cached_payload, cached=True), message="cache hit"
        )

    try:
        if settings.sagemaker_runtime_enabled:
            response = await asyncio.to_thread(
                SageMakerInferenceService().price_forecast,
                payload.model_dump(mode="json"),
            )
        else:
            response = price_model.forecast(payload)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc
    price_request = payload.model_dump()
    price_request["crop_key"] = payload.crop.strip().lower()
    price_request["market_key"] = payload.market.strip().lower()
    rec_id = await recommendation_service.store(
        user.id, "price", price_request, response.model_dump()
    )
    response.recommendation_id = rec_id
    await cache.set(
        cache_key, json.dumps(response.model_dump(), default=str), ttl_seconds=60 * 60 * 24 * 7
    )
    return success_response(response, message="forecast generated")


@router.post("/water-optimization", response_model=APIResponse[WaterOptimizationResponse])
async def water_optimization(
    payload: WaterOptimizationRequest,
    user: UserInDB = Depends(require_roles(["farmer", "extension_officer", "admin"])),
    cache: Cache = Depends(get_cache),
    recommendation_service: RecommendationService = Depends(get_recommendation_service),
    external_data_service: ExternalDataService = Depends(get_external_data_service),
    water_model: WaterOptimizer = Depends(get_water_optimizer),
) -> APIResponse[WaterOptimizationResponse]:
    effective_payload = payload
    weather_context = None
    if not payload.forecast:
        location = (payload.location or user.location or "").strip()
        if not location:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Location is required to fetch weather data",
            )
        weather = await external_data_service.fetch_weather(location, days=payload.days)
        effective_payload = payload.model_copy(
            update={"forecast": weather.forecast, "location": location}
        )
        weather_context = weather

    cache_key = _cache_key("water", user.id, effective_payload.model_dump())
    cached = await cache.get(cache_key)
    if cached:
        cached_payload = json.loads(cached)
        return success_response(
            WaterOptimizationResponse(**cached_payload, cached=True), message="cache hit"
        )

    try:
        response = water_model.optimize(effective_payload)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc
    if weather_context:
        response.weather_location = weather_context.location
        response.weather_source = weather_context.source
        response.weather_cached = weather_context.cached
        response.weather_fetched_at = weather_context.fetched_at
    rec_id = await recommendation_service.store(
        user.id, "water", effective_payload.model_dump(), response.model_dump()
    )
    response.recommendation_id = rec_id
    await cache.set(
        cache_key, json.dumps(response.model_dump(), default=str), ttl_seconds=60 * 60 * 24
    )
    return success_response(response, message="schedule generated")
