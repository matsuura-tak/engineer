"""AC-3：実践思考問題への記述回答と3観点ルーブリック自己検証によるXP加算（通常系）

根拠：docs/prd/001-personal-learning-loop.md 11章 AC-3（earned_xp = 20 + matched_rubric_count * 10、当日初回完了で streak_days +1）、
contracts/openapi.yaml submitChallenge L481-L485（連続日数は UTC 暦日。昨日なら +1、今日なら不変、2日以上前か null なら 1 に戻す）・
getSkillsSummary L823-L824（最終学習日が2日以上前か null の間は streak_days 0 を返す）、CLAUDE.md（level = floor(total_xp / 100) + 1）。
"""

import unittest

from acceptance_support import (
    LIMIT_READ_MS,
    AcceptanceTestCase,
    http,
    now_header,
    seed_challenge,
)

ANSWER = (
    "秒間1万リクエストの参照系APIを前提とし、単純なロック方式は待機スレッド枯渇の懸念があるため"
    "TTLジッターと非同期再計算を併用する。Redis障害時はサーキットブレーカーでDB直読みを制限する。"
)
TODAY = "2026-10-30"
YESTERDAY = "2026-10-29"
TWO_DAYS_AGO = "2026-10-28"
TEN_DAYS_AGO = "2026-10-20"


class AC3_SubmitChallengeTest(AcceptanceTestCase):

    def _seed(self, base_xp, streak_days, last_study_date):
        self.seed({
            "category_xp": {"data": base_xp},
            "streak_days": streak_days,
            "last_study_date": last_study_date,
            "challenges": [seed_challenge("chl_ac3", "2026-10-29T09:00:00Z", category="data")],
        })

    def _submit(self, matched, answer=ANSWER):
        return http(
            "POST", "/api/v1/challenges/chl_ac3/submit",
            body={"answer": answer, "matched_rubric_count": matched, "elapsed_seconds": 50},
            headers=now_header(),
        )

    def test_AC3_3観点すべて達成_1秒以内に200でcompletedと50XPと連続日数が1増え保存される(self):
        self._seed(base_xp=45, streak_days=2, last_study_date=YESTERDAY)
        resp = self._submit(3)
        self.assertEqual(resp.status, 200, "submit: %r" % resp)
        self.assertWithin(resp, LIMIT_READ_MS)
        data = resp.json()
        self.assertEqual(data.get("challenge_id"), "chl_ac3")
        self.assertEqual(data.get("status"), "completed")
        self.assertEqual(data.get("category"), "data")
        self.assertEqual(data.get("matched_rubric_count"), 3)
        self.assertEqual(data.get("earned_xp"), 50, "20 + 3 * 10")
        self.assertEqual(data.get("total_xp"), 95, "45 + 50")
        self.assertEqual(data.get("level"), 1, "floor(95 / 100) + 1")
        self.assertEqual(data.get("streak_days"), 3, "前日まで2日連続で、当日初回の完了なので +1")
        points = data.get("model_points")
        self.assertIsInstance(points, list, "model_points: %r" % (data,))
        self.assertEqual(len(points), 3, "3観点の模範解説")
        self.assertTrue(all(isinstance(p, str) and p.strip() for p in points), "model_points の中身が空: %r" % (points,))

        # 残った結果：問題は本日のセッションから消え、XP と連続日数が集計に残る
        session = self.get_session()
        self.assertIsNone(session.get("active_challenge"), "回答した問題がまだ未回答に残っている: %r" % (session,))
        summary = self.get_summary()
        self.assertEqual(self.category_map(summary)["data"]["total_xp"], 95)
        self.assertEqual(summary.get("streak_days"), 3)

    def test_AC3_達成観点数0から3_XPは20から50でレベルの境界100をまたぐ(self):
        # (matched_rubric_count, 回答前の data の XP, 期待する earned_xp, 期待する total_xp, 期待する level)
        table = [
            (0, 79, 20, 99, 1),
            (1, 70, 30, 100, 2),
            (2, 70, 40, 110, 2),
            (3, 150, 50, 200, 3),
        ]
        for matched, base, earned, total, level in table:
            with self.subTest(matched_rubric_count=matched):
                self._seed(base_xp=base, streak_days=0, last_study_date=None)
                resp = self._submit(matched)
                self.assertEqual(resp.status, 200, "submit: %r" % resp)
                self.assertWithin(resp, LIMIT_READ_MS)
                data = resp.json()
                self.assertEqual(
                    (data.get("earned_xp"), data.get("total_xp"), data.get("level")),
                    (earned, total, level),
                )

    def test_AC3_連続日数_当日初回なら1増え当日2回目なら増えない(self):
        # (説明, 回答前の streak_days, 回答前の last_study_date, 回答前の summary の streak_days, 回答後の streak_days)
        table = [
            ("初めての学習", 0, None, 0, 1),
            ("前日に学習済み", 2, YESTERDAY, 2, 3),
            ("当日すでに学習済み", 2, TODAY, 2, 2),
        ]
        for label, streak, last, before_summary, expected in table:
            with self.subTest(label=label):
                self._seed(base_xp=0, streak_days=streak, last_study_date=last)
                self.assertEqual(self.get_summary().get("streak_days"), before_summary, "回答前の summary の streak_days")
                resp = self._submit(1)
                self.assertEqual(resp.status, 200, "submit: %r" % resp)
                self.assertEqual(resp.json().get("streak_days"), expected)
                self.assertEqual(self.get_summary().get("streak_days"), expected, "集計に残った streak_days")

    def test_AC3_連続日数_2日以上空いた間はsummaryが0で回答すると1に戻る(self):
        # contracts/openapi.yaml L481-L485, L823-L824: 最終学習日が2日以上前のとき summary は 0、完了したとき 1 に戻す
        cases = [
            ("2日前に学習済み（境界）", 5, TWO_DAYS_AGO),
            ("10日前に学習済み", 10, TEN_DAYS_AGO),
        ]
        for label, saved_streak, last_date in cases:
            with self.subTest(label=label):
                self._seed(base_xp=0, streak_days=saved_streak, last_study_date=last_date)
                self.assertEqual(
                    self.get_summary().get("streak_days"), 0,
                    "連続が切れている間の summary は 0 を返す",
                )
                resp = self._submit(1)
                self.assertEqual(resp.status, 200, "submit: %r" % resp)
                self.assertWithin(resp, LIMIT_READ_MS)
                self.assertEqual(resp.json().get("streak_days"), 1, "2日以上空いた後の完了で streak_days は 1 に戻る")
                self.assertEqual(self.get_summary().get("streak_days"), 1, "完了後の summary も 1")


if __name__ == "__main__":
    unittest.main()
