"""AC-5：6領域スキルツリーと成長サマリーの取得・表示（通常系）

根拠：docs/prd/001-personal-learning-loop.md 11章 AC-5（level = floor(total_xp / 100) + 1、xp_to_next_level = 100 - (total_xp % 100)）、
9章5行目（6領域の日本語名）、contracts/openapi.yaml getSkillsSummary（weekly_mastered_count：直近7日間に思考問題クリアまたは復習 grade >= 3 の件数）。
"""

import unittest

from acceptance_support import (
    CATEGORIES,
    LABEL_JA,
    LIMIT_READ_MS,
    AcceptanceTestCase,
    http,
    now_header,
    seed_card,
    seed_challenge,
)


class AC5_SkillsSummaryTest(AcceptanceTestCase):

    def test_AC5_学習実績あり_1秒以内に200で6領域のXPとレベルと残りXPと全体の値が返る(self):
        xp = {"architecture": 120, "backend": 45, "data": 75, "reliability": 30, "security": 0, "trend": 15}
        self.seed({"category_xp": xp, "streak_days": 3, "last_study_date": "2026-10-30"})
        resp = http("GET", "/api/v1/skills/summary", headers=now_header())
        self.assertEqual(resp.status, 200, "skills/summary: %r" % resp)
        self.assertWithin(resp, LIMIT_READ_MS)
        data = resp.json()
        cats = self.category_map(data)
        expected = {
            "architecture": (120, 2, 80),
            "backend": (45, 1, 55),
            "data": (75, 1, 25),
            "reliability": (30, 1, 70),
            "security": (0, 1, 100),
            "trend": (15, 1, 85),
        }
        for category in CATEGORIES:
            with self.subTest(category=category):
                c = cats[category]
                self.assertEqual(c.get("label_ja"), LABEL_JA[category])
                self.assertEqual((c.get("total_xp"), c.get("level"), c.get("xp_to_next_level")), expected[category])
        self.assertEqual(data.get("total_xp"), 285, "6領域の合計")
        self.assertIsInstance(data.get("overall_level"), int)
        self.assertGreaterEqual(data["overall_level"], 1)
        self.assertEqual(data.get("streak_days"), 3)
        self.assertEqual(data.get("weekly_mastered_count"), 0, "直近7日間の達成なし")

    def test_AC5_レベルの境界_99は1で100は2で199は2で200は3(self):
        xp = {"architecture": 99, "backend": 100, "data": 199, "reliability": 200, "security": 0, "trend": 1}
        self.seed({"category_xp": xp})
        cats = self.category_map(self.get_summary())
        expected = {
            "architecture": (99, 1, 1),
            "backend": (100, 2, 100),
            "data": (199, 2, 1),
            "reliability": (200, 3, 100),
            "security": (0, 1, 100),
            "trend": (1, 1, 99),
        }
        for category in CATEGORIES:
            with self.subTest(category=category):
                c = cats[category]
                self.assertEqual((c.get("total_xp"), c.get("level"), c.get("xp_to_next_level")), expected[category])

    def test_AC5_直近7日間の達成数_思考問題クリア2件と復習grade3以上2件で4(self):
        # 基準時刻 2026-10-30T09:00:00Z。7日間の端の扱いが PRD と契約で決まっていないため、端から1日以上離した値だけを使う。
        self.seed({
            "challenges": [
                seed_challenge("chl_ac5_in1", "2026-10-28T09:00:00Z", status="completed", completed_at="2026-10-29T09:00:00Z"),
                seed_challenge("chl_ac5_in2", "2026-10-25T09:00:00Z", status="completed", completed_at="2026-10-25T09:00:00Z"),
                seed_challenge("chl_ac5_old", "2026-10-15T09:00:00Z", status="completed", completed_at="2026-10-16T09:00:00Z"),
                seed_challenge("chl_ac5_pending", "2026-10-29T09:00:00Z"),
            ],
            "review_cards": [
                seed_card("crd_ac5_g3", "2026-11-04T09:00:00Z", last_grade=3, graded_at="2026-10-29T09:00:00Z"),
                seed_card("crd_ac5_g4", "2026-11-05T09:00:00Z", last_grade=4, graded_at="2026-10-28T09:00:00Z"),
                seed_card("crd_ac5_g2", "2026-10-31T09:00:00Z", last_grade=2, graded_at="2026-10-29T09:00:00Z"),
                seed_card("crd_ac5_g3_old", "2026-10-31T09:00:00Z", last_grade=3, graded_at="2026-10-15T09:00:00Z"),
            ],
        })
        summary = self.get_summary()
        self.assertEqual(summary.get("weekly_mastered_count"), 4, "7日内の完了2件＋grade>=3の2件（grade2と10日以上前は数えない）")


if __name__ == "__main__":
    unittest.main()
