"""AC-7：不正入力（メモ文字数不足・超過・不正な評価値）に対するバリデーションエラー（エラー系）

根拠：docs/prd/001-personal-learning-loop.md 11章 AC-7（1秒以内に HTTP 400、error.code "VALIDATION_ERROR"、フィールド名を含む error.message、DB に保存されない）、
contracts/openapi.yaml createLearning / gradeReviewCard / submitChallenge の 400（submitChallenge の対応 AC に AC-7 がある：L360）、
CLAUDE.md「エラー応答」（application/problem+json）。
"""

import unittest

from acceptance_support import (
    LIMIT_READ_MS,
    AcceptanceTestCase,
    http,
    now_header,
    seed_card,
    seed_challenge,
)

VALID_ANSWER = "前提はQPS1万。ロックとTTLジッターを比較し、障害時はDB直読みを制限する。"


class AC7_ValidationErrorTest(AcceptanceTestCase):

    def test_AC7_メモが9文字と2001文字と空と欠落と型違い_1秒以内に400で保存されない(self):
        cases = [
            ("9文字（全角）", {"memo": "キャッシュ設計の要"}),
            ("2001文字（全角）", {"memo": "設" * 2001}),
            ("空文字", {"memo": ""}),
            ("memo なし", {"title": "メモなし"}),
            ("null", {"memo": None}),
            ("数値", {"memo": 1234567890}),
        ]
        self.assertEqual(len(cases[0][1]["memo"]), 9)
        for label, body in cases:
            with self.subTest(label=label):
                resp = http("POST", "/api/v1/learnings", body=body, headers=now_header())
                self.assertWithin(resp, LIMIT_READ_MS)
                self.assertProblem(resp, 400, "VALIDATION_ERROR", "memo")

        # 保存されていない：XP は0、問題もカードも増えていない
        summary = self.get_summary()
        self.assertEqual(summary.get("total_xp"), 0, "不正な入力で XP が入った: %r" % (summary,))
        session = self.get_session(now="2026-11-30T09:00:00Z")
        self.assertIsNone(session.get("active_challenge"), "不正な入力で問題が作られた: %r" % (session,))
        self.assertEqual(session.get("total_due_count"), 0, "不正な入力でカードが作られた: %r" % (session,))

    def test_AC7_gradeが0と5とマイナスと小数と文字列と真偽値とnullと欠落_1秒以内に400でカードは変わらない(self):
        self.seed({
            "category_xp": {"data": 45},
            "review_cards": [seed_card("crd_ac7", "2026-10-30T00:00:00Z", repetition_count=1, interval_days=1, ease_factor=2.5)],
        })
        cases = [
            ("0", {"grade": 0}),
            ("5", {"grade": 5}),
            ("-1", {"grade": -1}),
            ("3.5", {"grade": 3.5}),
            ("文字列 \"3\"", {"grade": "3"}),
            ("真偽値 true", {"grade": True}),
            ("null", {"grade": None}),
            ("grade なし", {"elapsed_seconds": 10}),
        ]
        for label, body in cases:
            with self.subTest(label=label):
                resp = http("POST", "/api/v1/reviews/crd_ac7/grade", body=body, headers=now_header())
                self.assertWithin(resp, LIMIT_READ_MS)
                self.assertProblem(resp, 400, "VALIDATION_ERROR", "grade")

        session = self.get_session()
        cards = {c.get("card_id"): c for c in session.get("due_reviews", [])}
        self.assertIn("crd_ac7", cards, "不正な評価でカードが期限到来から外れた: %r" % (session,))
        card = cards["crd_ac7"]
        self.assertEqual((card.get("repetition_count"), card.get("interval_days")), (1, 1))
        self.assertAlmostEqual(card.get("ease_factor"), 2.5, places=2)
        self.assertEqual(self.category_map(self.get_summary())["data"]["total_xp"], 45, "不正な評価で XP が入った")

    def test_AC7_回答が9文字と2001文字と達成観点数がマイナス1と4_400で問題は未回答のまま(self):
        self.seed({
            "category_xp": {"data": 45},
            "challenges": [seed_challenge("chl_ac7", "2026-10-29T09:00:00Z", category="data")],
        })
        cases = [
            ("回答9文字", {"answer": "ロックとTTL比較", "matched_rubric_count": 2}, "answer"),
            ("回答2001文字", {"answer": "設" * 2001, "matched_rubric_count": 2}, "answer"),
            ("達成観点数 -1", {"answer": VALID_ANSWER, "matched_rubric_count": -1}, "matched_rubric_count"),
            ("達成観点数 4", {"answer": VALID_ANSWER, "matched_rubric_count": 4}, "matched_rubric_count"),
        ]
        self.assertEqual(len(cases[0][1]["answer"]), 9)
        for label, body, field_name in cases:
            with self.subTest(label=label):
                resp = http("POST", "/api/v1/challenges/chl_ac7/submit", body=body, headers=now_header())
                self.assertWithin(resp, LIMIT_READ_MS)
                self.assertProblem(resp, 400, "VALIDATION_ERROR", field_name)

        session = self.get_session()
        self.assertIsNotNone(session.get("active_challenge"), "不正な回答で問題が完了扱いになった: %r" % (session,))
        self.assertEqual(session["active_challenge"].get("challenge_id"), "chl_ac7")
        self.assertEqual(session["active_challenge"].get("status"), "pending")
        self.assertEqual(self.category_map(self.get_summary())["data"]["total_xp"], 45, "不正な回答で XP が入った")


if __name__ == "__main__":
    unittest.main()
