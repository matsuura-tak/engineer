#!/usr/bin/env python3
"""fable が使えるか（上限にかかっていないか）を確かめ、結果をしばらくおぼえておく。

役割ファイルで model: fable の役は、fable が上限にかかっていると 429 のまま何時間も待ち続ける
（失敗も、別のモデルへの切り替えも起きない）。guard.py と session_start.py がこれを使い、
fable が使えると確かめられない間は、その役を model: "opus" で呼ばせる。

確かめ方：claude -p を fable で1回だけ動かし、stream-json の出力を読む。
- fable から返事が届き、エラーも上限の知らせもない → usable
- rate_limit_event の status が rejected、api_retry、エラー、時間切れ、claude がない → limited（opus を使う）
迷ったら limited に倒す。動かす場所はプロジェクトの外の空の一時フォルダで、フックは切る。
環境変数は今のセッションのものを使う（CLAUDE_CODE_ENTRYPOINT などで上限の判定が変わるため）。
親のセッションにつながる変数（セッション ID、リモート、メッセージ、記憶の同期など）だけを外し、
題名づけなどの別のリクエストも切る（CLAUDE_CODE_DISABLE_NONESSENTIAL_TRAFFIC）。
おぼえる時間は、usable が1分（その後に上限にかかると、役が何時間も待つため）、limited が10分。
結果のファイルは、アカウントと設定の場所ごとに分ける。

python3 fable_status.py --refresh   確かめて結果をおぼえ、usable か limited を出す
python3 fable_status.py --status    おぼえている結果だけを出す（usable、limited、古いかなければ unknown）
"""
import hashlib
import json
import os
import re
import shutil
import signal
import subprocess
import sys
import tempfile
import threading
import time

TTL = {"usable": 60, "limited": 600}  # 秒。これより古い結果は使わず、確かめ直す
TIMEOUT = 25  # 秒。答えがなければ止めて limited にする
PROBE_FLAG = "AI_ORG_FABLE_PROBE"  # 確かめている claude の中では、もう一度確かめない
LIMIT = "上限"  # 理由がこれで始まれば、本当に上限にかかっている（ほかは確かめられなかった）
STRIP_PREFIXES = ("CLAUDE_CODE_REMOTE", "CLAUDE_CODE_MESSAGING", "CLAUDE_CODE_SYNC_")
STRIP_NAMES = ("CLAUDE_CODE_SESSION_ID", "CLAUDE_CODE_DIAGNOSTICS_FILE", "CLAUDE_CODE_TEE_SDK_STDOUT",
               "CLAUDE_CODE_POST_FOR_SESSION_INGRESS_V2", "CLAUDE_CODE_WORKER_EPOCH", "CLAUDE_CODE_SSE_PORT",
               "CLAUDE_PID", "CLAUDE_ENV_FILE", "CLAUDE_MEMORY_STORES", "CLAUDE_COWORK_MEMORY_PATH_OVERRIDE",
               "CLAUDE_CODE_ENABLE_REMOTE_RECAP", "CLAUDE_CODE_ENABLE_PROMPT_SUGGESTION",
               "CLAUDE_SESSION_INGRESS_TOKEN_FILE", "SESSION_INGRESS_URL", "CLAUDE_CODE_CHILD_SESSION",
               "CLAUDE_CODE_PROJECTS_SESSION")
IDENTITY_VARS = ("CLAUDE_CODE_ACCOUNT_UUID", "CLAUDE_CODE_ORGANIZATION_UUID", "CLAUDE_CODE_ENTRYPOINT",
                 "ANTHROPIC_BASE_URL", "CLAUDE_CODE_USE_BEDROCK", "CLAUDE_CODE_USE_VERTEX",
                 "ANTHROPIC_API_KEY", "ANTHROPIC_AUTH_TOKEN", "CLAUDE_CODE_OAUTH_TOKEN")
HERE = os.path.dirname(os.path.abspath(__file__))


def fable_roles(agents_dir=None):
    """役割ファイルの frontmatter が model: fable の役の名前。"""
    agents_dir = agents_dir or os.path.join(HERE, "..", "agents")
    out = []
    try:
        names = sorted(os.listdir(agents_dir))
    except OSError:
        return out
    for name in (n for n in names if n.endswith(".md")):
        try:
            with open(os.path.join(agents_dir, name), encoding="utf-8") as f:
                head = f.read(4000)
        except (OSError, ValueError):
            continue
        m = re.match(r"---\r?\n(.*?)\r?\n---", head, re.S)
        if m and re.search(r"^model:\s*[\"']?fable[\"']?\s*$", m.group(1), re.M):
            out.append(name[:-3])
    return out


def identity():
    """アカウントと設定の場所。結果のファイルを分けるのに使う（ハッシュの先頭だけ）。"""
    conf = os.environ.get("CLAUDE_CONFIG_DIR") or ""
    parts = [conf] + [os.environ.get(k, "") for k in IDENTITY_VARS]
    if not os.environ.get("CLAUDE_CODE_ACCOUNT_UUID"):
        path = os.path.join(conf, ".claude.json") if conf else os.path.join(os.path.expanduser("~"), ".claude.json")
        try:
            with open(path, encoding="utf-8") as f:
                account = json.load(f).get("oauthAccount") or {}
            parts += [str(account.get("accountUuid")), str(account.get("organizationUuid"))]
        except Exception:
            parts.append("?")
    return hashlib.sha256("\n".join(parts).encode("utf-8", "replace")).hexdigest()[:12]


def cache_path():
    if os.environ.get("AI_ORG_FABLE_CACHE"):
        return os.environ["AI_ORG_FABLE_CACHE"]
    base = os.environ.get("XDG_CACHE_HOME") or os.path.join(os.path.expanduser("~"), ".cache")
    return os.path.join(base, "ai-org", "fable-" + identity() + ".json")


def cached(now=None):
    """古くない結果（{state, reason, checked_at}）。なければ None。"""
    try:
        with open(cache_path(), encoding="utf-8") as f:
            entry = json.load(f)
        age = (time.time() if now is None else now) - float(entry["checked_at"])
    except Exception:
        return None
    if entry.get("state") in TTL and -5 <= age < TTL[entry["state"]]:
        return entry
    return None


def status():
    entry = cached()
    return entry["state"] if entry else "unknown"


def write_cache(state, reason):
    entry = {"state": state, "reason": reason, "checked_at": time.time()}
    path = cache_path()
    try:
        os.makedirs(os.path.dirname(path) or ".", exist_ok=True)
        tmp = "%s.%d.tmp" % (path, os.getpid())
        with open(tmp, "w", encoding="utf-8") as f:
            json.dump(entry, f, ensure_ascii=False)
        os.replace(tmp, path)
    except Exception:
        pass  # おぼえられなくても、今回の結果は使う
    return entry


def judge(stream, alias="fable"):
    """claude の stream-json を1行ずつ読み、(状態, 理由) を返す。決まったらすぐ返す。"""
    seen = False
    for raw in stream:
        try:
            d = json.loads(raw.decode("utf-8", "replace") if isinstance(raw, bytes) else raw)
        except ValueError:
            continue
        if not isinstance(d, dict):
            continue
        kind, sub = d.get("type"), d.get("subtype")
        if kind == "rate_limit_event":
            info = d.get("rate_limit_info") if isinstance(d.get("rate_limit_info"), dict) else {}
            if info.get("status") == "rejected":
                return "limited", LIMIT + "（" + str(info.get("rateLimitType") or "?") + "）"
        elif kind == "system" and sub == "api_retry":
            if d.get("error_status") == 429 or d.get("error") == "rate_limit":
                return "limited", LIMIT + "（429 で再試行）"
            return "limited", "再試行（" + str(d.get("error_status") or d.get("error") or "?") + "）"
        elif kind == "assistant":
            if d.get("error"):
                head = LIMIT if d.get("error") == "rate_limit" else "エラー"
                return "limited", head + "（" + str(d.get("error")) + "）"
            msg = d.get("message") if isinstance(d.get("message"), dict) else {}
            seen = seen or alias in str(msg.get("model") or "")
        elif kind == "result":
            if d.get("is_error") or sub != "success":
                return "limited", "エラー（" + str(sub) + "）"
            return ("usable", "返事が届いた") if seen else ("limited", alias + " 以外のモデルが答えた")
    return "limited", "結果が出る前に終わった"


def probe_env():
    env = {k: v for k, v in os.environ.items() if k not in STRIP_NAMES and not k.startswith(STRIP_PREFIXES)}
    env[PROBE_FLAG] = "1"
    env["CLAUDE_CODE_DISABLE_NONESSENTIAL_TRAFFIC"] = "1"  # 題名づけなどの別のリクエストを出さない
    return env


def find_claude():
    """動いている Claude Code（CLAUDE_CODE_EXECPATH）を先に使う。PATH の claude は古い別物のことがある。"""
    for exe in (os.environ.get("CLAUDE_CODE_EXECPATH"), shutil.which("claude")):
        if exe and os.path.isfile(exe) and os.access(exe, os.X_OK):
            return exe
    return None


def probe(alias="fable", timeout=TIMEOUT):
    exe = find_claude()
    if not exe:
        return "limited", "claude が見つからない"
    cmd = [exe, "-p", "Reply with OK.", "--model", alias, "--output-format", "stream-json", "--verbose",
           "--max-turns", "1", "--tools", "", "--system-prompt", "Reply with OK.", "--no-session-persistence",
           "--strict-mcp-config", "--settings", '{"disableAllHooks": true}']
    work = proc = None
    result = []
    try:
        work = tempfile.mkdtemp(prefix="ai-org-fable-")
        proc = subprocess.Popen(cmd, cwd=work, env=probe_env(), stdin=subprocess.DEVNULL, stdout=subprocess.PIPE,
                                stderr=subprocess.DEVNULL, start_new_session=True)
        reader = threading.Thread(target=lambda: result.append(judge(proc.stdout, alias)))
        reader.daemon = True
        reader.start()
        reader.join(timeout)
        answered = list(result)  # 止めた後に読み終わった分は使わない
        return answered[0] if answered else ("limited", "%d 秒で答えがない" % timeout)
    except Exception as e:
        return "limited", "確かめられない（" + e.__class__.__name__ + "）"
    finally:  # 決まっても失敗しても、待ち続ける claude とその子を止め、一時フォルダを消す
        if proc is not None:
            try:
                os.killpg(proc.pid, signal.SIGKILL)
            except Exception:
                pass
            try:
                proc.wait(5)
                proc.stdout.close()
            except Exception:
                pass
        if work:
            shutil.rmtree(work, ignore_errors=True)


def refresh():
    entry = write_cache(*probe())
    return dict(entry, fresh=True)


def ensure(again=False):
    """古くない結果を返す（again なら確かめ直す）。どんな失敗も limited（opus を使う）にする。"""
    try:
        entry = None if again else cached()
        if entry:
            return entry
        if os.environ.get(PROBE_FLAG):
            return {"state": "limited", "reason": "確かめている途中", "checked_at": time.time(), "fresh": True}
        return refresh()
    except Exception as e:
        return {"state": "limited", "reason": "確かめられない（" + e.__class__.__name__ + "）",
                "checked_at": time.time(), "fresh": True}


def hit_limit(entry):
    """本当に上限にかかっているか（False なら、確かめられなかっただけ）。"""
    return str(entry.get("reason") or "").startswith(LIMIT)


def describe(entry):
    try:
        when = time.strftime("%H:%M", time.localtime(float(entry.get("checked_at") or 0)))
    except Exception:
        when = "?"
    return when + " に確認、" + str(entry.get("reason") or "")


def main(argv):
    if "--refresh" in argv:
        print(refresh()["state"])
    elif "--status" in argv:
        print(status())
    else:
        sys.stderr.write("使い方：fable_status.py --refresh | --status\n")
        return 2
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
