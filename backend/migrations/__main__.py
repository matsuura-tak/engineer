"""CLI entrypoint for SQLite migrations, online backup/restore, and data purge:
python3 -m backend.migrations <up|down|status|backup|restore|purge>
"""

import argparse
import os
import sqlite3
import sys

from backend.db import DatabaseManager
from backend.migrations import get_applied_versions, migrate_down, migrate_up
from backend.service import LearningLoopService


def main() -> int:
    parser = argparse.ArgumentParser(description="DevForge SQLite migration & maintenance runner")
    parser.add_argument("action", choices=["up", "down", "status", "backup", "restore", "purge"])
    parser.add_argument(
        "--db",
        default=os.environ.get("DEVFORGE_DB_PATH", os.path.expanduser("~/.devforge/devforge.sqlite3")),
        help="Path to SQLite database file",
    )
    parser.add_argument(
        "--target",
        default="",
        help="Backup output path (for backup) or source backup file path (for restore)",
    )
    args = parser.parse_args()

    db_path = args.db

    if args.action == "backup":
        if not args.target:
            sys.stderr.write("Error: --target <backup_file_path> is required for backup\n")
            return 2
        os.makedirs(os.path.dirname(os.path.abspath(args.target)), exist_ok=True)
        src = sqlite3.connect(db_path)
        dst = sqlite3.connect(args.target)
        try:
            src.backup(dst)
            integrity = dst.execute("PRAGMA integrity_check;").fetchone()[0]
            print(f"backup ok: src={db_path} target={args.target} integrity={integrity}")
        finally:
            dst.close()
            src.close()
        return 0

    if args.action == "restore":
        if not args.target or not os.path.isfile(args.target):
            sys.stderr.write("Error: existing --target <backup_file_path> is required for restore\n")
            return 2
        os.makedirs(os.path.dirname(os.path.abspath(db_path)), exist_ok=True)
        src = sqlite3.connect(args.target)
        dst = sqlite3.connect(db_path)
        try:
            src.backup(dst)
            integrity = dst.execute("PRAGMA integrity_check;").fetchone()[0]
            print(f"restore ok: from={args.target} db={db_path} integrity={integrity}")
        finally:
            dst.close()
            src.close()
        return 0

    if args.action == "purge":
        db_mgr = DatabaseManager(db_path, ensure_parent=True)
        try:
            db_mgr.init_db()
            svc = LearningLoopService(db_mgr, is_production=False)
            svc.purge_all_user_data()
            print(f"purge ok: all learning data cleared in {db_path}")
        finally:
            db_mgr.close()
        return 0

    if db_path != ":memory:":
        parent = os.path.dirname(os.path.abspath(db_path))
        os.makedirs(parent, exist_ok=True)

    conn = sqlite3.connect(db_path)
    try:
        conn.execute("PRAGMA journal_mode = WAL;")
        conn.execute("PRAGMA foreign_keys = ON;")
        if args.action == "up":
            applied = migrate_up(conn)
            versions = get_applied_versions(conn)
            tables = [
                r[0]
                for r in conn.execute(
                    "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name"
                ).fetchall()
            ]
            print(f"migrate_up ok: newly_applied={applied} current_versions={versions} tables={tables}")
        elif args.action == "down":
            rolled_back = migrate_down(conn, target_version=0)
            versions = get_applied_versions(conn)
            tables = [
                r[0]
                for r in conn.execute(
                    "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name"
                ).fetchall()
            ]
            print(f"migrate_down ok: rolled_back={rolled_back} current_versions={versions} tables={tables}")
        else:
            versions = get_applied_versions(conn)
            print(f"migration_status: current_versions={versions}")
    finally:
        conn.close()
    return 0


if __name__ == "__main__":
    sys.exit(main())
