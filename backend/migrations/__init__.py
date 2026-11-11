"""SQLite schema migration runner (up / down) using Python stdlib only."""

from datetime import datetime, timezone
import os
import sqlite3
from typing import List, Tuple

MIGRATIONS_DIR = os.path.dirname(os.path.abspath(__file__))

MIGRATIONS: List[Tuple[int, str, str, str]] = [
    (
        1,
        "001_initial_schema",
        os.path.join(MIGRATIONS_DIR, "001_initial_schema.up.sql"),
        os.path.join(MIGRATIONS_DIR, "001_initial_schema.down.sql"),
    ),
]


def _ensure_migrations_table(conn: sqlite3.Connection) -> None:
    conn.execute(
        """
        CREATE TABLE IF NOT EXISTS schema_migrations (
            version INTEGER PRIMARY KEY,
            applied_at TEXT NOT NULL
        );
        """
    )


def get_applied_versions(conn: sqlite3.Connection) -> List[int]:
    _ensure_migrations_table(conn)
    rows = conn.execute("SELECT version FROM schema_migrations ORDER BY version ASC").fetchall()
    return [int(row[0]) for row in rows]


def _split_sql_statements(sql_text: str) -> List[str]:
    statements: List[str] = []
    current: List[str] = []
    for line in sql_text.splitlines():
        stripped = line.strip()
        if not stripped or stripped.startswith("--"):
            continue
        current.append(line)
        if stripped.endswith(";"):
            stmt = "\n".join(current).strip()
            if stmt:
                statements.append(stmt)
            current = []
    if current:
        stmt = "\n".join(current).strip()
        if stmt:
            statements.append(stmt)
    return statements


def migrate_up(conn: sqlite3.Connection) -> List[int]:
    """Apply all pending migrations (and safely ensure idempotent DDL if already applied)."""
    conn.execute("PRAGMA foreign_keys = ON;")
    _ensure_migrations_table(conn)
    applied = set(get_applied_versions(conn))
    newly_applied: List[int] = []

    for version, _name, up_path, _down_path in MIGRATIONS:
        with open(up_path, "r", encoding="utf-8") as f:
            sql_text = f.read()
        statements = _split_sql_statements(sql_text)
        with conn:
            for stmt in statements:
                conn.execute(stmt)
            if version not in applied:
                now_iso = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")
                conn.execute(
                    "INSERT INTO schema_migrations (version, applied_at) VALUES (?, ?)",
                    (version, now_iso),
                )
                newly_applied.append(version)

    return newly_applied


def migrate_down(conn: sqlite3.Connection, target_version: int = 0) -> List[int]:
    """Roll back applied migrations down to target_version (default 0 = full rollback)."""
    conn.execute("PRAGMA foreign_keys = ON;")
    _ensure_migrations_table(conn)
    applied = set(get_applied_versions(conn))
    rolled_back: List[int] = []

    for version, _name, _up_path, down_path in sorted(MIGRATIONS, key=lambda m: m[0], reverse=True):
        if version in applied and version > target_version:
            with open(down_path, "r", encoding="utf-8") as f:
                sql_text = f.read()
            statements = _split_sql_statements(sql_text)
            with conn:
                for stmt in statements:
                    conn.execute(stmt)
                conn.execute("DELETE FROM schema_migrations WHERE version = ?", (version,))
            rolled_back.append(version)

    return rolled_back
