"""Structured JSON logging with log-injection and PII/secret sanitization."""

from datetime import datetime, timezone
import json
import sys
import threading
from typing import Any, Dict, Optional, TextIO

_FORBIDDEN_KEYS = frozenset(
    {
        "memo",
        "answer",
        "password",
        "token",
        "access_token",
        "refresh_token",
        "secret",
        "session_id",
        "authorization",
        "cookie",
        "email",
        "db_path",
    }
)


def _sanitize_str(value: str) -> str:
    cleaned = value.replace("\r", " ").replace("\n", " ").replace("\x00", "")
    if len(cleaned) > 256:
        return cleaned[:256]
    return cleaned


def _sanitize_extra(extra: Dict[str, Any]) -> Dict[str, Any]:
    safe: Dict[str, Any] = {}
    for k, v in extra.items():
        if k.lower() in _FORBIDDEN_KEYS:
            continue
        if isinstance(v, str):
            safe[k] = _sanitize_str(v)
        elif isinstance(v, (int, float, bool)) or v is None:
            safe[k] = v
    return safe


class StructuredLogger:
    """Thread-safe JSON line logger."""

    def __init__(self, stream: Optional[TextIO] = None) -> None:
        self._stream = stream
        self._lock = threading.Lock()

    def set_stream(self, stream: Optional[TextIO]) -> None:
        with self._lock:
            self._stream = stream

    def log(
        self,
        *,
        request_id: str,
        operation: str,
        result: str,
        status_code: int,
        processing_ms: int,
        method: str = "",
        path: str = "",
        user_id: str = "local_user",
        extra: Optional[Dict[str, Any]] = None,
    ) -> Dict[str, Any]:
        record: Dict[str, Any] = {
            "timestamp": datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
            "request_id": _sanitize_str(request_id),
            "user_id": _sanitize_str(user_id),
            "operation": _sanitize_str(operation),
            "method": _sanitize_str(method),
            "path": _sanitize_str(path.split("?", 1)[0]),
            "result": _sanitize_str(result),
            "status_code": int(status_code),
            "processing_ms": max(0, int(processing_ms)),
        }
        if extra:
            record.update(_sanitize_extra(extra))

        line = json.dumps(record, ensure_ascii=False, separators=(",", ":"))
        with self._lock:
            out = self._stream if self._stream is not None else sys.stdout
            try:
                out.write(line + "\n")
                out.flush()
            except OSError:
                pass
        return record


default_logger = StructuredLogger()
