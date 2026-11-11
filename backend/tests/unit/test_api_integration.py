"""Real SQLite + HTTP server integration tests covering BOLA/cross-ID, mass assignment, idempotency, rate limit, 500 hiding, logs, deletion, and production mode."""

import io
import json
import os
import re
import tempfile
import threading
from typing import Any, Dict, Optional, Tuple
import unittest
import urllib.error
import urllib.request

from backend.app import REGISTERED_ROUTES, create_server
from backend.config import AppConfig
from backend.logging_utils import StructuredLogger


def _http_request(
    base_url: str,
    method: str,
    path: str,
    *,
    body_obj: Any = None,
    raw_body: Optional[bytes] = None,
    headers: Optional[Dict[str, str]] = None,
) -> Tuple[int, Dict[str, str], bytes]:
    hdrs: Dict[str, str] = {}
    data: Optional[bytes] = None
    if raw_body is not None:
        data = raw_body
    elif body_obj is not None:
        data = json.dumps(body_obj, ensure_ascii=False).encode("utf-8")
        hdrs["Content-Type"] = "application/json"
    if headers:
        hdrs.update(headers)

    req = urllib.request.Request(f"{base_url}{path}", data=data, headers=hdrs, method=method)
    try:
        with urllib.request.urlopen(req, timeout=5.0) as resp:
            resp_headers = {k.lower(): v for k, v in resp.headers.items()}
            return resp.status, resp_headers, resp.read()
    except urllib.error.HTTPError as err:
        resp_headers = {k.lower(): v for k, v in err.headers.items()}
        return err.code, resp_headers, err.read()


class _ServerHarness:
    def __init__(
        self,
        db_path: str,
        *,
        is_production: bool = False,
        rate_limit_per_minute: int = 600,
    ) -> None:
        self.log_stream = io.StringIO()
        self.logger = StructuredLogger(stream=self.log_stream)
        self.config = AppConfig(
            host="127.0.0.1",
            bind_host="127.0.0.1",
            is_ipv6=False,
            port=0,
            db_path=db_path,
            ensure_db_parent=False,
            app_env="production" if is_production else "test",
            is_production=is_production,
            rate_limit_per_minute=rate_limit_per_minute,
        )
        self.server, self.db = create_server(self.config, logger=self.logger)
        actual_port = self.server.server_address[1]
        self.base_url = f"http://127.0.0.1:{actual_port}"
        self._thread = threading.Thread(target=self.server.serve_forever, kwargs={"poll_interval": 0.05}, daemon=True)
        self._thread.start()

    def close(self) -> None:
        self.server.shutdown()
        self.server.server_close()
        self.db.close()
        self._thread.join(timeout=2.0)


class TestAuthorizationAndCrossResource(unittest.TestCase):
    """Cross-type and cross-instance isolation tests (>= number of ID-taking endpoints)."""

    def setUp(self) -> None:
        self._tmp = tempfile.TemporaryDirectory()
        self.db_a = os.path.join(self._tmp.name, "user_a.sqlite3")
        self.db_b = os.path.join(self._tmp.name, "user_b.sqlite3")
        self.srv_a = _ServerHarness(self.db_a)
        self.srv_b = _ServerHarness(self.db_b)

        status, _, raw = _http_request(
            self.srv_a.base_url,
            "POST",
            "/api/v1/learnings",
            body_obj={
                "title": "Profile A Redis",
                "memo": "キャッシュミス時のDB負荷急増を防ぐにはロックとTTLジッターを組み合わせる",
            },
            headers={"X-Test-Now": "2026-10-30T09:00:00Z"},
        )
        self.assertEqual(status, 201)
        created = json.loads(raw.decode("utf-8"))
        self.chl_a = created["challenge"]["challenge_id"]
        self.crd_a = created["review_card"]["card_id"]

    def tearDown(self) -> None:
        self.srv_a.close()
        self.srv_b.close()
        self._tmp.cleanup()

    def test_submit_challenge_with_nonexistent_id_returns_404(self) -> None:
        status, hdrs, raw = _http_request(
            self.srv_a.base_url,
            "POST",
            "/api/v1/challenges/chl_nonexistent_999/submit",
            body_obj={"answer": "十分な長さのある回答テキストです12345", "matched_rubric_count": 2},
        )
        self.assertEqual(status, 404)
        self.assertIn("application/problem+json", hdrs["content-type"])
        problem = json.loads(raw.decode("utf-8"))
        self.assertEqual(problem["error"]["code"], "RESOURCE_NOT_FOUND")
        self.assertEqual(problem["error"]["field"], "challenge_id")

    def test_submit_challenge_with_review_card_id_cross_type_returns_404(self) -> None:
        status, _, raw = _http_request(
            self.srv_a.base_url,
            "POST",
            f"/api/v1/challenges/{self.crd_a}/submit",
            body_obj={"answer": "十分な長さのある回答テキストです12345", "matched_rubric_count": 2},
        )
        self.assertEqual(status, 404)
        self.assertEqual(json.loads(raw.decode("utf-8"))["error"]["code"], "RESOURCE_NOT_FOUND")

    def test_submit_challenge_cross_instance_id_returns_404(self) -> None:
        # User B attempting to submit User A's challenge_id against B's database gets 404
        status, _, raw = _http_request(
            self.srv_b.base_url,
            "POST",
            f"/api/v1/challenges/{self.chl_a}/submit",
            body_obj={"answer": "十分な長さのある回答テキストです12345", "matched_rubric_count": 3},
        )
        self.assertEqual(status, 404)
        self.assertEqual(json.loads(raw.decode("utf-8"))["error"]["code"], "RESOURCE_NOT_FOUND")

    def test_grade_review_with_nonexistent_id_returns_404(self) -> None:
        status, hdrs, raw = _http_request(
            self.srv_a.base_url,
            "POST",
            "/api/v1/reviews/crd_nonexistent_999/grade",
            body_obj={"grade": 3},
            headers={"X-Test-Now": "2026-10-31T09:00:00Z"},
        )
        self.assertEqual(status, 404)
        self.assertIn("application/problem+json", hdrs["content-type"])
        problem = json.loads(raw.decode("utf-8"))
        self.assertEqual(problem["error"]["code"], "RESOURCE_NOT_FOUND")
        self.assertEqual(problem["error"]["field"], "card_id")

    def test_grade_review_with_challenge_id_cross_type_returns_404(self) -> None:
        status, _, raw = _http_request(
            self.srv_a.base_url,
            "POST",
            f"/api/v1/reviews/{self.chl_a}/grade",
            body_obj={"grade": 3},
            headers={"X-Test-Now": "2026-10-31T09:00:00Z"},
        )
        self.assertEqual(status, 404)
        self.assertEqual(json.loads(raw.decode("utf-8"))["error"]["code"], "RESOURCE_NOT_FOUND")

    def test_grade_review_cross_instance_id_returns_404(self) -> None:
        # User B attempting to grade User A's card_id against B's database gets 404
        status, _, raw = _http_request(
            self.srv_b.base_url,
            "POST",
            f"/api/v1/reviews/{self.crd_a}/grade",
            body_obj={"grade": 3},
            headers={"X-Test-Now": "2026-10-31T09:00:00Z"},
        )
        self.assertEqual(status, 404)
        self.assertEqual(json.loads(raw.decode("utf-8"))["error"]["code"], "RESOURCE_NOT_FOUND")

    def test_submit_challenge_already_completed_returns_409(self) -> None:
        st1, _, _ = _http_request(
            self.srv_a.base_url,
            "POST",
            f"/api/v1/challenges/{self.chl_a}/submit",
            body_obj={"answer": "初回の十分な長さの設計トレードオフ回答です", "matched_rubric_count": 2},
            headers={"X-Test-Now": "2026-10-30T09:05:00Z"},
        )
        self.assertEqual(st1, 200)

        st2, _, raw2 = _http_request(
            self.srv_a.base_url,
            "POST",
            f"/api/v1/challenges/{self.chl_a}/submit",
            body_obj={"answer": "2回目の別キー送信は409になるべきです", "matched_rubric_count": 3},
            headers={"X-Test-Now": "2026-10-30T09:06:00Z", "Idempotency-Key": "different-key"},
        )
        self.assertEqual(st2, 409)
        self.assertEqual(json.loads(raw2.decode("utf-8"))["error"]["code"], "CHALLENGE_ALREADY_COMPLETED")

    def test_grade_review_not_due_returns_409(self) -> None:
        # Card created at 2026-10-30T09:00:00Z is due at 2026-10-31T09:00:00Z; grading early returns 409
        st, _, raw = _http_request(
            self.srv_a.base_url,
            "POST",
            f"/api/v1/reviews/{self.crd_a}/grade",
            body_obj={"grade": 3},
            headers={"X-Test-Now": "2026-10-30T12:00:00Z"},
        )
        self.assertEqual(st, 409)
        self.assertEqual(json.loads(raw.decode("utf-8"))["error"]["code"], "REVIEW_CARD_NOT_DUE")


class TestLearningAndIdempotency(unittest.TestCase):
    def setUp(self) -> None:
        self._tmp = tempfile.TemporaryDirectory()
        self.db_path = os.path.join(self._tmp.name, "idem.sqlite3")
        self.srv = _ServerHarness(self.db_path)

    def tearDown(self) -> None:
        self.srv.close()
        self._tmp.cleanup()

    def test_create_learning_persists_in_real_sqlite_and_ignores_mass_assignment(self) -> None:
        status, _, raw = _http_request(
            self.srv.base_url,
            "POST",
            "/api/v1/learnings",
            body_obj={
                "title": "SQLite WAL 設計",
                "memo": "SQLiteでWALモードを有効にすると読み取りと書き込みの並行性が向上する",
                "category": "data",
                "role": "admin",
                "user_id": "injected_user",
                "is_admin": True,
                "earned_xp": 999999,
                "total_xp": 999999,
            },
            headers={"X-Test-Now": "2026-10-30T09:00:00Z"},
        )
        self.assertEqual(status, 201)
        body = json.loads(raw.decode("utf-8"))
        self.assertEqual(body["earned_xp"], 15)
        self.assertNotIn("role", body)
        self.assertNotIn("is_admin", body)
        self.assertNotIn("user_id", body)

        _, _, sum_raw = _http_request(self.srv.base_url, "GET", "/api/v1/skills/summary")
        summary = json.loads(sum_raw.decode("utf-8"))
        self.assertEqual(summary["total_xp"], 15)

    def test_idempotency_replay_and_mismatch_422_and_error_recovery(self) -> None:
        # 1. Failed 400 request does NOT burn the idempotency key
        st_bad, _, _ = _http_request(
            self.srv.base_url,
            "POST",
            "/api/v1/learnings",
            body_obj={"memo": "short"},
            headers={"Idempotency-Key": "idem-recover-1"},
        )
        self.assertEqual(st_bad, 400)

        # Same key after fixing input succeeds with 201 (not replayed)
        st_ok1, hdr1, raw1 = _http_request(
            self.srv.base_url,
            "POST",
            "/api/v1/learnings",
            body_obj={"memo": "十分な長さのある技術学習メモ本文です12345"},
            headers={"Idempotency-Key": "idem-recover-1", "X-Test-Now": "2026-10-30T09:00:00Z"},
        )
        self.assertEqual(st_ok1, 201)
        self.assertNotIn("idempotent-replayed", hdr1)
        data1 = json.loads(raw1.decode("utf-8"))

        # 2. Exact retry returns 201 + Idempotent-Replayed: true + identical body
        st_ok2, hdr2, raw2 = _http_request(
            self.srv.base_url,
            "POST",
            "/api/v1/learnings",
            body_obj={"memo": "十分な長さのある技術学習メモ本文です12345"},
            headers={"Idempotency-Key": "idem-recover-1", "X-Test-Now": "2026-10-30T09:05:00Z"},
        )
        self.assertEqual(st_ok2, 201)
        self.assertEqual(hdr2.get("idempotent-replayed"), "true")
        data2 = json.loads(raw2.decode("utf-8"))
        self.assertEqual(data1, data2)

        # 3. Same key with different payload -> 422 IDEMPOTENCY_KEY_MISMATCH
        st_422, _, raw_422 = _http_request(
            self.srv.base_url,
            "POST",
            "/api/v1/learnings",
            body_obj={"memo": "別の内容に書き換えた技術学習メモ本文です999"},
            headers={"Idempotency-Key": "idem-recover-1", "X-Test-Now": "2026-10-30T09:06:00Z"},
        )
        self.assertEqual(st_422, 422)
        prob_422 = json.loads(raw_422.decode("utf-8"))
        self.assertEqual(prob_422["error"]["code"], "IDEMPOTENCY_KEY_MISMATCH")
        self.assertEqual(prob_422["error"]["field"], "Idempotency-Key")

        # 4. Same key on a different endpoint -> 422 IDEMPOTENCY_KEY_MISMATCH
        chl_id = data1["challenge"]["challenge_id"]
        st_cross_ep, _, _ = _http_request(
            self.srv.base_url,
            "POST",
            f"/api/v1/challenges/{chl_id}/submit",
            body_obj={"answer": "十分な長さのある回答テキストです12345", "matched_rubric_count": 2},
            headers={"Idempotency-Key": "idem-recover-1", "X-Test-Now": "2026-10-30T09:06:00Z"},
        )
        self.assertEqual(st_cross_ep, 422)

        # 5. Invalid key length (>128 chars) -> 400 VALIDATION_ERROR
        st_long, _, raw_long = _http_request(
            self.srv.base_url,
            "POST",
            "/api/v1/learnings",
            body_obj={"memo": "十分な長さのある技術学習メモ本文です12345"},
            headers={"Idempotency-Key": "k" * 129},
        )
        self.assertEqual(st_long, 400)
        self.assertEqual(json.loads(raw_long.decode("utf-8"))["error"]["field"], "Idempotency-Key")

        # 6. Concurrent duplicate requests with the same Idempotency-Key create only 1 row
        results: list = []

        def worker() -> None:
            res = _http_request(
                self.srv.base_url,
                "POST",
                "/api/v1/learnings",
                body_obj={"memo": "並列送信でも1件だけ作成されることを検証するメモ"},
                headers={"Idempotency-Key": "idem-concurrent-key", "X-Test-Now": "2026-10-30T09:10:00Z"},
            )
            results.append(res)

        t1 = threading.Thread(target=worker)
        t2 = threading.Thread(target=worker)
        t1.start()
        t2.start()
        t1.join()
        t2.join()
        self.assertEqual(len(results), 2)
        self.assertEqual(results[0][0], 201)
        self.assertEqual(results[1][0], 201)
        id_0 = json.loads(results[0][2].decode("utf-8"))["learning_id"]
        id_1 = json.loads(results[1][2].decode("utf-8"))["learning_id"]
        self.assertEqual(id_0, id_1)


class TestSessionCapAbuseAndErrorSafety(unittest.TestCase):
    def setUp(self) -> None:
        self._tmp = tempfile.TemporaryDirectory()
        self.db_path = os.path.join(self._tmp.name, "cap.sqlite3")
        self.srv = _ServerHarness(self.db_path, rate_limit_per_minute=5)

    def tearDown(self) -> None:
        self.srv.close()
        self._tmp.cleanup()

    def test_today_session_caps_at_1_challenge_and_5_reviews_even_with_large_dataset(self) -> None:
        cards = [
            {
                "card_id": f"crd_bulk_{i:03d}",
                "category": "backend",
                "front_prompt": f"Prompt {i}",
                "back_summary": f"Summary {i}",
                "next_review_at": "2026-10-29T09:00:00Z",
            }
            for i in range(60)
        ]
        challenges = [
            {
                "challenge_id": f"chl_bulk_{i:02d}",
                "category": "backend",
                "question": f"Question {i} with sufficient text",
                "status": "pending",
            }
            for i in range(15)
        ]
        st_seed, _, _ = _http_request(
            self.srv.base_url,
            "POST",
            "/api/v1/test/seed",
            body_obj={"reset_first": True, "challenges": challenges, "review_cards": cards},
            headers={"X-Test-Now": "2026-10-30T09:00:00Z"},
        )
        self.assertEqual(st_seed, 200)

        st_ses, _, raw_ses = _http_request(
            self.srv.base_url,
            "GET",
            "/api/v1/sessions/today",
            headers={"X-Test-Now": "2026-10-30T09:00:00Z"},
        )
        self.assertEqual(st_ses, 200)
        ses = json.loads(raw_ses.decode("utf-8"))
        self.assertIsNotNone(ses["active_challenge"])
        self.assertEqual(len(ses["due_reviews"]), 5)
        self.assertEqual(ses["total_due_count"], 60)
        self.assertEqual(ses["total_session_items"], 6)
        self.assertEqual(ses["estimated_seconds"], 180)

    def test_rate_limit_returns_429_with_retry_after_header(self) -> None:
        # Limit is 5 requests/min on this harness
        for _ in range(5):
            st, _, _ = _http_request(self.srv.base_url, "GET", "/api/v1/skills/summary")
            self.assertEqual(st, 200)

        st_429, hdrs, raw = _http_request(self.srv.base_url, "GET", "/api/v1/skills/summary")
        self.assertEqual(st_429, 429)
        self.assertIn("retry-after", hdrs)
        self.assertGreaterEqual(int(hdrs["retry-after"]), 1)
        prob = json.loads(raw.decode("utf-8"))
        self.assertEqual(prob["status"], 429)
        self.assertEqual(prob["error"]["code"], "RATE_LIMIT_EXCEEDED")

    def test_cors_cross_origin_and_non_json_post_and_oversized_body_rejected(self) -> None:
        # Cross-origin POST from external website rejected
        st_cors, hdrs_cors, _ = _http_request(
            self.srv.base_url,
            "POST",
            "/api/v1/learnings",
            body_obj={"memo": "クロスオリジンからの不正リクエスト検証メモ"},
            headers={"Origin": "https://attacker.example.com"},
        )
        self.assertEqual(st_cors, 400)
        self.assertNotIn("access-control-allow-origin", hdrs_cors)

        # Form-urlencoded POST rejected
        st_form, _, _ = _http_request(
            self.srv.base_url,
            "POST",
            "/api/v1/learnings",
            raw_body=b"memo=0123456789abcdef",
            headers={"Content-Type": "application/x-www-form-urlencoded"},
        )
        self.assertEqual(st_form, 400)

        # >64KB body rejected
        st_huge, _, _ = _http_request(
            self.srv.base_url,
            "POST",
            "/api/v1/learnings",
            raw_body=b'{"memo":"' + (b"a" * 70000) + b'"}',
            headers={"Content-Type": "application/json"},
        )
        self.assertEqual(st_huge, 400)

    def test_500_error_body_hides_traceback_and_sql_and_logs_contain_zero_secrets(self) -> None:
        # Send learning with secret-looking memo and newline injection attempt
        secret_memo = "業務メモ user@example.com password=supersecret123\nFAKE_LOG_LINE"
        st, _, _ = _http_request(
            self.srv.base_url,
            "POST",
            "/api/v1/learnings",
            body_obj={"memo": secret_memo},
        )
        self.assertEqual(st, 201)

        # Close underlying DB to deliberately trigger an internal 500 error
        self.srv.db.close()
        st_500, hdrs_500, raw_500 = _http_request(self.srv.base_url, "GET", "/api/v1/sessions/today")
        self.assertEqual(st_500, 500)
        self.assertIn("application/problem+json", hdrs_500["content-type"])
        text_500 = raw_500.decode("utf-8")
        for forbidden_leak in ("Traceback", "sqlite3", "SELECT", "INSERT", "ProgrammingError", ".py"):
            self.assertNotIn(forbidden_leak, text_500)

        # Inspect all structured JSON logs emitted during the test
        log_lines = [ln for ln in self.srv.log_stream.getvalue().splitlines() if ln.strip()]
        self.assertGreaterEqual(len(log_lines), 2)
        email_re = re.compile(r"[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}")
        for ln in log_lines:
            parsed_log = json.loads(ln)
            for req_key in ("timestamp", "request_id", "user_id", "operation", "result", "status_code", "processing_ms"):
                self.assertIn(req_key, parsed_log)
            self.assertNotIn("supersecret123", ln)
            self.assertNotIn("FAKE_LOG_LINE", ln)
            self.assertIsNone(email_re.search(ln))


class TestProductionModeWebUiAndDeletion(unittest.TestCase):
    def test_production_mode_blocks_test_reset_and_seed_with_403_and_ignores_test_headers(self) -> None:
        with tempfile.TemporaryDirectory() as tmpdir:
            srv = _ServerHarness(os.path.join(tmpdir, "prod.sqlite3"), is_production=True)
            try:
                st_rst, _, raw_rst = _http_request(srv.base_url, "POST", "/api/v1/test/reset")
                self.assertEqual(st_rst, 403)
                self.assertEqual(json.loads(raw_rst.decode("utf-8"))["error"]["code"], "TEST_SEAM_DISABLED")

                st_seed, _, raw_seed = _http_request(
                    srv.base_url,
                    "POST",
                    "/api/v1/test/seed",
                    body_obj={"reset_first": True},
                )
                self.assertEqual(st_seed, 403)
                self.assertEqual(json.loads(raw_seed.decode("utf-8"))["error"]["code"], "TEST_SEAM_DISABLED")

                # X-Test-Now and X-Test-Url-Fetch-Mode: stub_ok are ignored in production
                st_lrn, _, raw_lrn = _http_request(
                    srv.base_url,
                    "POST",
                    "/api/v1/learnings",
                    body_obj={
                        "title": "Prod Check",
                        "url": "https://timeout.example.test/article",
                        "memo": "本番モードではテスト用ヘッダが無視されることを検証するメモ",
                    },
                    headers={
                        "X-Test-Now": "2099-12-31T23:59:59Z",
                        "X-Test-Url-Fetch-Mode": "stub_ok",
                    },
                )
                self.assertEqual(st_lrn, 201)
                lrn_data = json.loads(raw_lrn.decode("utf-8"))
                self.assertNotIn("2099-", lrn_data["created_at"])
                self.assertEqual(lrn_data["url_fetch_status"], "fallback_used")
            finally:
                srv.close()

    def test_delete_and_reset_clears_all_tables_and_routes_match_contract(self) -> None:
        self.assertEqual(len(REGISTERED_ROUTES), 8)

        with tempfile.TemporaryDirectory() as tmpdir:
            srv = _ServerHarness(os.path.join(tmpdir, "del.sqlite3"))
            try:
                st, _, _ = _http_request(
                    srv.base_url,
                    "POST",
                    "/api/v1/learnings",
                    body_obj={"memo": "削除テスト用の十分な長さがある技術メモです123"},
                    headers={"Idempotency-Key": "del-idem-1"},
                )
                self.assertEqual(st, 201)

                srv.server.service.purge_all_user_data()
                count_queries = (
                    ("learnings", "SELECT COUNT(*) FROM learnings"),
                    ("challenges", "SELECT COUNT(*) FROM challenges"),
                    ("review_cards", "SELECT COUNT(*) FROM review_cards"),
                    ("idempotency_keys", "SELECT COUNT(*) FROM idempotency_keys"),
                    ("telemetry_events", "SELECT COUNT(*) FROM telemetry_events"),
                )
                with srv.db.read_tx() as conn:
                    for tbl, sql_stmt in count_queries:
                        cnt = conn.execute(sql_stmt).fetchone()[0]
                        self.assertEqual(cnt, 0, f"Expected 0 rows in {tbl}")
                    xp_sum = conn.execute("SELECT SUM(total_xp) FROM skill_progress").fetchone()[0]
                    self.assertEqual(xp_sum, 0)
                    st_row = conn.execute("SELECT streak_days, last_study_date FROM user_stats WHERE id=1").fetchone()
                    self.assertEqual(int(st_row["streak_days"]), 0)
                    self.assertIsNone(st_row["last_study_date"])
            finally:
                srv.close()

    def test_get_web_ui_contains_all_required_testids_lang_switch_and_xss_safe_api_base_url(self) -> None:
        required_testids = [
            "app-root",
            "learning-form",
            "title-input",
            "url-input",
            "memo-input",
            "submit-learning-btn",
            "offline-error-banner",
            "retry-submit-btn",
            "empty-state-guide",
            "empty-state-cta-btn",
        ]
        with tempfile.TemporaryDirectory() as tmpdir:
            srv = _ServerHarness(os.path.join(tmpdir, "ui.sqlite3"))
            try:
                for query in ["", "?lang=ja", "?lang=en", '?api_base_url="><script>alert(1)</script>']:
                    st, hdrs, raw = _http_request(srv.base_url, "GET", f"/{query}")
                    self.assertEqual(st, 200)
                    self.assertIn("text/html", hdrs["content-type"])
                    html_text = raw.decode("utf-8")
                    for tid in required_testids:
                        self.assertIn(f'data-testid="{tid}"', html_text)
                    self.assertNotIn("<script>alert(1)</script>", html_text)
            finally:
                srv.close()


if __name__ == "__main__":
    unittest.main()
