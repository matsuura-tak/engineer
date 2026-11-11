"""Unit tests for SSRF blocklist, alternate IP notations, DNS rebinding pinning, redirect checks, and TLS SNI."""

import http.client
import io
import socket
import ssl
from typing import List, Optional, Tuple
import unittest
from unittest import mock

from backend.errors import ApiProblemError
from backend.logging_utils import StructuredLogger
from backend.url_fetcher import UrlFetcher, _PinnedHTTPSConnection


class _FakeHTTPResponse:
    def __init__(self, status: int, body: bytes = b"", headers: Optional[dict] = None) -> None:
        self.status = status
        self._stream = io.BytesIO(body)
        self._headers = {k.lower(): v for k, v in (headers or {}).items()}

    def getheader(self, name: str, default: Optional[str] = None) -> Optional[str]:
        return self._headers.get(name.lower(), default)

    def read(self, amt: Optional[int] = None) -> bytes:
        return self._stream.read(amt)


class _FakePinnedConnection(http.client.HTTPConnection):
    def __init__(
        self,
        verified_ip: str,
        original_host: str,
        port: int,
        timeout: float,
        responses_queue: List[_FakeHTTPResponse],
        recorded_calls: List[Tuple[str, str, int, str, dict]],
    ) -> None:
        super().__init__(host=original_host, port=port, timeout=timeout)
        self.verified_ip = verified_ip
        self.original_host = original_host
        self._queue = responses_queue
        self._recorded = recorded_calls

    def request(self, method: str, url: str, body: object = None, headers: Optional[dict] = None, **kw: object) -> None:
        self._recorded.append((self.verified_ip, self.original_host, self.port, url, dict(headers or {})))

    def getresponse(self) -> _FakeHTTPResponse:  # type: ignore[override]
        return self._queue.pop(0)

    def close(self) -> None:
        return


class TestSsrfAndUrlFetcher(unittest.TestCase):
    def test_static_ssrf_blocks_all_forbidden_urls_even_with_stub_ok_and_zero_dns(self) -> None:
        dns_called = 0

        def fail_if_dns_called(*_args: object, **_kwargs: object) -> list:
            nonlocal dns_called
            dns_called += 1
            raise AssertionError("DNS resolver must never be called for static SSRF / literal IP checks")

        fetcher = UrlFetcher(resolver=fail_if_dns_called)
        forbidden_urls = [
            "file:///etc/passwd",
            "ftp://example.com/resource",
            "gopher://127.0.0.1:6379/_INFO",
            "javascript:alert(1)",
            "http://localhost/admin",
            "http://LOCALHOST:8000/test",
            "http://api.localhost/v1",
            "http://localhost./secret",
            "http://127.0.0.1:8000/admin",
            "http://127.1/admin",
            "http://2130706433/admin",  # Decimal 127.0.0.1
            "http://0x7f.1/admin",  # Hex 127.0.0.1
            "http://0177.0.0.1/admin",  # Octal 127.0.0.1
            "http://0.0.0.0/",
            "http://10.0.0.1/",
            "http://172.16.0.1/",
            "http://172.31.255.255/",
            "http://192.168.1.1/",
            "http://169.254.169.254/latest/meta-data/",
            "http://100.64.0.1/internal",  # CGNAT 100.64.0.0/10
            "http://100.127.255.254/internal",
            "http://[::1]/",
            "http://[::ffff:127.0.0.1]/",  # IPv4-mapped IPv6
            "http://[::ffff:169.254.169.254]/",
            "http://user:pass@127.0.0.1:8080/private",
            "",
            "http://",
        ]

        for bad_url in forbidden_urls:
            for mode in (None, "live", "stub_ok", "stub_timeout"):
                with self.subTest(bad_url=bad_url, mode=mode):
                    with self.assertRaises(ApiProblemError) as ctx:
                        fetcher.fetch(bad_url, fetch_mode_header=mode, is_production=False)
                    self.assertEqual(ctx.exception.code, "INVALID_URL_SCHEME_OR_HOST")
                    self.assertEqual(ctx.exception.status, 400)
                    self.assertIn("url", ctx.exception.message)

        self.assertEqual(dns_called, 0)

    def test_dns_rebinding_prevented_by_single_resolution_and_pinned_ip(self) -> None:
        resolve_calls = 0

        def rebinding_resolver(host: str, port: int, *_rest: object) -> list:
            nonlocal resolve_calls
            resolve_calls += 1
            if resolve_calls == 1:
                return [(socket.AF_INET, socket.SOCK_STREAM, 6, "", ("93.184.216.34", port))]
            # Second call would return loopback if TOCTOU existed
            return [(socket.AF_INET, socket.SOCK_STREAM, 6, "", ("127.0.0.1", port))]

        recorded: List[Tuple[str, str, int, str, dict]] = []
        responses = [
            _FakeHTTPResponse(
                200,
                b"<html><head><title>Pinned Article Title</title></head><body>Hello</body></html>",
            )
        ]

        fetcher = UrlFetcher(
            resolver=rebinding_resolver,
            connection_factory=lambda _scheme, vip, ohost, prt, tm: _FakePinnedConnection(
                vip, ohost, prt, tm, responses, recorded
            ),
        )
        res = fetcher.fetch("https://rebinding-check.example.org/post?id=1", fetch_mode_header="live")
        self.assertEqual(res.status, "fetched")
        self.assertEqual(res.extracted_title, "Pinned Article Title")
        self.assertEqual(resolve_calls, 1)
        self.assertEqual(len(recorded), 1)
        self.assertEqual(recorded[0][0], "93.184.216.34")
        self.assertEqual(recorded[0][1], "rebinding-check.example.org")
        self.assertEqual(recorded[0][4]["Host"], "rebinding-check.example.org")

    def test_dns_resolving_to_any_internal_ip_blocks_with_400_and_zero_connections(self) -> None:
        def mixed_resolver(_host: str, port: int, *_rest: object) -> list:
            return [
                (socket.AF_INET, socket.SOCK_STREAM, 6, "", ("93.184.216.34", port)),
                (socket.AF_INET, socket.SOCK_STREAM, 6, "", ("169.254.169.254", port)),
            ]

        connected = False

        def forbidden_conn(*_args: object) -> http.client.HTTPConnection:
            nonlocal connected
            connected = True
            raise AssertionError("Must never connect when any resolved IP is internal")

        fetcher = UrlFetcher(resolver=mixed_resolver, connection_factory=forbidden_conn)
        with self.assertRaises(ApiProblemError) as ctx:
            fetcher.fetch("https://evil-dns.example.org/", fetch_mode_header="live")
        self.assertEqual(ctx.exception.code, "INVALID_URL_SCHEME_OR_HOST")
        self.assertFalse(connected)

    def test_redirect_to_internal_ip_is_blocked_without_connecting_and_falls_back_201(self) -> None:
        log_buf = io.StringIO()
        logger = StructuredLogger(stream=log_buf)

        def public_resolver(_host: str, port: int, *_rest: object) -> list:
            return [(socket.AF_INET, socket.SOCK_STREAM, 6, "", ("93.184.216.34", port))]

        recorded: List[Tuple[str, str, int, str, dict]] = []
        responses = [
            _FakeHTTPResponse(
                302,
                b"",
                headers={"Location": "http://169.254.169.254/latest/meta-data/iam"},
            )
        ]

        fetcher = UrlFetcher(
            resolver=public_resolver,
            connection_factory=lambda _scheme, vip, ohost, prt, tm: _FakePinnedConnection(
                vip, ohost, prt, tm, responses, recorded
            ),
            logger=logger,
        )
        res = fetcher.fetch("https://public-blog.example.org/entry", fetch_mode_header="live")
        self.assertEqual(res.status, "fallback_used")
        self.assertEqual(len(recorded), 1)
        self.assertEqual(recorded[0][0], "93.184.216.34")
        self.assertIn("ssrf_redirect_blocked", log_buf.getvalue())

    def test_pinned_https_connection_connects_to_verified_ip_with_original_sni_hostname(self) -> None:
        fake_raw_sock = mock.MagicMock(name="raw_tcp_sock")
        fake_tls_sock = mock.MagicMock(name="tls_wrapped_sock")
        fake_ssl_ctx = mock.MagicMock(spec=ssl.SSLContext)
        fake_ssl_ctx.wrap_socket.return_value = fake_tls_sock

        with mock.patch("backend.url_fetcher.socket.create_connection", return_value=fake_raw_sock) as mock_conn:
            conn = _PinnedHTTPSConnection(
                verified_ip="93.184.216.34",
                original_host="secure.example.org",
                port=443,
                timeout=1.5,
                ssl_context=fake_ssl_ctx,
            )
            conn.connect()

            mock_conn.assert_called_once_with(("93.184.216.34", 443), 1.5)
            fake_ssl_ctx.wrap_socket.assert_called_once_with(
                fake_raw_sock, server_hostname="secure.example.org"
            )
            self.assertIs(conn.sock, fake_tls_sock)


if __name__ == "__main__":
    unittest.main()
