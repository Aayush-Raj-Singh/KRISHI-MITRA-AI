from __future__ import annotations

import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from app.services.aws_validation_service import AWSValidationService


def main() -> None:
    service = AWSValidationService()
    payload = service.validate()
    print(json.dumps(payload, indent=2, default=str))
    if not payload.get("summary", {}).get("ok", True):
        raise SystemExit(1)


if __name__ == "__main__":
    main()
