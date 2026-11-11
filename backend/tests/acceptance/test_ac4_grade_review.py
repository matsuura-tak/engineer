"""AC-4：SM-2忘却曲線カードの4段階評価による次回予定日と間隔の更新（通常系）

根拠：docs/prd/001-personal-learning-loop.md 11章 AC-4（grade 3：rep 1→2、interval 6。grade 1：rep 0、interval 1。earned_xp 10、未消化が1件減る）、
9章4行目（grade 2：間隔×1.2、grade 4：SM-2間隔×1.3）、
contracts/openapi.yaml gradeReviewCard の計算式（round_half_up、ease_factor の増減と下限 1.3、next_review_at = 基準時刻 + new_ivl 日）。
"""

import unittest

from acceptance_support import (
    FIXED_NOW,
    LIMIT_READ_MS,
    AcceptanceTestCase,
    http,
    now_header,
    seed_card,
    shift,
)

DUE_AT = "2026-10-30T00:00:00Z"


class AC4_GradeReviewTest(AcceptanceTestCase):

    def _seed(self, rep=1, ivl=1, ef=2.5, base_xp=45):
        self.seed({
            "category_xp": {"data": base_xp},
            "review_cards": [
                seed_card("crd_ac4", DUE_AT, repetition_count=rep, interval_days=ivl, ease_factor=ef),
                seed_card("crd_ac4_other", "2026-10-29T00:00:00Z"),
            ],
        })

    def _grade(self, grade):
        return http(
            "POST", "/api/v1/reviews/crd_ac4/grade",
            body={"grade": grade, "elapsed_seconds": 15},
            headers=now_header(),
        )

    def test_AC4_rep1でgrade3_1秒以内に200でrep2と間隔6日と10XPになり未消化が1件減る(self):
        self._seed()
        before = self.get_session()
        self.assertEqual(before.get("total_due_count"), 2, "評価前の未消化: %r" % (before,))

        resp = self._grade(3)
        self.assertEqual(resp.status, 200, "grade: %r" % resp)
        self.assertWithin(resp, LIMIT_READ_MS)
        data = resp.json()
        self.assertEqual(data.get("card_id"), "crd_ac4")
        self.assertEqual(data.get("grade"), 3)
        self.assertEqual(data.get("repetition_count"), 2)
        self.assertEqual(data.get("interval_days"), 6)
        self.assertAlmostEqual(data.get("ease_factor"), 2.5, places=2)
        self.assertSameInstant(data.get("next_review_at"), shift(FIXED_NOW, days=6), "next_review_at（現在時刻+6日）")
        self.assertEqual(data.get("earned_xp"), 10)
        self.assertEqual(data.get("total_xp"), 55, "45 + 10")
        self.assertEqual(data.get("remaining_due_count"), 1, "未消化 2 → 1")

        # 残った結果：本日の未消化リストから該当カードが1件減り、XP が集計に残る
        after = self.get_session()
        self.assertEqual(after.get("total_due_count"), 1)
        self.assertEqual([c.get("card_id") for c in after.get("due_reviews", [])], ["crd_ac4_other"])
        self.assertEqual(self.category_map(self.get_summary())["data"]["total_xp"], 55)
        # 6日後には再び期限が来る
        later = self.get_session(now=shift(FIXED_NOW, days=6))
        self.assertIn("crd_ac4", [c.get("card_id") for c in later.get("due_reviews", [])])

    def test_AC4_rep1から4段階それぞれ_rep間隔EFと次回日時が契約の式どおり(self):
        # (grade, 期待 rep, 期待 interval_days, 期待 ease_factor)  評価前：rep 1、interval 1、ef 2.5
        table = [
            (1, 0, 1, 2.3),   # 忘れた：1日後、ef - 0.20
            (2, 2, 1, 2.35),  # 曖昧：round_half_up(1 * 1.2) = 1、ef - 0.15
            (3, 2, 6, 2.5),   # 思い出せた：評価前 rep 1 のとき 6
            (4, 2, 8, 2.6),   # 即答：round_half_up(6 * 1.3) = 8、ef + 0.10
        ]
        for grade, rep, ivl, ef in table:
            with self.subTest(grade=grade):
                self._seed()
                resp = self._grade(grade)
                self.assertEqual(resp.status, 200, "grade: %r" % resp)
                self.assertWithin(resp, LIMIT_READ_MS)
                data = resp.json()
                self.assertEqual((data.get("repetition_count"), data.get("interval_days")), (rep, ivl))
                self.assertAlmostEqual(data.get("ease_factor"), ef, places=2)
                self.assertSameInstant(data.get("next_review_at"), shift(FIXED_NOW, days=ivl), "next_review_at")
                self.assertEqual(data.get("earned_xp"), 10)
                self.assertEqual(data.get("remaining_due_count"), 1)

    def test_AC4_rep2以上と下限_四捨五入とease_factorの下限1点3(self):
        # (説明, 評価前 rep, interval, ef, grade, 期待 rep, 期待 interval, 期待 ef)
        table = [
            ("grade3 rep2 は ivl*ef", 2, 6, 2.5, 3, 3, 15, 2.5),           # round_half_up(15.0) = 15
            ("grade4 rep2 は 0.5 を切り上げ", 2, 6, 2.5, 4, 3, 20, 2.6),     # round_half_up(6*2.5*1.3 = 19.5) = 20
            ("grade2 は現在間隔×1.2", 3, 10, 2.5, 2, 4, 12, 2.35),         # round_half_up(12.0) = 12
            ("grade1 で ef は 1.3 を下回らない", 3, 10, 1.3, 1, 0, 1, 1.3),  # max(1.3, 1.1)
            ("grade2 で ef は 1.3 を下回らない", 1, 1, 1.4, 2, 2, 1, 1.3),   # max(1.3, 1.25)
        ]
        for label, rep0, ivl0, ef0, grade, rep, ivl, ef in table:
            with self.subTest(label=label):
                self._seed(rep=rep0, ivl=ivl0, ef=ef0)
                resp = self._grade(grade)
                self.assertEqual(resp.status, 200, "grade: %r" % resp)
                data = resp.json()
                self.assertEqual((data.get("repetition_count"), data.get("interval_days")), (rep, ivl))
                self.assertAlmostEqual(data.get("ease_factor"), ef, places=2)
                self.assertSameInstant(data.get("next_review_at"), shift(FIXED_NOW, days=ivl), "next_review_at")


if __name__ == "__main__":
    unittest.main()
