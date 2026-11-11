"""AC-9：不正な内部URL（SSRF）の拒否およびブラウザ通知権限なしでの完結（権限・セキュリティ系）

根拠：docs/prd/001-personal-learning-loop.md 11章 AC-9（プライベートIP・ローカルホスト・非HTTP(S)スキームは外部リクエストを一切発行せず
HTTP 400、error.code "INVALID_URL_SCHEME_OR_HOST"。通知・クリップボード権限が拒否されていても AC-1〜AC-5 がエラー0件で完了）、
10章（拒否する帯域）、contracts/openapi.yaml createLearning（SSRF 防御）・getWebAppUi（OS/ブラウザ権限APIを一切要求しない）、
設計メモ 3章 Seam #3（SSRF 検査は常にスタブ判定より前）。
権限を拒否したブラウザで AC-1〜AC-5 を通すことは、このテストでは確かめない（test-plan 3章・7章で G4 の人に回す）。
"""

import threading
import unittest
from http.server import BaseHTTPRequestHandler, HTTPServer

from acceptance_support import (
    AcceptanceTestCase,
    http,
    now_header,
)

MEMO = "社内メタデータAPIやローカル管理画面へのSSRFを防ぐためURLのホストとスキームを検査する"


class _HitCounter(BaseHTTPRequestHandler):
    hits = []

    def do_GET(self):  # noqa: N802（http.server の決まった名前）
        _HitCounter.hits.append(self.path)
        self.send_response(200)
        self.send_header("Content-Type", "text/html")
        self.end_headers()
        self.wfile.write(b"<html><title>admin</title></html>")

    do_HEAD = do_GET
    do_POST = do_GET

    def log_message(self, *args):
        pass


class AC9_SsrfAndPermissionsTest(AcceptanceTestCase):

    def setUp(self):
        super().setUp()
        _HitCounter.hits = []
        self.listener = HTTPServer(("127.0.0.1", 0), _HitCounter)
        self.listener_port = self.listener.server_address[1]
        self.listener_thread = threading.Thread(target=self.listener.serve_forever, daemon=True)
        self.listener_thread.start()

    def tearDown(self):
        self.listener.shutdown()
        self.listener.server_close()
        self.listener_thread.join(timeout=5)
        super().tearDown()

    def _post(self, url, mode=None):
        extra = {"X-Test-Url-Fetch-Mode": mode} if mode else None
        return http(
            "POST", "/api/v1/learnings",
            body={"title": "SSRF", "url": url, "memo": MEMO},
            headers=now_header(extra=extra),
        )

    def test_AC9_ループバックの待ち受けを指すURL_400で待ち受けへの要求は0件(self):
        url = "http://127.0.0.1:%d/admin" % self.listener_port
        for mode in (None, "live", "stub_ok"):
            with self.subTest(mode=mode or "ヘッダなし"):
                resp = self._post(url, mode)
                self.assertProblem(resp, 400, "INVALID_URL_SCHEME_OR_HOST", "url")
        self.assertEqual(_HitCounter.hits, [], "SSRF 対象の URL に外部リクエストが発行された")
        self.assertEqual(self.get_summary().get("total_xp"), 0, "拒否した登録で XP が入った")

    def test_AC9_プライベートとリンクローカルとlocalhostと非HTTPスキーム_すべて400で保存されない(self):
        urls = [
            "http://127.0.0.1:8000/admin",
            "http://169.254.169.254/latest/meta-data/",
            "file:///etc/passwd",
            "http://localhost/",
            "http://LOCALHOST:8000/admin",
            "http://10.0.0.1/",
            "http://172.16.0.1/",
            "http://172.31.255.255/",
            "http://192.168.1.1/",
            "http://[::1]/",
            "ftp://ftp.example.test/file.txt",
        ]
        for url in urls:
            with self.subTest(url=url):
                resp = self._post(url, "stub_ok")
                self.assertProblem(resp, 400, "INVALID_URL_SCHEME_OR_HOST", "url")
        self.assertEqual(self.get_summary().get("total_xp"), 0, "拒否した登録で XP が入った")
        session = self.get_session(now="2026-11-30T09:00:00Z")
        self.assertIsNone(session.get("active_challenge"), "拒否した登録で問題が作られた: %r" % (session,))
        self.assertEqual(session.get("total_due_count"), 0, "拒否した登録でカードが作られた: %r" % (session,))

    def test_AC9_画面HTMLは通知やクリップボードなどのブラウザ権限APIを呼ばない(self):
        html = self.get_html()
        self.assertTestIdInHtml(html, "app-root")
        forbidden = (
            "Notification.requestPermission",
            "navigator.clipboard",
            "navigator.permissions",
            "getUserMedia",
            "navigator.geolocation",
            "PushManager",
        )
        found = [api for api in forbidden if api in html]
        self.assertEqual(found, [], "GET / の HTML がブラウザ権限APIを使っている")


if __name__ == "__main__":
    unittest.main()
