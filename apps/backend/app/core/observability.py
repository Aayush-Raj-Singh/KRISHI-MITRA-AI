from __future__ import annotations

import threading
import time
from collections import Counter, defaultdict
from dataclasses import dataclass, field
from typing import DefaultDict, List

from fastapi import FastAPI

REQUEST_DURATION_BUCKETS_MS = (50, 100, 250, 500, 1000, 2500, 5000)


@dataclass
class RequestDurationStats:
    count: int = 0
    total_ms: float = 0.0
    max_ms: float = 0.0
    buckets: Counter[str] = field(default_factory=Counter)


class ObservabilityRegistry:
    def __init__(self) -> None:
        self._lock = threading.Lock()
        self.started_at = time.time()
        self._request_totals: Counter[tuple[str, str, int]] = Counter()
        self._request_durations: DefaultDict[tuple[str, str], RequestDurationStats] = defaultdict(
            RequestDurationStats
        )
        self._exceptions: Counter[tuple[str, str]] = Counter()
        self._client_error_events: Counter[str] = Counter()

    def observe_request(
        self, *, method: str, path: str, status_code: int, duration_ms: float
    ) -> None:
        path_label = _label_value(path)
        method_label = _label_value(method.upper())
        duration_bucket = _duration_bucket(duration_ms)
        with self._lock:
            self._request_totals[(method_label, path_label, int(status_code))] += 1
            stats = self._request_durations[(method_label, path_label)]
            stats.count += 1
            stats.total_ms += duration_ms
            stats.max_ms = max(stats.max_ms, duration_ms)
            stats.buckets[duration_bucket] += 1

    def record_exception(self, *, kind: str, path: str) -> None:
        with self._lock:
            self._exceptions[(_label_value(kind), _label_value(path))] += 1

    def record_client_error(self, *, source: str) -> None:
        with self._lock:
            self._client_error_events[_label_value(source)] += 1

    def snapshot(self, *, db_connected: bool, redis_connected: bool) -> dict:
        with self._lock:
            request_totals = [
                {
                    "method": method,
                    "path": path,
                    "status_code": status_code,
                    "count": count,
                }
                for (method, path, status_code), count in sorted(self._request_totals.items())
            ]
            request_durations = [
                {
                    "method": method,
                    "path": path,
                    "count": stats.count,
                    "avg_ms": round(stats.total_ms / stats.count, 2) if stats.count else 0.0,
                    "max_ms": round(stats.max_ms, 2),
                    "buckets": dict(stats.buckets),
                }
                for (method, path), stats in sorted(self._request_durations.items())
            ]
            exceptions = [
                {"kind": kind, "path": path, "count": count}
                for (kind, path), count in sorted(self._exceptions.items())
            ]
            client_errors = [
                {"source": source, "count": count}
                for source, count in sorted(self._client_error_events.items())
            ]

        return {
            "uptime_seconds": round(max(time.time() - self.started_at, 0.0), 2),
            "dependencies": {
                "postgres": db_connected,
                "redis": redis_connected,
            },
            "requests": request_totals,
            "latency": request_durations,
            "exceptions": exceptions,
            "client_errors": client_errors,
        }

    def render_prometheus(self, *, db_connected: bool, redis_connected: bool) -> str:
        lines: List[str] = [
            "# HELP krishimitra_process_uptime_seconds Service uptime in seconds.",
            "# TYPE krishimitra_process_uptime_seconds gauge",
            f"krishimitra_process_uptime_seconds {max(time.time() - self.started_at, 0.0):.2f}",
            "# HELP krishimitra_dependency_up Dependency health state.",
            "# TYPE krishimitra_dependency_up gauge",
            f'krishimitra_dependency_up{{dependency="postgres"}} {1 if db_connected else 0}',
            f'krishimitra_dependency_up{{dependency="redis"}} {1 if redis_connected else 0}',
            "# HELP krishimitra_http_requests_total Total HTTP requests by method, path, and status.",
            "# TYPE krishimitra_http_requests_total counter",
        ]

        with self._lock:
            for (method, path, status_code), count in sorted(self._request_totals.items()):
                lines.append(
                    f'krishimitra_http_requests_total{{method="{method}",path="{path}",status_code="{status_code}"}} {count}'
                )

            lines.extend(
                [
                    "# HELP krishimitra_http_request_duration_ms HTTP request latency.",
                    "# TYPE krishimitra_http_request_duration_ms histogram",
                ]
            )
            for (method, path), stats in sorted(self._request_durations.items()):
                cumulative = 0
                for bucket in REQUEST_DURATION_BUCKETS_MS:
                    cumulative += stats.buckets.get(str(bucket), 0)
                    lines.append(
                        f'krishimitra_http_request_duration_ms_bucket{{method="{method}",path="{path}",le="{bucket}"}} {cumulative}'
                    )
                cumulative += stats.buckets.get("+Inf", 0)
                lines.append(
                    f'krishimitra_http_request_duration_ms_bucket{{method="{method}",path="{path}",le="+Inf"}} {cumulative}'
                )
                lines.append(
                    f'krishimitra_http_request_duration_ms_sum{{method="{method}",path="{path}"}} {stats.total_ms:.2f}'
                )
                lines.append(
                    f'krishimitra_http_request_duration_ms_count{{method="{method}",path="{path}"}} {stats.count}'
                )

            lines.extend(
                [
                    "# HELP krishimitra_exceptions_total Total exceptions grouped by kind and path.",
                    "# TYPE krishimitra_exceptions_total counter",
                ]
            )
            for (kind, path), count in sorted(self._exceptions.items()):
                lines.append(f'krishimitra_exceptions_total{{kind="{kind}",path="{path}"}} {count}')

            lines.extend(
                [
                    "# HELP krishimitra_client_errors_total Client-side error reports grouped by source.",
                    "# TYPE krishimitra_client_errors_total counter",
                ]
            )
            for source, count in sorted(self._client_error_events.items()):
                lines.append(f'krishimitra_client_errors_total{{source="{source}"}} {count}')

        return "\n".join(lines) + "\n"


def get_observability(app: FastAPI) -> ObservabilityRegistry:
    registry = getattr(app.state, "observability", None)
    if registry is None:
        registry = ObservabilityRegistry()
        app.state.observability = registry
    return registry


def _duration_bucket(duration_ms: float) -> str:
    for bucket in REQUEST_DURATION_BUCKETS_MS:
        if duration_ms <= bucket:
            return str(bucket)
    return "+Inf"


def _label_value(value: str) -> str:
    return str(value or "unknown").replace("\\", "_").replace('"', "'")
