"""AC-6：学習データ0件・本日の復習0件のときの空状態表示（空状態）

根拠：docs/prd/001-personal-learning-loop.md 11章 AC-6、contracts/openapi.yaml getTodaySession（emptySession）・getSkillsSummary（データ0件時の値）、
設計メモ docs/adr/features/001-personal-learning-loop.md 2章 AC-6 行・3章 Seam #4（data-testid：empty-state-guide、empty-state-cta-btn）。
画面に文言とボタンが「表示される」ことは、このテストでは確かめない（test-plan 3章・7章で G4 の人に回す）。
"""

import unittest

from acceptance_support import (
    AC6_EMPTY_MESSAGE,
    CATEGORIES,
    LIMIT_READ_MS,
    AcceptanceTestCase,
    http,
    now_header,
    seed_card,
    seed_challenge,
)


class AC6_EmptyStateTest(AcceptanceTestCase):

    def _assert_empty_session(self, data):
        self.assertIn("active_challenge", data, "active_challenge のキーがない: %r" % (data,))
        self.assertIsNone(data["active_challenge"])
        self.assertEqual(data.get("due_reviews"), [])
        self.assertEqual(data.get("total_due_count"), 0)
        self.assertEqual(data.get("total_session_items"), 0)
        self.assertEqual(data.get("estimated_seconds"), 0)
        self.assertIs(data.get("is_empty"), True)
        self.assertEqual(data.get("session_label_ja"), AC6_EMPTY_MESSAGE)

    def test_AC6_学習データ0件_セッションは空で6領域すべて0XPレベル1(self):
        resp = http("GET", "/api/v1/sessions/today", headers=now_header())
        self.assertEqual(resp.status, 200, "sessions/today: %r" % resp)
        self.assertWithin(resp, LIMIT_READ_MS)
        self._assert_empty_session(resp.json())

        resp = http("GET", "/api/v1/skills/summary", headers=now_header())
        self.assertEqual(resp.status, 200, "skills/summary: %r" % resp)
        self.assertWithin(resp, LIMIT_READ_MS)
        summary = resp.json()
        cats = self.category_map(summary)
        self.assertEqual(
            {c: (cats[c].get("total_xp"), cats[c].get("level"), cats[c].get("xp_to_next_level")) for c in CATEGORIES},
            {c: (0, 1, 100) for c in CATEGORIES},
        )
        self.assertEqual(
            (summary.get("total_xp"), summary.get("overall_level"), summary.get("streak_days"), summary.get("weekly_mastered_count")),
            (0, 1, 0, 0),
        )

    def test_AC6_学習済みでも本日の未回答0件と期限到来0枚_セッションは空(self):
        self.seed({
            "category_xp": {"data": 65},
            "streak_days": 1,
            "last_study_date": "2026-10-30",
            "challenges": [seed_challenge("chl_ac6_done", "2026-10-30T08:00:00Z", status="completed",
                                          completed_at="2026-10-30T08:02:00Z")],
            "review_cards": [seed_card("crd_ac6_future", "2026-10-31T09:00:00Z")],
        })
        self._assert_empty_session(self.get_session())
        self.assertEqual(self.category_map(self.get_summary())["data"]["total_xp"], 65, "空セッションでも XP は消えない")

    def test_AC6_画面HTMLに空状態ガイドと登録フォームへの誘導ボタンの識別子がある(self):
        html = self.get_html()
        for testid in ("app-root", "empty-state-guide", "empty-state-cta-btn", "learning-form"):
            with self.subTest(testid=testid):
                self.assertTestIdInHtml(html, testid)


if __name__ == "__main__":
    unittest.main()
