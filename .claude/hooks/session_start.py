#!/usr/bin/env python3
"""ai-org の SessionStart フック。

セッションの最初（再開、/clear、要約の後も）に、組織で動いていることと、
docs/progress.md の最後の記録を短く知らせる。出力はそのまま Claude の文脈に入る。
組織のファイルが lock.json と違う、または組織のフォルダにキットにないファイルがあれば、それも知らせる。
fable が使えるか（fable_status.py）も知らせる。古い結果しかなければ、ここで確かめる（長くて25秒）。
このフックは何があっても止めない（exit 0）。
"""
import hashlib
import json
import os
import sys

ROLES = ("pdm", "designer", "design-reviewer", "tech-lead",
         "ios-engineer", "backend-engineer", "verifier", "reviewer")
MAX_LINES = 10


def read_json(path):
    try:
        with open(path, encoding="utf-8") as f:
            value = json.load(f)
        return value if isinstance(value, dict) else None
    except Exception:
        return None


def last_records(root, count=3):
    """docs/progress.md の「## 記録」より下の箇条書きから、最後の count 行を返す。"""
    try:
        with open(os.path.join(root, "docs", "progress.md"), encoding="utf-8") as f:
            lines = f.read().splitlines()
    except Exception:
        return None
    start = next((i for i, ln in enumerate(lines) if ln.strip().startswith("## 記録")), -1)
    items = [ln.strip() for ln in lines[start + 1:] if ln.strip().startswith(("- ", "* ", "| "))]
    return items[-count:]


ORG_DIRS = (".claude/agents", ".claude/hooks", ".claude/rules", ".claude/skills", "docs/org", "docs/templates")


def drifted(root):
    """lock.json のハッシュと違う組織のファイルと、組織のフォルダにあるキットにないファイルを返す。"""
    lock = read_json(os.path.join(root, ".claude", "org", "lock.json"))
    files = lock.get("files") if lock else None
    if not isinstance(files, dict):
        return []
    changed = []
    for rel, digest in sorted(files.items()):
        try:
            with open(os.path.join(root, rel), "rb") as f:
                if hashlib.sha256(f.read()).hexdigest() != digest:
                    changed.append(rel)
        except Exception:
            changed.append(rel)
    for d in ORG_DIRS:
        for dirpath, dirnames, filenames in os.walk(os.path.join(root, d)):
            dirnames[:] = [n for n in dirnames if n != "__pycache__"]
            for name in filenames:
                rel = os.path.relpath(os.path.join(dirpath, name), root).replace(os.sep, "/")
                if rel not in files and name != ".DS_Store" and not name.endswith(".pyc"):
                    changed.append(rel)
    return changed


def fable_line():
    """fable の役を opus で呼ぶかどうかの1行。確かめられなくても止めない。"""
    try:
        sys.dont_write_bytecode = True
        import fable_status
        roles = fable_status.fable_roles()
        if not roles:
            return []
        entry = fable_status.ensure()
        names = "、".join(sorted(roles, key=lambda r: ROLES.index(r) if r in ROLES else len(ROLES)))
        when = "（" + fable_status.describe(entry) + "）"
        if entry.get("state") == "usable":
            return ["- fable は使えます" + when + "。" + names + " は model を付けずに呼びます。"
                    "状態が変わればガードが知らせます。"]
        head = "fable は上限にかかっています" if fable_status.hit_limit(entry) else "fable が使えるか確かめられませんでした"
        return ["- " + head + when + "。" + names + ' は model: "opus" を付けて呼びます。'
                "状態が変わればガードが知らせます。"]
    except Exception:
        return ["- fable が使えるか確かめられませんでした。fable の役は、ガードの指示どおりの model で呼びます。"]


def build(data):
    root = os.environ.get("CLAUDE_PROJECT_DIR") or data.get("cwd") or os.getcwd()
    app = read_json(os.path.join(root, ".claude", "org", "app.json"))
    ver = (app or {}).get("org_version") or "?"
    head = "[AI開発組織 v" + str(ver) + "]"
    agent = data.get("agent_type")
    if agent in ROLES:
        return [head + " このセッションは " + agent + " の役で動いています。"
                ".claude/agents/" + agent + ".md の範囲と報告の形に従ってください。"]
    name = (app or {}).get("app_name") or "アプリ名は未設定"
    out = [
        head + " このリポジトリ（" + str(name) + "）は AI だけの開発組織で動きます。人間は Takuma だけです。",
        "- メインセッションのあなたは指揮役です。PRD、デザイン、契約、コード、テストは書かず、役のサブエージェントに1体ずつ任せます。",
        "- 機能は Takuma が /feature で始めます（リリースは /release、振り返りは /retro）。頼まれたらそのコマンドを案内してください。",
        "- 決まりは .claude/rules/org.md、関門は docs/org/gates.md。書き込みは役ごとにフックが止めます。",
    ]
    out.extend(fable_line())
    if app is None:
        out.append("- 注意：.claude/org/app.json が読めないため、ファイルの書き込みはすべて止まります。Takuma に知らせてください。")
    changed = drifted(root)
    if changed:
        out.append("- 注意：組織のファイルが lock.json と違うか、キットにないファイルがあります（" + str(len(changed))
                   + " 件、例：" + changed[0] + "）。直さずに Takuma に知らせてください。")
    records = last_records(root)
    if records is None:
        out.append("- docs/progress.md がありません。")
    elif not records:
        out.append("- docs/progress.md にまだ記録はありません。")
    else:
        out.append("- いまの状態（docs/progress.md の最後の記録）：")
        room = MAX_LINES - len(out)
        if room > 0:
            out.extend("  " + r for r in records[-room:])
    return out[:MAX_LINES]


def main():
    try:
        raw = sys.stdin.buffer.read().decode("utf-8", "replace")
        data = json.loads(raw) if raw.strip() else {}
        if not isinstance(data, dict):
            data = {}
    except Exception:
        data = {}
    try:
        lines = build(data)
    except Exception:
        lines = ["[AI開発組織] このリポジトリは AI だけの開発組織で動きます。メインセッションは指揮役です。"
                 ".claude/rules/org.md と docs/progress.md を読んでください。"]
    sys.stdout.buffer.write(("\n".join(lines) + "\n").encode("utf-8"))


if __name__ == "__main__":
    main()
    sys.exit(0)
