"""HTTP server entrypoint and router for DevForge (`python3 -m backend.app`)."""

from collections import deque
import http.server
import json
import re
import signal
import socket
import sys
import threading
import time
from typing import Any, Deque, Dict, List, Optional, Tuple
import urllib.parse
import uuid

from backend.config import AppConfig, ConfigError, load_config
from backend.db import DatabaseManager
from backend.errors import ApiProblemError, build_internal_error_payload
from backend.logging_utils import StructuredLogger, default_logger
from backend.service import LearningLoopService
from backend.ui import render_web_ui_html

MAX_REQUEST_BODY_BYTES = 65536  # 64 KB

REGISTERED_ROUTES: List[Tuple[str, str, str]] = [
    ("GET", "/", "getWebAppUi"),
    ("POST", "/api/v1/learnings", "createLearning"),
    ("GET", "/api/v1/sessions/today", "getTodaySession"),
    ("POST", "/api/v1/challenges/{challenge_id}/submit", "submitChallenge"),
    ("POST", "/api/v1/reviews/{card_id}/grade", "gradeReviewCard"),
    ("GET", "/api/v1/skills/summary", "getSkillsSummary"),
    ("POST", "/api/v1/test/reset", "resetTestState"),
    ("POST", "/api/v1/test/seed", "seedTestState"),
]

_CHALLENGE_SUBMIT_RE = re.compile(r"^/api/v1/challenges/([^/]+)/submit$")
_REVIEW_GRADE_RE = re.compile(r"^/api/v1/reviews/([^/]+)/grade$")
_LOOPBACK_ORIGIN_RE = re.compile(
    r"^https?://(127(?:\.\d{1,3}){3}|localhost|\[::1\])(?::\d{1,5})?$",
    re.IGNORECASE,
)


class SlidingWindowRateLimiter:
    """Thread-safe 60-second sliding-window rate limiter returning 429 + Retry-After on overflow."""

    def __init__(self, limit_per_minute: int) -> None:
        self.limit_per_minute = max(1, int(limit_per_minute))
        self._timestamps: Deque[float] = deque()
        self._lock = threading.Lock()

    def check_and_record(self, now_monotonic: Optional[float] = None) -> Tuple[bool, int]:
        now = time.monotonic() if now_monotonic is None else now_monotonic
        cutoff = now - 60.0
        with self._lock:
            while self._timestamps and self._timestamps[0] <= cutoff:
                self._timestamps.popleft()
            if len(self._timestamps) >= self.limit_per_minute:
                oldest = self._timestamps[0]
                retry_after = max(1, int((oldest + 60.0) - now + 0.999))
                return False, retry_after
            self._timestamps.append(now)
            return True, 0

    def reset(self) -> None:
        with self._lock:
            self._timestamps.clear()


def _is_allowed_origin(origin: str, host_header: str) -> bool:
    orig = origin.strip()
    if not orig or orig.lower() == "null":
        return False
    if host_header:
        h = host_header.strip().lower()
        if orig.lower() in (f"http://{h}", f"https://{h}"):
            return True
    return bool(_LOOPBACK_ORIGIN_RE.match(orig))


class DevForgeHTTPServer(http.server.ThreadingHTTPServer):
    allow_reuse_address = True
    daemon_threads = True

    def __init__(
        self,
        config: AppConfig,
        service: LearningLoopService,
        rate_limiter: SlidingWindowRateLimiter,
        logger: Optional[StructuredLogger] = None,
    ) -> None:
        if config.is_ipv6:
            self.address_family = socket.AF_INET6
        else:
            self.address_family = socket.AF_INET
        self.app_config = config
        self.service = service
        self.rate_limiter = rate_limiter
        self.structured_logger = logger or default_logger
        super().__init__((config.bind_host, config.port), DevForgeRequestHandler)


class DevForgeRequestHandler(http.server.BaseHTTPRequestHandler):
    protocol_version = "HTTP/1.1"

    @property
    def app_server(self) -> DevForgeHTTPServer:
        return self.server  # type: ignore[return-value]

    def log_message(self, format: str, *args: Any) -> None:  # noqa: A002
        # Suppress default plaintext stderr logging; all requests are logged as structured JSON.
        return

    def _send_bytes(
        self,
        status_code: int,
        content_type: str,
        body_bytes: bytes,
        *,
        request_id: str,
        extra_headers: Optional[Dict[str, str]] = None,
    ) -> None:
        self.send_response(status_code)
        self.send_header("Content-Type", content_type)
        self.send_header("Content-Length", str(len(body_bytes)))
        self.send_header("X-Request-Id", request_id)
        self.send_header("X-Content-Type-Options", "nosniff")
        self.send_header("X-Frame-Options", "DENY")
        self.send_header("Referrer-Policy", "no-referrer")
        self.send_header("Connection", "close")

        origin = self.headers.get("Origin")
        host_hdr = self.headers.get("Host", "")
        if origin and _is_allowed_origin(origin, host_hdr):
            self.send_header("Access-Control-Allow-Origin", origin.strip())
            self.send_header("Vary", "Origin")

        if extra_headers:
            for k, v in extra_headers.items():
                self.send_header(k, v)
        self.end_headers()
        self.wfile.write(body_bytes)

    def _send_json(
        self,
        status_code: int,
        payload: Dict[str, Any],
        *,
        request_id: str,
        content_type: str = "application/json; charset=utf-8",
        extra_headers: Optional[Dict[str, str]] = None,
    ) -> None:
        raw = json.dumps(payload, ensure_ascii=False, separators=(",", ":")).encode("utf-8")
        self._send_bytes(
            status_code,
            content_type,
            raw,
            request_id=request_id,
            extra_headers=extra_headers,
        )

    def _send_problem(
        self,
        problem: ApiProblemError,
        *,
        instance: str,
        request_id: str,
    ) -> None:
        payload = problem.to_dict(instance=instance)
        self._send_json(
            problem.status,
            payload,
            request_id=request_id,
            content_type="application/problem+json; charset=utf-8",
            extra_headers=problem.headers,
        )

    def _read_json_body(self, *, allow_empty: bool = False) -> Any:
        raw_len = self.headers.get("Content-Length")
        if raw_len is None or raw_len.strip() == "":
            if allow_empty:
                return {}
            raise ApiProblemError(
                code="VALIDATION_ERROR",
                message="リクエスト本文が必要です",
                field="body",
            )
        try:
            content_length = int(raw_len.strip(), 10)
        except ValueError as exc:
            raise ApiProblemError(
                code="VALIDATION_ERROR",
                message="Content-Length ヘッダが不正です",
                field="Content-Length",
            ) from exc

        if content_length < 0:
            raise ApiProblemError(
                code="VALIDATION_ERROR",
                message="Content-Length ヘッダが不正です",
                field="Content-Length",
            )
        if content_length > MAX_REQUEST_BODY_BYTES:
            raise ApiProblemError(
                code="VALIDATION_ERROR",
                message="リクエスト本文のサイズが上限（64KB）を超えています",
                field="body",
            )

        if content_length == 0:
            if allow_empty:
                return {}
            raise ApiProblemError(
                code="VALIDATION_ERROR",
                message="リクエスト本文が空です",
                field="body",
            )

        ctype = (self.headers.get("Content-Type") or "").split(";", 1)[0].strip().lower()
        if ctype != "application/json":
            raise ApiProblemError(
                code="VALIDATION_ERROR",
                message="Content-Type には application/json を指定してください",
                field="Content-Type",
            )

        raw_bytes = self.rfile.read(content_length)
        try:
            text = raw_bytes.decode("utf-8")
        except UnicodeDecodeError as exc:
            raise ApiProblemError(
                code="VALIDATION_ERROR",
                message="リクエスト本文は UTF-8 でエンコードしてください",
                field="body",
            ) from exc

        try:
            return json.loads(text)
        except json.JSONDecodeError as exc:
            raise ApiProblemError(
                code="VALIDATION_ERROR",
                message="リクエスト本文が有効な JSON ではありません",
                field="body",
            ) from exc

    def _verify_same_origin_for_mutation(self) -> None:
        origin = self.headers.get("Origin")
        if origin is None:
            return
        host_hdr = self.headers.get("Host", "")
        if not _is_allowed_origin(origin, host_hdr):
            raise ApiProblemError(
                code="VALIDATION_ERROR",
                message="許可されていない Origin からのリクエストです",
                field="Origin",
            )

    def do_OPTIONS(self) -> None:  # noqa: N802
        request_id = str(uuid.uuid4())
        origin = self.headers.get("Origin")
        host_hdr = self.headers.get("Host", "")
        headers: Dict[str, str] = {}
        if origin and _is_allowed_origin(origin, host_hdr):
            headers["Access-Control-Allow-Methods"] = "GET, POST, OPTIONS"
            headers["Access-Control-Allow-Headers"] = (
                "Content-Type, Idempotency-Key, X-Test-Now, X-Test-Url-Fetch-Mode"
            )
            headers["Access-Control-Max-Age"] = "600"
        self._send_bytes(204, "text/plain; charset=utf-8", b"", request_id=request_id, extra_headers=headers)

    def do_GET(self) -> None:  # noqa: N802
        self._dispatch("GET")

    def do_POST(self) -> None:  # noqa: N802
        self._dispatch("POST")

    def do_PUT(self) -> None:  # noqa: N802
        self._dispatch("PUT")

    def do_PATCH(self) -> None:  # noqa: N802
        self._dispatch("PATCH")

    def do_DELETE(self) -> None:  # noqa: N802
        self._dispatch("DELETE")

    def _dispatch(self, method: str) -> None:
        t0 = time.perf_counter()
        request_id = str(uuid.uuid4())
        split = urllib.parse.urlsplit(self.path)
        clean_path = split.path or "/"
        query_params = urllib.parse.parse_qs(split.query, keep_blank_values=True)
        operation = "unknownRoute"
        status_out = 500
        error_code_logged: Optional[str] = None

        try:
            # Test reset bypasses rate-limit starvation and resets limiter in non-prod
            if method == "POST" and clean_path == "/api/v1/test/reset":
                operation = "resetTestState"
                self._verify_same_origin_for_mutation()
                if self.app_server.service.is_production:
                    raise ApiProblemError(
                        code="TEST_SEAM_DISABLED",
                        message="本番モードでは /api/v1/test/* は無効化されています",
                    )
                self._read_json_body(allow_empty=True)
                res = self.app_server.service.reset_test_state()
                self.app_server.rate_limiter.reset()
                status_out = 200
                self._send_json(200, res, request_id=request_id)
                return

            allowed, retry_after = self.app_server.rate_limiter.check_and_record()
            if not allowed:
                raise ApiProblemError(
                    code="RATE_LIMIT_EXCEEDED",
                    message="リクエスト回数の上限を超えました。しばらく待ってから再試行してください",
                    headers={"Retry-After": str(retry_after)},
                )

            test_now = self.headers.get("X-Test-Now")
            idem_key = self.headers.get("Idempotency-Key")

            if method == "GET" and clean_path == "/":
                operation = "getWebAppUi"
                lang_param = query_params.get("lang", [None])[0]
                api_base_param = query_params.get("api_base_url", [None])[0]
                html_doc = render_web_ui_html(lang=lang_param, api_base_url=api_base_param)
                status_out = 200
                csp = (
                    "default-src 'self'; "
                    "script-src 'self' 'unsafe-inline'; "
                    "style-src 'self' 'unsafe-inline'; "
                    "connect-src 'self' http://127.0.0.1:* https://127.0.0.1:* http://localhost:* http://[::1]:*; "
                    "img-src 'self' data:; "
                    "object-src 'none'; "
                    "base-uri 'none'; "
                    "frame-ancestors 'none'"
                )
                self._send_bytes(
                    200,
                    "text/html; charset=utf-8",
                    html_doc.encode("utf-8"),
                    request_id=request_id,
                    extra_headers={"Content-Security-Policy": csp},
                )
                return

            if method == "POST" and clean_path == "/api/v1/learnings":
                operation = "createLearning"
                self._verify_same_origin_for_mutation()
                ctype = (self.headers.get("Content-Type") or "").split(";", 1)[0].strip().lower()
                if ctype != "application/json":
                    raise ApiProblemError(
                        code="VALIDATION_ERROR",
                        message="Content-Type には application/json を指定してください",
                        field="Content-Type",
                    )
                body = self._read_json_body(allow_empty=False)
                fetch_mode = self.headers.get("X-Test-Url-Fetch-Mode")
                status_code, resp_dict, replayed = self.app_server.service.create_learning(
                    body,
                    path=clean_path,
                    idempotency_key=idem_key,
                    test_now_header=test_now,
                    fetch_mode_header=fetch_mode,
                    request_id=request_id,
                )
                status_out = status_code
                extra_hdrs = {"Idempotent-Replayed": "true"} if replayed else None
                self._send_json(status_code, resp_dict, request_id=request_id, extra_headers=extra_hdrs)
                return

            if method == "GET" and clean_path == "/api/v1/sessions/today":
                operation = "getTodaySession"
                resp_dict = self.app_server.service.get_today_session(test_now_header=test_now)
                status_out = 200
                self._send_json(200, resp_dict, request_id=request_id)
                return

            if method == "GET" and clean_path == "/api/v1/skills/summary":
                operation = "getSkillsSummary"
                resp_dict = self.app_server.service.get_skills_summary(test_now_header=test_now)
                status_out = 200
                self._send_json(200, resp_dict, request_id=request_id)
                return

            if method == "POST" and clean_path == "/api/v1/test/seed":
                operation = "seedTestState"
                self._verify_same_origin_for_mutation()
                if self.app_server.service.is_production:
                    raise ApiProblemError(
                        code="TEST_SEAM_DISABLED",
                        message="本番モードでは /api/v1/test/* は無効化されています",
                    )
                body = self._read_json_body(allow_empty=False)
                resp_dict = self.app_server.service.seed_test_state(body, test_now_header=test_now)
                status_out = 200
                self._send_json(200, resp_dict, request_id=request_id)
                return

            m_chl = _CHALLENGE_SUBMIT_RE.match(clean_path)
            if method == "POST" and m_chl:
                operation = "submitChallenge"
                self._verify_same_origin_for_mutation()
                challenge_id = urllib.parse.unquote(m_chl.group(1))
                body = self._read_json_body(allow_empty=False)
                status_code, resp_dict, replayed = self.app_server.service.submit_challenge(
                    challenge_id,
                    body,
                    path=clean_path,
                    idempotency_key=idem_key,
                    test_now_header=test_now,
                )
                status_out = status_code
                extra_hdrs = {"Idempotent-Replayed": "true"} if replayed else None
                self._send_json(status_code, resp_dict, request_id=request_id, extra_headers=extra_hdrs)
                return

            m_rev = _REVIEW_GRADE_RE.match(clean_path)
            if method == "POST" and m_rev:
                operation = "gradeReviewCard"
                self._verify_same_origin_for_mutation()
                card_id = urllib.parse.unquote(m_rev.group(1))
                body = self._read_json_body(allow_empty=False)
                status_code, resp_dict, replayed = self.app_server.service.grade_review_card(
                    card_id,
                    body,
                    path=clean_path,
                    idempotency_key=idem_key,
                    test_now_header=test_now,
                )
                status_out = status_code
                extra_hdrs = {"Idempotent-Replayed": "true"} if replayed else None
                self._send_json(status_code, resp_dict, request_id=request_id, extra_headers=extra_hdrs)
                return

            # Any other /api/v1/test/* path in production returns 403 TEST_SEAM_DISABLED
            if clean_path.startswith("/api/v1/test/") and self.app_server.service.is_production:
                operation = "testSeamBlocked"
                raise ApiProblemError(
                    code="TEST_SEAM_DISABLED",
                    message="本番モードでは /api/v1/test/* は無効化されています",
                )

            raise ApiProblemError(
                code="RESOURCE_NOT_FOUND",
                message="指定されたエンドポイントは存在しません",
            )

        except ApiProblemError as problem:
            status_out = problem.status
            error_code_logged = problem.code
            self.app_server.service.record_api_error_event(clean_path, problem.status, problem.code)
            self._send_problem(problem, instance=clean_path, request_id=request_id)
        except Exception:
            # Never leak stack traces, file paths, or raw SQL in 500 error responses
            status_out = 500
            error_code_logged = "INTERNAL_ERROR"
            self.app_server.service.record_api_error_event(clean_path, 500, "INTERNAL_ERROR")
            safe_payload = build_internal_error_payload(instance=clean_path)
            self._send_json(
                500,
                safe_payload,
                request_id=request_id,
                content_type="application/problem+json; charset=utf-8",
            )
        finally:
            elapsed_ms = max(0, int((time.perf_counter() - t0) * 1000))
            if status_out < 400:
                res_kind = "success"
            elif status_out < 500:
                res_kind = "client_error"
            else:
                res_kind = "server_error"
            extra_meta: Dict[str, Any] = {}
            if error_code_logged:
                extra_meta["error_code"] = error_code_logged
            self.app_server.structured_logger.log(
                request_id=request_id,
                operation=operation,
                result=res_kind,
                status_code=status_out,
                processing_ms=elapsed_ms,
                method=method,
                path=clean_path,
                extra=extra_meta,
            )


def create_server(
    config: Optional[AppConfig] = None,
    *,
    logger: Optional[StructuredLogger] = None,
) -> Tuple[DevForgeHTTPServer, DatabaseManager]:
    cfg = config or load_config()
    db = DatabaseManager(cfg.db_path, ensure_parent=cfg.ensure_db_parent)
    db.init_db()
    service = LearningLoopService(db, is_production=cfg.is_production)
    limiter = SlidingWindowRateLimiter(cfg.rate_limit_per_minute)
    server = DevForgeHTTPServer(cfg, service, limiter, logger=logger)
    return server, db


def main(argv: Optional[List[str]] = None) -> int:
    args = sys.argv[1:] if argv is None else argv
    if "--list-routes" in args:
        for method, path, op_id in REGISTERED_ROUTES:
            print(f"{op_id} {method} {path}")
        return 0

    try:
        cfg = load_config()
    except ConfigError as exc:
        sys.stderr.write(f"Startup configuration error: {exc}\n")
        sys.stderr.flush()
        return 2

    try:
        server, db = create_server(cfg)
    except Exception as exc:
        sys.stderr.write(f"Failed to initialize DevForge server (DEVFORGE_DB_PATH / DEVFORGE_PORT): {exc}\n")
        sys.stderr.flush()
        return 1

    stop_once = threading.Event()

    def _request_shutdown(_signum: int, _frame: Any) -> None:
        if not stop_once.is_set():
            stop_once.set()
            threading.Thread(target=server.shutdown, daemon=True).start()

    signal.signal(signal.SIGTERM, _request_shutdown)
    signal.signal(signal.SIGINT, _request_shutdown)

    default_logger.log(
        request_id="startup",
        operation="server_started",
        result="success",
        status_code=200,
        processing_ms=0,
        extra={
            "host": cfg.bind_host,
            "port": cfg.port,
            "app_env": cfg.app_env,
        },
    )

    try:
        server.serve_forever(poll_interval=0.1)
    finally:
        server.server_close()
        db.close()

    return 0


if __name__ == "__main__":
    sys.exit(main())
