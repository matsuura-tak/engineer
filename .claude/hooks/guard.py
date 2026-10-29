#!/usr/bin/env python3
"""ai-org のパスガード（PreToolUse フック）。

役割ごとに書いてよい場所を決め、ほかへの書き込みを止める。
- Edit / Write / MultiEdit / NotebookEdit: 役割の範囲の外なら止める。迷ったら止める。
- Bash: リダイレクト、rm、mv、cp、sed -i などの書き先を見る（できる範囲の確認）。
  サブエージェントには、git の履歴を変える操作、gh で GitHub を変える操作、読み取れないコマンドも止める。
  python や node の中で書くファイルは見えない。
- Agent: subagent_type がない、isolation: worktree、汎用エージェントなら止める。役に model を渡すのも止める。
  ただし fable の役は、fable が使えると確かめられない間（fable_status.py）は model: "opus" を求める。
  役の名前は大文字小文字を区別しない（Claude Code がそう探すため）。
- SendMessage: 役に続きを頼むのを止める（新しく呼ばせ、上の確かめを通す）。
- Skill: 役の手引き（craft-<役>）を、その役以外が開くのを止める。手引きは役の起動時に読み込まれ、Skill ツールを通らない。
- PowerShell と、ファイルや GitHub を直接書き換える MCP のツールは、だれにも使わせない。

役割は入力の agent_type（役割ファイルの name）で決める。
agent_type も agent_id もなければメインセッションなので指揮役（orchestrator）とする。
止めるときは exit 2 で、理由を日本語で stderr に出す。
書ける場所は .claude/org/app.json の paths を使う。
macOS の Xcode CLT の python3（3.9）で動く書き方にしている。
"""
import fnmatch
import json
import os
import re
import shlex
import sys

ORCH = "orchestrator"
LABELS = {
    ORCH: "指揮役（メインセッション）",
    "pdm": "pdm（PdM）",
    "designer": "designer（デザイナー）",
    "design-reviewer": "design-reviewer（デザインレビュアー）",
    "tech-lead": "tech-lead（テックリード）",
    "ios-engineer": "ios-engineer（iOSエンジニア）",
    "backend-engineer": "backend-engineer（バックエンドエンジニア）",
    "verifier": "verifier（検証担当）",
    "reviewer": "reviewer（レビュアー）",
}
AGENT_ROLES = tuple(r for r in LABELS if r != ORCH)
GENERIC_AGENTS = ("general-purpose", "claude", "fork")  # settings.json の deny と同じ。大文字でも止める
EDIT_TOOLS = ("Edit", "Write", "MultiEdit", "NotebookEdit")
PROTECTED = (".claude/", ".github/", ".git/", ".mcp.json")
PROTECTED_PARTS = (".claude", ".github", ".git")
INSTRUCTION_NAMES = ("claude.md", "claude.local.md", "agents.md")
TECH_LEAD_ROOT_FILES = (".gitignore", "README.md", "Makefile", "Gemfile", "Gemfile.lock", ".tool-versions",
                        ".editorconfig", ".swiftlint.yml", ".swiftformat", "fastlane/")
SECRET_NAMES = (".env", ".env.*", "*.p8", "*.p12", "*.pem", "*.key",
                "*.mobileprovision", "*.provisionprofile", "*.keystore", "*.jks")
GLOB_CHARS = "*?["
MCP_WRITES = re.compile(r"(create_or_update_file|push_files|delete_file|write_file|edit_file|move_file|"
                        r"create_directory|merge|create_repository|fork_repository|update_pull_request_branch)")


def deny(msg):
    sys.stderr.buffer.write(("[ai-org ガード] " + msg + "\n").encode("utf-8"))
    sys.stderr.flush()
    sys.exit(2)


def label(role):
    return LABELS.get(role) or ("エージェント「" + role + "」" if role else "名前のないエージェント")


# ---------- 役割と書ける場所 ----------

def norm_entry(value):
    """app.json のパスを 'ios/' の形にそろえる。危ない値（空、'.'、'..'、絶対パス）は捨てる。"""
    if not isinstance(value, str) or not value.strip():
        return None
    v = value.strip().replace("\\", "/")
    if v.startswith("/"):
        return None
    v = os.path.normpath(v).replace("\\", "/")
    if v in (".", "") or v == ".." or v.startswith("../"):
        return None
    return v + "/"


def as_list(value):
    if isinstance(value, list):
        return value
    return [value] if isinstance(value, str) else []


def runner_configs(acc):
    """受け入れテストのフォルダより上にある conftest.py（受け入れテストの動きを変えられる）。"""
    out = []
    for a in acc:
        parts = a.rstrip("/").split("/")
        for i in range(len(parts)):
            out.append("/".join(parts[:i] + ["conftest.py"]))
    return out


def role_rules(app):
    """役割 -> (書ける場所, 書けない場所)。'/' で終わるものはディレクトリ、それ以外はファイル1つ。"""
    paths = app.get("paths") if isinstance(app.get("paths"), dict) else {}
    acc = [a for a in (norm_entry(x) for x in as_list(paths.get("acceptance_tests"))) if a]

    def d(key):
        return norm_entry(paths.get(key))

    rules = {
        ORCH: (["docs/progress.md", "docs/reviews/", "docs/approvals/"], []),
        "pdm": (["docs/prd/", "docs/support/", "metadata/"], []),
        "designer": ([d("design")], []),
        "design-reviewer": ([], []),
        "tech-lead": ([d("contracts"), "docs/adr/", "CLAUDE.md"] + list(TECH_LEAD_ROOT_FILES), []),
        "ios-engineer": ([d("ios")], acc),
        "backend-engineer": ([d("backend")], acc),
        "verifier": (acc + ["docs/verification/"], []),
        "reviewer": ([], []),
    }
    return {r: ([a for a in allow if a], excl) for r, (allow, excl) in rules.items()}, runner_configs(acc)


def detect_role(data):
    """agent_type があればそれが役割。agent_type も agent_id もなければメインセッション = 指揮役。"""
    t = data.get("agent_type")
    if t is None and not data.get("agent_id"):
        return ORCH
    if not isinstance(t, str) or not t:
        return ""
    return t + "（サブエージェント）" if t == ORCH else t


def load_app(root):
    with open(os.path.join(root, ".claude", "org", "app.json"), encoding="utf-8") as f:
        app = json.load(f)
    if not isinstance(app, dict):
        raise ValueError("app.json がオブジェクトではありません")
    return app


def project_root(data):
    root = os.environ.get("CLAUDE_PROJECT_DIR") or data.get("cwd")
    if not isinstance(root, str) or not root:
        return None
    return os.path.realpath(root)


# ---------- パスの判定 ----------

def is_under(path, base):
    return path == base or path.startswith(base.rstrip("/") + "/")


def locate(path, root, data, base_dir=None):
    """('in', 相対パス) / ('free', None) / ('out', None) を返す。"""
    path = os.path.expanduser(path)
    if not os.path.isabs(path):
        path = os.path.join(base_dir or root, path)
    real = os.path.realpath(path)
    rel = None
    if is_under(real, root):
        rel = os.path.relpath(real, root).replace("\\", "/")
    elif is_under(real.casefold(), root.casefold()):
        # macOS の大文字と小文字を区別しないディスクでは、/Users/x/App と /Users/x/app は同じ場所
        rel = real.casefold()[len(root.casefold()):].strip("/") or "."
    if rel is not None:
        parts = rel.split("/")
        # isolation: worktree の作業場所（.claude/worktrees/<名前>/）は、その下を本体と同じに扱う
        if len(parts) >= 4 and parts[0].casefold() == ".claude" and parts[1].casefold() == "worktrees":
            rel = "/".join(parts[3:])
        return "in", rel
    scratch = data.get("scratchpad_dir")
    if isinstance(scratch, str) and scratch and is_under(real, os.path.realpath(scratch)):
        return "free", None
    # プランモードの計画ファイル（既定は ~/.claude/plans/）は指揮役だけ書ける
    config = os.environ.get("CLAUDE_CONFIG_DIR") or os.path.expanduser("~/.claude")
    plans = os.path.realpath(os.path.join(config, "plans"))
    if detect_role(data) == ORCH and real.endswith(".md") and is_under(real, plans) and real != plans:
        return "free", None
    return "out", None


def glob_base(rel):
    idx = [rel.find(c) for c in GLOB_CHARS if c in rel]
    return rel[:min(idx)] if idx else rel


def overlaps(rel, entry, shell):
    """rel が entry の中か。Bash の rm -rf ios や ios/* のように entry を含む指定も重なりとみなす。"""
    p = entry.casefold().rstrip("/")
    if rel == p or rel.startswith(p + "/"):
        return True
    if not shell:
        return False
    if rel in (".", "") or p.startswith(rel + "/"):
        return True
    return any(c in rel for c in GLOB_CHARS) and p.startswith(glob_base(rel))


def inside(rel, entry):
    e = entry.casefold()
    return rel.startswith(e) if e.endswith("/") else rel == e


def is_secret(rel):
    name = rel.rsplit("/", 1)[-1]
    return any(fnmatch.fnmatchcase(name, pat) for pat in SECRET_NAMES)


def who_can_write(rel, rules):
    names = []
    for r, (allow, excl) in rules.items():
        if any(inside(rel, a) for a in allow) and not any(overlaps(rel, e, False) for e in excl):
            names.append(label(r))
    return names


def protected_reason(rel, shell):
    """どの役も書けない場所なら理由を返す。"""
    cf = rel.casefold()
    if shell and cf in (".", ""):
        return ("リポジトリ全体（.）をまとめて書き換える操作は、どの役もできません。"
                "書き換えるパスを1つずつ指定してください。")
    parts = cf.split("/")
    if any(overlaps(cf, p, shell) for p in PROTECTED) or any(p in PROTECTED_PARTS for p in parts):
        return (rel + " は組織の設定と履歴（.claude、.github、.git、.mcp.json。下のフォルダの中にあるものも）なので、"
                "どの役も書けません。変える必要があれば、理由を報告して Takuma に頼んでください。")
    if parts[-1] in INSTRUCTION_NAMES and cf != "claude.md":
        return (rel + " はエージェントへの指示として自動で読み込まれるファイルなので、どの役も書けません。"
                "書けるのはリポジトリ直下の CLAUDE.md（tech-lead）だけです。")
    if is_secret(cf):
        return rel + " は秘密情報のファイル（.env、鍵、証明書など）なので、どの役も書けません。"
    return None


def judge(role, rel, rules_and_configs, shell=False):
    """書いてよければ None、だめなら理由の文を返す。"""
    rules, configs = rules_and_configs
    reason = protected_reason(rel, shell)
    if reason:
        return reason
    cf = rel.casefold()
    if role not in rules:
        return (label(role) + "は組織の役ではないので、ファイルを書けません。"
                "書く作業は組織の役（pdm、ios-engineer など）に任せてください。")
    allow, excl = rules[role]
    for e in excl:
        if overlaps(cf, e, shell):
            return (label(role) + "は受け入れテスト（" + e + "）を書けません。書けるのは verifier（検証担当）だけです。"
                    "テストが仕様と合わないと思ったら、テストは変えずに報告に書いてください。")
    if any(cf == c.casefold() for c in configs):
        return (rel + " は受け入れテストのフォルダより上にある conftest.py で、受け入れテストの動きを変えられるので、"
                "どの役も書けません。単体テスト用の設定は、受け入れテストのフォルダの外（例：backend/tests/unit/）に置いてください。")
    base = glob_base(cf) if shell else cf
    if any(inside(base, a) for a in allow):
        return None
    owners = [n for n in who_can_write(cf, rules) if n != label(role)]
    msg = label(role) + "は " + rel + " を書けません。"
    msg += ("このパスを書けるのは " + "、".join(owners) + " です。") if owners else "このパスはどの役も書けません。"
    msg += (label(role) + "が書けるのは " + "、".join(allow) + " だけです。") if allow else (label(role) + "は読み取り専用です。")
    if not owners:
        return msg + "変える必要があれば、理由を報告して Takuma に頼んでください。"
    if role == ORCH:
        return msg + "その役のサブエージェントに任せてください。"
    return msg + "作業を止めて、このことを報告に書いてください。Bash などで回り道をしないでください。"


# ---------- Edit / Write ----------

def check_edit(data):
    tool_input = data.get("tool_input")
    if not isinstance(tool_input, dict):
        deny("tool_input を読めませんでした。安全のため止めます。")
    path = tool_input.get("notebook_path") if data.get("tool_name") == "NotebookEdit" else None
    path = path or tool_input.get("file_path")
    if not isinstance(path, str) or not path:
        deny("書き込み先のパスがわかりません。安全のため止めます。")
    root = project_root(data)
    if not root:
        deny("プロジェクトの場所（CLAUDE_PROJECT_DIR）がわかりません。安全のため止めます。")
    try:
        app = load_app(root)
    except Exception as e:
        deny(".claude/org/app.json を読めないので、書き込みを止めました（" + e.__class__.__name__ + "）。"
             "Takuma に /ai-org:setup のやり直しか、app.json の復元を頼んでください。")
    role = detect_role(data)
    kind, rel = locate(path, root, data)
    if kind == "free":
        return
    if kind == "out":
        deny(label(role) + "はプロジェクトの外（" + path + "）には書けません。"
             "一時ファイルはスクラッチパッドに置いてください。")
    reason = judge(role, rel, role_rules(app))
    if reason:
        deny(reason)


# ---------- Bash（できる範囲の確認） ----------

HEREDOC = re.compile(r"(?<!<)<<(?!<)-?\s*(['\"]?)([A-Za-z_][A-Za-z0-9_]*)\1")
WRAPPERS = ("sudo", "env", "command", "builtin", "exec", "nohup", "time", "nice",
            "then", "do", "else", "if", "while", "until", "!", "{")
WRITE_CMDS = ("rm", "rmdir", "unlink", "mv", "cp", "sed", "perl", "tee", "truncate", "shred",
              "touch", "ln", "dd", "install", "rsync")
GIT_VALUE_OPTS = ("-C", "-c", "--git-dir", "--work-tree", "--namespace", "--exec-path", "--config-env")
# サブエージェントに使わせない git のサブコマンド（履歴、ブランチ、リモートは指揮役だけが扱う）
AGENT_DENY_GIT = ("commit", "reset", "rebase", "merge", "cherry-pick", "revert", "stash", "switch", "push", "pull",
                  "clean", "update-index", "update-ref", "worktree", "apply", "am", "tag", "filter-branch",
                  "filter-repo", "replace", "notes", "gc", "prune", "reflog", "symbolic-ref", "read-tree",
                  "checkout-index", "submodule")
# サブエージェントが使ってよい gh（読むだけのもの）
GH_READ = {"pr": ("view", "diff", "checks", "list", "status"), "run": ("view", "list", "watch"),
           "issue": ("view", "list", "status"), "repo": ("view",), "release": ("view", "list"),
           "workflow": ("view", "list"), "auth": ("status",), "search": None, "status": None}


class Seen(object):
    """1つのコマンド列から見つけたもの。"""

    def __init__(self):
        self.targets = []   # (パス, cd の列, 種類)。種類は "write" か "restore"（HEAD に戻すだけ）
        self.agent_deny = []  # サブエージェントには止める理由


def strip_heredocs(text):
    out, pending = [], []
    for line in text.split("\n"):
        if pending:
            if line.strip() == pending[0]:
                pending.pop(0)
            continue
        out.append(line)
        pending.extend(m.group(2) for m in HEREDOC.finditer(line))
    return "\n".join(out)


def strip_comments(text):
    out, quote, i = [], None, 0
    while i < len(text):
        c = text[i]
        if quote:
            if c == "\\" and quote == '"' and i + 1 < len(text):
                out.append(text[i:i + 2])
                i += 2
                continue
            if c == quote:
                quote = None
        elif c == "\\" and i + 1 < len(text):
            out.append(text[i:i + 2])
            i += 2
            continue
        elif c in "'\"":
            quote = c
        elif c == "#" and (i == 0 or text[i - 1] in " \t\n;&|("):
            while i < len(text) and text[i] != "\n":
                i += 1
            continue
        out.append(c)
        i += 1
    return "".join(out)


def operands(args, value_opts=()):
    ops, i, done = [], 0, False
    while i < len(args):
        a = args[i]
        if not done and a == "--":
            done = True
        elif not done and a.startswith("-") and len(a) > 1:
            if a in value_opts:
                i += 1
        elif a:
            ops.append(a)
        i += 1
    return ops


def has_short_flag(args, flag):
    for a in args:
        if a == "--":
            break
        if a.startswith("-") and not a.startswith("--") and flag in a[1:]:
            return True
    return False


def option_values(args, shorts, longs):
    """-o X、-oX、--output X、--output=X の X を集める。"""
    out = []
    for i, a in enumerate(args):
        if a == "--":
            break
        if a in shorts or a in longs:
            if i + 1 < len(args):
                out.append(args[i + 1])
        elif any(a.startswith(l + "=") for l in longs):
            out.append(a.split("=", 1)[1])
        elif any(a.startswith(s) and len(a) > len(s) and not a.startswith("--") for s in shorts):
            out.append(a[2:])
    return out


def config_writes(rest):
    if any(a in ("--get", "--get-all", "--get-regexp", "--list", "-l") for a in rest):
        return False
    edits = ("--add", "--replace-all", "--rename-section", "--remove-section", "-e", "--edit")
    return any(a in edits or a.startswith("--unset") for a in rest) or len(operands(rest, ("--file", "-f"))) > 1


def git_targets(args, seen):
    """git のコマンド。書き先を返し、サブエージェントに使わせないものを記録する。"""
    cdir, i = None, 0
    while i < len(args) and args[i].startswith("-"):
        a = args[i]
        if a in GIT_VALUE_OPTS and i + 1 < len(args):
            if a == "-C":
                cdir = args[i + 1] if cdir is None else os.path.join(cdir, args[i + 1])
            i += 2
            continue
        i += 1
    if i >= len(args):
        return [], "write"
    sub, rest = args[i], args[i + 1:]

    def under(paths):
        return [os.path.join(cdir, p) if cdir and not os.path.isabs(p) else p for p in paths]

    msg = "git " + sub + " は、履歴、ブランチ、リモートを変えるので、指揮役（メインセッション）だけが行います。"
    if sub in AGENT_DENY_GIT:
        seen.agent_deny.append(msg)
    elif sub == "branch" and any(a in ("-d", "-D", "-m", "-M", "-c", "-C", "-f", "--delete", "--move",
                                       "--copy", "--force") for a in rest):
        seen.agent_deny.append(msg)
    elif sub == "config" and config_writes(rest):
        seen.agent_deny.append("git config で設定を変える操作は、指揮役だけが行います。")
    elif sub == "remote" and rest and rest[0] not in ("-v", "--verbose", "show", "get-url"):
        seen.agent_deny.append(msg)
    if sub in ("rm", "mv"):
        return under(operands(rest)), "write"
    if sub == "restore":
        src = option_values(rest, ("-s",), ("--source",))
        return under(operands(rest, ("-s", "--source"))), ("write" if src else "restore")
    if sub == "checkout":
        if "--" in rest:
            k = rest.index("--")
            before = operands(rest[:k])
            return under([a for a in rest[k + 1:] if a]), ("write" if before else "restore")
        seen.agent_deny.append("git checkout（-- のない形）はブランチを切り替えるか、別の版のファイルで上書きするので、"
                               "指揮役だけが行います。自分の範囲のファイルを戻すなら git restore <パス> を使います。")
        ops = operands(rest, ("-b", "-B", "--orphan"))
        return under(ops[1:]), "write"
    return [], "write"


def gh_check(args, seen):
    if not args:
        return
    sub, rest = args[0], args[1:]
    if sub == "api":
        methods = [m.upper() for m in option_values(rest, ("-X",), ("--method",))]
        body = any(a in ("-f", "-F", "--field", "--raw-field", "--input") or
                   a.startswith(("--field=", "--raw-field=", "--input=")) for a in rest)
        if any(m != "GET" for m in methods) or (body and not methods):
            seen.agent_deny.append("gh api で GitHub を変える操作は、指揮役だけが行います。")
        return
    allowed = GH_READ.get(sub, ())
    if allowed is None:
        return
    if not rest or rest[0] not in allowed:
        seen.agent_deny.append("gh " + " ".join(args[:2]) + " は GitHub を変える操作なので、指揮役だけが行います。"
                               "読むだけなら gh pr view、gh pr diff、gh run view などを使います。")


def find_targets(args):
    paths = []
    for a in args:
        if a.startswith("-") or a in ("(", "!"):
            break
        paths.append(a)
    writes = "-delete" in args
    for i, a in enumerate(args):
        if a in ("-exec", "-execdir", "-ok", "-okdir") and i + 1 < len(args):
            writes = writes or os.path.basename(args[i + 1]) in WRITE_CMDS
    return (paths or ["."]) if writes else []


def tar_targets(args):
    shorts = [a[1:] for a in args if a.startswith("-") and not a.startswith("--")]
    old_style = args[0] if args and not args[0].startswith("-") else ""
    longs = [a.split("=", 1)[0] for a in args if a.startswith("--")]
    extract = any("x" in s for s in shorts + [old_style]) or any(a in ("--extract", "--get") for a in longs)
    create = any(c in s for s in shorts + [old_style] for c in "cru") or \
        any(a in ("--create", "--append", "--update") for a in longs)
    out = []
    if extract:
        out += option_values(args, ("-C",), ("--directory",)) or ["."]
    if create:
        files = option_values(args, ("-f",), ("--file",))
        for i, a in enumerate(args):
            bundle = (a.startswith("-") and not a.startswith("--") and len(a) > 2 and a.endswith("f")) or \
                (i == 0 and a == old_style and "f" in a)
            if bundle and i + 1 < len(args):
                files.append(args[i + 1])
        out += files
    return out


def command_targets(words, depth, seen):
    """1つのコマンドが書き換えるパスと、cd の行き先を返す。"""
    while words and (re.match(r"^[A-Za-z_][A-Za-z0-9_]*=", words[0]) or words[0] in WRAPPERS):
        words = words[1:]
    if not words:
        return [], None
    cmd, args = os.path.basename(words[0]), words[1:]

    def w(paths, kind="write"):
        return [(p, kind) for p in paths]

    if cmd in ("cd", "pushd"):
        return [], (args[0] if args else "~")
    if cmd in ("bash", "sh", "zsh", "dash") and "-c" in args and depth < 3:
        i = args.index("-c")
        return (shell_targets(args[i + 1], depth + 1, seen) if i + 1 < len(args) else []), None
    if cmd == "eval" and depth < 3:
        return shell_targets(" ".join(args), depth + 1, seen), None
    if cmd == "git":
        paths, kind = git_targets(args, seen)
        return w(paths, kind), None
    if cmd == "gh":
        gh_check(args, seen)
        return [], None
    if cmd == "patch":
        seen.agent_deny.append("patch は書き先を確かめられないので、サブエージェントは使えません。Edit で直してください。")
        return [], None
    if cmd == "xargs" and any(os.path.basename(a) in WRITE_CMDS for a in args):
        seen.agent_deny.append("xargs で書き換えるコマンドは書き先を確かめられないので、サブエージェントは使えません。")
        return [], None
    if cmd in ("rm", "rmdir", "unlink", "touch", "tee", "shred", "mv"):
        return w(operands(args)), None
    if cmd == "truncate":
        return w(operands(args, ("-s", "-r", "--size", "--reference"))), None
    if cmd in ("cp", "ln", "install", "rsync"):
        for i, a in enumerate(args):
            if a in ("-t", "--target-directory") and i + 1 < len(args):
                return w([args[i + 1]]), None
            if a.startswith("--target-directory="):
                return w([a.split("=", 1)[1]]), None
        return w(operands(args)[-1:]), None
    if cmd == "sed" and (has_short_flag(args, "i") or any(a.startswith("--in-place") for a in args)):
        ops = operands(args, ("-e", "-f", "--expression", "--file", "-l"))
        script_given = any(a in ("-e", "-f") or a.startswith("--expression") or a.startswith("--file") for a in args)
        return w(ops if script_given else ops[1:]), None
    if cmd == "perl" and has_short_flag(args, "i"):
        return w(operands(args, ("-e", "-E", "-M", "-I"))), None
    if cmd in ("awk", "gawk") and "inplace" in option_values(args, ("-i",), ("--include",)):
        ops = operands(args, ("-f", "-v", "-F", "-i", "-E", "-l", "--include"))
        return w(ops if "-f" in args else ops[1:]), None
    if cmd == "dd":
        return w([a[3:] for a in args if a.startswith("of=")]), None
    if cmd == "curl":
        return w(option_values(args, ("-o",), ("--output",))), None
    if cmd == "wget":
        return w(option_values(args, ("-O", "-P"), ("--output-document", "--directory-prefix"))), None
    if cmd == "find":
        return w(find_targets(args)), None
    if cmd in ("tar", "bsdtar", "gtar"):
        return w(tar_targets(args)), None
    if cmd == "unzip":
        return w(option_values(args, ("-d",), ()) or ["."]), None
    return [], None


def shell_targets(command, depth, seen):
    """コマンド全体から (書き先, そのときの cd 先の列, 種類) を取り出す。"""
    text = strip_comments(strip_heredocs(command.replace("\\\n", " "))).replace("\n", " ; ")
    lex = shlex.shlex(text, posix=True, punctuation_chars=True)
    lex.whitespace_split = True
    lex.commenters = ""
    tokens = list(lex)
    found, seg, cds, i = [], [], [], 0

    def flush():
        paths, cd = command_targets(seg, depth, seen)
        for p in paths:  # bash -c の中から返った書き先は (パス, 中の cd, 種類) の組
            if len(p) == 3:
                found.append((p[0], tuple(cds) + p[1], p[2]))
            else:
                found.append((p[0], tuple(cds), p[1]))
        if cd is not None:
            cds.append(cd)
        del seg[:]

    while i < len(tokens):
        t = tokens[i]
        punct = t and all(c in "();<>|&" for c in t)
        if punct and ("(" in t or ")" in t):
            flush()
        elif punct and ">" in t:
            nxt = tokens[i + 1] if i + 1 < len(tokens) else ""
            if t[0] in ";|" or t.startswith("&&"):
                flush()
            if seg and seg[-1].isdigit() and len(seg[-1]) <= 2:
                seg.pop()
            fd_copy = t.endswith("&") and (nxt.isdigit() or nxt == "-")
            if nxt and not fd_copy and not all(c in "();<>|&" for c in nxt):
                found.append((nxt, tuple(cds), "write"))
            i += 1
        elif punct and "<" in t:
            i += 1
        elif punct:
            flush()
        else:
            seg.append(t)
        i += 1
    flush()
    return found


SAFE_VARS = ("HOME", "TMPDIR", "CLAUDE_PROJECT_DIR")


def expand(text, agent):
    """~ と環境変数を展開する。サブエージェントでは、値が変わらない変数（HOME など）だけを展開する。"""
    text = os.path.expanduser(text)
    if not agent:
        return os.path.expandvars(text)
    return re.sub(r"\$(\{)?(" + "|".join(SAFE_VARS) + r")(?(1)\}|(?![A-Za-z0-9_]))",
                  lambda m: os.environ.get(m.group(2), m.group(0)), text)


def resolve_dir(cwd, cds, agent=False):
    d = cwd
    for c in cds:
        c = expand(c, agent)
        if c == "-" or "$" in c or "`" in c:
            return None
        d = c if os.path.isabs(c) else os.path.join(d, c)
    return d


def check_bash(data):
    tool_input = data.get("tool_input")
    command = tool_input.get("command") if isinstance(tool_input, dict) else None
    root = project_root(data)
    if not isinstance(command, str) or not root:
        return
    role = detect_role(data)
    agent = role != ORCH
    seen = Seen()
    try:
        targets = shell_targets(command, 0, seen)
    except ValueError:
        if agent:
            deny("コマンドを読み取れないので止めました（引用符の数が合わない、$'...' を使っている、など）。"
                 "単純な形に分けて実行してください。")
        return  # 指揮役の読み取れないコマンドは通す（Bash の確認は補助）
    if agent and seen.agent_deny:
        deny(seen.agent_deny[0] + label(role) + "は作業を止めて、必要なことを報告に書いてください。")
    try:
        rules = role_rules(load_app(root))
    except Exception:
        return  # Bash の確認は補助なので、app.json がなければ通す（Edit / Write は止まる）
    cwd = data.get("cwd") if isinstance(data.get("cwd"), str) else root
    for raw, cds, kind in targets:
        target = expand(raw, agent)
        base = resolve_dir(cwd, cds, agent)
        if not target or "$" in target or "`" in target or base is None:
            if agent:
                deny("書き先（" + raw + "）か cd の行き先に $ や ` があり、どこに書くか確かめられないので止めました。"
                     "パスをそのまま書いて実行してください。")
            continue
        where, rel = locate(target, root, data, base)
        if where != "in":
            continue  # プロジェクトの外（/tmp など）への Bash の書き込みはここでは見ない
        if kind == "restore" and role == ORCH:
            reason = protected_reason(rel, True)  # HEAD に戻すだけなら、指揮役は範囲の外でもよい
        else:
            reason = judge(role, rel, rules, shell=True)
        if reason:
            deny("Bash で " + rel + " を書き換えようとしています。" + reason)


# ---------- Agent、MCP、PowerShell ----------

def fable_entry(fs, again=False):
    """fable_status の結果。読めない、確かめられないときは limited（opus を使う）。"""
    try:
        return fs.ensure(again)
    except Exception as e:
        return {"state": "limited", "reason": "確かめられない（" + e.__class__.__name__ + "）"}


def check_agent(data):
    tool_input = data.get("tool_input")
    if not isinstance(tool_input, dict):
        return
    kind = tool_input.get("subagent_type")
    if not kind:
        deny("subagent_type がありません。組織の役の名前（pdm、ios-engineer など）を subagent_type に入れて呼んでください。")
    if tool_input.get("isolation") == "worktree":
        deny("isolation: worktree は使いません。作業場所が .claude/worktrees/ の下になり、書き込みがすべて止まります。"
             "isolation を外して呼び直してください。")
    kind = str(kind).strip().lower()  # Claude Code は役を大文字小文字を区別せずに探す（PDM でも pdm が動く）
    if kind in GENERIC_AGENTS:
        deny(kind + " などの汎用エージェントには作業させません。組織の役の名前を subagent_type に入れて呼んでください。")
    if kind not in AGENT_ROLES:
        return
    raw = tool_input.get("model")
    model = str(raw).strip().lower() if raw not in (None, "") else ""
    try:
        sys.dont_write_bytecode = True
        import fable_status as fs  # 同じフォルダ
        fable = kind in fs.fable_roles()
    except Exception:
        fs, fable = None, True  # 分からなければ fable の役として扱い、opus なら通す
    if not fable:
        if model:
            deny(kind + " を呼ぶときに model を指定しないでください。指定すると役割ファイルで決めたモデル"
                 "（作り手と判定役で別のモデルにしている）が上書きされます。model を外して呼び直してください。")
        return
    entry = fable_entry(fs)
    if entry.get("state") == "usable" and model == "opus" and not entry.get("fresh"):
        entry = fable_entry(fs, again=True)  # opus を求められたら、古い「使える」を信じず確かめ直す
    when = "（" + (fs.describe(entry) if fs else str(entry.get("reason"))) + "）"
    if entry.get("state") == "usable":
        if model:
            deny(kind + " は fable で動く役で、いま fable は使えます" + when + "。"
                 "model を外して呼び直してください（役割ファイルの fable で動きます）。")
    elif model != "opus":
        if fs and fs.hit_limit(entry):
            why = "いま fable は上限にかかっています" + when + "。"
        else:
            why = "fable が使えるか確かめられませんでした" + when + "。安全のため、"
        deny(kind + " は fable で動く役ですが、" + why + 'model: "opus" を付けて呼び直してください'
             "（fable のままだと 429 で何時間も待ち続けることがあります。opus 以外は渡せません）。"
             "fable が使えるようになったら、ガードが model を外すように知らせます。")


def check_send_message(data):
    deny("SendMessage は使いません。役に続きを頼むときも、Agent ツールで役を新しく呼び、委任指示書を渡してください"
         "（1つのタスクに1体を新しく呼ぶ。続きを頼むと、役のモデルの確かめ（fable が上限なら opus）も通りません）。")


def check_skill(data):
    tool_input = data.get("tool_input")
    if not isinstance(tool_input, dict):
        return
    name = str(tool_input.get("skill") or "").strip().lstrip("/").rsplit(":", 1)[-1].lower()
    owner = name[len("craft-"):] if name.startswith("craft-") else ""
    if owner not in AGENT_ROLES or detect_role(data) == owner:
        return
    deny(name + " は " + label(owner) + " の手引きで、その役が起動したときに読み込まれます。"
         "ほかの役と指揮役は開きません。その役の仕事なら、Agent ツールで " + owner + " を呼んで任せてください。")


def check_mcp(data):
    tool = data.get("tool_name")
    name = tool.split("__")[-1].casefold()
    if MCP_WRITES.search(name):
        deny(tool + " はファイルや GitHub を直接書き換える MCP のツールなので、どの役も使えません。"
             "ファイルは Edit か Write で書き、コミットは指揮役が git で行い、マージは Takuma が行います。")


def main():
    try:
        data = json.loads(sys.stdin.buffer.read().decode("utf-8", "replace"))
        if not isinstance(data, dict):
            raise ValueError("not an object")
    except Exception:
        deny("フックの入力を読めませんでした。安全のため止めます。")
    tool = data.get("tool_name")
    try:
        if tool in EDIT_TOOLS:
            check_edit(data)
        elif tool == "Bash":
            try:
                check_bash(data)
            except SystemExit:
                raise
            except Exception:
                pass  # 読み取れないコマンドは通す（Bash の確認は補助）
        elif tool == "Agent":
            check_agent(data)
        elif tool == "SendMessage":
            check_send_message(data)
        elif tool == "Skill":
            check_skill(data)
        elif tool == "PowerShell":
            deny("PowerShell は書き先を確かめられないので、この組織では使いません。Bash を使ってください。")
        elif isinstance(tool, str) and tool.startswith("mcp__"):
            check_mcp(data)
    except SystemExit:
        raise
    except Exception as e:
        deny("ガードの中でエラーが起きたので、安全のため止めます（" + e.__class__.__name__ + ": " + str(e)[:200] + "）。")
    sys.exit(0)


if __name__ == "__main__":
    main()
