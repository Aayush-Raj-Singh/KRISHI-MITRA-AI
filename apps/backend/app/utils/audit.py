from __future__ import annotations

from datetime import datetime
from typing import Any, Dict, Optional

from app.core.database import Database


async def log_audit_event(
    db: Database,
    actor_id: str,
    actor_role: str,
    entity: str,
    entity_id: str,
    action: str,
    payload: Optional[Dict[str, Any]] = None,
    ip: Optional[str] = None,
) -> None:
    if db is None:
        return
    await db["audit_logs"].insert_one(
        {
            "actor_id": actor_id,
            "actor_role": actor_role,
            "entity": entity,
            "entity_id": entity_id,
            "action": action,
            "payload": payload or {},
            "ip": ip,
            "ts": datetime.utcnow(),
        }
    )
