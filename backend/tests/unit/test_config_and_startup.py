"""Unit and subprocess tests for environment configuration and startup safety (Contract D-2)."""

import os
import subprocess
import sys
import tempfile
import unittest

from backend.config import ConfigError, load_config

REPO_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", ".."))


class TestConfigAndStartup(unittest.TestCase):
    def test_default_config_values(self) -> None:
        cfg = load_config({})
        self.assertEqual(cfg.host, "127.0.0.1")
        self.assertEqual(cfg.bind_host, "127.0.0.1")
        self.assertFalse(cfg.is_ipv6)
        self.assertEqual(cfg.port, 8000)
        self.assertTrue(cfg.db_path.endswith(os.path.join(".devforge", "devforge.sqlite3")))
        self.assertTrue(cfg.ensure_db_parent)
        self.assertFalse(cfg.is_production)

    def test_valid_loopback_hosts(self) -> None:
        for host, expected_ipv6 in [
            ("127.0.0.1", False),
            ("127.0.0.2", False),
            ("127.255.255.254", False),
            ("localhost", False),
            ("LOCALHOST", False),
            ("::1", True),
            ("[::1]", True),
        ]:
            with self.subTest(host=host):
                cfg = load_config({"DEVFORGE_HOST": host, "DEVFORGE_DB_PATH": ":memory:"})
                self.assertEqual(cfg.is_ipv6, expected_ipv6)

    def test_invalid_non_loopback_hosts_raise_with_var_name(self) -> None:
        for bad_host in ["0.0.0.0", "192.168.1.10", "10.0.0.1", "::", "example.com", "", " 127.0.0.1 "]:
            with self.subTest(bad_host=bad_host):
                with self.assertRaises(ConfigError) as ctx:
                    load_config({"DEVFORGE_HOST": bad_host, "DEVFORGE_DB_PATH": ":memory:"})
                self.assertIn("DEVFORGE_HOST", str(ctx.exception))

    def test_port_boundaries_and_invalid_values(self) -> None:
        self.assertEqual(load_config({"DEVFORGE_PORT": "1", "DEVFORGE_DB_PATH": ":memory:"}).port, 1)
        self.assertEqual(load_config({"DEVFORGE_PORT": "65535", "DEVFORGE_DB_PATH": ":memory:"}).port, 65535)

        for bad_port in ["0", "65536", "-1", "abc", "8000.5", "", " 8000"]:
            with self.subTest(bad_port=bad_port):
                with self.assertRaises(ConfigError) as ctx:
                    load_config({"DEVFORGE_PORT": bad_port, "DEVFORGE_DB_PATH": ":memory:"})
                self.assertIn("DEVFORGE_PORT", str(ctx.exception))

    def test_db_path_validation(self) -> None:
        with tempfile.TemporaryDirectory() as tmpdir:
            valid_file = os.path.join(tmpdir, "custom.sqlite3")
            cfg = load_config({"DEVFORGE_DB_PATH": valid_file})
            self.assertEqual(cfg.db_path, os.path.abspath(valid_file))
            self.assertFalse(cfg.ensure_db_parent)

            missing_parent = os.path.join(tmpdir, "missing_subdir", "db.sqlite3")
            with self.assertRaises(ConfigError) as ctx1:
                load_config({"DEVFORGE_DB_PATH": missing_parent})
            self.assertIn("DEVFORGE_DB_PATH", str(ctx1.exception))

            with self.assertRaises(ConfigError) as ctx2:
                load_config({"DEVFORGE_DB_PATH": tmpdir})
            self.assertIn("DEVFORGE_DB_PATH", str(ctx2.exception))

            with self.assertRaises(ConfigError) as ctx3:
                load_config({"DEVFORGE_DB_PATH": ""})
            self.assertIn("DEVFORGE_DB_PATH", str(ctx3.exception))

    def test_subprocess_refuses_invalid_env_with_nonzero_exit_and_stderr(self) -> None:
        cases = [
            ({"DEVFORGE_HOST": "0.0.0.0", "DEVFORGE_DB_PATH": ":memory:"}, "DEVFORGE_HOST"),
            ({"DEVFORGE_PORT": "70000", "DEVFORGE_DB_PATH": ":memory:"}, "DEVFORGE_PORT"),
            (
                {"DEVFORGE_DB_PATH": "/nonexistent_devforge_dir_99999/test.sqlite3"},
                "DEVFORGE_DB_PATH",
            ),
        ]
        for overrides, expected_var in cases:
            with self.subTest(expected_var=expected_var):
                env = os.environ.copy()
                env.update(overrides)
                proc = subprocess.run(
                    [sys.executable, "-m", "backend.app"],
                    cwd=REPO_ROOT,
                    env=env,
                    capture_output=True,
                    text=True,
                    timeout=5,
                )
                self.assertNotEqual(proc.returncode, 0)
                self.assertIn(expected_var, proc.stderr)


if __name__ == "__main__":
    unittest.main()
