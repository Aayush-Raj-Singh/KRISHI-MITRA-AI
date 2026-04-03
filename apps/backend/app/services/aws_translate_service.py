from __future__ import annotations

import boto3

from app.core.config import settings


class AWSTranslateService:
    _LANG_TO_TRANSLATE_CODE = {
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
        self.client = boto3.client("translate", region_name=settings.aws_region)

    def translate_text(
        self, text: str, source_language: str = "auto", target_language: str = "en"
    ) -> str:
        content = text.strip()
        if not content:
            return text
        src = self._LANG_TO_TRANSLATE_CODE.get(source_language.lower(), source_language.lower())
        dst = self._LANG_TO_TRANSLATE_CODE.get(target_language.lower(), target_language.lower())
        if src == dst:
            return text
        response = self.client.translate_text(
            Text=content,
            SourceLanguageCode=src,
            TargetLanguageCode=dst,
        )
        translated = response.get("TranslatedText")
        return translated if isinstance(translated, str) and translated.strip() else text
