"""SQLite WAL connection manager and transaction helper."""

from contextlib import contextmanager
import os
import sqlite3
import threading
from typing import Iterator, List, Optional

from backend.migrations import migrate_up


class DatabaseManager:
    """Manages SQLite connections in WAL mode with foreign_keys=ON and safe write serialization."""

    def __init__(self, db_path: str, ensure_parent: bool = False) -> None:
        self.db_path = db_path
        self._lock = threading.RLock()
        self._closed = False
        self._connections: List[sqlite3.Connection] = []
        self._local = threading.local()
        self._shared_mem_conn: Optional[sqlite3.Connection] = None

        if db_path != ":memory:" and ensure_parent:
            parent = os.path.dirname(os.path.abspath(db_path))
            os.makedirs(parent, exist_ok=True)

    def _configure_connection(self, conn: sqlite3.Connection) -> sqlite3.Connection:
        conn.row_factory = sqlite3.Row
        conn.isolation_level = None  # Explicit transaction management (autocommit outside BEGIN)
        if self.db_path != ":memory:":
            conn.execute("PRAGMA journal_mode = WAL;")
        conn.execute("PRAGMA synchronous = NORMAL;")
        conn.execute("PRAGMA foreign_keys = ON;")
        conn.execute("PRAGMA busy_timeout = 5000;")
        return conn

    def get_connection(self) -> sqlite3.Connection:
        with self._lock:
            if self._closed:
                raise sqlite3.ProgrammingError("DatabaseManager is closed")
            if self.db_path == ":memory:":
                if self._shared_mem_conn is None:
                    self._shared_mem_conn = self._configure_connection(
                        sqlite3.connect(":memory:", check_same_thread=False)
                    )
                    self._connections.append(self._shared_mem_conn)
                return self._shared_mem_conn

            conn = getattr(self._local, "conn", None)
            if conn is None:
                conn = self._configure_connection(
                    sqlite3.connect(self.db_path, timeout=5.0, check_same_thread=False)
                )
                self._local.conn = conn
                self._connections.append(conn)
            return conn

    def init_db(self) -> List[int]:
        """Run pending migrations and ensure initial seed rows without losing existing data."""
        with self._lock:
            if self.db_path == ":memory:":
                conn = self.get_connection()
                prev_isolation = conn.isolation_level
                conn.isolation_level = ""
                try:
                    return migrate_up(conn)
                finally:
                    conn.isolation_level = prev_isolation

            setup_conn = sqlite3.connect(self.db_path, timeout=5.0)
            try:
                setup_conn.execute("PRAGMA journal_mode = WAL;")
                setup_conn.execute("PRAGMA foreign_keys = ON;")
                setup_conn.execute("PRAGMA busy_timeout = 5000;")
                return migrate_up(setup_conn)
            finally:
                setup_conn.close()

    @contextmanager
    def read_tx(self) -> Iterator[sqlite3.Connection]:
        with self._lock:
            conn = self.get_connection()
            conn.execute("PRAGMA foreign_keys = ON;")
            yield conn

    @contextmanager
    def write_tx(self) -> Iterator[sqlite3.Connection]:
        with self._lock:
            conn = self.get_connection()
            conn.execute("PRAGMA foreign_keys = ON;")
            conn.execute("BEGIN IMMEDIATE;")
            try:
                yield conn
                conn.execute("COMMIT;")
            except BaseException:
                try:
                    conn.execute("ROLLBACK;")
                except sqlite3.Error:
                    pass
                raise

    def close(self) -> None:
        with self._lock:
            if self._closed:
                return
            self._closed = True
            for conn in self._connections:
                try:
                    if self.db_path != ":memory:":
                        conn.execute("PRAGMA wal_checkpoint(TRUNCATE);")
                except sqlite3.Error:
                    pass
                try:
                    conn.close()
                except sqlite3.Error:
                    pass
            self._connections.clear()
            self._shared_mem_conn = None
