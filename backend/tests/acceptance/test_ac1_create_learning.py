"""AC-1：外部学習メモ（および任意の公開URL）の登録によるスキルXP・実践思考問題1問・忘却曲線カードの生成（通常系）

根拠：docs/prd/001-personal-learning-loop.md 11章 AC-1、contracts/openapi.yaml createLearning。
"""

import unittest

from acceptance_support import (
    AC1_MEMO,
    AC1_TITLE,
    CATEGORIES,
    FIXED_NOW,
    LIMIT_LEARNING_MS,
    AcceptanceTestCase,
    http,
    now_header,
    restart_server,
    shift,
)


class AC1_CreateLearningTest(AcceptanceTestCase):

    def test_AC1_URLなし領域自動_3秒以内に201で15XPと3観点の問題1問と初回カードが返り保存される(self):
        resp = http(
            "POST", "/api/v1/learnings",
            body={"title": AC1_TITLE, "memo": AC1_MEMO},
            headers=now_header(),
        )
        self.assertWithin(resp, LIMIT_LEARNING_MS)
        data = self.assertCreatedLearning(resp, memo=AC1_MEMO, title=AC1_TITLE)
        self.assertEqual(data.get("url_fetch_status"), "not_provided", "URLなしの url_fetch_status: %r" % (data,))
        self.assertSameInstant(data["review_card"]["next_review_at"], shift(FIXED_NOW, days=1), "初回カードの next_review_at（現在時刻+1日）")

        # 残った結果：XP が領域に加算され、問題が本日のセッションに、カードは1日後に期限が来る
        cats = self.category_map(self.get_summary())
        self.assertEqual(cats[data["category"]]["total_xp"], 15, "登録した領域の total_xp")
        others = [c for c in CATEGORIES if c != data["category"]]
        self.assertEqual([cats[c]["total_xp"] for c in others], [0] * 5, "ほかの5領域の total_xp")

        session = self.get_session()
        self.assertIsNotNone(session.get("active_challenge"), "登録した問題が本日のセッションにない: %r" % (session,))
        self.assertEqual(session["active_challenge"]["challenge_id"], data["challenge"]["challenge_id"])
        self.assertEqual(session.get("total_due_count"), 0, "登録直後はカードの期限が来ていない: %r" % (session,))

        next_day = self.get_session(now=shift(FIXED_NOW, days=1))
        self.assertEqual(next_day.get("total_due_count"), 1, "1日後に期限が来るカードの数: %r" % (next_day,))
        self.assertEqual([c.get("card_id") for c in next_day.get("due_reviews", [])], [data["review_card"]["card_id"]])

    def test_AC1_登録の後にサーバーを再起動しても_XPと問題とカードが残る(self):
        resp = http(
            "POST", "/api/v1/learnings",
            body={"title": AC1_TITLE, "memo": AC1_MEMO, "category": "data"},
            headers=now_header(),
        )
        data = self.assertCreatedLearning(resp, memo=AC1_MEMO, title=AC1_TITLE, category="data")

        restart_server()  # 同じ DEVFORGE_DB_PATH のままプロセスを止めて起動し直す

        self.assertEqual(self.category_map(self.get_summary())["data"]["total_xp"], 15, "再起動の後の data の total_xp")
        session = self.get_session()
        self.assertIsNotNone(session.get("active_challenge"), "再起動の後に問題が消えた: %r" % (session,))
        self.assertEqual(session["active_challenge"]["challenge_id"], data["challenge"]["challenge_id"])
        next_day = self.get_session(now=shift(FIXED_NOW, days=1))
        self.assertEqual([c.get("card_id") for c in next_day.get("due_reviews", [])], [data["review_card"]["card_id"]],
                         "再起動の後にカードが消えた")

    def test_AC1_公開URLあり取得成功_201でurl_fetch_statusがfetched(self):
        url = "https://ok.example.test/redis"  # 予約テストドメイン（設計メモ 3章 Seam #3）。外部インターネットに出ない
        resp = http(
            "POST", "/api/v1/learnings",
            body={"title": AC1_TITLE, "url": url, "memo": AC1_MEMO},
            headers=now_header(extra={"X-Test-Url-Fetch-Mode": "stub_ok"}),
        )
        self.assertWithin(resp, LIMIT_LEARNING_MS)
        data = self.assertCreatedLearning(resp, memo=AC1_MEMO, title=AC1_TITLE)
        self.assertEqual(data.get("url"), url, "url が入力と違う")
        self.assertEqual(data.get("url_fetch_status"), "fetched", "url_fetch_status: %r" % (data,))

    def test_AC1_領域を指定_6領域それぞれ指定どおりに15XPが入る(self):
        for category in CATEGORIES:
            with self.subTest(category=category):
                resp = http(
                    "POST", "/api/v1/learnings",
                    body={"title": "領域 %s" % category, "memo": AC1_MEMO, "category": category},
                    headers=now_header(),
                )
                self.assertWithin(resp, LIMIT_LEARNING_MS)
                self.assertCreatedLearning(resp, memo=AC1_MEMO, category=category)
        summary = self.get_summary()
        cats = self.category_map(summary)
        self.assertEqual({c: cats[c]["total_xp"] for c in CATEGORIES}, {c: 15 for c in CATEGORIES})
        self.assertEqual(summary.get("total_xp"), 90, "全体の total_xp（15×6）")

    def test_AC1_メモ境界値10文字と2000文字_どちらも201(self):
        cases = {
            "10文字（全角）": "キャッシュ設計の要点",
            "2000文字（全角）": "設計" * 1000,
        }
        for label, memo in cases.items():
            with self.subTest(label=label):
                self.assertEqual(len(memo), 10 if label.startswith("10") else 2000)
                resp = http("POST", "/api/v1/learnings", body={"memo": memo}, headers=now_header())
                self.assertWithin(resp, LIMIT_LEARNING_MS)
                self.assertCreatedLearning(resp, memo=memo)
        self.assertEqual(self.get_summary().get("total_xp"), 30, "2件の登録で全体の total_xp が 30")


if __name__ == "__main__":
    unittest.main()
