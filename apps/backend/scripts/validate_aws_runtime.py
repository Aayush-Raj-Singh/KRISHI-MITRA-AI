from __future__ import annotations

import json
from pathlib import Path
import sys

ROOT = Path(__file__).resolve().parents[1]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from app.services.aws_validation_service import AWSValidationService


def main() -> None:
    service = AWSValidationService()
    print(json.dumps(service.validate(), indent=2, default=str))


if __name__ == "__main__":
    main()
