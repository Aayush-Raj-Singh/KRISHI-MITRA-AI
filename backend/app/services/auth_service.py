from __future__ import annotations

from datetime import datetime, timedelta, timezone
from typing import Optional

import hashlib
import secrets

from bson import ObjectId
from jose import JWTError
from motor.motor_asyncio import AsyncIOMotorDatabase

from app.core.config import settings
from app.core.security import (
    create_access_token,
    create_refresh_token,
    decode_token,
    get_password_hash,
    verify_password,
)
from app.models.user import UserInDB, default_user_document
from app.services.otp_delivery import OTPDeliveryPayload, get_otp_provider


class AuthService:
    def __init__(self, db: AsyncIOMotorDatabase):
        self._db = db
        self._collection = db["users"]
        self._reset_collection = db["password_resets"]
        self._refresh_collection = db["refresh_tokens"]
        self._mfa_collection = db["mfa_challenges"]
        self._otp_provider = get_otp_provider()

    @staticmethod
    def _now() -> datetime:
        return datetime.now(timezone.utc)

    @staticmethod
    def _lockout_remaining_seconds(user: UserInDB) -> int:
        lockout_until = getattr(user, "lockout_until", None)
        if not lockout_until:
            return 0
        now = AuthService._now()
        delta = (lockout_until - now).total_seconds()
        return int(max(delta, 0))

    async def lockout_remaining_seconds(self, phone: str) -> int:
        user = await self.get_user_by_phone(phone)
        if not user:
            return 0
        return self._lockout_remaining_seconds(user)

    async def _record_failed_login(self, user: UserInDB) -> None:
        if not user.id:
            return
        attempts = int(getattr(user, "failed_login_attempts", 0)) + 1
        payload: dict = {"failed_login_attempts": attempts, "last_failed_login_at": self._now()}
        if attempts >= settings.auth_lockout_threshold:
            payload["lockout_until"] = self._now() + timedelta(minutes=settings.auth_lockout_minutes)
            payload["failed_login_attempts"] = 0
        await self._collection.update_one(self._user_query(user.id), {"$set": payload})

    async def _record_successful_login(self, user: UserInDB) -> None:
        if not user.id:
            return
        await self._collection.update_one(
            self._user_query(user.id),
            {
                "$set": {
                    "failed_login_attempts": 0,
                    "lockout_until": None,
                    "last_login": self._now(),
                }
            },
        )

    @staticmethod
    def _user_query(user_id: str) -> dict:
        return {"_id": ObjectId(user_id)} if ObjectId.is_valid(user_id) else {"_id": user_id}

    @staticmethod
    def _hash_token(token: str) -> str:
        return hashlib.sha256(token.encode("utf-8")).hexdigest()

    async def get_user_by_phone(self, phone: str) -> Optional[UserInDB]:
        user = await self._collection.find_one({"phone": phone})
        if not user:
            return None
        return UserInDB.from_mongo(user)

    async def get_user_by_id(self, user_id: str) -> Optional[UserInDB]:
        user = await self._collection.find_one(self._user_query(user_id))
        if not user:
            return None
        return UserInDB.from_mongo(user)

    async def create_user(self, payload: dict) -> UserInDB:
        document = default_user_document(payload)
        result = await self._collection.insert_one(document)
        created = await self._collection.find_one({"_id": result.inserted_id})
        return UserInDB.from_mongo(created)

    async def authenticate_user(
        self,
        phone: str,
        password: str,
        mfa_code: str | None = None,
    ) -> Optional[UserInDB]:
        user = await self.get_user_by_phone(phone)
        if not user:
            return None
        if self._lockout_remaining_seconds(user) > 0:
            return None
        if not verify_password(password, user.hashed_password):
            await self._record_failed_login(user)
            return None
        if settings.feature_mfa_enabled and settings.mfa_enabled:
            if not mfa_code:
                await self.create_mfa_challenge(user.id, user.phone)
                return None
            valid = await self.verify_mfa_code(user.id, mfa_code)
            if not valid:
                await self._record_failed_login(user)
                return None
        await self._record_successful_login(user)
        return user

    async def _store_refresh_token(self, user_id: str, jti: str, refresh_token: str) -> None:
        now = self._now()
        expires_at = now + timedelta(days=settings.refresh_token_expire_days)
        await self._refresh_collection.insert_one(
            {
                "user_id": user_id,
                "jti": jti,
                "token_hash": self._hash_token(refresh_token),
                "created_at": now,
                "expires_at": expires_at,
                "revoked": False,
            }
        )

    async def create_tokens(self, user: UserInDB) -> dict:
        if not user.id:
            raise ValueError("User ID missing for token creation")
        refresh_jti = secrets.token_hex(16)
        access_token = create_access_token(user.id, user.role)
        refresh_token = create_refresh_token(user.id, user.role, jti=refresh_jti)
        await self._store_refresh_token(user.id, refresh_jti, refresh_token)
        return {
            "access_token": access_token,
            "refresh_token": refresh_token,
            "token_type": "bearer",
        }

    async def rotate_refresh_token(self, refresh_token: str) -> Optional[dict]:
        try:
            payload = decode_token(refresh_token, token_type="refresh")
        except JWTError:
            return None

        user_id = payload.get("sub")
        jti = payload.get("jti")
        if not user_id or not jti:
            return None

        record = await self._refresh_collection.find_one({"user_id": user_id, "jti": jti})
        if not record or record.get("revoked"):
            return None
        if record.get("expires_at") and record["expires_at"] < self._now():
            return None
        if record.get("token_hash") != self._hash_token(refresh_token):
            return None

        user = await self.get_user_by_id(user_id)
        if not user or not user.id:
            return None

        new_refresh_jti = secrets.token_hex(16)
        new_access_token = create_access_token(user.id, user.role)
        new_refresh_token = create_refresh_token(user.id, user.role, jti=new_refresh_jti)

        await self._refresh_collection.update_one(
            {"_id": record["_id"]},
            {
                "$set": {
                    "revoked": True,
                    "revoked_at": self._now(),
                    "replaced_by_jti": new_refresh_jti,
                    "reason": "token_rotated",
                }
            },
        )
        await self._store_refresh_token(user.id, new_refresh_jti, new_refresh_token)

        return {
            "access_token": new_access_token,
            "refresh_token": new_refresh_token,
            "token_type": "bearer",
        }

    async def revoke_refresh_token(self, refresh_token: str, reason: str = "logout") -> bool:
        try:
            payload = decode_token(refresh_token, token_type="refresh")
        except JWTError:
            return False

        user_id = payload.get("sub")
        jti = payload.get("jti")
        if not user_id or not jti:
            return False

        result = await self._refresh_collection.update_one(
            {
                "user_id": user_id,
                "jti": jti,
                "token_hash": self._hash_token(refresh_token),
                "revoked": False,
            },
            {
                "$set": {
                    "revoked": True,
                    "revoked_at": self._now(),
                    "reason": reason,
                }
            },
        )
        return result.modified_count > 0

    async def create_password_reset(self, phone: str, channel: str) -> dict:
        user = await self.get_user_by_phone(phone)
        if not user or not user.id:
            return {"sent": True}
        otp = f"{secrets.randbelow(1000000):06d}"
        otp_hash = hashlib.sha256(f"{otp}:{settings.jwt_secret_key}".encode("utf-8")).hexdigest()
        now = self._now()
        expires_at = now + timedelta(minutes=settings.password_reset_expire_minutes)
        await self._reset_collection.update_many(
            {"user_id": user.id, "used": False},
            {"$set": {"used": True, "revoked_at": now, "reason": "new_reset_requested"}},
        )
        await self._reset_collection.insert_one(
            {
                "user_id": user.id,
                "otp_hash": otp_hash,
                "channel": channel,
                "created_at": now,
                "expires_at": expires_at,
                "used": False,
            }
        )
        await self._otp_provider.send_otp(
            OTPDeliveryPayload(
                phone=user.email if channel == "email" and getattr(user, "email", None) else user.phone,
                otp=otp,
                channel=channel,
            )
        )
        return {"sent": True}

    async def reset_password(self, phone: str, otp: str, new_password: str) -> bool:
        user = await self.get_user_by_phone(phone)
        if not user or not user.id:
            return False
        record = await self._reset_collection.find_one(
            {"user_id": user.id, "used": False}, sort=[("created_at", -1)]
        )
        if not record:
            return False
        if record.get("expires_at") and record["expires_at"] < self._now():
            return False
        otp_hash = hashlib.sha256(f"{otp}:{settings.jwt_secret_key}".encode("utf-8")).hexdigest()
        if not secrets.compare_digest(otp_hash, record.get("otp_hash", "")):
            return False
        await self._collection.update_one(
            self._user_query(user.id),
            {"$set": {"hashed_password": get_password_hash(new_password)}},
        )
        now = self._now()
        await self._reset_collection.update_one(
            {"_id": record["_id"]},
            {"$set": {"used": True, "used_at": now}},
        )
        await self._refresh_collection.update_many(
            {"user_id": user.id, "revoked": False},
            {
                "$set": {
                    "revoked": True,
                    "revoked_at": now,
                    "reason": "password_reset",
                }
            },
        )
        return True

    async def create_mfa_challenge(self, user_id: str, phone: str) -> None:
        otp = f"{secrets.randbelow(1000000):06d}"
        otp_hash = hashlib.sha256(f"{otp}:{settings.jwt_refresh_secret_key}".encode("utf-8")).hexdigest()
        now = self._now()
        expires_at = now + timedelta(minutes=settings.mfa_otp_expire_minutes)
        await self._mfa_collection.update_many(
            {"user_id": user_id, "used": False},
            {"$set": {"used": True, "revoked_at": now, "reason": "new_challenge_requested"}},
        )
        await self._mfa_collection.insert_one(
            {
                "user_id": user_id,
                "otp_hash": otp_hash,
                "created_at": now,
                "expires_at": expires_at,
                "used": False,
            }
        )
        await self._otp_provider.send_otp(
            OTPDeliveryPayload(
                phone=phone,
                otp=otp,
                channel="sms",
            )
        )

    async def verify_mfa_code(self, user_id: str, otp: str) -> bool:
        challenge = await self._mfa_collection.find_one(
            {"user_id": user_id, "used": False},
            sort=[("created_at", -1)],
        )
        if not challenge:
            return False
        if challenge.get("expires_at") and challenge["expires_at"] < self._now():
            return False
        otp_hash = hashlib.sha256(f"{otp}:{settings.jwt_refresh_secret_key}".encode("utf-8")).hexdigest()
        if not secrets.compare_digest(challenge.get("otp_hash", ""), otp_hash):
            return False
        await self._mfa_collection.update_one(
            {"_id": challenge["_id"]},
            {"$set": {"used": True, "used_at": self._now()}},
        )
        return True
