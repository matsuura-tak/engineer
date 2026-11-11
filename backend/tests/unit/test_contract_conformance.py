"""Contract conformance tests verifying exact response property sets and route inventory (OWASP API3 & API9)."""

import json
import os
import re
import tempfile
import unittest

from backend.app import REGISTERED_ROUTES
from backend.tests.unit.test_api_integration import _ServerHarness, _http_request

REPO_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", ".."))
OPENAPI_PATH = os.path.join(REPO_ROOT, "contracts", "openapi.yaml")


class TestOpenApiContractConformance(unittest.TestCase):
    def test_registered_routes_match_openapi_operation_ids_with_zero_diff(self) -> None:
        with open(OPENAPI_PATH, "r", encoding="utf-8") as f:
            spec_text = f.read()
        contract_op_ids = re.findall(r"^\s+operationId:\s*(\S+)", spec_text, re.M)
        impl_op_ids = [op_id for _method, _path, op_id in REGISTERED_ROUTES]
        self.assertEqual(impl_op_ids, contract_op_ids)
        self.assertEqual(len(impl_op_ids), 8)

    def test_all_endpoints_return_exact_contract_fields_without_extra_properties(self) -> None:
        with tempfile.TemporaryDirectory() as tmpdir:
            srv = _ServerHarness(os.path.join(tmpdir, "conform.sqlite3"))
            try:
                # 1. resetTestState
                st_rst, _, raw_rst = _http_request(srv.base_url, "POST", "/api/v1/test/reset")
                self.assertEqual(st_rst, 200)
                self.assertEqual(set(json.loads(raw_rst.decode("utf-8")).keys()), {"status"})

                # 2. seedTestState
                st_seed, _, raw_seed = _http_request(
                    srv.base_url,
                    "POST",
                    "/api/v1/test/seed",
                    body_obj={"reset_first": True},
                )
                self.assertEqual(st_seed, 200)
                self.assertEqual(
                    set(json.loads(raw_seed.decode("utf-8")).keys()),
                    {"status", "seeded_challenges_count", "seeded_review_cards_count"},
                )

                # 3. createLearning
                st_lrn, _, raw_lrn = _http_request(
                    srv.base_url,
                    "POST",
                    "/api/v1/learnings",
                    body_obj={
                        "title": "Contract Check",
                        "memo": "契約スキーマの全フィールド完全一致を検証するためのメモ",
                    },
                    headers={"X-Test-Now": "2026-10-30T09:00:00Z"},
                )
                self.assertEqual(st_lrn, 201)
                lrn = json.loads(raw_lrn.decode("utf-8"))
                self.assertEqual(
                    set(lrn.keys()),
                    {
                        "learning_id",
                        "title",
                        "url",
                        "memo",
                        "category",
                        "earned_xp",
                        "url_fetch_status",
                        "processing_ms",
                        "challenge",
                        "review_card",
                        "created_at",
                    },
                )
                self.assertEqual(
                    set(lrn["challenge"].keys()),
                    {
                        "challenge_id",
                        "learning_id",
                        "category",
                        "question",
                        "rubric_items",
                        "status",
                        "created_at",
                    },
                )
                for rb in lrn["challenge"]["rubric_items"]:
                    self.assertEqual(set(rb.keys()), {"index", "perspective", "label_ja", "description_ja"})
                self.assertEqual(
                    set(lrn["review_card"].keys()),
                    {
                        "card_id",
                        "learning_id",
                        "category",
                        "front_prompt",
                        "back_summary",
                        "interval_days",
                        "ease_factor",
                        "repetition_count",
                        "next_review_at",
                    },
                )

                # 4. getTodaySession
                st_ses, _, raw_ses = _http_request(
                    srv.base_url,
                    "GET",
                    "/api/v1/sessions/today",
                    headers={"X-Test-Now": "2026-10-31T09:00:00Z"},
                )
                self.assertEqual(st_ses, 200)
                ses = json.loads(raw_ses.decode("utf-8"))
                self.assertEqual(
                    set(ses.keys()),
                    {
                        "session_date",
                        "active_challenge",
                        "due_reviews",
                        "total_due_count",
                        "total_session_items",
                        "estimated_seconds",
                        "session_label_ja",
                        "is_empty",
                    },
                )

                # 5. submitChallenge
                chl_id = lrn["challenge"]["challenge_id"]
                st_sub, _, raw_sub = _http_request(
                    srv.base_url,
                    "POST",
                    f"/api/v1/challenges/{chl_id}/submit",
                    body_obj={"answer": "十分な長さのある回答テキストです12345", "matched_rubric_count": 3},
                    headers={"X-Test-Now": "2026-10-31T09:00:00Z"},
                )
                self.assertEqual(st_sub, 200)
                sub = json.loads(raw_sub.decode("utf-8"))
                self.assertEqual(
                    set(sub.keys()),
                    {
                        "challenge_id",
                        "status",
                        "category",
                        "answer",
                        "matched_rubric_count",
                        "earned_xp",
                        "total_xp",
                        "level",
                        "streak_days",
                        "model_points",
                        "completed_at",
                    },
                )

                # 6. gradeReviewCard
                crd_id = lrn["review_card"]["card_id"]
                st_grd, _, raw_grd = _http_request(
                    srv.base_url,
                    "POST",
                    f"/api/v1/reviews/{crd_id}/grade",
                    body_obj={"grade": 3},
                    headers={"X-Test-Now": "2026-10-31T09:00:00Z"},
                )
                self.assertEqual(st_grd, 200)
                grd = json.loads(raw_grd.decode("utf-8"))
                self.assertEqual(
                    set(grd.keys()),
                    {
                        "card_id",
                        "category",
                        "grade",
                        "repetition_count",
                        "interval_days",
                        "ease_factor",
                        "next_review_at",
                        "earned_xp",
                        "total_xp",
                        "level",
                        "streak_days",
                        "remaining_due_count",
                    },
                )

                # 7. getSkillsSummary
                st_sum, _, raw_sum = _http_request(
                    srv.base_url,
                    "GET",
                    "/api/v1/skills/summary",
                    headers={"X-Test-Now": "2026-10-31T09:00:00Z"},
                )
                self.assertEqual(st_sum, 200)
                summary = json.loads(raw_sum.decode("utf-8"))
                self.assertEqual(
                    set(summary.keys()),
                    {
                        "categories",
                        "total_xp",
                        "overall_level",
                        "streak_days",
                        "weekly_mastered_count",
                    },
                )
                for cat_item in summary["categories"]:
                    self.assertEqual(
                        set(cat_item.keys()),
                        {
                            "category",
                            "label_ja",
                            "label_en",
                            "total_xp",
                            "level",
                            "xp_to_next_level",
                        },
                    )

                # 8. ProblemDetails on 400
                st_err, _, raw_err = _http_request(
                    srv.base_url,
                    "POST",
                    "/api/v1/learnings",
                    body_obj={"memo": "short"},
                )
                self.assertEqual(st_err, 400)
                prob = json.loads(raw_err.decode("utf-8"))
                self.assertEqual(set(prob.keys()), {"type", "title", "status", "detail", "instance", "error"})
                self.assertEqual(set(prob["error"].keys()), {"code", "message", "field"})
            finally:
                srv.close()


if __name__ == "__main__":
    unittest.main()
