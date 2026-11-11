"""AC-2：本日の3分学習セッション（未回答の実践思考問題最大1問＋期限到来カード最大5枚）の取得（通常系）

根拠：docs/prd/001-personal-learning-loop.md 11章 AC-2、contracts/openapi.yaml getTodaySession（古い順、next_review_at <= 現在時刻）。
"""

import unittest

from acceptance_support import (
    AC2_SESSION_LABEL,
    FIXED_NOW,
    LIMIT_READ_MS,
    AcceptanceTestCase,
    http,
    now_header,
    seed_card,
    seed_challenge,
    shift,
)

# 期限到来（next_review_at <= 2026-10-30T09:00:00Z）のカード7枚。投入の順は期限の順と変えておく。
DUE_CARDS = [
    ("crd_ac2_d4", "2026-10-26T09:00:00Z"),
    ("crd_ac2_d1", "2026-10-23T09:00:00Z"),
    ("crd_ac2_d7", FIXED_NOW),               # 境界：現在時刻ちょうどは期限到来に入る
    ("crd_ac2_d2", "2026-10-24T09:00:00Z"),
    ("crd_ac2_d6", "2026-10-28T09:00:00Z"),
    ("crd_ac2_d3", "2026-10-25T09:00:00Z"),
    ("crd_ac2_d5", "2026-10-27T09:00:00Z"),
]
# 期限前のカード2枚（入らない）
NOT_DUE_CARDS = [
    ("crd_ac2_n1", shift(FIXED_NOW, seconds=1)),  # 境界：1秒後は入らない
    ("crd_ac2_n2", "2026-11-02T09:00:00Z"),
]
OLDEST_FIVE = ["crd_ac2_d1", "crd_ac2_d2", "crd_ac2_d3", "crd_ac2_d4", "crd_ac2_d5"]


def _seed_payload():
    return {
        "challenges": [
            seed_challenge("chl_ac2_new", "2026-10-29T10:00:00Z"),
            seed_challenge("chl_ac2_old", "2026-10-28T09:00:00Z"),
            seed_challenge("chl_ac2_mid", "2026-10-29T09:00:00Z"),
            seed_challenge("chl_ac2_done", "2026-10-27T09:00:00Z", status="completed",
                           completed_at="2026-10-27T09:05:00Z"),
        ],
        "review_cards": [seed_card(cid, at) for cid, at in DUE_CARDS + NOT_DUE_CARDS],
    }


class AC2_TodaySessionTest(AcceptanceTestCase):

    def test_AC2_未回答3件と期限到来7枚_1秒以内に200で問題1件とカード古い順5件と総数7(self):
        self.seed(_seed_payload())
        resp = http("GET", "/api/v1/sessions/today", headers=now_header())
        self.assertEqual(resp.status, 200, "sessions/today: %r" % resp)
        self.assertWithin(resp, LIMIT_READ_MS)
        data = resp.json()

        active = data.get("active_challenge")
        self.assertIsInstance(active, dict, "active_challenge が1件でない: %r" % (data,))
        self.assertEqual(active.get("challenge_id"), "chl_ac2_old", "未回答のうち最も古い問題1件")
        self.assertEqual(active.get("status"), "pending")

        due = data.get("due_reviews")
        self.assertIsInstance(due, list, "due_reviews: %r" % (data,))
        self.assertEqual([c.get("card_id") for c in due], OLDEST_FIVE, "期限が古い順の5件")
        self.assertEqual(data.get("total_due_count"), 7, "期限到来の総数（ちょうど現在時刻を含み、1秒後を含まない）")
        self.assertEqual(data.get("total_session_items"), 6, "全6問")
        self.assertIsInstance(data.get("estimated_seconds"), int)
        self.assertLessEqual(data["estimated_seconds"], 180, "想定所要秒数は180以下")
        self.assertEqual(data.get("session_label_ja"), AC2_SESSION_LABEL)
        self.assertIs(data.get("is_empty"), False)

    def test_AC2_現在時刻を3日進める_期限到来の総数が9になり表示は5件のまま(self):
        self.seed(_seed_payload())
        data = self.get_session(now=shift(FIXED_NOW, days=3))
        self.assertEqual(data.get("total_due_count"), 9, "3日後は期限前だった2枚も期限到来")
        self.assertEqual([c.get("card_id") for c in data.get("due_reviews", [])], OLDEST_FIVE)


if __name__ == "__main__":
    unittest.main()
