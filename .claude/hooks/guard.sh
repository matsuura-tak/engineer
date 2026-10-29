#!/bin/sh
# guard.py を動かす入口。PreToolUse から呼ばれる。
# Claude Code は「exit 2」以外では止めないので、python3 が動かない、guard.py が落ちた、
# というときも exit 2 にして、止める側に倒す。
python3 "${0%/*}/guard.py"
rc=$?
if [ "$rc" -ne 0 ] && [ "$rc" -ne 2 ]; then
  echo "[ai-org ガード] ガードを動かせませんでした（終了コード $rc）。python3 が使えるか確かめてください。安全のため止めます。" >&2
fi
[ "$rc" -eq 0 ] || exit 2
