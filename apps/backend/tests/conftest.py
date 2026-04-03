from __future__ import annotations

import os
import sys
from pathlib import Path

os.environ.setdefault("FEATURE_BACKGROUND_JOBS_ENABLED", "false")
os.environ.setdefault("SCHEDULER_ENABLED", "false")

BACKEND_ROOT = Path(__file__).resolve().parents[1]
backend_root_str = str(BACKEND_ROOT)
if backend_root_str not in sys.path:
    sys.path.insert(0, backend_root_str)
