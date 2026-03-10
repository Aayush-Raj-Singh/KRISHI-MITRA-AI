from __future__ import annotations

import math
from datetime import datetime, timezone
from time import perf_counter
from typing import Any, Dict, List, Tuple

from bson import ObjectId
from motor.motor_asyncio import AsyncIOMotorDatabase

from app.core.config import settings
from app.core.logging import get_logger
from app.models.conversation import default_conversation_record
from app.models.user import UserInDB
from app.rag import KnowledgeBaseRetriever
from app.schemas.advisory import SUPPORTED_ADVISORY_LANGUAGES, AdvisorySlaTelemetry
from app.services.bedrock_service import BedrockService

logger = get_logger(__name__)


class AdvisoryService:
    def __init__(self, db: AsyncIOMotorDatabase) -> None:
        self._collection = db["conversations"]
        self._telemetry = db["advisory_telemetry"]
        self._retriever = KnowledgeBaseRetriever()
        try:
            self._bedrock = BedrockService()
        except Exception as exc:  # noqa: BLE001
            logger.warning("bedrock_client_init_failed", error=str(exc))
            self._bedrock = None

    async def _get_conversation(self, user_id: str) -> Tuple[str, List[Dict[str, str]]]:
        conversation = await self._collection.find_one({"user_id": user_id})
        if not conversation:
            result = await self._collection.insert_one(default_conversation_record(user_id, []))
            return str(result.inserted_id), []
        return str(conversation.get("_id")), conversation.get("messages", [])

    async def get_history(self, user_id: str, limit: int = 20) -> List[Dict[str, Any]]:
        _, history = await self._get_conversation(user_id)
        return history[-max(limit, 1) :]

    @staticmethod
    def _system_prompt() -> str:
        return (
            "You are KrishiMitra, an expert agricultural advisor for Indian farmers. "
            "Provide practical, actionable advice based on scientific principles and local practices.\n"
            "Guidelines:\n"
            "- Respond in the requested language.\n"
            "- Use simple, farmer-friendly terminology.\n"
            "- If uncertain, explicitly acknowledge uncertainty.\n"
            "- Prioritize advice that is safe, season-aware, and region-aware.\n"
            "- Cite supporting references at the end in the format: Sources: <name1>, <name2>."
        )

    @staticmethod
    def _fallback_response(language: str) -> str:
        localized = {
            "en": "Advisory service is temporarily unavailable. Please try again shortly or contact your local extension officer.",
            "hi": "Salah seva abhi asthayi roop se upalabdh nahin hai. Kripya thodi der baad phir prayas karen.",
            "bn": "Poramorsho sheba ekhon shamoyikvabe upolobdho noy. Onugroho kore kichukhon por abar cheshta korun.",
            "ta": "Aalosanai sevai tharkaalikamaaga kidaikkavillai. Siridhu neram kazhithu meendum muyarchi seyyavum.",
            "te": "Salahaa seva prastutam taatkalikanga andubaatulo ledu. Konchem tarvata malli prayatninchandi.",
            "mr": "Salla seva sadhya tatpurti upalabdh nahi. Krupaya kahi velanantar punha prayatna kara.",
            "gu": "Salah seva haalma tatkalik rite upalabdh nathi. Krupaya thodi vaar pachi fari prayas karo.",
            "kn": "Salahhe seva taatkalikavagi labhyavilla. Dayavittu swalpa samayada nantara matte prayatnisi.",
            "pa": "Salah seva is vele asthai taur te uplabdh nahin hai. Kirpa karke kujh samay baad dubara koshish karo.",
            "as": "Poramorsho sewa etia samoyik bhabe upolobdho nohoi. Anugroho kori olop pora punor chesta korok.",
            "ml": "Upadesa sevanam tatkalikamayi labhyamalla. Dayavayi kurachu samayam kazhinju veendum sramikkuka.",
            "or": "Paramarsa seba barttaman samayina bhabe upalabdha nuhein. Daya kari kichhi samaya pare puni chesta karantu.",
            "ur": "Mashwarati service filhal arzi taur par dastiyab nahin hai. Barah-e-karam kuch dair baad dobara koshish karein.",
            "ne": "Paramarsha sewa haal asthayi rupma upalabdha chaina. Kripaya kehi samay pachi feri prayas garnuhos.",
            "sa": "Paramarsha-seva adya tatkalikata anupalabdha asti. Kripaya kinchit-kalanantaram punah prayatnam kuruta.",
        }
        return localized.get(language, localized["en"])


    async def advisory_sla_telemetry(self, window_minutes: int = 1440, sla_target_ms: float = 3000.0) -> AdvisorySlaTelemetry:
        now = datetime.now(timezone.utc)
        since_epoch = now.timestamp() - (window_minutes * 60)
        docs = await self._telemetry.find({"ts_epoch": {"$gte": since_epoch}}).to_list(length=None)

        latencies = sorted(float(doc.get("latency_ms", 0.0)) for doc in docs if doc.get("latency_ms") is not None)
        total_requests = len(docs)
        successful_requests = len([doc for doc in docs if str(doc.get("status")) == "success"])
        fallback_responses = len([doc for doc in docs if bool(doc.get("is_fallback"))])

        def _percentile(values: List[float], percentile: float) -> float:
            if not values:
                return 0.0
            rank = math.ceil((percentile / 100.0) * len(values))
            index = min(max(rank - 1, 0), len(values) - 1)
            return round(values[index], 2)

        language_distribution: dict[str, int] = {}
        for doc in docs:
            key = str(doc.get("language") or "en")
            language_distribution[key] = language_distribution.get(key, 0) + 1

        p50 = _percentile(latencies, 50)
        p95 = _percentile(latencies, 95)

        return AdvisorySlaTelemetry(
            window_minutes=window_minutes,
            total_requests=total_requests,
            successful_requests=successful_requests,
            fallback_responses=fallback_responses,
            p50_latency_ms=p50,
            p95_latency_ms=p95,
            sla_target_ms=sla_target_ms,
            sla_compliant=(p95 <= sla_target_ms if total_requests else True),
            language_distribution=language_distribution,
            generated_at=now,
        )

    async def chat(self, user: UserInDB, message: str, language: str | None) -> Dict[str, Any]:
        started = perf_counter()
        conversation_id, history = await self._get_conversation(user.id)
        language_code = (language or user.language or "en").lower().strip()
        if language_code not in SUPPORTED_ADVISORY_LANGUAGES:
            logger.warning("unsupported_advisory_language_fallback", language=language_code, user_id=user.id)
            language_code = "en"
        history = history[-12:]

        user_context = {
            "Farmer name": user.name,
            "Location": user.location,
            "Farm size acres": user.farm_size,
            "Soil type": user.soil_type,
            "Primary crops": ", ".join(user.primary_crops),
            "Preferred language": language_code,
        }

        retrieved = self._retriever.retrieve(message, top_k=settings.rag_top_k)
        retrieved_context = [
            {
                "source": doc.name,
                "reference": doc.reference,
                "content": doc.text,
            }
            for doc in retrieved
        ]
        source_items = [{"title": doc.name, "reference": doc.reference} for doc in retrieved]
        source_names = [doc.name for doc in retrieved]

        status = "fallback"
        if self._bedrock:
            try:
                reply, model_used, is_fallback = self._bedrock.generate_reply(
                    system_prompt=self._system_prompt(),
                    user_context=user_context,
                    conversation=history,
                    user_message=message,
                    language=language_code,
                    retrieved_context=retrieved_context,
                )
                status = "success"
            except Exception as exc:  # noqa: BLE001
                logger.warning("bedrock_unavailable_using_fallback", error=str(exc))
                reply = self._fallback_response(language_code)
                model_used = "fallback"
                is_fallback = True
                status = "fallback"
        else:
            reply = self._fallback_response(language_code)
            model_used = "fallback"
            is_fallback = True
            status = "fallback"

        if source_names:
            sources_line = f"Sources: {', '.join(source_names)}"
            if "Sources:" not in reply:
                reply = f"{reply.strip()}\n\n{sources_line}"
        elif "uncertain" not in reply.lower():
            reply = (
                f"{reply.strip()}\n\n"
                "Note: I could not retrieve supporting references for this query. "
                "Please validate with a local extension officer."
            )

        now = datetime.now(timezone.utc)
        new_history = history + [
            {"role": "user", "content": message, "language": language_code, "timestamp": now.isoformat()},
            {"role": "assistant", "content": reply, "language": language_code, "timestamp": now.isoformat()},
        ]

        query_id = ObjectId(conversation_id) if ObjectId.is_valid(conversation_id) else conversation_id
        await self._collection.update_one(
            {"_id": query_id},
            {"$set": {"messages": new_history, "updated_at": datetime.now(timezone.utc)}},
            upsert=True,
        )

        latency_ms = round((perf_counter() - started) * 1000, 2)
        await self._telemetry.insert_one(
            {
                "user_id": user.id,
                "language": language_code,
                "latency_ms": latency_ms,
                "status": status,
                "is_fallback": is_fallback,
                "model": model_used,
                "ts_epoch": datetime.now(timezone.utc).timestamp(),
                "created_at": datetime.now(timezone.utc),
            }
        )
        if latency_ms > 5000:
            logger.warning("advisory_latency_sla_breach", latency_ms=latency_ms, model=model_used)

        return {
            "reply": reply,
            "language": language_code,
            "model": model_used,
            "sources": source_items,
            "is_fallback": is_fallback,
            "latency_ms": latency_ms,
            "conversation_id": conversation_id,
            "created_at": datetime.now(timezone.utc),
        }
