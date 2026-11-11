"""AC-5：6領域スキルツリーと成長サマリーの取得・表示（通常系）

根拠：docs/prd/001-personal-learning-loop.md 11章 AC-5（level = floor(total_xp / 100) + 1、xp_to_next_level = 100 - (total_xp % 100)）、
9章5行目（6領域の日本語名）、contracts/openapi.yaml getSkillsSummary L821-L828（overall_level = floor(total_xp / 100) + 1、
weekly_mastered_count は now - 604,800秒（168時間）<= t <= now の両端を含み、思考問題クリアと復習 last_grade >= 3 の合計）。
"""

import unittest

from acceptance_support import (
    CATEGORIES,
    FIXED_NOW,
    LABEL_JA,
    LIMIT_READ_MS,
    AcceptanceTestCase,
    http,
    now_header,
    seed_card,
    seed_challenge,
    shift,
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
        self.assertEqual(data.get("overall_level"), 3, "floor(285 / 100) + 1")
        self.assertEqual(data.get("streak_days"), 3)
        self.assertEqual(data.get("weekly_mastered_count"), 0, "直近7日間の達成なし")

    def test_AC5_レベルの境界_99は1で100は2で199は2で200は3(self):
        xp = {"architecture": 99, "backend": 100, "data": 199, "reliability": 200, "security": 0, "trend": 1}
        self.seed({"category_xp": xp})
        summary = self.get_summary()
        cats = self.category_map(summary)
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
        self.assertEqual((summary.get("total_xp"), summary.get("overall_level")), (599, 6), "合計599XP: floor(599/100)+1=6")

        overall_cases = [
            ("合計99XP", {"architecture": 99}, 99, 1),
            ("合計100XP（60+40で各領域Lv1でも全体Lv2）", {"architecture": 60, "backend": 40}, 100, 2),
            ("合計600XP", {"architecture": 200, "backend": 200, "data": 200}, 600, 7),
        ]
        for label, cat_xp, expected_total, expected_overall in overall_cases:
            with self.subTest(overall=label):
                self.seed({"category_xp": cat_xp})
                s = self.get_summary()
                self.assertEqual((s.get("total_xp"), s.get("overall_level")), (expected_total, expected_overall))

    def test_AC5_直近7日間の達成数_思考問題クリア2件と復習grade3以上2件で4(self):
        # 基準時刻 2026-10-30T09:00:00Z。直近7日は now - 168時間 <= t <= now（contracts/openapi.yaml L825。境界値は次のテストで確かめる）。
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

    def test_AC5_直近7日間の境界_ちょうど168時間前と現在時刻は含み168時間1秒前は含まない(self):
        # contracts/openapi.yaml L825: now - 604,800秒（168時間）<= t <= now（両端を含む）
        at_lower = shift(FIXED_NOW, days=-7)                  # 2026-10-23T09:00:00Z（ちょうど168時間前：含む）
        before_lower = shift(FIXED_NOW, days=-7, seconds=-1)  # 2026-10-23T08:59:59Z（168時間1秒前：含まない）
        created = "2026-10-20T09:00:00Z"
        next_due = "2026-11-04T09:00:00Z"
        cases = [
            ("問題：ちょうど168時間前", {"challenges": [seed_challenge("chl_ac5_b1", created, status="completed", completed_at=at_lower)]}, 1),
            ("問題：168時間1秒前", {"challenges": [seed_challenge("chl_ac5_b2", created, status="completed", completed_at=before_lower)]}, 0),
            ("問題：現在時刻ちょうど", {"challenges": [seed_challenge("chl_ac5_b3", created, status="completed", completed_at=FIXED_NOW)]}, 1),
            ("カードgrade3：ちょうど168時間前", {"review_cards": [seed_card("crd_ac5_b1", next_due, last_grade=3, graded_at=at_lower)]}, 1),
            ("カードgrade3：168時間1秒前", {"review_cards": [seed_card("crd_ac5_b2", next_due, last_grade=3, graded_at=before_lower)]}, 0),
            ("カードgrade3：現在時刻ちょうど", {"review_cards": [seed_card("crd_ac5_b3", next_due, last_grade=3, graded_at=FIXED_NOW)]}, 1),
        ]
        for label, payload, expected in cases:
            with self.subTest(label=label):
                self.seed(payload)
                self.assertEqual(self.get_summary().get("weekly_mastered_count"), expected)


if __name__ == "__main__":
    unittest.main()
