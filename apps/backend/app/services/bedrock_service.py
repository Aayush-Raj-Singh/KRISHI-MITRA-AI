from __future__ import annotations

import json
from typing import Any, Dict, List, Tuple

import boto3
from botocore.exceptions import BotoCoreError, ClientError

from app.core.config import settings
from app.core.logging import get_logger
from app.services.llm_provider import BaseLLMService, build_llm_prompt

logger = get_logger(__name__)


class BedrockService(BaseLLMService):
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
        self.client = boto3.client("bedrock-runtime", region_name=settings.aws_region)
        self.translate_client = boto3.client("translate", region_name=settings.aws_region)
        self.model_id = settings.bedrock_model_id
        self.fallback_model_id = settings.bedrock_fallback_model_id
        self.max_tokens = settings.llm_max_tokens
        self.temperature = settings.llm_temperature

    def describe_runtime(self) -> Dict[str, Any]:
        return {
            "provider": "bedrock",
            "implementation": type(self).__name__,
            "model_id": self.model_id,
            "fallback_model_id": self.fallback_model_id,
            "supports_fallback": True,
            "max_tokens": self.max_tokens,
            "temperature": self.temperature,
        }

    def _build_prompt(
        self,
        system_prompt: str,
        user_context: Dict[str, Any],
        conversation: List[Dict[str, str]],
        user_message: str,
        language: str,
        retrieved_context: List[Dict[str, str]] | None = None,
    ) -> str:
        return build_llm_prompt(
            system_prompt=system_prompt,
            user_context=user_context,
            conversation=conversation,
            user_message=user_message,
            language=language,
            retrieved_context=retrieved_context,
        )

    def _translate_text(self, text: str, source_language: str, target_language: str) -> str:
        src = self._LANG_TO_TRANSLATE_CODE.get(source_language.lower(), source_language.lower())
        dst = self._LANG_TO_TRANSLATE_CODE.get(target_language.lower(), target_language.lower())
        if src == dst:
            return text
        response = self.translate_client.translate_text(
            Text=text,
            SourceLanguageCode=src,
            TargetLanguageCode=dst,
        )
        translated = response.get("TranslatedText")
        return translated if isinstance(translated, str) and translated.strip() else text

    def translate_text(
        self, text: str, source_language: str = "auto", target_language: str = "en"
    ) -> str:
        content = text.strip()
        if not content:
            return text
        return self._translate_text(
            content, source_language=source_language, target_language=target_language
        )

    def _invoke_converse(self, prompt: str, model_id: str) -> str:
        response = self.client.converse(
            modelId=model_id,
            messages=[
                {
                    "role": "user",
                    "content": [
                        {"text": prompt},
                    ],
                }
            ],
            inferenceConfig={
                "maxTokens": self.max_tokens,
                "temperature": self.temperature,
            },
        )
        content = response.get("output", {}).get("message", {}).get("content", [])
        if isinstance(content, list):
            return "".join(item.get("text", "") for item in content if isinstance(item, dict))
        return ""

    def _invoke_titan(self, prompt: str, model_id: str) -> str:
        body = {
            "inputText": prompt,
            "textGenerationConfig": {
                "maxTokenCount": self.max_tokens,
                "temperature": self.temperature,
            },
        }
        response = self.client.invoke_model(
            modelId=model_id,
            body=json.dumps(body),
            contentType="application/json",
            accept="application/json",
        )
        payload = json.loads(response["body"].read())
        results = payload.get("results", [])
        if results:
            return results[0].get("outputText", "")
        return payload.get("outputText", "")

    def _invoke_model(self, prompt: str, model_id: str) -> str:
        normalized = (model_id or "").strip().lower()
        if normalized.startswith("amazon.titan"):
            return self._invoke_titan(prompt, model_id)
        if normalized:
            return self._invoke_converse(prompt, model_id)
        return self._invoke_titan(prompt, model_id)

    def generate_reply(
        self,
        system_prompt: str,
        user_context: Dict[str, Any],
        conversation: List[Dict[str, str]],
        user_message: str,
        language: str,
        retrieved_context: List[Dict[str, str]] | None = None,
    ) -> Tuple[str, str, bool]:
        prompt_message = user_message
        prompt_context = retrieved_context
        translated_query = False
        if language.lower() != "en":
            try:
                prompt_message = self._translate_text(
                    user_message, source_language=language, target_language="en"
                )
                prompt_context = []
                for item in retrieved_context or []:
                    translated_item = dict(item)
                    translated_item["content"] = self._translate_text(
                        str(item.get("content", "")),
                        source_language="auto",
                        target_language="en",
                    )
                    prompt_context.append(translated_item)
                translated_query = True
            except Exception as exc:
                logger.warning("translate_query_failed", language=language, error=str(exc))

        prompt = self._build_prompt(
            system_prompt,
            user_context,
            conversation,
            prompt_message,
            "en" if translated_query else language,
            retrieved_context=prompt_context,
        )
        try:
            reply = self._invoke_model(prompt, self.model_id)
            model_used = self.model_id
            fallback_used = False
        except (BotoCoreError, ClientError, KeyError, ValueError) as exc:
            logger.warning("Bedrock invocation failed, attempting fallback", error=str(exc))
            try:
                reply = self._invoke_model(prompt, self.fallback_model_id)
                model_used = self.fallback_model_id
                fallback_used = True
            except (BotoCoreError, ClientError, KeyError, ValueError) as fallback_exc:
                logger.error("Bedrock fallback failed", error=str(fallback_exc))
                raise

        final_reply = reply.strip()
        if translated_query and language.lower() != "en":
            try:
                final_reply = self._translate_text(
                    final_reply, source_language="en", target_language=language
                )
            except Exception as exc:
                logger.warning("translate_reply_failed", language=language, error=str(exc))
        return final_reply, model_used, fallback_used

    def health_check(self, test_fallback: bool = False) -> Dict[str, Any]:
        result: Dict[str, Any] = {
            "available": True,
            "primary_model": {"model_id": self.model_id, "ok": False},
        }
        if settings.should_mock_runtime_validation:
            result["mocked"] = True
            result["primary_model"]["ok"] = True
            result["primary_model"]["sample"] = "OK"
            if test_fallback:
                result["fallback_model"] = {
                    "model_id": self.fallback_model_id,
                    "ok": True,
                    "sample": "OK",
                    "mocked": True,
                }
            return result

        prompt = "Return the word: OK"
        try:
            reply = self._invoke_model(prompt, self.model_id)
            result["primary_model"]["ok"] = bool(reply.strip())
            result["primary_model"]["sample"] = reply.strip()[:120]
        except Exception as exc:
            result["available"] = False
            result["primary_model"]["error"] = str(exc)

        if test_fallback:
            result["fallback_model"] = {"model_id": self.fallback_model_id, "ok": False}
            try:
                reply = self._invoke_model(prompt, self.fallback_model_id)
                result["fallback_model"]["ok"] = bool(reply.strip())
                result["fallback_model"]["sample"] = reply.strip()[:120]
            except Exception as exc:
                result["available"] = False
                result["fallback_model"]["error"] = str(exc)

        return result
