from __future__ import annotations

from app.models.user import UserInDB
from app.schemas.auth import FarmProfile, UserPublic


def to_public_user(user: UserInDB) -> UserPublic:
    return UserPublic(
        id=user.id,
        name=user.name,
        phone=user.phone,
        email=getattr(user, "email", None),
        profile_image_url=getattr(user, "profile_image_url", None),
        role=user.role,
        location=user.location,
        farm_size=user.farm_size,
        soil_type=user.soil_type,
        water_source=user.water_source,
        primary_crops=user.primary_crops,
        language=user.language,
        assigned_regions=getattr(user, "assigned_regions", []),
        risk_view_consent=getattr(user, "risk_view_consent", False),
        created_at=user.created_at,
        updated_at=getattr(user, "updated_at", None),
        preferences=getattr(user, "preferences", None),
    )


def to_farm_profile(user: UserInDB) -> FarmProfile:
    profile = getattr(user, "farm_profile", None) or {}
    return FarmProfile(
        location=str(profile.get("location") or user.location),
        farm_size=float(profile.get("farm_size") or user.farm_size),
        soil_type=str(profile.get("soil_type") or user.soil_type),
        water_source=str(profile.get("water_source") or user.water_source),
        primary_crops=list(profile.get("primary_crops") or user.primary_crops),
    )
