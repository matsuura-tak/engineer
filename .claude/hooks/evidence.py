#!/usr/bin/env python3
"""ai-org の証拠チェック（SubagentStop と、PreToolUse の SubagentHandback）。

組織の役が証拠のない報告で終わろうとしたら、1体につき1回だけ差し戻す。
- 全員：「## 証拠」か「## 実行したコマンドと結果」の見出しと、その下に1行以上の中身が要る。
- 判定役（design-reviewer、reviewer）：1行目が PASS か FAIL であること。
見出しの名前は .claude/agents/*.md の「報告の形」と合わせている。

ループしないように、SubagentStop では stop_hook_active が true なら必ず通す。
auto モードでは報告が SubagentHandback ツールで届くことがあるので、そちらは PreToolUse で見る。
SubagentHandback には stop_hook_active がないので、差し戻した agent_id を一時フォルダに記録し、2回目は通す。
このフックが壊れたときは止めずに通す（作業を止めすぎないため）。
"""
import json
import os
import re
import sys
import tempfile

ROLES = ("pdm", "designer", "design-reviewer", "tech-lead",
         "ios-engineer", "backend-engineer", "verifier", "reviewer")
JUDGES = ("design-reviewer", "reviewer")
EVIDENCE = re.compile(r"^\s{0,3}#{1,6}\s*(証拠|実行したコマンドと結果)\s*$")
HEADING = re.compile(r"^\s{0,3}#{1,6}\s")


def problems(role, text):
    lines = text.splitlines()
    found = []
    if role in JUDGES:
        first = next((ln.strip().strip("*#` ") for ln in lines if ln.strip()), "")
        if not re.match(r"^(PASS|FAIL)\s*$", first):
            found.append("1行目を PASS か FAIL の1語だけにしてください。")
    ok = False
    for i, ln in enumerate(lines):
        if EVIDENCE.match(ln):
            for nxt in lines[i + 1:]:
                if HEADING.match(nxt):
                    break
                if nxt.strip():
                    ok = True
                    break
        if ok:
            break
    if not ok:
        found.append("「## 実行したコマンドと結果」（作業したとき）か「## 証拠」（判定したとき）の見出しを付け、"
                     "その下に、実行したコマンドとその結果、見たファイルやスクリーンショットのパスを書いてください。"
                     "何も実行していなければ「なし」と、その理由を書いてください。")
    return found


def already_sent_back(data, role):
    """SubagentHandback で、この agent_id をもう差し戻したか。初めてなら記録して False を返す。"""
    key = str(data.get("agent_id") or (str(data.get("session_id") or "") + "-" + role))
    mark = os.path.join(tempfile.gettempdir(), "ai-org-evidence-" + re.sub(r"[^A-Za-z0-9_-]", "_", key)[:120])
    if os.path.exists(mark):
        return True
    with open(mark, "w") as f:
        f.write("1")
    return False


def block(role, found):
    msg = "[ai-org 証拠チェック] " + role + " の報告に足りないものがあります。報告を書き直してから終えてください。\n"
    msg += "\n".join("- " + f for f in found) + "\n"
    sys.stderr.buffer.write(msg.encode("utf-8"))
    sys.exit(2)


def main():
    try:
        data = json.loads(sys.stdin.buffer.read().decode("utf-8", "replace"))
        role = data.get("agent_type")
        if role not in ROLES:
            return
        event = data.get("hook_event_name")
        if event == "SubagentStop":
            if data.get("stop_hook_active"):
                return
            path = data.get("agent_transcript_path")
            if isinstance(path, str) and path:
                try:
                    with open(path, encoding="utf-8", errors="replace") as f:
                        if re.search(r'"name"\s*:\s*"SubagentHandback"', f.read()):
                            return  # 報告は SubagentHandback で確認済み
                except OSError:
                    pass
            text = data.get("last_assistant_message")
        elif event == "PreToolUse" and data.get("tool_name") == "SubagentHandback":
            tool_input = data.get("tool_input")
            text = tool_input.get("message") if isinstance(tool_input, dict) else None
        else:
            return
        if not isinstance(text, str) or not text.strip():
            return  # 報告の文が見えないときは判断しない
        found = problems(role, text)
        if found and event == "PreToolUse" and already_sent_back(data, role):
            return
    except Exception:
        return
    if found:
        block(role, found)


if __name__ == "__main__":
    main()
    sys.exit(0)
