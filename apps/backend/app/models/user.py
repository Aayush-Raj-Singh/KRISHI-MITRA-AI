from __future__ import annotations

from datetime import datetime, timezone
from typing import Any, Dict, List, Optional

from pydantic import BaseModel, Field


class UserInDB(BaseModel):
    id: Optional[str] = Field(default=None, alias="_id")
    name: str
    phone: str
    email: Optional[str] = None
    profile_image_url: Optional[str] = None
    hashed_password: str
    role: str
    location: str
    farm_size: float
    soil_type: str
    water_source: str
    primary_crops: List[str]
    language: str
    assigned_regions: List[str] = Field(default_factory=list)
    risk_view_consent: bool = False
    failed_login_attempts: int = 0
    lockout_until: Optional[datetime] = None
    last_login: Optional[datetime] = None
    created_at: datetime
    updated_at: Optional[datetime] = None
    farm_profile: Optional[Dict[str, Any]] = None
    preferences: Optional[Dict[str, Any]] = None

    model_config = {
        "populate_by_name": True,
        "arbitrary_types_allowed": True,
    }

    @classmethod
    def from_record(cls, data: Dict[str, Any]) -> "UserInDB":
        if not data:
            raise ValueError("No data to build UserInDB")
        data = dict(data)
        data["_id"] = str(data.get("_id"))
        return cls(**data)


def default_user_document(payload: Dict[str, Any]) -> Dict[str, Any]:
    now = datetime.now(timezone.utc)
    assigned_regions = [
        str(item).strip() for item in payload.get("assigned_regions", []) if str(item).strip()
    ]
    return {
        "name": payload["name"],
        "phone": payload["phone"],
        "email": payload.get("email"),
        "profile_image_url": payload.get("profile_image_url"),
        "hashed_password": payload["hashed_password"],
        "role": payload["role"],
        "location": payload["location"],
        "farm_size": payload["farm_size"],
        "soil_type": payload["soil_type"],
        "water_source": payload["water_source"],
        "primary_crops": payload["primary_crops"],
        "language": payload["language"],
        "assigned_regions": assigned_regions,
        "farm_profile": {
            "location": payload["location"],
            "farm_size": payload["farm_size"],
            "soil_type": payload["soil_type"],
            "water_source": payload["water_source"],
            "primary_crops": payload["primary_crops"],
        },
        "preferences": {
            "notifications": bool(payload.get("notifications", True)),
            "voice_input": bool(payload.get("voice_input", True)),
        },
        "risk_view_consent": bool(payload.get("risk_view_consent", False)),
        "failed_login_attempts": 0,
        "lockout_until": None,
        "last_login": None,
        "created_at": now,
        "updated_at": now,
    }
