from __future__ import annotations

import asyncio
import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from app.core.config import settings
from app.services.llm_factory import get_llm_service
from app.services.translation_service import TranslationService


async def main_async() -> int:
    payload: dict[str, object] = {
        "llm_provider": settings.llm_provider,
        "translation_provider": settings.translation_provider,
        "runtime_validation_mock_mode": settings.should_mock_runtime_validation,
    }

    ok = True

    try:
        llm = get_llm_service()
        llm_status = await asyncio.to_thread(llm.health_check, False)
        llm_status["implementation"] = type(llm).__name__
        payload["llm"] = llm_status
        if not bool(llm_status.get("available")):
            ok = False
    except Exception as exc:
        payload["llm"] = {
            "available": False,
            "error": str(exc),
        }
        ok = False

    try:
        translation_service = TranslationService()
        translation_status = await translation_service.health_check()
        payload["translation"] = translation_status
        if not bool(translation_status.get("available")):
            ok = False
    except Exception as exc:
        payload["translation"] = {
            "available": False,
            "error": str(exc),
        }
        ok = False

    payload["summary"] = {"ok": ok}
    print(json.dumps(payload, indent=2, default=str))
    return 0 if ok else 1


def main() -> None:
    raise SystemExit(asyncio.run(main_async()))


if __name__ == "__main__":
    main()
