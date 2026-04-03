from __future__ import annotations

from functools import lru_cache
from typing import List

from fastapi import Depends, HTTPException, Request, status
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError

from app.core.cache import Cache, get_cache
from app.core.config import settings
from app.core.database import Database
from app.core.security import decode_token
from app.models.user import UserInDB
from app.services.advisory_service import AdvisoryService
from app.services.analytics_service import AnalyticsService
from app.services.auth_service import AuthService
from app.services.crop_service import CropRecommender
from app.services.dashboard_service import DashboardService
from app.services.disease_service import DiseaseDetectionService
from app.services.external_data_service import ExternalDataService
from app.services.feedback_service import FeedbackService
from app.services.geo_hierarchy_service import GeoHierarchyService
from app.services.platform_service import PlatformService
from app.services.price_service import PriceForecaster
from app.services.recommendation_service import RecommendationService
from app.services.report_export_service import ReportExportService
from app.services.state_engine_service import StateEngineService
from app.services.state_portal_service import StatePortalService
from app.services.translation_service import TranslationService
from app.services.trend_service import TrendAnalyticsService
from app.services.water_service import WaterOptimizer

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/login")


async def get_db(request: Request) -> Database:
    db = request.app.state.db
    if db is None:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail="Database unavailable"
        )
    return db


async def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: Database = Depends(get_db),
) -> UserInDB:
    auth_service = AuthService(db)
    try:
        payload = decode_token(token, token_type="access")
        if payload.get("type") != "access":
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token type"
            )
        user_id = payload.get("sub")
        if not user_id:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token subject"
            )
    except JWTError as exc:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token"
        ) from exc

    user = await auth_service.get_user_by_id(user_id)
    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User not found")
    return user


def require_roles(allowed_roles: List[str]):
    async def checker(user: UserInDB = Depends(get_current_user)) -> UserInDB:
        if user.role not in allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN, detail="Insufficient permissions"
            )
        return user

    return checker


async def require_public_api_key(request: Request) -> str:
    api_key = request.headers.get("x-api-key") or request.query_params.get("api_key")
    allowed = settings.public_api_key_list
    if not allowed:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail="Public API keys not configured"
        )
    if not api_key or api_key not in allowed:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid API key")
    return api_key


async def get_auth_service(db: Database = Depends(get_db)) -> AuthService:
    return AuthService(db)


async def get_recommendation_service(db: Database = Depends(get_db)) -> RecommendationService:
    return RecommendationService(db)


async def get_feedback_service(db: Database = Depends(get_db)) -> FeedbackService:
    return FeedbackService(db)


async def get_dashboard_service(
    db: Database = Depends(get_db),
    cache: Cache = Depends(get_cache),
) -> DashboardService:
    return DashboardService(db, cache)


async def get_analytics_service(db: Database = Depends(get_db)) -> AnalyticsService:
    return AnalyticsService(db)


async def get_external_data_service(db: Database = Depends(get_db)) -> ExternalDataService:
    return ExternalDataService(db)


def get_public_external_data_service() -> ExternalDataService:
    return ExternalDataService()


async def get_state_engine_service(db: Database = Depends(get_db)) -> StateEngineService:
    external_data_service = ExternalDataService(db)
    geo_hierarchy_service = GeoHierarchyService(db)
    state_portal_service = StatePortalService(db)
    return StateEngineService(
        db, external_data_service, geo_hierarchy_service, state_portal_service
    )


async def get_platform_service(db: Database = Depends(get_db)) -> PlatformService:
    external_data_service = ExternalDataService(db)
    geo_hierarchy_service = GeoHierarchyService(db)
    state_portal_service = StatePortalService(db)
    state_engine_service = StateEngineService(
        db, external_data_service, geo_hierarchy_service, state_portal_service
    )
    return PlatformService(state_engine_service, external_data_service, geo_hierarchy_service)


async def get_advisory_service(db: Database = Depends(get_db)) -> AdvisoryService:
    return AdvisoryService(db)


def get_translation_service() -> TranslationService:
    return TranslationService()


async def get_report_export_service(db: Database = Depends(get_db)) -> ReportExportService:
    return ReportExportService(db)


async def get_trend_analytics_service(
    db: Database = Depends(get_db),
    cache: Cache = Depends(get_cache),
) -> TrendAnalyticsService:
    return TrendAnalyticsService(db, cache)


@lru_cache(maxsize=1)
def get_crop_recommender() -> CropRecommender:
    return CropRecommender()


@lru_cache(maxsize=1)
def get_price_forecaster() -> PriceForecaster:
    return PriceForecaster()


@lru_cache(maxsize=1)
def get_water_optimizer() -> WaterOptimizer:
    return WaterOptimizer()


@lru_cache(maxsize=1)
def get_disease_detection_service() -> DiseaseDetectionService:
    return DiseaseDetectionService()
