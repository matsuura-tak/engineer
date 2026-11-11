"""Environment configuration loader and startup validator (Contract D-2)."""

from dataclasses import dataclass
import ipaddress
import os
from typing import Mapping, Optional


class ConfigError(ValueError):
    """Raised when an environment variable violates startup safety rules."""


@dataclass(frozen=True)
class AppConfig:
    host: str
    bind_host: str
    is_ipv6: bool
    port: int
    db_path: str
    ensure_db_parent: bool
    app_env: str
    is_production: bool
    rate_limit_per_minute: int


def _validate_host(raw_host: str) -> tuple:
    if not raw_host or raw_host.strip() != raw_host:
        raise ConfigError(
            f"Invalid DEVFORGE_HOST={raw_host!r}: must be a loopback host (127.0.0.0/8, ::1, or localhost)"
        )

    stripped = raw_host
    if stripped.startswith("[") and stripped.endswith("]"):
        stripped = stripped[1:-1]

    if stripped.lower() == "localhost":
        return raw_host, "127.0.0.1", False

    try:
        ip = ipaddress.ip_address(stripped)
    except ValueError as exc:
        raise ConfigError(
            f"Invalid DEVFORGE_HOST={raw_host!r}: only loopback addresses (127.0.0.0/8, ::1, localhost) are allowed"
        ) from exc

    if isinstance(ip, ipaddress.IPv4Address) and ip.is_loopback:
        return raw_host, str(ip), False
    if isinstance(ip, ipaddress.IPv6Address) and ip == ipaddress.IPv6Address("::1"):
        return raw_host, "::1", True

    raise ConfigError(
        f"Invalid DEVFORGE_HOST={raw_host!r}: non-loopback binding is refused because authentication is disabled"
    )


def _validate_port(raw_port: str) -> int:
    if not raw_port or not raw_port.isdigit():
        raise ConfigError(
            f"Invalid DEVFORGE_PORT={raw_port!r}: must be an integer between 1 and 65535"
        )
    port = int(raw_port, 10)
    if port < 1 or port > 65535:
        raise ConfigError(
            f"Invalid DEVFORGE_PORT={raw_port!r}: port out of range (1..65535)"
        )
    return port


def _validate_db_path(env: Mapping[str, str]) -> tuple:
    if "DEVFORGE_DB_PATH" not in env:
        default_path = os.path.abspath(os.path.expanduser("~/.devforge/devforge.sqlite3"))
        return default_path, True

    raw_path = env["DEVFORGE_DB_PATH"]
    if not raw_path or not raw_path.strip():
        raise ConfigError("Invalid DEVFORGE_DB_PATH='': database path must not be empty")

    if raw_path == ":memory:":
        return ":memory:", False

    expanded = os.path.expanduser(raw_path)
    abs_path = os.path.abspath(expanded)
    if os.path.isdir(abs_path):
        raise ConfigError(
            f"Invalid DEVFORGE_DB_PATH={raw_path!r}: path points to a directory, expected a file"
        )
    parent_dir = os.path.dirname(abs_path)
    if not parent_dir or not os.path.isdir(parent_dir):
        raise ConfigError(
            f"Invalid DEVFORGE_DB_PATH={raw_path!r}: parent directory {parent_dir!r} does not exist"
        )
    return abs_path, False


def _validate_rate_limit(raw_limit: Optional[str]) -> int:
    if raw_limit is None or raw_limit == "":
        return 600
    if not raw_limit.isdigit() or int(raw_limit, 10) < 1:
        raise ConfigError(
            f"Invalid DEVFORGE_RATE_LIMIT_PER_MINUTE={raw_limit!r}: must be a positive integer"
        )
    return int(raw_limit, 10)


def load_config(environ: Optional[Mapping[str, str]] = None) -> AppConfig:
    env = os.environ if environ is None else environ

    raw_host = env["DEVFORGE_HOST"] if "DEVFORGE_HOST" in env else "127.0.0.1"
    host, bind_host, is_ipv6 = _validate_host(raw_host)

    raw_port = env["DEVFORGE_PORT"] if "DEVFORGE_PORT" in env else "8000"
    port = _validate_port(raw_port)

    db_path, ensure_db_parent = _validate_db_path(env)

    app_env = env.get("APP_ENV", "development").strip() or "development"
    is_production = app_env.lower() == "production"

    rate_limit = _validate_rate_limit(env.get("DEVFORGE_RATE_LIMIT_PER_MINUTE"))

    return AppConfig(
        host=host,
        bind_host=bind_host,
        is_ipv6=is_ipv6,
        port=port,
        db_path=db_path,
        ensure_db_parent=ensure_db_parent,
        app_env=app_env,
        is_production=is_production,
        rate_limit_per_minute=rate_limit,
    )
