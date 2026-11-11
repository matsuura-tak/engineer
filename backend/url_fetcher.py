"""SSRF-safe URL fetcher with pinned-IP connections, redirect re-verification, and Test Seam #3."""

from dataclasses import dataclass
import html
import http.client
import ipaddress
import re
import socket
import ssl
import time
from typing import Callable, List, Optional, Tuple
import urllib.parse

from backend.errors import ApiProblemError
from backend.logging_utils import StructuredLogger, default_logger

VALID_FETCH_MODES = frozenset({"live", "stub_ok", "stub_timeout", "stub_error"})
REDIRECT_STATUSES = frozenset({301, 302, 303, 307, 308})
MAX_REDIRECTS = 3
TOTAL_TIMEOUT_SECONDS = 2.0
MAX_RESPONSE_BYTES = 524288  # 512 KB

_CGNAT_NET = ipaddress.ip_network("100.64.0.0/10")
_TITLE_RE = re.compile(r"<title[^>]*>(.*?)</title>", re.IGNORECASE | re.DOTALL)

SSRF_ERROR_MESSAGE = "url には公開 http/https URL のみ指定できます（ローカルホストやプライベートIPは指定できません）"


@dataclass(frozen=True)
class UrlFetchResult:
    status: str  # "fetched" | "not_provided" | "fallback_used"
    extracted_title: str = ""


def _is_single_addr_forbidden(
    addr: "ipaddress.IPv4Address | ipaddress.IPv6Address",
) -> bool:
    if (
        addr.is_private
        or addr.is_loopback
        or addr.is_link_local
        or addr.is_multicast
        or addr.is_reserved
        or addr.is_unspecified
    ):
        return True
    if isinstance(addr, ipaddress.IPv4Address) and addr in _CGNAT_NET:
        return True
    return False


def is_forbidden_ip(ip_obj: "ipaddress.IPv4Address | ipaddress.IPv6Address") -> bool:
    """Check IPv4/IPv6 (including IPv4-mapped, 6to4, and Teredo embedded addresses) against SSRF blocklist."""
    candidates: List["ipaddress.IPv4Address | ipaddress.IPv6Address"] = [ip_obj]
    if isinstance(ip_obj, ipaddress.IPv6Address):
        if ip_obj.ipv4_mapped is not None:
            candidates.append(ip_obj.ipv4_mapped)
        if ip_obj.sixtofour is not None:
            candidates.append(ip_obj.sixtofour)
        if ip_obj.teredo is not None:
            candidates.extend(ip_obj.teredo)

    return any(_is_single_addr_forbidden(c) for c in candidates)


def _looks_like_ipv4_alt_notation(host: str) -> bool:
    """Detect decimal/octal/hex/short IPv4 notations accepted by inet_aton without matching domain names."""
    if not host or len(host) > 64:
        return False
    parts = host.split(".")
    if len(parts) > 4 or any(p == "" for p in parts):
        return False
    for part in parts:
        low = part.lower()
        if low.startswith("0x"):
            hex_body = low[2:]
            if not hex_body or not all(ch in "0123456789abcdef" for ch in hex_body):
                return False
        else:
            if not part.isdigit():
                return False
    return True


def parse_ip_literal(host_no_dot: str) -> Optional["ipaddress.IPv4Address | ipaddress.IPv6Address"]:
    """Parse standard IPv4/IPv6 literals and inet_aton alternate IPv4 notations without DNS."""
    candidate = host_no_dot
    if "%" in candidate:
        candidate = candidate.split("%", 1)[0]

    try:
        return ipaddress.ip_address(candidate)
    except ValueError:
        pass

    if _looks_like_ipv4_alt_notation(candidate):
        try:
            packed = socket.inet_aton(candidate)
            return ipaddress.IPv4Address(packed)
        except OSError:
            return None

    return None


def _validate_url_syntax_and_static_ssrf(
    raw_url: str,
) -> Tuple[str, str, int, str, Optional["ipaddress.IPv4Address | ipaddress.IPv6Address"]]:
    """
    Steps 1-3 of Contract SSRF order (pure string / IP literal checks, zero DNS/network):
    Returns (scheme, host_no_dot, port, path_and_query, parsed_ip_or_none).
    Raises ApiProblemError(INVALID_URL_SCHEME_OR_HOST) on violation.
    """
    if not raw_url or any(ch in raw_url for ch in ("\r", "\n", "\t", " ", "\x00")):
        raise ApiProblemError(
            code="INVALID_URL_SCHEME_OR_HOST",
            message=SSRF_ERROR_MESSAGE,
            field="url",
        )

    try:
        parsed = urllib.parse.urlsplit(raw_url)
    except ValueError as exc:
        raise ApiProblemError(
            code="INVALID_URL_SCHEME_OR_HOST",
            message=SSRF_ERROR_MESSAGE,
            field="url",
        ) from exc

    scheme = (parsed.scheme or "").lower()
    if scheme not in ("http", "https"):
        raise ApiProblemError(
            code="INVALID_URL_SCHEME_OR_HOST",
            message=SSRF_ERROR_MESSAGE,
            field="url",
        )

    hostname = parsed.hostname
    if not hostname:
        raise ApiProblemError(
            code="INVALID_URL_SCHEME_OR_HOST",
            message=SSRF_ERROR_MESSAGE,
            field="url",
        )

    try:
        port = parsed.port if parsed.port is not None else (443 if scheme == "https" else 80)
    except ValueError as exc:
        raise ApiProblemError(
            code="INVALID_URL_SCHEME_OR_HOST",
            message=SSRF_ERROR_MESSAGE,
            field="url",
        ) from exc

    if port < 1 or port > 65535:
        raise ApiProblemError(
            code="INVALID_URL_SCHEME_OR_HOST",
            message=SSRF_ERROR_MESSAGE,
            field="url",
        )

    host_no_dot = hostname.rstrip(".").lower()
    if not host_no_dot or host_no_dot == "localhost" or host_no_dot.endswith(".localhost"):
        raise ApiProblemError(
            code="INVALID_URL_SCHEME_OR_HOST",
            message=SSRF_ERROR_MESSAGE,
            field="url",
        )

    literal_ip = parse_ip_literal(host_no_dot)
    if literal_ip is not None and is_forbidden_ip(literal_ip):
        raise ApiProblemError(
            code="INVALID_URL_SCHEME_OR_HOST",
            message=SSRF_ERROR_MESSAGE,
            field="url",
        )

    path = parsed.path or "/"
    if parsed.query:
        path = f"{path}?{parsed.query}"

    return scheme, host_no_dot, port, path, literal_ip


class _PinnedHTTPConnection(http.client.HTTPConnection):
    """HTTPConnection that connects directly to a pre-verified IP address (prevents DNS rebinding)."""

    def __init__(self, verified_ip: str, original_host: str, port: int, timeout: float) -> None:
        super().__init__(host=original_host, port=port, timeout=timeout)
        self._verified_ip = verified_ip

    def connect(self) -> None:
        self.sock = socket.create_connection((self._verified_ip, self.port), self.timeout)


class _PinnedHTTPSConnection(http.client.HTTPSConnection):
    """HTTPSConnection that connects to a pre-verified IP while verifying TLS cert & SNI for original_host."""

    def __init__(
        self,
        verified_ip: str,
        original_host: str,
        port: int,
        timeout: float,
        ssl_context: Optional[ssl.SSLContext] = None,
    ) -> None:
        ctx = ssl_context or ssl.create_default_context()
        super().__init__(host=original_host, port=port, timeout=timeout, context=ctx)
        self._verified_ip = verified_ip
        self._original_host = original_host
        self._ssl_ctx = ctx

    def connect(self) -> None:
        raw_sock = socket.create_connection((self._verified_ip, self.port), self.timeout)
        self.sock = self._ssl_ctx.wrap_socket(raw_sock, server_hostname=self._original_host)


def _extract_html_title(raw_bytes: bytes) -> str:
    try:
        text = raw_bytes.decode("utf-8", errors="replace")
    except Exception:
        return ""
    match = _TITLE_RE.search(text)
    if not match:
        return ""
    unescaped = html.unescape(match.group(1))
    cleaned = " ".join(unescaped.split()).strip()
    return cleaned[:200]


class UrlFetcher:
    """Fetches public article metadata safely with SSRF protection and deterministic test seams."""

    def __init__(
        self,
        *,
        resolver: Callable[..., list] = socket.getaddrinfo,
        connection_factory: Optional[Callable[[str, str, str, int, float], http.client.HTTPConnection]] = None,
        logger: Optional[StructuredLogger] = None,
    ) -> None:
        self._resolver = resolver
        self._connection_factory = connection_factory
        self._logger = logger or default_logger

    def _open_pinned_connection(
        self,
        scheme: str,
        verified_ip: str,
        original_host: str,
        port: int,
        timeout: float,
    ) -> http.client.HTTPConnection:
        if self._connection_factory is not None:
            return self._connection_factory(scheme, verified_ip, original_host, port, timeout)
        if scheme == "https":
            return _PinnedHTTPSConnection(verified_ip, original_host, port, timeout)
        return _PinnedHTTPConnection(verified_ip, original_host, port, timeout)

    def fetch(
        self,
        url: Optional[str],
        *,
        fetch_mode_header: Optional[str] = None,
        is_production: bool = False,
        request_id: str = "internal",
    ) -> UrlFetchResult:
        if url is None:
            return UrlFetchResult(status="not_provided", extracted_title="")

        # Normalize fetch mode (ignored in production -> always 'live')
        if is_production or not fetch_mode_header:
            mode = "live"
        else:
            mode = fetch_mode_header.strip()
            if mode not in VALID_FETCH_MODES:
                raise ApiProblemError(
                    code="VALIDATION_ERROR",
                    message="X-Test-Url-Fetch-Mode の値が不正です",
                    field="X-Test-Url-Fetch-Mode",
                )

        # Steps 1-4: Static SSRF inspection ALWAYS runs BEFORE stub or reserved-domain handling!
        scheme, host_no_dot, port, path, literal_ip = _validate_url_syntax_and_static_ssrf(url)

        # Step 5a: Test header stubs (no DNS, no external connection, no 2s sleep)
        if mode == "stub_ok":
            return UrlFetchResult(status="fetched", extracted_title="")
        if mode in ("stub_timeout", "stub_error"):
            return UrlFetchResult(status="fallback_used", extracted_title="")

        # Step 5b: Reserved test domains (*.example.test / example.test) - no DNS, no external connection
        if host_no_dot == "example.test" or host_no_dot.endswith(".example.test"):
            if host_no_dot == "ok.example.test":
                return UrlFetchResult(status="fetched", extracted_title="")
            return UrlFetchResult(status="fallback_used", extracted_title="")

        # Steps 6-7: Live HTTP/HTTPS fetch with single DNS resolution per hop, pinned IP, max 3 redirects, 2.0s budget
        deadline = time.monotonic() + TOTAL_TIMEOUT_SECONDS
        current_url = url
        current_scheme = scheme
        current_host = host_no_dot
        current_port = port
        current_path = path
        current_literal_ip = literal_ip

        for hop in range(MAX_REDIRECTS + 1):
            remaining = deadline - time.monotonic()
            if remaining <= 0:
                return UrlFetchResult(status="fallback_used", extracted_title="")

            # Resolve DNS once if not already an IP literal
            if current_literal_ip is not None:
                verified_ip = str(current_literal_ip)
            else:
                try:
                    addr_infos = self._resolver(current_host, current_port, 0, socket.SOCK_STREAM)
                except OSError:
                    return UrlFetchResult(status="fallback_used", extracted_title="")

                if not addr_infos:
                    return UrlFetchResult(status="fallback_used", extracted_title="")

                resolved_ips: List[str] = []
                for info in addr_infos:
                    sockaddr = info[4]
                    if not sockaddr:
                        continue
                    raw_ip = sockaddr[0]
                    parsed_ip = parse_ip_literal(raw_ip)
                    if parsed_ip is None or is_forbidden_ip(parsed_ip):
                        if hop == 0:
                            raise ApiProblemError(
                                code="INVALID_URL_SCHEME_OR_HOST",
                                message=SSRF_ERROR_MESSAGE,
                                field="url",
                            )
                        self._logger.log(
                            request_id=request_id,
                            operation="ssrf_redirect_blocked",
                            result="blocked",
                            status_code=201,
                            processing_ms=0,
                            extra={"hop": hop},
                        )
                        return UrlFetchResult(status="fallback_used", extracted_title="")
                    resolved_ips.append(str(parsed_ip))

                if not resolved_ips:
                    return UrlFetchResult(status="fallback_used", extracted_title="")
                verified_ip = resolved_ips[0]

            remaining = deadline - time.monotonic()
            if remaining <= 0:
                return UrlFetchResult(status="fallback_used", extracted_title="")

            conn: Optional[http.client.HTTPConnection] = None
            try:
                conn = self._open_pinned_connection(
                    current_scheme,
                    verified_ip,
                    current_host,
                    current_port,
                    min(remaining, TOTAL_TIMEOUT_SECONDS),
                )
                default_port = 443 if current_scheme == "https" else 80
                if ":" in current_host and not current_host.startswith("["):
                    host_header_base = f"[{current_host}]"
                else:
                    host_header_base = current_host
                host_header = (
                    host_header_base
                    if current_port == default_port
                    else f"{host_header_base}:{current_port}"
                )
                conn.request(
                    "GET",
                    current_path,
                    headers={
                        "Host": host_header,
                        "User-Agent": "DevForge/1.0 (+local-personal-learning)",
                        "Accept": "text/html,application/xhtml+xml;q=0.9,*/*;q=0.1",
                        "Accept-Encoding": "identity",
                        "Connection": "close",
                    },
                )
                resp = conn.getresponse()
                status_code = resp.status

                if status_code in REDIRECT_STATUSES:
                    location = resp.getheader("Location")
                    if not location or hop >= MAX_REDIRECTS:
                        return UrlFetchResult(status="fallback_used", extracted_title="")
                    next_url = urllib.parse.urljoin(current_url, location.strip())
                    try:
                        (
                            current_scheme,
                            current_host,
                            current_port,
                            current_path,
                            current_literal_ip,
                        ) = _validate_url_syntax_and_static_ssrf(next_url)
                    except ApiProblemError:
                        self._logger.log(
                            request_id=request_id,
                            operation="ssrf_redirect_blocked",
                            result="blocked",
                            status_code=201,
                            processing_ms=0,
                            extra={"hop": hop + 1},
                        )
                        return UrlFetchResult(status="fallback_used", extracted_title="")

                    # Also handle reserved test domains if redirected there
                    if current_host == "example.test" or current_host.endswith(".example.test"):
                        if current_host == "ok.example.test":
                            return UrlFetchResult(status="fetched", extracted_title="")
                        return UrlFetchResult(status="fallback_used", extracted_title="")

                    current_url = next_url
                    continue

                if 200 <= status_code < 300:
                    chunks: List[bytes] = []
                    bytes_read = 0
                    while bytes_read < MAX_RESPONSE_BYTES:
                        if time.monotonic() > deadline:
                            return UrlFetchResult(status="fallback_used", extracted_title="")
                        to_read = min(16384, MAX_RESPONSE_BYTES - bytes_read)
                        chunk = resp.read(to_read)
                        if not chunk:
                            break
                        chunks.append(chunk)
                        bytes_read += len(chunk)
                    if time.monotonic() > deadline:
                        return UrlFetchResult(status="fallback_used", extracted_title="")
                    body_bytes = b"".join(chunks)
                    return UrlFetchResult(
                        status="fetched",
                        extracted_title=_extract_html_title(body_bytes),
                    )

                return UrlFetchResult(status="fallback_used", extracted_title="")
            except ApiProblemError:
                raise
            except Exception:
                return UrlFetchResult(status="fallback_used", extracted_title="")
            finally:
                if conn is not None:
                    try:
                        conn.close()
                    except Exception:
                        pass

        return UrlFetchResult(status="fallback_used", extracted_title="")
