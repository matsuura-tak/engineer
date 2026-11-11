"""Application service layer implementing all 8 OpenAPI operations with ACID transactions."""

from datetime import date, datetime, timedelta
import hashlib
import json
import sqlite3
import threading
import time
from typing import Any, Dict, List, Optional, Tuple
import uuid

from backend.db import DatabaseManager
from backend.domain import (
    CG_LEARNING_INITIAL_XP,
    CG_REVIEW_CARD_XP,
    SKILL_CATEGORIES,
    VALID_CATEGORIES,
    WEEKLY_WINDOW_SECONDS,
    compute_effective_streak_for_summary,
    compute_level,
    compute_sm2_review,
    compute_streak_on_completion,
    compute_xp_to_next_level,
    format_iso8601_utc,
    is_within_weekly_window,
    parse_iso8601_utc,
    resolve_now,
)
from backend.errors import ApiProblemError
from backend.generator import ChallengeGenerator, default_generator
from backend.url_fetcher import UrlFetcher

IDEMPOTENCY_TTL_SECONDS = 86400  # 24 hours


def _is_strict_int(val: Any) -> bool:
    return isinstance(val, int) and not isinstance(val, bool)


def _is_strict_number(val: Any) -> bool:
    return isinstance(val, (int, float)) and not isinstance(val, bool)


def _validate_idempotency_key(key: Optional[str]) -> Optional[str]:
    if key is None:
        return None
    if not isinstance(key, str) or len(key) < 1 or len(key) > 128 or any(ord(ch) < 32 for ch in key):
        raise ApiProblemError(
            code="VALIDATION_ERROR",
            message="Idempotency-Key は1文字以上128文字以下で指定してください",
            field="Idempotency-Key",
        )
    return key


def _compute_request_hash(method: str, path: str, body_obj: Dict[str, Any]) -> str:
    canonical_json = json.dumps(body_obj, sort_keys=True, separators=(",", ":"), ensure_ascii=False)
    payload = f"{method.upper()} {path}\n{canonical_json}".encode("utf-8")
    return hashlib.sha256(payload).hexdigest()


def _ensure_json_object(body: Any) -> Dict[str, Any]:
    if not isinstance(body, dict):
        raise ApiProblemError(
            code="VALIDATION_ERROR",
            message="リクエスト本文は JSON オブジェクトで指定してください",
            field="body",
        )
    return body


def _build_challenge_item(row: sqlite3.Row) -> Dict[str, Any]:
    return {
        "challenge_id": str(row["challenge_id"]),
        "learning_id": str(row["learning_id"]),
        "category": str(row["category"]),
        "question": str(row["question"]),
        "rubric_items": json.loads(row["rubric_json"]),
        "status": str(row["status"]),
        "created_at": str(row["created_at"]),
    }


def _build_review_card_item(row: sqlite3.Row) -> Dict[str, Any]:
    return {
        "card_id": str(row["card_id"]),
        "learning_id": str(row["learning_id"]),
        "category": str(row["category"]),
        "front_prompt": str(row["front_prompt"]),
        "back_summary": str(row["back_summary"]),
        "interval_days": int(row["interval_days"]),
        "ease_factor": float(row["ease_factor"]),
        "repetition_count": int(row["repetition_count"]),
        "next_review_at": str(row["next_review_at"]),
    }


class LearningLoopService:
    """Implements business rules, idempotency, telemetry, and database state transitions."""

    def __init__(
        self,
        db: DatabaseManager,
        *,
        is_production: bool = False,
        url_fetcher: Optional[UrlFetcher] = None,
        generator: Optional[ChallengeGenerator] = None,
    ) -> None:
        self.db = db
        self.is_production = is_production
        self.url_fetcher = url_fetcher or UrlFetcher()
        self.generator = generator or default_generator
        self._idem_locks_guard = threading.Lock()
        self._idem_locks: Dict[str, threading.Lock] = {}

    def _get_idem_lock(self, key: str) -> threading.Lock:
        with self._idem_locks_guard:
            lock = self._idem_locks.get(key)
            if lock is None:
                if len(self._idem_locks) > 4096:
                    self._idem_locks.clear()
                lock = threading.Lock()
                self._idem_locks[key] = lock
            return lock

    def _record_telemetry(
        self,
        conn: sqlite3.Connection,
        event_name: str,
        properties: Dict[str, Any],
        now_iso: str,
    ) -> None:
        event_id = f"evt_{uuid.uuid4().hex[:16]}"
        conn.execute(
            """
            INSERT INTO telemetry_events (event_id, event_name, properties_json, created_at)
            VALUES (?, ?, ?, ?)
            """,
            (
                event_id,
                event_name,
                json.dumps(properties, ensure_ascii=False, separators=(",", ":")),
                now_iso,
            ),
        )

    def record_api_error_event(self, endpoint: str, status_code: int, error_code: str) -> None:
        """Best-effort recording of `Api Error Occurred` telemetry event."""
        try:
            now_iso = format_iso8601_utc(resolve_now(None, is_production=True))
            with self.db.write_tx() as conn:
                self._record_telemetry(
                    conn,
                    "Api Error Occurred",
                    {
                        "endpoint": endpoint,
                        "status_code": int(status_code),
                        "error_code": str(error_code),
                    },
                    now_iso,
                )
        except Exception:
            pass

    def _check_idempotency_tx(
        self,
        conn: sqlite3.Connection,
        idem_key: str,
        request_hash: str,
        now_utc: datetime,
    ) -> Optional[Tuple[int, Dict[str, Any]]]:
        row = conn.execute(
            """
            SELECT request_hash, status_code, response_json, created_at
            FROM idempotency_keys
            WHERE idempotency_key = ?
            """,
            (idem_key,),
        ).fetchone()
        if row is None:
            return None

        try:
            created_dt = parse_iso8601_utc(str(row["created_at"]))
            age_seconds = (now_utc - created_dt).total_seconds()
        except ApiProblemError:
            age_seconds = 0.0

        if age_seconds >= IDEMPOTENCY_TTL_SECONDS:
            conn.execute("DELETE FROM idempotency_keys WHERE idempotency_key = ?", (idem_key,))
            return None

        if str(row["request_hash"]) != request_hash:
            raise ApiProblemError(
                code="IDEMPOTENCY_KEY_MISMATCH",
                message="Idempotency-Key は前回と違う内容の要求には使えません",
                field="Idempotency-Key",
            )

        return int(row["status_code"]), json.loads(row["response_json"])

    def _save_idempotency_tx(
        self,
        conn: sqlite3.Connection,
        idem_key: str,
        endpoint: str,
        request_hash: str,
        status_code: int,
        response_dict: Dict[str, Any],
        now_iso: str,
    ) -> None:
        conn.execute(
            """
            INSERT OR REPLACE INTO idempotency_keys
                (idempotency_key, endpoint, request_hash, status_code, response_json, created_at)
            VALUES (?, ?, ?, ?, ?, ?)
            """,
            (
                idem_key,
                endpoint,
                request_hash,
                int(status_code),
                json.dumps(response_dict, ensure_ascii=False, separators=(",", ":")),
                now_iso,
            ),
        )

    def create_learning(
        self,
        body: Any,
        *,
        path: str = "/api/v1/learnings",
        idempotency_key: Optional[str] = None,
        test_now_header: Optional[str] = None,
        fetch_mode_header: Optional[str] = None,
        request_id: str = "req",
    ) -> Tuple[int, Dict[str, Any], bool]:
        """operationId: createLearning (POST /api/v1/learnings)."""
        t0 = time.perf_counter()
        idem_key = _validate_idempotency_key(idempotency_key)
        now_utc = resolve_now(test_now_header, self.is_production)
        payload = _ensure_json_object(body)

        if idem_key is not None:
            lock = self._get_idem_lock(idem_key)
            with lock:
                return self._create_learning_inner(
                    payload=payload,
                    path=path,
                    idem_key=idem_key,
                    now_utc=now_utc,
                    fetch_mode_header=fetch_mode_header,
                    request_id=request_id,
                    t0=t0,
                )
        return self._create_learning_inner(
            payload=payload,
            path=path,
            idem_key=None,
            now_utc=now_utc,
            fetch_mode_header=fetch_mode_header,
            request_id=request_id,
            t0=t0,
        )

    def _create_learning_inner(
        self,
        *,
        payload: Dict[str, Any],
        path: str,
        idem_key: Optional[str],
        now_utc: datetime,
        fetch_mode_header: Optional[str],
        request_id: str,
        t0: float,
    ) -> Tuple[int, Dict[str, Any], bool]:
        req_hash = _compute_request_hash("POST", path, payload) if idem_key is not None else ""

        if idem_key is not None:
            with self.db.write_tx() as conn:
                cached = self._check_idempotency_tx(conn, idem_key, req_hash, now_utc)
                if cached is not None:
                    return cached[0], cached[1], True

        # Whitelist input extraction (prevents Mass Assignment of XP / role / IDs)
        raw_memo = payload.get("memo")
        if raw_memo is None or not isinstance(raw_memo, str):
            raise ApiProblemError(
                code="VALIDATION_ERROR",
                message="memo は10文字以上2000文字以下で入力してください",
                field="memo",
            )
        if len(raw_memo) > 2000 or len(raw_memo.strip()) < 10:
            raise ApiProblemError(
                code="VALIDATION_ERROR",
                message="memo は10文字以上2000文字以下で入力してください",
                field="memo",
            )

        raw_title = payload.get("title")
        if raw_title is not None:
            if not isinstance(raw_title, str) or len(raw_title) > 200:
                raise ApiProblemError(
                    code="VALIDATION_ERROR",
                    message="title は200文字以下の文字列で入力してください",
                    field="title",
                )

        raw_url = payload.get("url")
        if raw_url is not None:
            if not isinstance(raw_url, str) or len(raw_url) > 2048:
                raise ApiProblemError(
                    code="VALIDATION_ERROR",
                    message="url は2048文字以下の文字列で入力してください",
                    field="url",
                )

        raw_category = payload.get("category")
        if raw_category is not None:
            if not isinstance(raw_category, str) or raw_category not in VALID_CATEGORIES:
                raise ApiProblemError(
                    code="VALIDATION_ERROR",
                    message="category は有効な6領域のいずれかで指定してください",
                    field="category",
                )

        # SSRF validation + external URL fetch (before opening DB write lock so external 2s I/O never blocks DB)
        fetch_result = self.url_fetcher.fetch(
            raw_url,
            fetch_mode_header=fetch_mode_header,
            is_production=self.is_production,
            request_id=request_id,
        )

        artifacts = self.generator.generate(
            title=raw_title,
            memo=raw_memo,
            url=raw_url,
            category=raw_category,
            fetched_title=fetch_result.extracted_title,
        )

        now_iso = format_iso8601_utc(now_utc)
        next_review_iso = format_iso8601_utc(now_utc + timedelta(days=1))
        learning_id = f"lrn_{uuid.uuid4().hex[:12]}"
        challenge_id = f"chl_{uuid.uuid4().hex[:12]}"
        card_id = f"crd_{uuid.uuid4().hex[:12]}"
        earned_xp = CG_LEARNING_INITIAL_XP
        processing_ms = max(0, int((time.perf_counter() - t0) * 1000))

        rubric_json = json.dumps(artifacts.rubric_items, ensure_ascii=False, separators=(",", ":"))
        model_points_json = json.dumps(artifacts.model_points, ensure_ascii=False, separators=(",", ":"))

        with self.db.write_tx() as conn:
            if idem_key is not None:
                cached = self._check_idempotency_tx(conn, idem_key, req_hash, now_utc)
                if cached is not None:
                    return cached[0], cached[1], True

            conn.execute(
                """
                INSERT INTO learnings
                    (learning_id, title, url, memo, category, earned_xp, url_fetch_status, processing_ms, created_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
                """,
                (
                    learning_id,
                    artifacts.resolved_title,
                    raw_url,
                    raw_memo,
                    artifacts.category,
                    earned_xp,
                    fetch_result.status,
                    processing_ms,
                    now_iso,
                ),
            )
            conn.execute(
                """
                INSERT INTO challenges
                    (challenge_id, learning_id, category, question, rubric_json, status,
                     answer, matched_rubric_count, earned_xp, model_points_json, created_at, completed_at)
                VALUES (?, ?, ?, ?, ?, 'pending', NULL, NULL, NULL, ?, ?, NULL)
                """,
                (
                    challenge_id,
                    learning_id,
                    artifacts.category,
                    artifacts.question,
                    rubric_json,
                    model_points_json,
                    now_iso,
                ),
            )
            conn.execute(
                """
                INSERT INTO review_cards
                    (card_id, learning_id, category, front_prompt, back_summary,
                     interval_days, ease_factor, repetition_count, next_review_at, last_grade, graded_at, created_at)
                VALUES (?, ?, ?, ?, ?, 1, 2.5, 0, ?, NULL, NULL, ?)
                """,
                (
                    card_id,
                    learning_id,
                    artifacts.category,
                    artifacts.front_prompt,
                    artifacts.back_summary,
                    next_review_iso,
                    now_iso,
                ),
            )
            conn.execute(
                """
                UPDATE skill_progress
                SET total_xp = total_xp + ?, updated_at = ?
                WHERE category = ?
                """,
                (earned_xp, now_iso, artifacts.category),
            )

            self._record_telemetry(
                conn,
                "Learning Created",
                {
                    "category": artifacts.category,
                    "memo_length": len(raw_memo),
                    "has_url": raw_url is not None,
                    "url_fetch_status": fetch_result.status,
                    "processing_ms": processing_ms,
                },
                now_iso,
            )

            response_dict: Dict[str, Any] = {
                "learning_id": learning_id,
                "title": artifacts.resolved_title,
                "url": raw_url,
                "memo": raw_memo,
                "category": artifacts.category,
                "earned_xp": earned_xp,
                "url_fetch_status": fetch_result.status,
                "processing_ms": processing_ms,
                "challenge": {
                    "challenge_id": challenge_id,
                    "learning_id": learning_id,
                    "category": artifacts.category,
                    "question": artifacts.question,
                    "rubric_items": artifacts.rubric_items,
                    "status": "pending",
                    "created_at": now_iso,
                },
                "review_card": {
                    "card_id": card_id,
                    "learning_id": learning_id,
                    "category": artifacts.category,
                    "front_prompt": artifacts.front_prompt,
                    "back_summary": artifacts.back_summary,
                    "interval_days": 1,
                    "ease_factor": 2.5,
                    "repetition_count": 0,
                    "next_review_at": next_review_iso,
                },
                "created_at": now_iso,
            }

            if idem_key is not None:
                self._save_idempotency_tx(
                    conn,
                    idem_key=idem_key,
                    endpoint=path,
                    request_hash=req_hash,
                    status_code=201,
                    response_dict=response_dict,
                    now_iso=now_iso,
                )

        return 201, response_dict, False

    def get_today_session(
        self,
        *,
        test_now_header: Optional[str] = None,
    ) -> Dict[str, Any]:
        """operationId: getTodaySession (GET /api/v1/sessions/today)."""
        now_utc = resolve_now(test_now_header, self.is_production)
        now_iso = format_iso8601_utc(now_utc)
        session_date = now_utc.strftime("%Y-%m-%d")

        with self.db.write_tx() as conn:
            chl_row = conn.execute(
                """
                SELECT challenge_id, learning_id, category, question, rubric_json, status, created_at
                FROM challenges
                WHERE status = 'pending'
                ORDER BY created_at ASC, rowid ASC
                LIMIT 1
                """
            ).fetchone()

            active_challenge = _build_challenge_item(chl_row) if chl_row is not None else None

            # Evaluate due review cards using canonical UTC comparison (supports both indexed ISO strings and offsets)
            all_card_rows = conn.execute(
                """
                SELECT card_id, learning_id, category, front_prompt, back_summary,
                       interval_days, ease_factor, repetition_count, next_review_at
                FROM review_cards
                ORDER BY next_review_at ASC, card_id ASC
                """
            ).fetchall()

            due_With_dt: List[Tuple[datetime, str, sqlite3.Row]] = []
            for r in all_card_rows:
                due_dt = parse_iso8601_utc(str(r["next_review_at"]))
                if due_dt <= now_utc:
                    due_With_dt.append((due_dt, str(r["card_id"]), r))

            due_With_dt.sort(key=lambda item: (item[0], item[1]))
            total_due_count = len(due_With_dt)
            due_reviews = [_build_review_card_item(item[2]) for item in due_With_dt[:5]]

            total_session_items = (1 if active_challenge is not None else 0) + len(due_reviews)
            estimated_seconds = min(
                180,
                (55 if active_challenge is not None else 0) + len(due_reviews) * 25,
            )
            is_empty = total_session_items == 0

            if is_empty:
                session_label_ja = (
                    "本日の復習はすべて完了しています。新しい記事URLや学びのメモを1件追加して3分ループを始めましょう"
                )
            else:
                minutes = max(1, (estimated_seconds + 59) // 60)
                session_label_ja = f"本日のセッション（全{total_session_items}問・目安{minutes}分）"

            self._record_telemetry(
                conn,
                "Session Started",
                {
                    "due_review_count": total_due_count,
                    "has_active_challenge": active_challenge is not None,
                },
                now_iso,
            )

        return {
            "session_date": session_date,
            "active_challenge": active_challenge,
            "due_reviews": due_reviews,
            "total_due_count": total_due_count,
            "total_session_items": total_session_items,
            "estimated_seconds": estimated_seconds,
            "session_label_ja": session_label_ja,
            "is_empty": is_empty,
        }

    def _count_remaining_due_cards(self, conn: sqlite3.Connection, now_utc: datetime) -> int:
        rows = conn.execute("SELECT next_review_at FROM review_cards").fetchall()
        count = 0
        for r in rows:
            if parse_iso8601_utc(str(r["next_review_at"])) <= now_utc:
                count += 1
        return count

    def _maybe_record_session_completed(
        self,
        conn: sqlite3.Connection,
        now_utc: datetime,
        now_iso: str,
        elapsed_seconds: int,
        streak_days: int,
    ) -> None:
        pending_chl = conn.execute(
            "SELECT COUNT(*) FROM challenges WHERE status = 'pending'"
        ).fetchone()[0]
        if int(pending_chl) == 0 and self._count_remaining_due_cards(conn, now_utc) == 0:
            self._record_telemetry(
                conn,
                "Session Completed",
                {
                    "elapsed_seconds": int(elapsed_seconds),
                    "completed_items_count": 1,
                    "streak_days": int(streak_days),
                },
                now_iso,
            )

    def submit_challenge(
        self,
        challenge_id: str,
        body: Any,
        *,
        path: str,
        idempotency_key: Optional[str] = None,
        test_now_header: Optional[str] = None,
    ) -> Tuple[int, Dict[str, Any], bool]:
        """
        operationId: submitChallenge (POST /api/v1/challenges/{challenge_id}/submit).
        Inspection order per contract L478:
        1. Idempotency-Key shape (400) -> 2. Replay/Mismatch (200/422) -> 3. Exists (404) -> 4. Body (400) -> 5. Status (409).
        """
        idem_key = _validate_idempotency_key(idempotency_key)
        now_utc = resolve_now(test_now_header, self.is_production)
        now_iso = format_iso8601_utc(now_utc)
        payload = _ensure_json_object(body)
        req_hash = _compute_request_hash("POST", path, payload) if idem_key is not None else ""

        with self.db.write_tx() as conn:
            if idem_key is not None:
                cached = self._check_idempotency_tx(conn, idem_key, req_hash, now_utc)
                if cached is not None:
                    return cached[0], cached[1], True

            chl_row = conn.execute(
                """
                SELECT challenge_id, category, question, status, model_points_json
                FROM challenges
                WHERE challenge_id = ?
                """,
                (challenge_id,),
            ).fetchone()
            if chl_row is None:
                raise ApiProblemError(
                    code="RESOURCE_NOT_FOUND",
                    message="指定された challenge_id は存在しません",
                    field="challenge_id",
                )

            raw_answer = payload.get("answer")
            if raw_answer is None or not isinstance(raw_answer, str):
                raise ApiProblemError(
                    code="VALIDATION_ERROR",
                    message="answer は10文字以上2000文字以下で入力してください",
                    field="answer",
                )
            if len(raw_answer) > 2000 or len(raw_answer.strip()) < 10:
                raise ApiProblemError(
                    code="VALIDATION_ERROR",
                    message="answer は10文字以上2000文字以下で入力してください",
                    field="answer",
                )

            raw_mrc = payload.get("matched_rubric_count")
            if raw_mrc is None or not _is_strict_int(raw_mrc) or raw_mrc < 0 or raw_mrc > 3:
                raise ApiProblemError(
                    code="VALIDATION_ERROR",
                    message="matched_rubric_count は 0 から 3 の整数で指定してください",
                    field="matched_rubric_count",
                )

            raw_elapsed = payload.get("elapsed_seconds", 60)
            if not _is_strict_int(raw_elapsed) or raw_elapsed < 0:
                raise ApiProblemError(
                    code="VALIDATION_ERROR",
                    message="elapsed_seconds は 0 以上の整数で指定してください",
                    field="elapsed_seconds",
                )

            if str(chl_row["status"]) == "completed":
                raise ApiProblemError(
                    code="CHALLENGE_ALREADY_COMPLETED",
                    message="指定された challenge_id はすでに回答済みです",
                    field="challenge_id",
                )

            category = str(chl_row["category"])
            earned_xp = 20 + int(raw_mrc) * 10

            if chl_row["model_points_json"]:
                model_points = json.loads(chl_row["model_points_json"])
            else:
                gen = self.generator.generate(
                    title=None,
                    memo=str(chl_row["question"]),
                    url=None,
                    category=category,
                )
                model_points = gen.model_points

            conn.execute(
                """
                UPDATE challenges
                SET status = 'completed',
                    answer = ?,
                    matched_rubric_count = ?,
                    earned_xp = ?,
                    model_points_json = ?,
                    completed_at = ?
                WHERE challenge_id = ?
                """,
                (
                    raw_answer,
                    int(raw_mrc),
                    earned_xp,
                    json.dumps(model_points, ensure_ascii=False, separators=(",", ":")),
                    now_iso,
                    challenge_id,
                ),
            )

            conn.execute(
                """
                UPDATE skill_progress
                SET total_xp = total_xp + ?, updated_at = ?
                WHERE category = ?
                """,
                (earned_xp, now_iso, category),
            )
            xp_row = conn.execute(
                "SELECT total_xp FROM skill_progress WHERE category = ?",
                (category,),
            ).fetchone()
            new_total_xp = int(xp_row["total_xp"])
            new_level = compute_level(new_total_xp)

            stats_row = conn.execute(
                "SELECT streak_days, last_study_date FROM user_stats WHERE id = 1"
            ).fetchone()
            new_streak, new_last_date = compute_streak_on_completion(
                int(stats_row["streak_days"]),
                stats_row["last_study_date"],
                now_utc,
            )
            conn.execute(
                "UPDATE user_stats SET streak_days = ?, last_study_date = ? WHERE id = 1",
                (new_streak, new_last_date),
            )

            self._record_telemetry(
                conn,
                "Challenge Submitted",
                {
                    "category": category,
                    "answer_length": len(raw_answer),
                    "matched_rubric_count": int(raw_mrc),
                    "earned_xp": earned_xp,
                },
                now_iso,
            )
            self._maybe_record_session_completed(conn, now_utc, now_iso, int(raw_elapsed), new_streak)

            response_dict: Dict[str, Any] = {
                "challenge_id": challenge_id,
                "status": "completed",
                "category": category,
                "answer": raw_answer,
                "matched_rubric_count": int(raw_mrc),
                "earned_xp": earned_xp,
                "total_xp": new_total_xp,
                "level": new_level,
                "streak_days": new_streak,
                "model_points": model_points,
                "completed_at": now_iso,
            }

            if idem_key is not None:
                self._save_idempotency_tx(
                    conn,
                    idem_key=idem_key,
                    endpoint=path,
                    request_hash=req_hash,
                    status_code=200,
                    response_dict=response_dict,
                    now_iso=now_iso,
                )

        return 200, response_dict, False

    def grade_review_card(
        self,
        card_id: str,
        body: Any,
        *,
        path: str,
        idempotency_key: Optional[str] = None,
        test_now_header: Optional[str] = None,
    ) -> Tuple[int, Dict[str, Any], bool]:
        """
        operationId: gradeReviewCard (POST /api/v1/reviews/{card_id}/grade).
        Inspection order per contract L656:
        1. Idempotency-Key shape (400) -> 2. Replay/Mismatch (200/422) -> 3. Exists (404) -> 4. Body (400) -> 5. Due check (409).
        """
        idem_key = _validate_idempotency_key(idempotency_key)
        now_utc = resolve_now(test_now_header, self.is_production)
        now_iso = format_iso8601_utc(now_utc)
        payload = _ensure_json_object(body)
        req_hash = _compute_request_hash("POST", path, payload) if idem_key is not None else ""

        with self.db.write_tx() as conn:
            if idem_key is not None:
                cached = self._check_idempotency_tx(conn, idem_key, req_hash, now_utc)
                if cached is not None:
                    return cached[0], cached[1], True

            card_row = conn.execute(
                """
                SELECT card_id, category, interval_days, ease_factor, repetition_count, next_review_at
                FROM review_cards
                WHERE card_id = ?
                """,
                (card_id,),
            ).fetchone()
            if card_row is None:
                raise ApiProblemError(
                    code="RESOURCE_NOT_FOUND",
                    message="指定された card_id は存在しません",
                    field="card_id",
                )

            raw_grade = payload.get("grade")
            if raw_grade is None or not _is_strict_int(raw_grade) or raw_grade < 1 or raw_grade > 4:
                raise ApiProblemError(
                    code="VALIDATION_ERROR",
                    message="grade は 1 から 4 の整数で指定してください",
                    field="grade",
                )

            raw_elapsed = payload.get("elapsed_seconds", 20)
            if not _is_strict_int(raw_elapsed) or raw_elapsed < 0:
                raise ApiProblemError(
                    code="VALIDATION_ERROR",
                    message="elapsed_seconds は 0 以上の整数で指定してください",
                    field="elapsed_seconds",
                )

            due_dt = parse_iso8601_utc(str(card_row["next_review_at"]))
            if due_dt > now_utc:
                raise ApiProblemError(
                    code="REVIEW_CARD_NOT_DUE",
                    message="指定された card_id はまだ復習の期限が来ていません",
                    field="card_id",
                )

            new_rep, new_ivl, new_ef = compute_sm2_review(
                repetition_count=int(card_row["repetition_count"]),
                interval_days=int(card_row["interval_days"]),
                ease_factor=float(card_row["ease_factor"]),
                grade=int(raw_grade),
            )
            next_review_iso = format_iso8601_utc(now_utc + timedelta(days=new_ivl))
            category = str(card_row["category"])
            earned_xp = CG_REVIEW_CARD_XP

            conn.execute(
                """
                UPDATE review_cards
                SET repetition_count = ?,
                    interval_days = ?,
                    ease_factor = ?,
                    next_review_at = ?,
                    last_grade = ?,
                    graded_at = ?
                WHERE card_id = ?
                """,
                (
                    new_rep,
                    new_ivl,
                    new_ef,
                    next_review_iso,
                    int(raw_grade),
                    now_iso,
                    card_id,
                ),
            )

            conn.execute(
                """
                UPDATE skill_progress
                SET total_xp = total_xp + ?, updated_at = ?
                WHERE category = ?
                """,
                (earned_xp, now_iso, category),
            )
            xp_row = conn.execute(
                "SELECT total_xp FROM skill_progress WHERE category = ?",
                (category,),
            ).fetchone()
            new_total_xp = int(xp_row["total_xp"])
            new_level = compute_level(new_total_xp)

            stats_row = conn.execute(
                "SELECT streak_days, last_study_date FROM user_stats WHERE id = 1"
            ).fetchone()
            new_streak, new_last_date = compute_streak_on_completion(
                int(stats_row["streak_days"]),
                stats_row["last_study_date"],
                now_utc,
            )
            conn.execute(
                "UPDATE user_stats SET streak_days = ?, last_study_date = ? WHERE id = 1",
                (new_streak, new_last_date),
            )

            remaining_due_count = self._count_remaining_due_cards(conn, now_utc)

            self._record_telemetry(
                conn,
                "Review Graded",
                {
                    "category": category,
                    "grade": int(raw_grade),
                    "new_interval_days": new_ivl,
                    "earned_xp": earned_xp,
                },
                now_iso,
            )
            self._maybe_record_session_completed(conn, now_utc, now_iso, int(raw_elapsed), new_streak)

            response_dict: Dict[str, Any] = {
                "card_id": card_id,
                "category": category,
                "grade": int(raw_grade),
                "repetition_count": new_rep,
                "interval_days": new_ivl,
                "ease_factor": new_ef,
                "next_review_at": next_review_iso,
                "earned_xp": earned_xp,
                "total_xp": new_total_xp,
                "level": new_level,
                "streak_days": new_streak,
                "remaining_due_count": remaining_due_count,
            }

            if idem_key is not None:
                self._save_idempotency_tx(
                    conn,
                    idem_key=idem_key,
                    endpoint=path,
                    request_hash=req_hash,
                    status_code=200,
                    response_dict=response_dict,
                    now_iso=now_iso,
                )

        return 200, response_dict, False

    def get_skills_summary(
        self,
        *,
        test_now_header: Optional[str] = None,
    ) -> Dict[str, Any]:
        """operationId: getSkillsSummary (GET /api/v1/skills/summary)."""
        now_utc = resolve_now(test_now_header, self.is_production)

        with self.db.read_tx() as conn:
            xp_rows = conn.execute("SELECT category, total_xp FROM skill_progress").fetchall()
            xp_by_cat = {str(r["category"]): int(r["total_xp"]) for r in xp_rows}

            categories_out: List[Dict[str, Any]] = []
            overall_xp = 0
            for cat, label_ja, label_en in SKILL_CATEGORIES:
                cat_xp = xp_by_cat.get(cat, 0)
                overall_xp += cat_xp
                categories_out.append(
                    {
                        "category": cat,
                        "label_ja": label_ja,
                        "label_en": label_en,
                        "total_xp": cat_xp,
                        "level": compute_level(cat_xp),
                        "xp_to_next_level": compute_xp_to_next_level(cat_xp),
                    }
                )

            overall_level = compute_level(overall_xp)

            stats_row = conn.execute(
                "SELECT streak_days, last_study_date FROM user_stats WHERE id = 1"
            ).fetchone()
            effective_streak = compute_effective_streak_for_summary(
                int(stats_row["streak_days"]) if stats_row is not None else 0,
                stats_row["last_study_date"] if stats_row is not None else None,
                now_utc,
            )

            # Count completed challenges and mastered review cards (last_grade >= 3) within [now - 168h, now]
            completed_rows = conn.execute(
                "SELECT completed_at FROM challenges WHERE status = 'completed' AND completed_at IS NOT NULL"
            ).fetchall()
            mastered_challenges = sum(
                1 for r in completed_rows if is_within_weekly_window(str(r["completed_at"]), now_utc)
            )

            graded_rows = conn.execute(
                """
                SELECT graded_at FROM review_cards
                WHERE last_grade IS NOT NULL AND last_grade >= 3 AND graded_at IS NOT NULL
                """
            ).fetchall()
            mastered_cards = sum(
                1 for r in graded_rows if is_within_weekly_window(str(r["graded_at"]), now_utc)
            )

            weekly_mastered_count = mastered_challenges + mastered_cards

        return {
            "categories": categories_out,
            "total_xp": overall_xp,
            "overall_level": overall_level,
            "streak_days": effective_streak,
            "weekly_mastered_count": weekly_mastered_count,
        }

    def _wipe_all_tables_tx(self, conn: sqlite3.Connection) -> None:
        conn.execute("DELETE FROM review_cards;")
        conn.execute("DELETE FROM challenges;")
        conn.execute("DELETE FROM learnings;")
        conn.execute("DELETE FROM idempotency_keys;")
        conn.execute("DELETE FROM telemetry_events;")
        conn.execute(
            "UPDATE skill_progress SET total_xp = 0, updated_at = '1970-01-01T00:00:00Z';"
        )
        conn.execute("UPDATE user_stats SET streak_days = 0, last_study_date = NULL WHERE id = 1;")

    def purge_all_user_data(self) -> None:
        """Delete all stored learning records, cards, challenges, idempotency cache, telemetry, and reset stats."""
        with self.db.write_tx() as conn:
            self._wipe_all_tables_tx(conn)

    def purge_expired_records(self, now_utc: Optional[datetime] = None) -> Tuple[int, int]:
        """Purge expired idempotency_keys (>24h) and telemetry_events (>90d) per retention map."""
        ref = now_utc or resolve_now(None, is_production=True)
        idem_cutoff = format_iso8601_utc(ref - timedelta(seconds=IDEMPOTENCY_TTL_SECONDS))
        telemetry_cutoff = format_iso8601_utc(ref - timedelta(days=90))
        with self.db.write_tx() as conn:
            cur1 = conn.execute(
                "DELETE FROM idempotency_keys WHERE created_at <= ?",
                (idem_cutoff,),
            )
            cur2 = conn.execute(
                "DELETE FROM telemetry_events WHERE created_at < ?",
                (telemetry_cutoff,),
            )
            return cur1.rowcount, cur2.rowcount

    def reset_test_state(self) -> Dict[str, Any]:
        """operationId: resetTestState (POST /api/v1/test/reset)."""
        if self.is_production:
            raise ApiProblemError(
                code="TEST_SEAM_DISABLED",
                message="本番モードでは /api/v1/test/* は無効化されています",
            )
        self.purge_all_user_data()
        return {"status": "reset_ok"}

    def seed_test_state(
        self,
        body: Any,
        *,
        test_now_header: Optional[str] = None,
    ) -> Dict[str, Any]:
        """operationId: seedTestState (POST /api/v1/test/seed)."""
        if self.is_production:
            raise ApiProblemError(
                code="TEST_SEAM_DISABLED",
                message="本番モードでは /api/v1/test/* は無効化されています",
            )

        payload = _ensure_json_object(body)

        reset_first = payload.get("reset_first", True)
        if not isinstance(reset_first, bool):
            raise ApiProblemError(
                code="VALIDATION_ERROR",
                message="reset_first は真偽値で指定してください",
                field="reset_first",
            )

        if "now" in payload and payload["now"] is not None:
            seed_now = parse_iso8601_utc(payload["now"], field_name="now")
        else:
            seed_now = resolve_now(test_now_header, is_production=False)
        seed_now_iso = format_iso8601_utc(seed_now)

        streak_days = payload.get("streak_days")
        if streak_days is not None and (not _is_strict_int(streak_days) or streak_days < 0):
            raise ApiProblemError(
                code="VALIDATION_ERROR",
                message="streak_days は 0 以上の整数で指定してください",
                field="streak_days",
            )

        has_last_study_date = "last_study_date" in payload
        last_study_date = payload.get("last_study_date")
        if last_study_date is not None:
            if not isinstance(last_study_date, str):
                raise ApiProblemError(
                    code="VALIDATION_ERROR",
                    message="last_study_date は YYYY-MM-DD 文字列または null で指定してください",
                    field="last_study_date",
                )
            try:
                date.fromisoformat(last_study_date)
            except ValueError as exc:
                raise ApiProblemError(
                    code="VALIDATION_ERROR",
                    message="last_study_date は YYYY-MM-DD 形式で指定してください",
                    field="last_study_date",
                ) from exc

        category_xp = payload.get("category_xp")
        if category_xp is not None:
            if not isinstance(category_xp, dict):
                raise ApiProblemError(
                    code="VALIDATION_ERROR",
                    message="category_xp はオブジェクトで指定してください",
                    field="category_xp",
                )
            for cat, xp_val in category_xp.items():
                if cat not in VALID_CATEGORIES or not _is_strict_int(xp_val) or xp_val < 0:
                    raise ApiProblemError(
                        code="VALIDATION_ERROR",
                        message="category_xp の領域名または XP 値が不正です",
                        field="category_xp",
                    )

        challenges_in = payload.get("challenges", [])
        if challenges_in is None or not isinstance(challenges_in, list):
            raise ApiProblemError(
                code="VALIDATION_ERROR",
                message="challenges は配列で指定してください",
                field="challenges",
            )

        cards_in = payload.get("review_cards", [])
        if cards_in is None or not isinstance(cards_in, list):
            raise ApiProblemError(
                code="VALIDATION_ERROR",
                message="review_cards は配列で指定してください",
                field="review_cards",
            )

        with self.db.write_tx() as conn:
            if reset_first:
                self._wipe_all_tables_tx(conn)

            if streak_days is not None:
                conn.execute("UPDATE user_stats SET streak_days = ? WHERE id = 1", (int(streak_days),))
            if has_last_study_date:
                conn.execute("UPDATE user_stats SET last_study_date = ? WHERE id = 1", (last_study_date,))

            if category_xp:
                for cat, xp_val in category_xp.items():
                    conn.execute(
                        "UPDATE skill_progress SET total_xp = ?, updated_at = ? WHERE category = ?",
                        (int(xp_val), seed_now_iso, cat),
                    )

            seeded_challenges_count = 0
            for idx, item in enumerate(challenges_in):
                if not isinstance(item, dict) or not isinstance(item.get("question"), str) or not item["question"]:
                    raise ApiProblemError(
                        code="VALIDATION_ERROR",
                        message="challenges の各要素には question 文字列が必要です",
                        field="challenges",
                    )
                chl_id = str(item.get("challenge_id") or f"chl_seed_{idx + 1}_{uuid.uuid4().hex[:6]}")
                lrn_id = str(item.get("learning_id") or f"lrn_for_{chl_id}")
                cat = str(item.get("category") or "data")
                if cat not in VALID_CATEGORIES:
                    raise ApiProblemError(
                        code="VALIDATION_ERROR",
                        message="challenges.category が不正です",
                        field="challenges",
                    )
                status = str(item.get("status") or "pending")
                if status not in ("pending", "completed"):
                    raise ApiProblemError(
                        code="VALIDATION_ERROR",
                        message="challenges.status が不正です",
                        field="challenges",
                    )
                created_iso = (
                    format_iso8601_utc(parse_iso8601_utc(item["created_at"], "created_at"))
                    if item.get("created_at") is not None
                    else seed_now_iso
                )
                completed_iso = (
                    format_iso8601_utc(parse_iso8601_utc(item["completed_at"], "completed_at"))
                    if item.get("completed_at") is not None
                    else (seed_now_iso if status == "completed" and "completed_at" not in item else None)
                )

                gen = self.generator.generate(
                    title="Seeded Learning",
                    memo=str(item["question"]),
                    url=None,
                    category=cat,
                )

                conn.execute(
                    """
                    INSERT OR IGNORE INTO learnings
                        (learning_id, title, url, memo, category, earned_xp, url_fetch_status, processing_ms, created_at)
                    VALUES (?, ?, NULL, ?, ?, 15, 'not_provided', 0, ?)
                    """,
                    (lrn_id, gen.resolved_title, str(item["question"]), cat, created_iso),
                )
                try:
                    conn.execute(
                        """
                        INSERT INTO challenges
                            (challenge_id, learning_id, category, question, rubric_json, status,
                             answer, matched_rubric_count, earned_xp, model_points_json, created_at, completed_at)
                        VALUES (?, ?, ?, ?, ?, ?, NULL, NULL, NULL, ?, ?, ?)
                        """,
                        (
                            chl_id,
                            lrn_id,
                            cat,
                            str(item["question"]),
                            json.dumps(gen.rubric_items, ensure_ascii=False, separators=(",", ":")),
                            status,
                            json.dumps(gen.model_points, ensure_ascii=False, separators=(",", ":")),
                            created_iso,
                            completed_iso,
                        ),
                    )
                except sqlite3.IntegrityError as exc:
                    raise ApiProblemError(
                        code="VALIDATION_ERROR",
                        message="challenges の challenge_id が重複しているか制約に違反しています",
                        field="challenges",
                    ) from exc
                seeded_challenges_count += 1

            seeded_cards_count = 0
            for idx, item in enumerate(cards_in):
                if (
                    not isinstance(item, dict)
                    or not isinstance(item.get("front_prompt"), str)
                    or not isinstance(item.get("back_summary"), str)
                    or not isinstance(item.get("next_review_at"), str)
                ):
                    raise ApiProblemError(
                        code="VALIDATION_ERROR",
                        message="review_cards の各要素には front_prompt, back_summary, next_review_at が必要です",
                        field="review_cards",
                    )
                crd_id = str(item.get("card_id") or f"crd_seed_{idx + 1}_{uuid.uuid4().hex[:6]}")
                lrn_id = str(item.get("learning_id") or f"lrn_for_{crd_id}")
                cat = str(item.get("category") or "data")
                if cat not in VALID_CATEGORIES:
                    raise ApiProblemError(
                        code="VALIDATION_ERROR",
                        message="review_cards.category が不正です",
                        field="review_cards",
                    )
                rep = item.get("repetition_count", 0)
                ivl = item.get("interval_days", 1)
                ef = item.get("ease_factor", 2.5)
                if not _is_strict_int(rep) or rep < 0:
                    raise ApiProblemError(
                        code="VALIDATION_ERROR",
                        message="review_cards.repetition_count が不正です",
                        field="review_cards",
                    )
                if not _is_strict_int(ivl) or ivl < 1:
                    raise ApiProblemError(
                        code="VALIDATION_ERROR",
                        message="review_cards.interval_days が不正です",
                        field="review_cards",
                    )
                if not _is_strict_number(ef) or float(ef) < 1.3:
                    raise ApiProblemError(
                        code="VALIDATION_ERROR",
                        message="review_cards.ease_factor が不正です",
                        field="review_cards",
                    )
                next_rev_iso = format_iso8601_utc(
                    parse_iso8601_utc(item["next_review_at"], "next_review_at")
                )
                last_grade = item.get("last_grade")
                if last_grade is not None and (
                    not _is_strict_int(last_grade) or last_grade < 1 or last_grade > 4
                ):
                    raise ApiProblemError(
                        code="VALIDATION_ERROR",
                        message="review_cards.last_grade が不正です",
                        field="review_cards",
                    )
                graded_iso = (
                    format_iso8601_utc(parse_iso8601_utc(item["graded_at"], "graded_at"))
                    if item.get("graded_at") is not None
                    else None
                )

                conn.execute(
                    """
                    INSERT OR IGNORE INTO learnings
                        (learning_id, title, url, memo, category, earned_xp, url_fetch_status, processing_ms, created_at)
                    VALUES (?, ?, NULL, ?, ?, 15, 'not_provided', 0, ?)
                    """,
                    (lrn_id, str(item["front_prompt"])[:200], str(item["back_summary"]), cat, seed_now_iso),
                )
                try:
                    conn.execute(
                        """
                        INSERT INTO review_cards
                            (card_id, learning_id, category, front_prompt, back_summary,
                             interval_days, ease_factor, repetition_count, next_review_at, last_grade, graded_at, created_at)
                        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                        """,
                        (
                            crd_id,
                            lrn_id,
                            cat,
                            str(item["front_prompt"]),
                            str(item["back_summary"]),
                            int(ivl),
                            float(ef),
                            int(rep),
                            next_rev_iso,
                            int(last_grade) if last_grade is not None else None,
                            graded_iso,
                            seed_now_iso,
                        ),
                    )
                except sqlite3.IntegrityError as exc:
                    raise ApiProblemError(
                        code="VALIDATION_ERROR",
                        message="review_cards の card_id が重複しているか制約に違反しています",
                        field="review_cards",
                    ) from exc
                seeded_cards_count += 1

        return {
            "status": "seeded_ok",
            "seeded_challenges_count": seeded_challenges_count,
            "seeded_review_cards_count": seeded_cards_count,
        }
