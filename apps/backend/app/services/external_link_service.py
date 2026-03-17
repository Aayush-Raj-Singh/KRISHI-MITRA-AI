from __future__ import annotations

import ipaddress
from datetime import datetime, timezone
from typing import Optional
from urllib.parse import urlparse

from app.core.database import Database

from app.core.config import settings
from app.schemas.links import ExternalLinkCheckResponse


class ExternalLinkService:
    def __init__(self, db: Optional[Database]) -> None:
        self._db = db
        self._collection = db["external_links"] if db is not None else None

    @staticmethod
    def _is_ip_address(host: str) -> bool:
        try:
            ipaddress.ip_address(host)
            return True
        except ValueError:
            return False

    @staticmethod
    def _is_private_ip(host: str) -> bool:
        try:
            ip = ipaddress.ip_address(host)
            return ip.is_private or ip.is_loopback or ip.is_reserved or ip.is_link_local
        except ValueError:
            return False

    def _is_allowed_domain(self, host: str) -> bool:
        allowlist = settings.external_link_allowlist_domains
        if not allowlist:
            return False
        host = host.lower()
        return any(host == domain or host.endswith(f".{domain}") for domain in allowlist)

    async def check(self, url: str) -> ExternalLinkCheckResponse:
        parsed = urlparse(url)
        host = parsed.hostname or ""
        safe = True
        verified = False
        reason = None

        if parsed.scheme not in {"http", "https"}:
            safe = False
            reason = "Only http/https URLs are allowed"
        elif not host:
            safe = False
            reason = "URL is missing host"
        elif self._is_ip_address(host) and self._is_private_ip(host):
            safe = False
            reason = "Private network addresses are blocked"

        if safe:
            verified = self._is_allowed_domain(host)

        response = ExternalLinkCheckResponse(
            url=url,
            safe=safe,
            verified=verified,
            domain=host or None,
            reason=reason,
            checked_at=datetime.now(timezone.utc),
        )

        if self._collection is not None:
            await self._collection.insert_one(response.model_dump())

        return response
