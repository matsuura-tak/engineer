"""受け入れテストの補助（001-personal-learning-loop）。

このファイルは verifier が持つ受け入れテストの設定です。実装のパッケージ（backend.*）は import しません。
サーバーは本物のプロセスとして起動し、本物の HTTP（urllib）で呼びます。

起動のしかた（根拠）:
- 起動コマンド: `python3 -m backend.app`、既定の接続先 `http://127.0.0.1:8000`（CLAUDE.md「ローカルサーバー起動（実装後）」）
  python3 の代わりに、このテストを動かしている同じインタプリタ（sys.executable）を使う。
- テスト用の DB: 環境変数 `DEVFORGE_DB_PATH`（CLAUDE.md「DB とトランザクション」、設計メモ 3章 Seam #1）
- テストごとの初期化: `POST /api/v1/test/reset`（contracts/openapi.yaml resetTestState）
- データの投入: `POST /api/v1/test/seed`（contracts/openapi.yaml seedTestState）
- 時刻の固定: ヘッダ `X-Test-Now`（contracts/openapi.yaml components.parameters.TestNowHeader）
- 外部 URL の取得: ヘッダ `X-Test-Url-Fetch-Mode`（contracts/openapi.yaml components.parameters.TestUrlFetchModeHeader）
- `APP_ENV=production` のときテスト用エンドポイントは 403 になる（設計メモ 7章 E）ため、子プロセスの環境から APP_ENV を外す。

既に起動しているサーバーに向けたいとき（任意）:
- 環境変数 `DEVFORGE_ACCEPTANCE_BASE_URL`（例 `http://127.0.0.1:8000`）を付けると、サーバーを起動せずにその接続先を使う。
  これは受け入れテストの側の設定で、アプリの設定ではない。

待ち方: sleep を使わない。起動待ちは「子プロセスが終了したか」を timeout 付きで待つ（proc.wait）ことで、
落ちたらすぐ気づき、生きていれば次の接続を試す。
"""

import atexit
import datetime
import json
import os
import shutil
import socket
import subprocess
import sys
import tempfile
import time
import unittest
import urllib.error
import urllib.request

# --- 接続先と起動 -------------------------------------------------------------

REPO_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", ".."))
DEFAULT_HOST = "127.0.0.1"
DEFAULT_PORT = 8000
SERVER_MODULE = "backend.app"
STARTUP_DEADLINE_SECONDS = 10.0  # 起動の待ちの上限（1か所の定数）。設計メモ 6章の起動目標は 500ms。
REQUEST_TIMEOUT_SECONDS = 10.0   # 1回の HTTP の待ちの上限（応答時間の合否は各テストで AC の値と比べる）

# --- AC の値（PRD 11章・contracts/openapi.yaml） --------------------------------

FIXED_NOW = "2026-10-30T09:00:00Z"
CATEGORIES = ("architecture", "backend", "data", "reliability", "security", "trend")
LABEL_JA = {
    "architecture": "設計・アーキテクチャ",
    "backend": "バックエンド・API",
    "data": "データ・DB",
    "reliability": "インフラ・信頼性",
    "security": "セキュリティ",
    "trend": "技術トレンド",
}
RUBRIC_PERSPECTIVES = ("premise_constraints", "tradeoff_comparison", "failure_edge_cases")
AC1_TITLE = "Redisキャッシュ設計"
AC1_MEMO = "キャッシュミス時のDB負荷急増（Cache Stampede）を防ぐにはロックやTTLジッターを使う"
AC2_SESSION_LABEL = "本日のセッション（全6問・目安3分）"
AC6_EMPTY_MESSAGE = "本日の復習はすべて完了しています。新しい記事URLや学びのメモを1件追加して3分ループを始めましょう"

LIMIT_LEARNING_MS = 3000   # AC-1, AC-8
LIMIT_READ_MS = 1000       # AC-2, AC-3, AC-4, AC-5, AC-7


class _ServerState:
    base_url = None
    process = None
    workdir = None
    log_path = None
    failure = None


_STATE = _ServerState()


def _port_is_open(host, port):
    try:
        with socket.create_connection((host, port), timeout=0.5):
            return True
    except OSError:
        return False


def _log_tail(max_chars=2000):
    if not _STATE.log_path or not os.path.exists(_STATE.log_path):
        return "(ログなし)"
    with open(_STATE.log_path, "r", encoding="utf-8", errors="replace") as f:
        text = f.read()
    return text[-max_chars:] if text else "(ログは空)"


def _stop_process():
    proc = _STATE.process
    if proc is not None and proc.poll() is None:
        proc.terminate()
        try:
            proc.wait(timeout=5)
        except subprocess.TimeoutExpired:
            proc.kill()
            proc.wait(timeout=5)
    _STATE.process = None


def _stop_server():
    _stop_process()
    if _STATE.workdir:
        shutil.rmtree(_STATE.workdir, ignore_errors=True)
        _STATE.workdir = None


def _start_server():
    """サーバーを起動する。_STATE.workdir があれば同じ DB ファイルを使う（再起動の確認のため）。"""
    host, port = DEFAULT_HOST, DEFAULT_PORT
    if _port_is_open(host, port):
        raise RuntimeError(
            "サーバーを起動する前から %s:%d が使われている。別のプロセスに向けてテストしないよう止めた。"
            "既存のサーバーを使うなら DEVFORGE_ACCEPTANCE_BASE_URL を付ける。" % (host, port)
        )
    if _STATE.workdir is None:
        _STATE.workdir = tempfile.mkdtemp(prefix="devforge-acceptance-")
        _STATE.log_path = os.path.join(_STATE.workdir, "server.log")
        atexit.register(_stop_server)
    env = dict(os.environ)
    env.pop("APP_ENV", None)
    env["DEVFORGE_DB_PATH"] = os.path.join(_STATE.workdir, "acceptance.sqlite3")
    env["PYTHONUNBUFFERED"] = "1"
    log_file = open(_STATE.log_path, "a", encoding="utf-8")
    try:
        _STATE.process = subprocess.Popen(
            [sys.executable, "-m", SERVER_MODULE],
            cwd=REPO_ROOT,
            env=env,
            stdout=log_file,
            stderr=subprocess.STDOUT,
        )
    finally:
        log_file.close()

    base_url = "http://%s:%d" % (host, port)
    deadline = time.monotonic() + STARTUP_DEADLINE_SECONDS
    while True:
        try:
            # 子プロセスが落ちたら即座に返る。生きていれば 0.05 秒で TimeoutExpired になり、次の接続を試す。
            code = _STATE.process.wait(timeout=0.05)
            raise RuntimeError(
                "サーバーが起動できない（`%s -m %s` が終了コード %d で終わった）。サーバーの出力:\n%s"
                % (os.path.basename(sys.executable), SERVER_MODULE, code, _log_tail())
            )
        except subprocess.TimeoutExpired:
            pass
        try:
            with urllib.request.urlopen(base_url + "/", timeout=1) as resp:
                resp.read()
            return base_url
        except urllib.error.HTTPError:
            return base_url  # HTTP で応答した＝起動した（GET / の中身は各 AC のテストで確かめる）
        except (urllib.error.URLError, OSError):
            pass
        if time.monotonic() > deadline:
            _stop_process()
            raise RuntimeError(
                "サーバーに接続できない（%s に %.0f 秒以内に応答がない）。サーバーの出力:\n%s"
                % (base_url, STARTUP_DEADLINE_SECONDS, _log_tail())
            )


def ensure_server():
    """サーバーの接続先を返す。起動できなかったときは、同じ理由で毎回失敗させる。"""
    if _STATE.base_url:
        return _STATE.base_url
    if _STATE.failure:
        raise RuntimeError(_STATE.failure)
    override = os.environ.get("DEVFORGE_ACCEPTANCE_BASE_URL")
    try:
        _STATE.base_url = override.rstrip("/") if override else _start_server()
    except RuntimeError as exc:
        _STATE.failure = str(exc)
        raise
    return _STATE.base_url


def restart_server():
    """同じ DB ファイルのままサーバーのプロセスを止めて起動し直す（保存が残るかの確認）。

    DEVFORGE_ACCEPTANCE_BASE_URL で外のサーバーに向けているときは再起動できないので、失敗させる（黙って飛ばさない）。
    """
    if os.environ.get("DEVFORGE_ACCEPTANCE_BASE_URL"):
        raise RuntimeError("DEVFORGE_ACCEPTANCE_BASE_URL を付けたときはサーバーを再起動できない。付けずに動かす。")
    ensure_server()
    _stop_process()
    _STATE.base_url = None
    try:
        _STATE.base_url = _start_server()
    except RuntimeError as exc:
        _STATE.failure = "再起動の後に " + str(exc)
        raise
    return _STATE.base_url


# --- HTTP ---------------------------------------------------------------------

class Response(object):
    def __init__(self, status, headers, body, elapsed_ms):
        self.status = status
        self.headers = headers
        self.body = body
        self.elapsed_ms = elapsed_ms

    @property
    def content_type(self):
        return (self.headers.get("Content-Type") or "").lower()

    @property
    def text(self):
        return self.body.decode("utf-8", errors="replace")

    def json(self):
        return json.loads(self.body.decode("utf-8"))

    def __repr__(self):
        return "<Response %s %s %.0fms %s>" % (self.status, self.content_type, self.elapsed_ms, self.text[:500])


def http(method, path, body=None, headers=None, raw_body=None):
    base_url = ensure_server()
    data = None
    req_headers = {"Accept": "application/json, application/problem+json, text/html"}
    if body is not None:
        data = json.dumps(body, ensure_ascii=False).encode("utf-8")
        req_headers["Content-Type"] = "application/json"
    elif raw_body is not None:
        data = raw_body
    if headers:
        req_headers.update(headers)
    req = urllib.request.Request(base_url + path, data=data, method=method, headers=req_headers)
    started = time.perf_counter()
    try:
        with urllib.request.urlopen(req, timeout=REQUEST_TIMEOUT_SECONDS) as resp:
            payload = resp.read()
            status, resp_headers = resp.status, resp.headers
    except urllib.error.HTTPError as err:
        payload = err.read()
        status, resp_headers = err.code, err.headers
    elapsed_ms = (time.perf_counter() - started) * 1000.0
    return Response(status, resp_headers, payload, elapsed_ms)


def now_header(now=FIXED_NOW, extra=None):
    h = {"X-Test-Now": now}
    if extra:
        h.update(extra)
    return h


def parse_dt(value):
    """ISO 8601（末尾 Z も可）を UTC の aware datetime にする。"""
    if not isinstance(value, str):
        raise AssertionError("日時が文字列ではない: %r" % (value,))
    v = value.strip()
    if v.endswith("Z") or v.endswith("z"):
        v = v[:-1] + "+00:00"
    dt = datetime.datetime.fromisoformat(v)
    if dt.tzinfo is None:
        raise AssertionError("日時にタイムゾーンがない: %r" % (value,))
    return dt.astimezone(datetime.timezone.utc)


def shift(iso, days=0, seconds=0):
    dt = parse_dt(iso) + datetime.timedelta(days=days, seconds=seconds)
    return dt.strftime("%Y-%m-%dT%H:%M:%SZ")


# --- テストの土台 -------------------------------------------------------------

class AcceptanceTestCase(unittest.TestCase):
    """全テストの土台。テストごとに DB を初期化し、ほかのテストのデータに頼らない。"""

    maxDiff = None

    def setUp(self):
        ensure_server()
        resp = http("POST", "/api/v1/test/reset")
        self.assertEqual(resp.status, 200, "test/reset が 200 でない: %r" % resp)
        self.assertEqual(resp.json().get("status"), "reset_ok", "test/reset の status: %r" % resp)

    # --- 操作 ---
    def seed(self, payload):
        body = {"reset_first": True}
        body.update(payload)
        resp = http("POST", "/api/v1/test/seed", body=body)
        self.assertEqual(resp.status, 200, "test/seed が 200 でない: %r" % resp)
        data = resp.json()
        self.assertEqual(data.get("status"), "seeded_ok", "test/seed の status: %r" % resp)
        self.assertEqual(data.get("seeded_challenges_count"), len(payload.get("challenges", [])), "seed の問題数: %r" % resp)
        self.assertEqual(data.get("seeded_review_cards_count"), len(payload.get("review_cards", [])), "seed のカード数: %r" % resp)
        return data

    def get_session(self, now=FIXED_NOW):
        resp = http("GET", "/api/v1/sessions/today", headers=now_header(now))
        self.assertEqual(resp.status, 200, "sessions/today: %r" % resp)
        return resp.json()

    def get_summary(self, now=FIXED_NOW):
        resp = http("GET", "/api/v1/skills/summary", headers=now_header(now))
        self.assertEqual(resp.status, 200, "skills/summary: %r" % resp)
        return resp.json()

    def category_map(self, summary):
        cats = summary.get("categories")
        self.assertIsInstance(cats, list, "categories が配列でない: %r" % (summary,))
        mapping = {c.get("category"): c for c in cats}
        self.assertEqual(len(cats), 6, "categories の件数: %r" % (cats,))
        self.assertEqual(set(mapping), set(CATEGORIES), "categories の領域: %r" % (sorted(mapping),))
        return mapping

    def get_html(self, query=""):
        resp = http("GET", "/" + query)
        self.assertEqual(resp.status, 200, "GET /%s: %r" % (query, resp))
        self.assertTrue(resp.content_type.startswith("text/html"), "GET / の Content-Type: %r" % resp.content_type)
        return resp.text

    # --- 確かめ ---
    def assertWithin(self, resp, limit_ms):
        self.assertLessEqual(
            resp.elapsed_ms, limit_ms, "応答時間 %.0fms が上限 %dms を超えた: %r" % (resp.elapsed_ms, limit_ms, resp)
        )

    def assertProblem(self, resp, status, code, field_name):
        self.assertEqual(resp.status, status, "ステータス: %r" % resp)
        self.assertTrue(
            resp.content_type.startswith("application/problem+json"),
            "エラーの Content-Type が application/problem+json でない: %r" % resp,
        )
        data = resp.json()
        self.assertEqual(data.get("status"), status, "problem の status: %r" % (data,))
        error = data.get("error")
        self.assertIsInstance(error, dict, "error オブジェクトがない: %r" % (data,))
        self.assertEqual(error.get("code"), code, "error.code: %r" % (data,))
        message = error.get("message")
        self.assertIsInstance(message, str, "error.message が文字列でない: %r" % (data,))
        self.assertIn(field_name, message, "error.message にフィールド名 %s がない: %r" % (field_name, data))
        return data

    def assertSameInstant(self, actual_iso, expected_iso, label):
        self.assertEqual(parse_dt(actual_iso), parse_dt(expected_iso), "%s: %r（期待 %s）" % (label, actual_iso, expected_iso))

    def assertTestIdInHtml(self, html, testid):
        needle_double = 'data-testid="%s"' % testid
        needle_single = "data-testid='%s'" % testid
        self.assertTrue(
            needle_double in html or needle_single in html,
            "GET / の HTML に %s がない" % needle_double,
        )

    def assertCreatedLearning(self, resp, memo, title=None, category=None):
        """AC-1 / AC-8 の 201 応答の中身（PRD AC-1 の Then、contracts の CreateLearningResponse）。"""
        self.assertEqual(resp.status, 201, "POST /api/v1/learnings: %r" % resp)
        data = resp.json()
        self.assertIsInstance(data.get("learning_id"), str, "learning_id: %r" % (data,))
        self.assertNotEqual(data["learning_id"], "", "learning_id が空")
        self.assertIn(data.get("category"), CATEGORIES, "category: %r" % (data,))
        if category is not None:
            self.assertEqual(data["category"], category, "指定した category と違う: %r" % (data,))
        self.assertEqual(data.get("earned_xp"), 15, "earned_xp: %r" % (data,))
        self.assertEqual(data.get("memo"), memo, "memo が入力と違う")
        if title is not None:
            self.assertEqual(data.get("title"), title, "title が入力と違う")
        challenge = data.get("challenge")
        self.assertIsInstance(challenge, dict, "challenge がない: %r" % (data,))
        self.assertIsInstance(challenge.get("question"), str, "challenge.question: %r" % (challenge,))
        self.assertGreater(len(challenge["question"].strip()), 0, "challenge.question が空")
        self.assertEqual(challenge.get("status"), "pending", "challenge.status: %r" % (challenge,))
        self.assertEqual(challenge.get("learning_id"), data["learning_id"], "challenge.learning_id")
        rubric = challenge.get("rubric_items")
        self.assertIsInstance(rubric, list, "rubric_items: %r" % (challenge,))
        self.assertEqual(len(rubric), 3, "rubric_items の件数: %r" % (rubric,))
        self.assertEqual(
            [(r.get("index"), r.get("perspective")) for r in sorted(rubric, key=lambda r: r.get("index", -1))],
            list(enumerate(RUBRIC_PERSPECTIVES)),
            "rubric_items の3観点: %r" % (rubric,),
        )
        card = data.get("review_card")
        self.assertIsInstance(card, dict, "review_card がない: %r" % (data,))
        self.assertEqual(card.get("interval_days"), 1, "review_card.interval_days: %r" % (card,))
        self.assertAlmostEqual(card.get("ease_factor"), 2.5, places=2, msg="review_card.ease_factor: %r" % (card,))
        self.assertEqual(card.get("repetition_count"), 0, "review_card.repetition_count: %r" % (card,))
        self.assertEqual(card.get("learning_id"), data["learning_id"], "review_card.learning_id")
        return data


def seed_card(card_id, next_review_at, category="data", repetition_count=1, interval_days=1, ease_factor=2.5, **extra):
    card = {
        "card_id": card_id,
        "category": category,
        "front_prompt": "【%s】の要点・トレードオフ・障害対策を自分の言葉で説明してください。" % card_id,
        "back_summary": "要点 %s" % card_id,
        "repetition_count": repetition_count,
        "interval_days": interval_days,
        "ease_factor": ease_factor,
        "next_review_at": next_review_at,
    }
    card.update(extra)
    return card


def seed_challenge(challenge_id, created_at, category="data", status="pending", **extra):
    ch = {
        "challenge_id": challenge_id,
        "category": category,
        "question": "【実践思考 %s】前提条件・トレードオフ・障害対策を説明してください。" % challenge_id,
        "status": status,
        "created_at": created_at,
    }
    ch.update(extra)
    return ch
