"""AC-8：外部URL取得失敗・タイムアウト時およびブラウザオフライン時のフォールバックと入力保持（オフライン・通信エラー系）

根拠：docs/prd/001-personal-learning-loop.md 11章 AC-8（取得失敗・2秒タイムアウトでもエラーにせず3,000ms以内に HTTP 201、
url_fetch_status "fallback_used"。通信切断時は入力保持・エラーバナー・再試行ボタン）、
contracts/openapi.yaml createLearning・X-Test-Url-Fetch-Mode（stub_timeout、stub_error）・Idempotency-Key・getWebAppUi（api_base_url）、
設計メモ 3章 Seam #3（予約テストドメイン timeout.example.test、error.example.test）・Seam #4（data-testid）・6章 オフライン（再送は Idempotency-Key で二重作成を防ぐ）。
ブラウザが実際に入力を保持しバナーを出すことは、このテストでは確かめない（test-plan 3章・7章で G4 の人に回す）。
外部インターネットには出ない（スタブのヘッダか、予約テストドメインだけを使う）。
"""

import unittest

from acceptance_support import (
    FIXED_NOW,
    LIMIT_LEARNING_MS,
    AcceptanceTestCase,
    http,
    now_header,
    shift,
)

TITLE = "分散ロックの設計"
MEMO = "分散環境でのロック取得時はリース期限とフェンシングトークンを組み合わせてスプリットブレインを防ぐ"


class AC8_FallbackAndOfflineTest(AcceptanceTestCase):

    def _post(self, url, mode=None, extra_headers=None):
        extra = {}
        if mode:
            extra["X-Test-Url-Fetch-Mode"] = mode
        if extra_headers:
            extra.update(extra_headers)
        return http(
            "POST", "/api/v1/learnings",
            body={"title": TITLE, "url": url, "memo": MEMO},
            headers=now_header(extra=extra),
        )

    def test_AC8_URL取得がタイムアウトと接続失敗_3秒以内に201でfallback_usedとメモから問題とカードができる(self):
        cases = [
            ("スタブ：2秒タイムアウト", "https://timeout.example.test/article", "stub_timeout"),
            ("スタブ：接続失敗/HTTP 500", "https://error.example.test/article", "stub_error"),
            ("予約ドメイン：timeout.example.test（ヘッダなし）", "https://timeout.example.test/slow", None),
            ("予約ドメイン：error.example.test（ヘッダなし・存在しないURL）", "https://error.example.test/missing", None),
        ]
        created = []
        for label, url, mode in cases:
            with self.subTest(label=label):
                resp = self._post(url, mode)
                self.assertWithin(resp, LIMIT_LEARNING_MS)
                data = self.assertCreatedLearning(resp, memo=MEMO, title=TITLE)
                self.assertEqual(data.get("url_fetch_status"), "fallback_used", "url_fetch_status: %r" % (data,))
                self.assertEqual(data.get("url"), url, "url が入力と違う")
                self.assertSameInstant(data["review_card"]["next_review_at"], shift(FIXED_NOW, days=1), "next_review_at")
                created.append(data)

        # 残った結果：4件分の XP とカードが保存されている
        self.assertEqual(self.get_summary().get("total_xp"), 15 * len(created), "フォールバックで作った件数分の XP")
        next_day = self.get_session(now=shift(FIXED_NOW, days=1))
        self.assertEqual(next_day.get("total_due_count"), len(created), "フォールバックで作ったカードの数")

    def test_AC8_通信切断後の再試行_同じIdempotency_Keyで2回送っても1件だけ作られる(self):
        headers = {"Idempotency-Key": "ac8-resend-0001"}
        first = self._post("https://timeout.example.test/resend", "stub_timeout", headers)
        first_data = self.assertCreatedLearning(first, memo=MEMO, title=TITLE)
        second = self._post("https://timeout.example.test/resend", "stub_timeout", headers)
        self.assertWithin(second, LIMIT_LEARNING_MS)
        second_data = self.assertCreatedLearning(second, memo=MEMO, title=TITLE)
        self.assertEqual(second_data["learning_id"], first_data["learning_id"], "再試行で別の学習が作られた")
        self.assertEqual(self.get_summary().get("total_xp"), 15, "再試行で XP が二重に入った")
        next_day = self.get_session(now=shift(FIXED_NOW, days=1))
        self.assertEqual(next_day.get("total_due_count"), 1, "再試行でカードが二重に作られた")

    def test_AC8_接続先を到達不能にした画面HTMLにエラーバナーと再試行ボタンと入力欄の識別子がある(self):
        html = self.get_html("?api_base_url=http://127.0.0.1:59999")
        testids = (
            "learning-form", "title-input", "url-input", "memo-input", "submit-learning-btn",
            "offline-error-banner", "retry-submit-btn",
        )
        for testid in testids:
            with self.subTest(testid=testid):
                self.assertTestIdInHtml(html, testid)


if __name__ == "__main__":
    unittest.main()
