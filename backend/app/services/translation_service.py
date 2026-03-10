from __future__ import annotations

from typing import Dict, Iterable

import httpx

from app.core.logging import get_logger
from app.services.bedrock_service import BedrockService

logger = get_logger(__name__)


class TranslationService:
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
        try:
            self._bedrock = BedrockService()
        except Exception as exc:  # noqa: BLE001
            logger.warning("aws_translate_unavailable", error=str(exc))
            self._bedrock = None

    @staticmethod
    def _is_effective_translation(original: str, translated: str, target_language: str) -> bool:
        if not translated or not translated.strip():
            return False
        if target_language == "en":
            return True
        if translated.strip() != original.strip():
            return True
        # If source text is only numeric/punctuation, equal output is acceptable.
        has_ascii_letters = any(("a" <= ch <= "z") or ("A" <= ch <= "Z") for ch in original)
        return not has_ascii_letters

    @classmethod
    def _public_code(cls, language: str) -> str:
        return cls._LANG_TO_PUBLIC_CODE.get(language.lower().strip(), language.lower().strip())

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
        except Exception as exc:  # noqa: BLE001
            logger.warning("public_translate_failed", error=str(exc), target_language=target_language)
            return None

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
        async with httpx.AsyncClient(timeout=10.0) as client:
            for text in unique_texts:
                translated: str | None = None

                if self._bedrock is not None:
                    try:
                        candidate = self._bedrock.translate_text(
                            text=text,
                            source_language=source,
                            target_language=target,
                        )
                        if self._is_effective_translation(text, candidate, target):
                            translated = candidate
                    except Exception as exc:  # noqa: BLE001
                        logger.warning("aws_translate_failed", error=str(exc), target_language=target)

                if translated is None:
                    candidate = await self._translate_via_public_endpoint(client, text, source, target)
                    if candidate and self._is_effective_translation(text, candidate, target):
                        translated = candidate

                results[text] = translated or text

        return results
