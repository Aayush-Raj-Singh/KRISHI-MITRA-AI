from __future__ import annotations

import asyncio
import hashlib
from typing import Dict, Iterable, Optional, List

import httpx
from botocore.exceptions import ClientError

from app.core.config import settings
from app.core.cache import Cache, get_cache
from app.core.exceptions import ExternalServiceUnavailableError
from app.core.logging import get_logger
from app.services.bedrock_service import BedrockService

logger = get_logger(__name__)


class TranslationService:
    _AWS_TRANSLATE_AVAILABLE: Optional[bool] = None
    _LOCAL_CACHE: Dict[str, str] = {}
    _LOCAL_CACHE_MAX = 5000
    _CACHE_TTL_SECONDS = 60 * 60 * 24 * 7
    _MAX_CONCURRENCY = 8

    _LANG_TO_PUBLIC_CODE = {
        "en": "en",
        "hi": "hi",
        "bn": "bn",
        "ta": "ta",
        "te": "te",
        "mr": "mr",
        "gu": "gu",
        "kn": "kn",
        "pa": "pa",
        "as": "as",
        "ml": "ml",
        "or": "or",
        "ur": "ur",
        "ne": "ne",
        "sa": "sa",
        "auto": "auto",
    }

    def __init__(self) -> None:
        self._aws_translate_enabled = settings.aws_translate_enabled
        if TranslationService._AWS_TRANSLATE_AVAILABLE is False:
            self._aws_translate_enabled = False
        try:
            self._bedrock = BedrockService() if self._aws_translate_enabled else None
        except Exception as exc:
            logger.warning("aws_translate_unavailable", error=str(exc))
            if settings.is_production and self._aws_translate_enabled:
                raise ExternalServiceUnavailableError("AWS translation runtime is unavailable") from exc
            self._bedrock = None
            TranslationService._AWS_TRANSLATE_AVAILABLE = False
        else:
            if self._bedrock is not None and TranslationService._AWS_TRANSLATE_AVAILABLE is None:
                TranslationService._AWS_TRANSLATE_AVAILABLE = True
        self._cache: Cache = get_cache()

    @staticmethod
    def _latin1_score(text: str) -> int:
        return sum(1 for ch in text if 0x00C0 <= ord(ch) <= 0x00FF or 0x0080 <= ord(ch) <= 0x009F)

    @staticmethod
    def _indic_score(text: str) -> int:
        return sum(
            1
            for ch in text
            if 0x0900 <= ord(ch) <= 0x0D7F
            or 0x0980 <= ord(ch) <= 0x09FF
            or 0x0A00 <= ord(ch) <= 0x0A7F
            or 0x0A80 <= ord(ch) <= 0x0AFF
            or 0x0B00 <= ord(ch) <= 0x0B7F
            or 0x0B80 <= ord(ch) <= 0x0BFF
            or 0x0C00 <= ord(ch) <= 0x0C7F
            or 0x0C80 <= ord(ch) <= 0x0CFF
        )

    @classmethod
    def _repair_mojibake(cls, text: str) -> str:
        if not text:
            return text
        if cls._latin1_score(text) < 2:
            return text
        original_indic = cls._indic_score(text)
        original_latin1 = cls._latin1_score(text)
        try:
            repaired = text.encode("latin1").decode("utf-8")
        except Exception:
            return text
        if cls._indic_score(repaired) >= original_indic + 2:
            return repaired
        if cls._latin1_score(repaired) < original_latin1:
            return repaired
        return text

    @staticmethod
    def _is_effective_translation(original: str, translated: str, target_language: str) -> bool:
        if not translated or not translated.strip():
            return False
        if target_language == "en":
            return True
        if translated.strip() != original.strip():
            return True
        has_ascii_letters = any(("a" <= ch <= "z") or ("A" <= ch <= "Z") for ch in original)
        return not has_ascii_letters

    @classmethod
    def _public_code(cls, language: str) -> str:
        return cls._LANG_TO_PUBLIC_CODE.get(language.lower().strip(), language.lower().strip())

    @classmethod
    def _cache_key(cls, source_language: str, target_language: str, text: str) -> str:
        digest = hashlib.sha256(text.encode("utf-8")).hexdigest()
        return f"translate:{source_language}:{target_language}:{digest}"

    async def _get_cached(
        self,
        key: str,
        original_text: Optional[str] = None,
        target_language: Optional[str] = None,
    ) -> Optional[str]:
        cached = self._LOCAL_CACHE.get(key)
        if cached:
            cached = self._repair_mojibake(cached)
            if original_text is not None and target_language is not None:
                if not self._is_effective_translation(original_text, cached, target_language):
                    return None
            return cached
        try:
            cached = await self._cache.get(key)
        except Exception:
            cached = None
        if cached:
            fixed = self._repair_mojibake(cached)
            if original_text is not None and target_language is not None:
                if not self._is_effective_translation(original_text, fixed, target_language):
                    return None
            self._LOCAL_CACHE[key] = fixed
            return fixed
        return None

    async def _set_cached(self, key: str, value: str) -> None:
        if len(self._LOCAL_CACHE) >= self._LOCAL_CACHE_MAX:
            for _ in range(200):
                self._LOCAL_CACHE.pop(next(iter(self._LOCAL_CACHE)), None)
                if len(self._LOCAL_CACHE) < self._LOCAL_CACHE_MAX:
                    break
        self._LOCAL_CACHE[key] = value
        try:
            await self._cache.set(key, value, ttl_seconds=self._CACHE_TTL_SECONDS)
        except Exception:
            return

    async def _translate_via_public_endpoint(
        self,
        client: httpx.AsyncClient,
        text: str,
        source_language: str,
        target_language: str,
    ) -> str | None:
        source_code = self._public_code(source_language)
        target_code = self._public_code(target_language)
        if source_code == target_code:
            return text

        try:
            response = await client.get(
                "https://translate.googleapis.com/translate_a/single",
                params={
                    "client": "gtx",
                    "sl": source_code,
                    "tl": target_code,
                    "dt": "t",
                    "q": text,
                },
            )
            response.raise_for_status()
            payload = response.json()
            segments = payload[0] if isinstance(payload, list) and payload else []
            translated = "".join(
                part[0] for part in segments if isinstance(part, list) and part and isinstance(part[0], str)
            ).strip()
            return translated or None
        except Exception as exc:
            logger.warning("public_translate_failed", error=str(exc), target_language=target_language)
            return None

    async def _translate_single(
        self,
        client: httpx.AsyncClient,
        text: str,
        source_language: str,
        target_language: str,
        semaphore: asyncio.Semaphore,
    ) -> tuple[str, str]:
        async with semaphore:
            translated: str | None = None

            if self._bedrock is not None and self._aws_translate_enabled:
                try:
                    candidate = await asyncio.to_thread(
                        self._bedrock.translate_text,
                        text,
                        source_language,
                        target_language,
                    )
                    if self._is_effective_translation(text, candidate, target_language):
                        translated = candidate
                except ClientError as exc:
                    error_code = ""
                    try:
                        error_code = str(exc.response.get("Error", {}).get("Code", ""))
                    except Exception:
                        error_code = ""
                    if error_code in {
                        "SubscriptionRequiredException",
                        "AccessDeniedException",
                        "UnrecognizedClientException",
                        "UnauthorizedOperation",
                    } or "SubscriptionRequiredException" in str(exc):
                        self._aws_translate_enabled = False
                        self._bedrock = None
                        TranslationService._AWS_TRANSLATE_AVAILABLE = False
                        logger.warning(
                            "aws_translate_disabled",
                            error_code=error_code,
                            error=str(exc),
                        )
                    else:
                        logger.warning("aws_translate_failed", error=str(exc), target_language=target_language)
                except Exception as exc:
                    logger.warning("aws_translate_failed", error=str(exc), target_language=target_language)

            if translated is None and settings.allow_runtime_fallbacks and settings.public_translate_fallback_enabled:
                candidate = await self._translate_via_public_endpoint(client, text, source_language, target_language)
                if candidate and self._is_effective_translation(text, candidate, target_language):
                    translated = candidate

            if translated is None and settings.is_production:
                raise ExternalServiceUnavailableError("Translation service is unavailable")

            output = translated or text
            output = self._repair_mojibake(output)
            return text, output

    async def translate_many(
        self,
        texts: Iterable[str],
        source_language: str,
        target_language: str,
    ) -> Dict[str, str]:
        source = source_language.lower().strip()
        target = target_language.lower().strip()

        unique_texts = []
        seen = set()
        for text in texts:
            content = text.strip()
            if not content or content in seen:
                continue
            seen.add(content)
            unique_texts.append(content)

        if not unique_texts or source == target:
            return {text: text for text in unique_texts}

        results: Dict[str, str] = {}
        cache_keys: Dict[str, str] = {}
        missing_texts: List[str] = []

        for text in unique_texts:
            cache_key = self._cache_key(source, target, text)
            cache_keys[text] = cache_key
            cached = await self._get_cached(cache_key, text, target)
            if cached:
                results[text] = cached
            else:
                missing_texts.append(text)

        if not missing_texts:
            return results

        semaphore = asyncio.Semaphore(self._MAX_CONCURRENCY)
        async with httpx.AsyncClient(timeout=10.0) as client:
            tasks = [
                self._translate_single(client, text, source, target, semaphore)
                for text in missing_texts
            ]
            for text, translated in await asyncio.gather(*tasks):
                results[text] = translated
                if self._is_effective_translation(text, translated, target):
                    await self._set_cached(cache_keys[text], translated)

        return results
