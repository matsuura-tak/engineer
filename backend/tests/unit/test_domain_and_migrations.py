"""Tests for domain formulas, migrations (up/down/up + data preservation), and UI enum/i18n safety."""

from datetime import datetime, timezone
from decimal import Decimal
import os
import sqlite3
import tempfile
import unittest

from backend.db import DatabaseManager
from backend.domain import (
    compute_effective_streak_for_summary,
    compute_level,
    compute_sm2_review,
    compute_streak_on_completion,
    compute_xp_to_next_level,
    is_within_weekly_window,
    parse_iso8601_utc,
    round_half_up,
)
from backend.migrations import get_applied_versions, migrate_down, migrate_up
from backend.ui import (
    UI_STRINGS,
    normalize_ui_category,
    normalize_ui_fetch_status,
    resolve_problem_ui_message,
)


class TestDomainCalculations(unittest.TestCase):
    def test_level_and_remaining_xp_boundaries(self) -> None:
        cases = [
            (0, 1, 100),
            (1, 1, 99),
            (99, 1, 1),
            (100, 2, 100),
            (199, 2, 1),
            (200, 3, 100),
            (285, 3, 15),
        ]
        for xp, expected_lvl, expected_rem in cases:
            with self.subTest(xp=xp):
                self.assertEqual(compute_level(xp), expected_lvl)
                self.assertEqual(compute_xp_to_next_level(xp), expected_rem)

    def test_sm2_formulas_and_round_half_up(self) -> None:
        self.assertEqual(round_half_up(Decimal("19.5")), 20)
        self.assertEqual(round_half_up(Decimal("19.49")), 19)
        self.assertEqual(round_half_up(Decimal("0.5")), 1)

        # From rep=0, ivl=1, ef=2.5
        self.assertEqual(compute_sm2_review(0, 1, 2.5, 3), (1, 1, 2.5))
        self.assertEqual(compute_sm2_review(0, 1, 2.5, 4), (1, 1, 2.6))

        # From rep=1, ivl=1, ef=2.5
        self.assertEqual(compute_sm2_review(1, 1, 2.5, 1), (0, 1, 2.3))
        self.assertEqual(compute_sm2_review(1, 1, 2.5, 2), (2, 1, 2.35))
        self.assertEqual(compute_sm2_review(1, 1, 2.5, 3), (2, 6, 2.5))
        self.assertEqual(compute_sm2_review(1, 1, 2.5, 4), (2, 8, 2.6))

        # From rep=2, ivl=6, ef=2.5 -> 6*2.5=15, grade4 -> round_half_up(15*1.3=19.5)=20
        self.assertEqual(compute_sm2_review(2, 6, 2.5, 3), (3, 15, 2.5))
        self.assertEqual(compute_sm2_review(2, 6, 2.5, 4), (3, 20, 2.6))

        # Ease factor lower bound 1.3
        self.assertEqual(compute_sm2_review(2, 4, 1.3, 1), (0, 1, 1.3))
        self.assertEqual(compute_sm2_review(2, 4, 1.4, 2)[2], 1.3)

    def test_streak_calculation_and_summary_decay(self) -> None:
        now = parse_iso8601_utc("2026-10-30T09:00:00Z")

        # Never studied -> summary 0, completion -> 1
        self.assertEqual(compute_effective_streak_for_summary(0, None, now), 0)
        self.assertEqual(compute_streak_on_completion(0, None, now), (1, "2026-10-30"))

        # Studied yesterday -> summary keeps 2, completion -> 3
        self.assertEqual(compute_effective_streak_for_summary(2, "2026-10-29", now), 2)
        self.assertEqual(compute_streak_on_completion(2, "2026-10-29", now), (3, "2026-10-30"))

        # Studied today -> unchanged
        self.assertEqual(compute_effective_streak_for_summary(3, "2026-10-30", now), 3)
        self.assertEqual(compute_streak_on_completion(3, "2026-10-30", now), (3, "2026-10-30"))

        # Studied 2 days ago -> summary 0, completion resets to 1
        self.assertEqual(compute_effective_streak_for_summary(5, "2026-10-28", now), 0)
        self.assertEqual(compute_streak_on_completion(5, "2026-10-28", now), (1, "2026-10-30"))

    def test_weekly_window_inclusive_boundaries(self) -> None:
        now = datetime(2026, 10, 30, 9, 0, 0, tzinfo=timezone.utc)
        self.assertTrue(is_within_weekly_window("2026-10-23T09:00:00Z", now))  # Exactly -168h
        self.assertTrue(is_within_weekly_window("2026-10-30T09:00:00Z", now))  # Exactly now
        self.assertFalse(is_within_weekly_window("2026-10-23T08:59:59Z", now))  # 1s too old
        self.assertFalse(is_within_weekly_window("2026-10-30T09:00:01Z", now))  # 1s in future


class TestMigrationsAndCompatibility(unittest.TestCase):
    def test_migration_up_down_up_on_real_sqlite_file(self) -> None:
        with tempfile.TemporaryDirectory() as tmpdir:
            db_path = os.path.join(tmpdir, "mig_test.sqlite3")
            conn = sqlite3.connect(db_path)
            try:
                applied1 = migrate_up(conn)
                self.assertEqual(applied1, [1])
                self.assertEqual(get_applied_versions(conn), [1])

                tables_up = {
                    r[0]
                    for r in conn.execute(
                        "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'"
                    ).fetchall()
                }
                self.assertEqual(
                    tables_up,
                    {
                        "schema_migrations",
                        "learnings",
                        "challenges",
                        "review_cards",
                        "skill_progress",
                        "user_stats",
                        "idempotency_keys",
                        "telemetry_events",
                    },
                )

                # Verify foreign key indexes exist
                indexes = {
                    r[0]
                    for r in conn.execute(
                        "SELECT name FROM sqlite_master WHERE type='index' AND name NOT LIKE 'sqlite_%'"
                    ).fetchall()
                }
                self.assertIn("idx_challenges_learning_id", indexes)
                self.assertIn("idx_review_cards_learning_id", indexes)
                self.assertIn("idx_review_cards_next_review_at", indexes)

                rolled_back = migrate_down(conn, target_version=0)
                self.assertEqual(rolled_back, [1])
                self.assertEqual(get_applied_versions(conn), [])

                tables_down = {
                    r[0]
                    for r in conn.execute(
                        "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'"
                    ).fetchall()
                }
                self.assertEqual(tables_down, {"schema_migrations"})

                applied2 = migrate_up(conn)
                self.assertEqual(applied2, [1])
                self.assertEqual(get_applied_versions(conn), [1])
                cat_count = conn.execute("SELECT COUNT(*) FROM skill_progress").fetchone()[0]
                self.assertEqual(cat_count, 6)
            finally:
                conn.close()

    def test_re_running_init_db_preserves_existing_records(self) -> None:
        with tempfile.TemporaryDirectory() as tmpdir:
            db_path = os.path.join(tmpdir, "preserve.sqlite3")
            db1 = DatabaseManager(db_path)
            db1.init_db()
            with db1.write_tx() as conn:
                conn.execute(
                    """
                    INSERT INTO learnings
                        (learning_id, title, url, memo, category, earned_xp, url_fetch_status, processing_ms, created_at)
                    VALUES ('lrn_keep', 'Keep', NULL, '0123456789memo', 'data', 15, 'not_provided', 3, '2026-10-30T09:00:00Z')
                    """
                )
                conn.execute("UPDATE skill_progress SET total_xp = 120 WHERE category = 'data'")
                conn.execute("UPDATE user_stats SET streak_days = 4, last_study_date = '2026-10-30' WHERE id = 1")
            db1.close()

            # Re-open and re-run init_db() simulating app upgrade / restart
            db2 = DatabaseManager(db_path)
            newly_applied = db2.init_db()
            self.assertEqual(newly_applied, [])
            with db2.read_tx() as conn:
                lrn = conn.execute("SELECT title FROM learnings WHERE learning_id = 'lrn_keep'").fetchone()
                xp = conn.execute("SELECT total_xp FROM skill_progress WHERE category = 'data'").fetchone()
                st = conn.execute("SELECT streak_days FROM user_stats WHERE id = 1").fetchone()
                self.assertEqual(lrn["title"], "Keep")
                self.assertEqual(int(xp["total_xp"]), 120)
                self.assertEqual(int(st["streak_days"]), 4)
            db2.close()


class TestUiI18nAndForwardCompatibility(unittest.TestCase):
    def test_ja_and_en_string_keys_match_with_zero_missing_values(self) -> None:
        ja_keys = set(UI_STRINGS["ja"].keys())
        en_keys = set(UI_STRINGS["en"].keys())
        self.assertEqual(ja_keys, en_keys)
        for k in ja_keys:
            self.assertIsInstance(UI_STRINGS["ja"][k], str)
            self.assertIsInstance(UI_STRINGS["en"][k], str)
            if k not in ("unit_items", "xp_to_next_prefix"):
                self.assertTrue(len(UI_STRINGS["ja"][k]) > 0, f"Empty ja value for {k}")
                self.assertTrue(len(UI_STRINGS["en"][k]) > 0, f"Empty en value for {k}")

    def test_unknown_enum_and_unknown_error_code_fallbacks(self) -> None:
        # Unknown SkillCategory -> unknown ('その他' / 'Other')
        self.assertEqual(normalize_ui_category("quantum_computing", "ja"), {"key": "unknown", "label": "その他"})
        self.assertEqual(normalize_ui_category("quantum_computing", "en"), {"key": "unknown", "label": "Other"})
        self.assertEqual(normalize_ui_category("data", "ja")["key"], "data")

        # Unknown UrlFetchStatus -> unknown
        self.assertEqual(normalize_ui_fetch_status("cached_from_edge", "ja")["key"], "unknown")
        self.assertEqual(normalize_ui_fetch_status("fetched", "en")["key"], "fetched")

        # Unknown error.code -> does not crash, uses problem.title safely
        future_problem = {
            "type": "https://devforge.local/problems/future-quota-limit",
            "title": "新しい制限に達しました",
            "status": 429,
            "detail": "詳細メッセージ",
            "error": {"code": "FUTURE_UNKNOWN_CODE_2027", "message": "詳細メッセージ"},
        }
        self.assertEqual(resolve_problem_ui_message(future_problem, "ja"), "新しい制限に達しました")
        self.assertTrue(len(resolve_problem_ui_message({}, "en")) > 0)


if __name__ == "__main__":
    unittest.main()
