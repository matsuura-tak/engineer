"""Single-page Web UI renderer for GET / (Vanilla HTML5/CSS3/JS, zero external dependencies)."""

import html
import json
from typing import Dict, Optional
import urllib.parse

UI_STRINGS: Dict[str, Dict[str, str]] = {
    "ja": {
        "page_title": "DevForge — 日次3分のエンジニア育成ループ",
        "brand_subtitle": "記事や実務の学びを、3秒で「設計思考問題」と「忘却曲線カード」へ鍛造する",
        "lang_toggle_label": "English に切り替え",
        "lang_toggle_text": "EN",
        "theme_toggle_label": "表示テーマを切り替え",
        "theme_toggle_text": "テーマ切替",
        "stat_overall_level": "総合レベル",
        "stat_total_xp": "累計 XP",
        "stat_streak": "連続学習日数",
        "stat_weekly_mastered": "直近7日の定着数",
        "unit_days": "日",
        "unit_items": "件",
        "empty_guide_text": "本日の復習はすべて完了しています。新しい記事URLや学びのメモを1件追加して3分ループを始めましょう",
        "empty_cta_btn": "新しい学びを追加する",
        "session_panel_title": "本日の3分学習セッション",
        "session_timer_prefix": "経過",
        "session_timer_unit": "秒",
        "session_remaining_prefix": "残り復習カード",
        "active_challenge_badge": "実践思考 1問",
        "answer_label": "あなたの設計・トレードオフ回答（10〜2,000文字）",
        "answer_placeholder": "前提条件・代替案とのトレードオフ・障害やエッジケース時の対策を自分の言葉で記述してください…",
        "rubric_heading": "プロの3視点 自己検証チェック（満たした観点を選択）",
        "submit_challenge_btn": "回答を記録して XP を獲得する",
        "model_points_heading": "模範観点の解説（回答完了）",
        "review_section_heading": "忘却曲線（SM-2）復習カード",
        "reveal_answer_btn": "要点・答えを確認する",
        "back_summary_heading": "学習メモの要点",
        "grade_prompt": "どのくらい自分の言葉で思い出せましたか？",
        "grade_1_btn": "1: 忘れた（1日後）",
        "grade_2_btn": "2: 曖昧（間隔×1.2）",
        "grade_3_btn": "3: 思い出せた（標準）",
        "grade_4_btn": "4: 即答できた（×1.3）",
        "form_section_title": "外部学習の取り込み（3秒変換）",
        "form_section_desc": "読んだ技術記事や業務の気づきを貼るだけで、+15 XP・実践思考1問・復習カードを自動生成します。",
        "title_label": "タイトル（任意・最大200文字）",
        "title_placeholder": "例：Redisキャッシュ設計とCache Stampede対策",
        "url_label": "公開記事 URL（任意・http/https）",
        "url_placeholder": "https://example.com/tech-article",
        "category_label": "スキル領域（未指定ならキーワードから自動判定）",
        "category_auto": "自動判定（おすすめ）",
        "cat_architecture": "設計・アーキテクチャ",
        "cat_backend": "バックエンド・API",
        "cat_data": "データ・DB",
        "cat_reliability": "インフラ・信頼性",
        "cat_security": "セキュリティ",
        "cat_trend": "技術トレンド",
        "cat_unknown": "その他",
        "memo_label": "学習メモ本文（必須・10〜2,000文字）",
        "memo_placeholder": "例：キャッシュミス時のDB負荷急増（Cache Stampede）を防ぐにはミューテックスロックやTTLジッターを使う",
        "char_count_suffix": " / 2,000 文字",
        "submit_learning_btn": "3秒で問題＆復習カードに変換する（+15 XP）",
        "submitting_btn": "変換中…",
        "offline_error_text": "通信に失敗しました。入力内容は保持されています",
        "retry_submit_btn": "再試行",
        "generated_result_heading": "変換完了：実践思考問題と復習カードを生成しました",
        "fetch_status_fetched": "URL取得成功",
        "fetch_status_not_provided": "メモ本文から生成",
        "fetch_status_fallback_used": "URL取得フォールバック（メモ本文から生成）",
        "fetch_status_unknown": "生成完了",
        "skills_section_title": "6領域スキルツリー＆成長サマリー",
        "xp_to_next_prefix": "次レベルまであと ",
        "xp_to_next_suffix": " XP",
        "err_validation_default": "入力内容を確認してください。",
        "err_invalid_url": "指定されたURLは許可されていません。公開されている http または https のURLを入力してください。",
        "err_not_found": "対象の問題または復習カードが見つかりません。画面を再読み込みしてください。",
        "err_test_disabled": "本番モードではテスト用エンドポイントは利用できません。",
        "err_already_completed": "この問題はすでに回答済みです。画面を再読み込みしてください。",
        "err_card_not_due": "このカードはまだ復習の期限が来ていません。画面を再読み込みしてください。",
        "err_idempotency_mismatch": "送信内容が前回と違います。画面を再読み込みしてからやり直してください。",
        "err_internal": "サーバーエラーが発生しました。時間をおいて再試行してください。",
    },
    "en": {
        "page_title": "DevForge — Daily 3-Minute Engineering Growth Loop",
        "brand_subtitle": "Forge articles and engineering notes into design trade-off challenges and spaced-repetition cards in 3s",
        "lang_toggle_label": "Switch to Japanese",
        "lang_toggle_text": "日本語",
        "theme_toggle_label": "Toggle color theme",
        "theme_toggle_text": "Theme",
        "stat_overall_level": "Overall Level",
        "stat_total_xp": "Total XP",
        "stat_streak": "Day Streak",
        "stat_weekly_mastered": "Mastered (7d)",
        "unit_days": "d",
        "unit_items": "",
        "empty_guide_text": "All reviews for today are complete. Add a new article URL or learning note to start your 3-minute loop.",
        "empty_cta_btn": "Add New Learning",
        "session_panel_title": "Today's 3-Minute Session",
        "session_timer_prefix": "Elapsed",
        "session_timer_unit": "s",
        "session_remaining_prefix": "Due cards remaining",
        "active_challenge_badge": "1 Design Challenge",
        "answer_label": "Your Architecture & Trade-off Answer (10–2,000 chars)",
        "answer_placeholder": "Explain (1) premises & constraints, (2) trade-offs vs alternatives, and (3) failure/edge-case mitigations…",
        "rubric_heading": "Self-Check Against 3 Pro Perspectives",
        "submit_challenge_btn": "Submit Answer & Claim XP",
        "model_points_heading": "Model Perspective Breakdown (Completed)",
        "review_section_heading": "Spaced-Repetition (SM-2) Review Cards",
        "reveal_answer_btn": "Reveal Key Summary",
        "back_summary_heading": "Key Summary",
        "grade_prompt": "How clearly could you recall and explain it in your own words?",
        "grade_1_btn": "1: Forgot (1d)",
        "grade_2_btn": "2: Hard (×1.2)",
        "grade_3_btn": "3: Good (SM-2)",
        "grade_4_btn": "4: Easy (×1.3)",
        "form_section_title": "Capture External Learning (3s Conversion)",
        "form_section_desc": "Paste an article URL or engineering memo to earn +15 XP, 1 thinking challenge, and 1 SM-2 review card.",
        "title_label": "Title (optional, max 200 chars)",
        "title_placeholder": "e.g., Redis Cache Stampede Mitigation",
        "url_label": "Public Article URL (optional, http/https)",
        "url_placeholder": "https://example.com/tech-article",
        "category_label": "Skill Category (auto-detected if omitted)",
        "category_auto": "Auto-detect (Recommended)",
        "cat_architecture": "Architecture & Design",
        "cat_backend": "Backend & API",
        "cat_data": "Data & Database",
        "cat_reliability": "Infrastructure & Reliability",
        "cat_security": "Security",
        "cat_trend": "Tech Trends",
        "cat_unknown": "Other",
        "memo_label": "Learning Memo (required, 10–2,000 chars)",
        "memo_placeholder": "e.g., Combine mutex locks or TTL jitter to prevent database overload on cache miss (Cache Stampede).",
        "char_count_suffix": " / 2,000 chars",
        "submit_learning_btn": "Convert to Challenge & Card (+15 XP)",
        "submitting_btn": "Converting…",
        "offline_error_text": "Connection failed. Your input has been preserved.",
        "retry_submit_btn": "Retry",
        "generated_result_heading": "Converted: Practical Challenge & Review Card Ready",
        "fetch_status_fetched": "URL Fetched",
        "fetch_status_not_provided": "Generated from Memo",
        "fetch_status_fallback_used": "Fallback Used (Generated from Memo)",
        "fetch_status_unknown": "Generated",
        "skills_section_title": "6-Domain Skill Tree & Growth Summary",
        "xp_to_next_prefix": "",
        "xp_to_next_suffix": " XP to next level",
        "err_validation_default": "Please check your input.",
        "err_invalid_url": "The specified URL is not allowed. Please enter a public http or https URL.",
        "err_not_found": "The target challenge or review card was not found. Please reload the page.",
        "err_test_disabled": "Test endpoints are disabled in production mode.",
        "err_already_completed": "This challenge has already been answered. Please reload the page.",
        "err_card_not_due": "This card is not due for review yet. Please reload the page.",
        "err_idempotency_mismatch": "The request differs from the previous one. Please reload the page and try again.",
        "err_internal": "A server error occurred. Please try again later.",
    },
}


def sanitize_api_base_url(raw_api_base_url: Optional[str]) -> str:
    """Allow only empty string or http/https URLs for api_base_url test seam."""
    if not raw_api_base_url:
        return ""
    candidate = raw_api_base_url.strip()
    if not candidate:
        return ""
    try:
        parsed = urllib.parse.urlsplit(candidate)
    except ValueError:
        return ""
    if parsed.scheme.lower() not in ("http", "https") or not parsed.netloc:
        return ""
    return candidate.rstrip("/")


def normalize_ui_category(category: Optional[str], lang: str = "ja") -> Dict[str, str]:
    """Decode SkillCategory safely, falling back to 'unknown' ('その他' / 'Other') for future enum values."""
    t = UI_STRINGS["en" if lang == "en" else "ja"]
    mapping = {
        "architecture": t["cat_architecture"],
        "backend": t["cat_backend"],
        "data": t["cat_data"],
        "reliability": t["cat_reliability"],
        "security": t["cat_security"],
        "trend": t["cat_trend"],
    }
    if category and category in mapping:
        return {"key": category, "label": mapping[category]}
    return {"key": "unknown", "label": t["cat_unknown"]}


def normalize_ui_fetch_status(status: Optional[str], lang: str = "ja") -> Dict[str, str]:
    """Decode UrlFetchStatus safely, falling back to 'unknown' for future enum values."""
    t = UI_STRINGS["en" if lang == "en" else "ja"]
    mapping = {
        "fetched": t["fetch_status_fetched"],
        "not_provided": t["fetch_status_not_provided"],
        "fallback_used": t["fetch_status_fallback_used"],
    }
    if status and status in mapping:
        return {"key": status, "label": mapping[status]}
    return {"key": "unknown", "label": t["fetch_status_unknown"]}


def resolve_problem_ui_message(problem: Optional[dict], lang: str = "ja") -> str:
    """Map ProblemDetails to user-facing copy; unknown error.code falls back safely to title/detail."""
    t = UI_STRINGS["en" if lang == "en" else "ja"]
    if not isinstance(problem, dict):
        return t["err_internal"]
    err_obj = problem.get("error") if isinstance(problem.get("error"), dict) else {}
    code = err_obj.get("code")
    msg = err_obj.get("message")

    if code == "VALIDATION_ERROR":
        return str(msg) if isinstance(msg, str) and msg else t["err_validation_default"]
    if code == "INVALID_URL_SCHEME_OR_HOST":
        return str(msg) if isinstance(msg, str) and msg and lang == "ja" else t["err_invalid_url"]
    if code == "RESOURCE_NOT_FOUND":
        return t["err_not_found"]
    if code == "TEST_SEAM_DISABLED":
        return t["err_test_disabled"]
    if code == "CHALLENGE_ALREADY_COMPLETED":
        return t["err_already_completed"]
    if code == "REVIEW_CARD_NOT_DUE":
        return t["err_card_not_due"]
    if code == "IDEMPOTENCY_KEY_MISMATCH":
        return t["err_idempotency_mismatch"]
    if code == "INTERNAL_ERROR":
        return t["err_internal"]

    # Unknown future error.code fallback
    title = problem.get("title")
    if isinstance(title, str) and title.strip():
        return title.strip()
    detail = problem.get("detail")
    if isinstance(detail, str) and detail.strip():
        return detail.strip()
    return t["err_internal"]


def render_web_ui_html(*, lang: Optional[str] = None, api_base_url: Optional[str] = None) -> str:
    """Render the complete single-page Web UI HTML with all 10 required static data-testid attributes."""
    resolved_lang = "en" if lang == "en" else "ja"
    t = UI_STRINGS[resolved_lang]
    safe_base_url = sanitize_api_base_url(api_base_url)

    escaped_lang = html.escape(resolved_lang, quote=True)
    escaped_base_url = html.escape(safe_base_url, quote=True)
    i18n_json_safe = (
        json.dumps(UI_STRINGS, ensure_ascii=False, separators=(",", ":"))
        .replace("<", "\\u003c")
        .replace(">", "\\u003e")
        .replace("&", "\\u0026")
    )

    e = lambda s: html.escape(s, quote=True)

    return f"""<!DOCTYPE html>
<html lang="{escaped_lang}">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>{e(t["page_title"])}</title>
  <style>
    :root {{
      --bg: #F8FAFC;
      --surface: #FFFFFF;
      --surface-muted: #F1F5F9;
      --border: #CBD5E1;
      --text: #0F172A;
      --text-secondary: #334155;
      --primary: #1D4ED8;
      --primary-hover: #1E40AF;
      --primary-contrast: #FFFFFF;
      --accent-xp-bg: #EEF2FF;
      --accent-xp-text: #312E81;
      --success-bg: #ECFDF5;
      --success-border: #059669;
      --success-text: #065F46;
      --danger-bg: #FEF2F2;
      --danger-border: #DC2626;
      --danger-text: #991B1B;
      --warning-bg: #FFFBEB;
      --warning-border: #D97706;
      --warning-text: #92400E;
      --focus-ring: #2563EB;
      --shadow: 0 4px 14px rgba(15, 23, 42, 0.06);
    }}
    @media (prefers-color-scheme: dark) {{
      :root:not([data-theme="light"]) {{
        --bg: #0B1120;
        --surface: #111827;
        --surface-muted: #1E293B;
        --border: #334155;
        --text: #F8FAFC;
        --text-secondary: #CBD5E1;
        --primary: #60A5FA;
        --primary-hover: #93C5FD;
        --primary-contrast: #0B1120;
        --accent-xp-bg: #1E1B4B;
        --accent-xp-text: #E0E7FF;
        --success-bg: #064E3B;
        --success-border: #34D399;
        --success-text: #ECFDF5;
        --danger-bg: #7F1D1D;
        --danger-border: #F87171;
        --danger-text: #FEF2F2;
        --warning-bg: #78350F;
        --warning-border: #FBBF24;
        --warning-text: #FEF3C7;
        --focus-ring: #93C5FD;
        --shadow: 0 6px 20px rgba(0, 0, 0, 0.35);
      }}
    }}
    :root[data-theme="dark"] {{
      --bg: #0B1120;
      --surface: #111827;
      --surface-muted: #1E293B;
      --border: #334155;
      --text: #F8FAFC;
      --text-secondary: #CBD5E1;
      --primary: #60A5FA;
      --primary-hover: #93C5FD;
      --primary-contrast: #0B1120;
      --accent-xp-bg: #1E1B4B;
      --accent-xp-text: #E0E7FF;
      --success-bg: #064E3B;
      --success-border: #34D399;
      --success-text: #ECFDF5;
      --danger-bg: #7F1D1D;
      --danger-border: #F87171;
      --danger-text: #FEF2F2;
      --warning-bg: #78350F;
      --warning-border: #FBBF24;
      --warning-text: #FEF3C7;
      --focus-ring: #93C5FD;
      --shadow: 0 6px 20px rgba(0, 0, 0, 0.35);
    }}
    *, *::before, *::after {{
      box-sizing: border-box;
    }}
    body {{
      margin: 0;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Hiragino Sans", "Noto Sans JP", sans-serif;
      background-color: var(--bg);
      color: var(--text);
      line-height: 1.6;
      overflow-wrap: anywhere;
    }}
    [hidden] {{
      display: none !important;
    }}
    :focus-visible {{
      outline: 3px solid var(--focus-ring);
      outline-offset: 2px;
    }}
    .container {{
      max-width: 72rem;
      margin: 0 auto;
      padding: 1.25rem 1rem 3rem;
    }}
    .topbar {{
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      justify-content: space-between;
      gap: 1rem;
      padding-bottom: 1rem;
      border-bottom: 1px solid var(--border);
      margin-bottom: 1.25rem;
    }}
    .brand-title {{
      margin: 0;
      font-size: 1.5rem;
      font-weight: 800;
      letter-spacing: -0.02em;
    }}
    .brand-sub {{
      margin: 0.25rem 0 0;
      font-size: 0.9375rem;
      color: var(--text-secondary);
    }}
    .topbar-actions {{
      display: flex;
      flex-wrap: wrap;
      gap: 0.5rem;
    }}
    button, input, select, textarea {{
      font: inherit;
      color: inherit;
    }}
    .btn {{
      display: inline-flex;
      align-items: center;
      justify-content: center;
      min-height: 44px;
      min-width: 44px;
      padding: 0.625rem 1.125rem;
      border-radius: 0.625rem;
      border: 1px solid transparent;
      font-weight: 700;
      cursor: pointer;
      transition: background-color 0.12s ease, border-color 0.12s ease;
      text-align: center;
    }}
    .btn-primary {{
      background-color: var(--primary);
      color: var(--primary-contrast);
    }}
    .btn-primary:hover:not(:disabled) {{
      background-color: var(--primary-hover);
    }}
    .btn-secondary {{
      background-color: var(--surface-muted);
      color: var(--text);
      border-color: var(--border);
    }}
    .btn-secondary:hover:not(:disabled) {{
      border-color: var(--primary);
    }}
    .btn-danger {{
      background-color: var(--danger-text);
      color: #FFFFFF;
    }}
    .btn:disabled {{
      opacity: 0.65;
      cursor: not-allowed;
    }}
    .stats-strip {{
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(min(100%, 11rem), 1fr));
      gap: 0.75rem;
      margin-bottom: 1.25rem;
    }}
    .stat-pill {{
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: 0.75rem;
      padding: 0.875rem 1rem;
      box-shadow: var(--shadow);
    }}
    .stat-label {{
      font-size: 0.8125rem;
      font-weight: 600;
      color: var(--text-secondary);
    }}
    .stat-value {{
      font-size: 1.375rem;
      font-weight: 800;
      margin-top: 0.125rem;
    }}
    .banner {{
      border-radius: 0.75rem;
      padding: 0.875rem 1rem;
      margin-bottom: 1rem;
      border: 2px solid;
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      justify-content: space-between;
      gap: 0.75rem;
      font-weight: 600;
    }}
    .banner-error {{
      background-color: var(--danger-bg);
      border-color: var(--danger-border);
      color: var(--danger-text);
    }}
    .banner-warning {{
      background-color: var(--warning-bg);
      border-color: var(--warning-border);
      color: var(--warning-text);
    }}
    .banner-success {{
      background-color: var(--success-bg);
      border-color: var(--success-border);
      color: var(--success-text);
    }}
    .panel {{
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: 1rem;
      padding: 1.25rem;
      margin-bottom: 1.25rem;
      box-shadow: var(--shadow);
    }}
    .panel-header {{
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      justify-content: space-between;
      gap: 0.75rem;
      margin-bottom: 1rem;
    }}
    .panel-title {{
      margin: 0;
      font-size: 1.25rem;
      font-weight: 800;
    }}
    .badge {{
      display: inline-flex;
      align-items: center;
      padding: 0.25rem 0.75rem;
      border-radius: 999px;
      font-size: 0.875rem;
      font-weight: 700;
      background-color: var(--accent-xp-bg);
      color: var(--accent-xp-text);
    }}
    .empty-guide {{
      text-align: left;
      background: var(--surface);
      border: 2px dashed var(--border);
      border-radius: 1rem;
      padding: 1.5rem;
      margin-bottom: 1.25rem;
    }}
    .empty-guide p {{
      margin: 0 0 1rem;
      font-size: 1.0625rem;
      font-weight: 600;
    }}
    .form-grid {{
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(min(100%, 16rem), 1fr));
      gap: 1rem;
      margin-bottom: 1rem;
    }}
    .field {{
      display: flex;
      flex-direction: column;
      gap: 0.375rem;
      margin-bottom: 1rem;
    }}
    .field label {{
      font-weight: 700;
      font-size: 0.9375rem;
    }}
    .input, .select, .textarea {{
      width: 100%;
      min-height: 44px;
      padding: 0.625rem 0.75rem;
      border-radius: 0.625rem;
      border: 1px solid var(--border);
      background-color: var(--bg);
      color: var(--text);
    }}
    .textarea {{
      min-height: 7rem;
      resize: vertical;
    }}
    .field-meta {{
      display: flex;
      justify-content: flex-end;
      font-size: 0.8125rem;
      color: var(--text-secondary);
    }}
    .subcard {{
      background-color: var(--surface-muted);
      border: 1px solid var(--border);
      border-radius: 0.75rem;
      padding: 1rem;
      margin-top: 0.875rem;
    }}
    .rubric-list {{
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
      margin: 0.75rem 0 1rem;
    }}
    .rubric-check {{
      display: flex;
      align-items: flex-start;
      gap: 0.625rem;
      min-height: 44px;
      padding: 0.5rem 0.75rem;
      border-radius: 0.625rem;
      background: var(--surface);
      border: 1px solid var(--border);
      cursor: pointer;
    }}
    .rubric-check input[type="checkbox"] {{
      min-width: 22px;
      min-height: 22px;
      margin-top: 0.2rem;
    }}
    .grade-grid {{
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(min(100%, 11rem), 1fr));
      gap: 0.625rem;
      margin-top: 0.75rem;
    }}
    .skills-grid {{
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(min(100%, 16rem), 1fr));
      gap: 0.875rem;
    }}
    .skill-card {{
      background-color: var(--surface-muted);
      border: 1px solid var(--border);
      border-radius: 0.75rem;
      padding: 1rem;
    }}
    .skill-card-head {{
      display: flex;
      justify-content: space-between;
      align-items: baseline;
      gap: 0.5rem;
      margin-bottom: 0.5rem;
    }}
    .skill-name {{
      font-weight: 800;
    }}
    .skill-level {{
      font-weight: 800;
      color: var(--primary);
    }}
    .progress-track {{
      width: 100%;
      height: 0.625rem;
      background-color: var(--surface);
      border-radius: 999px;
      overflow: hidden;
      border: 1px solid var(--border);
      margin-bottom: 0.5rem;
    }}
    .progress-fill {{
      height: 100%;
      background-color: var(--primary);
      border-radius: 999px;
      transition: width 0.2s ease;
    }}
    .skill-foot {{
      display: flex;
      justify-content: space-between;
      font-size: 0.8125rem;
      color: var(--text-secondary);
      font-weight: 600;
    }}
    .model-points {{
      margin: 0.5rem 0 0;
      padding-left: 1.25rem;
    }}
    .model-points li {{
      margin-bottom: 0.375rem;
    }}
  </style>
</head>
<body>
  <main class="container" data-testid="app-root" data-api-base-url="{escaped_base_url}" data-initial-lang="{escaped_lang}">
    <header class="topbar">
      <div>
        <h1 class="brand-title">DevForge</h1>
        <p class="brand-sub" id="brand-subtitle">{e(t["brand_subtitle"])}</p>
      </div>
      <div class="topbar-actions">
        <button type="button" class="btn btn-secondary" id="lang-toggle-btn" aria-label="{e(t["lang_toggle_label"])}">{e(t["lang_toggle_text"])}</button>
        <button type="button" class="btn btn-secondary" id="theme-toggle-btn" aria-label="{e(t["theme_toggle_label"])}">{e(t["theme_toggle_text"])}</button>
      </div>
    </header>

    <section class="stats-strip" aria-label="Growth Metrics">
      <div class="stat-pill">
        <div class="stat-label" id="stat-label-level">{e(t["stat_overall_level"])}</div>
        <div class="stat-value" id="stat-val-level">Lv.1</div>
      </div>
      <div class="stat-pill">
        <div class="stat-label" id="stat-label-xp">{e(t["stat_total_xp"])}</div>
        <div class="stat-value" id="stat-val-xp">0 XP</div>
      </div>
      <div class="stat-pill">
        <div class="stat-label" id="stat-label-streak">{e(t["stat_streak"])}</div>
        <div class="stat-value" id="stat-val-streak">0</div>
      </div>
      <div class="stat-pill">
        <div class="stat-label" id="stat-label-weekly">{e(t["stat_weekly_mastered"])}</div>
        <div class="stat-value" id="stat-val-weekly">0</div>
      </div>
    </section>

    <div class="banner banner-warning" data-testid="offline-error-banner" id="offline-error-banner" role="alert" hidden>
      <span id="offline-error-text">{e(t["offline_error_text"])}</span>
      <button type="button" class="btn btn-primary" data-testid="retry-submit-btn" id="retry-submit-btn" aria-label="{e(t["retry_submit_btn"])}">{e(t["retry_submit_btn"])}</button>
    </div>

    <div class="banner banner-error" data-testid="validation-error-banner" id="validation-error-banner" role="alert" hidden>
      <span id="validation-error-text"></span>
    </div>

    <section class="empty-guide" data-testid="empty-state-guide" id="empty-state-guide" hidden>
      <p id="empty-guide-text">{e(t["empty_guide_text"])}</p>
      <button type="button" class="btn btn-primary" data-testid="empty-state-cta-btn" id="empty-state-cta-btn" aria-label="{e(t["empty_cta_btn"])}">{e(t["empty_cta_btn"])}</button>
    </section>

    <section class="panel" data-testid="challenge-card" id="latest-generated-panel" hidden>
      <div class="panel-header">
        <h2 class="panel-title" id="generated-result-heading">{e(t["generated_result_heading"])}</h2>
        <div>
          <span class="badge" data-testid="xp-badge" id="xp-badge">+15 XP</span>
          <span class="badge" id="fetch-status-badge"></span>
        </div>
      </div>
      <p id="generated-question-preview" style="margin:0;font-weight:600;"></p>
    </section>

    <section class="panel" data-testid="today-session-panel" id="today-session-panel" hidden>
      <div class="panel-header">
        <h2 class="panel-title" data-testid="session-header" id="session-header">{e(t["session_panel_title"])}</h2>
        <span class="badge" id="session-timer-badge">0s</span>
      </div>

      <div class="subcard" id="active-challenge-box" hidden>
        <div class="panel-header">
          <span class="badge" id="active-challenge-cat-badge"></span>
          <span class="badge" id="active-challenge-xp-feedback" hidden></span>
        </div>
        <p id="active-challenge-question" style="font-weight:700;margin-top:0;"></p>

        <form data-testid="challenge-submit-form" id="challenge-submit-form" novalidate>
          <div class="field">
            <label for="challenge-answer-input" id="answer-label">{e(t["answer_label"])}</label>
            <textarea class="textarea" id="challenge-answer-input" name="answer" aria-label="{e(t["answer_label"])}" placeholder="{e(t["answer_placeholder"])}"></textarea>
          </div>
          <div>
            <strong id="rubric-heading">{e(t["rubric_heading"])}</strong>
            <div class="rubric-list" id="rubric-checklist"></div>
          </div>
          <button type="submit" class="btn btn-primary" id="submit-challenge-btn" aria-label="{e(t["submit_challenge_btn"])}">{e(t["submit_challenge_btn"])}</button>
        </form>

        <div id="model-points-box" hidden style="margin-top:1rem;">
          <strong id="model-points-heading">{e(t["model_points_heading"])}</strong>
          <ul class="model-points" data-testid="model-points-list" id="model-points-list"></ul>
        </div>
      </div>

      <div class="subcard" data-testid="review-card-panel" id="review-card-panel" hidden>
        <div class="panel-header">
          <strong id="review-section-heading">{e(t["review_section_heading"])}</strong>
          <span class="badge" id="review-remaining-badge"></span>
        </div>
        <p id="review-front-prompt" style="font-weight:700;font-size:1.0625rem;"></p>
        <button type="button" class="btn btn-secondary" id="reveal-answer-btn" aria-label="{e(t["reveal_answer_btn"])}">{e(t["reveal_answer_btn"])}</button>
        <div id="review-answer-area" hidden style="margin-top:1rem;">
          <div style="padding:0.75rem;border-radius:0.5rem;background:var(--surface);border:1px solid var(--border);">
            <div style="font-size:0.8125rem;font-weight:700;color:var(--text-secondary);" id="back-summary-heading">{e(t["back_summary_heading"])}</div>
            <p id="review-back-summary" style="margin:0.375rem 0 0;"></p>
          </div>
          <p id="grade-prompt" style="margin:0.875rem 0 0.25rem;font-weight:700;">{e(t["grade_prompt"])}</p>
          <div class="grade-grid">
            <button type="button" class="btn btn-secondary" data-testid="grade-btn-1" id="grade-btn-1" data-grade="1" aria-label="{e(t["grade_1_btn"])}">{e(t["grade_1_btn"])}</button>
            <button type="button" class="btn btn-secondary" data-testid="grade-btn-2" id="grade-btn-2" data-grade="2" aria-label="{e(t["grade_2_btn"])}">{e(t["grade_2_btn"])}</button>
            <button type="button" class="btn btn-primary" data-testid="grade-btn-3" id="grade-btn-3" data-grade="3" aria-label="{e(t["grade_3_btn"])}">{e(t["grade_3_btn"])}</button>
            <button type="button" class="btn btn-primary" data-testid="grade-btn-4" id="grade-btn-4" data-grade="4" aria-label="{e(t["grade_4_btn"])}">{e(t["grade_4_btn"])}</button>
          </div>
        </div>
      </div>
    </section>

    <section class="panel" id="capture-panel">
      <h2 class="panel-title" id="form-section-title">{e(t["form_section_title"])}</h2>
      <p id="form-section-desc" style="margin:0.25rem 0 1rem;color:var(--text-secondary);">{e(t["form_section_desc"])}</p>

      <form data-testid="learning-form" id="learning-form" novalidate>
        <div class="form-grid">
          <div class="field" style="margin-bottom:0;">
            <label for="title-input" id="title-label">{e(t["title_label"])}</label>
            <input type="text" class="input" data-testid="title-input" id="title-input" name="title" maxlength="200" aria-label="{e(t["title_label"])}" placeholder="{e(t["title_placeholder"])}">
          </div>
          <div class="field" style="margin-bottom:0;">
            <label for="url-input" id="url-label">{e(t["url_label"])}</label>
            <input type="url" class="input" data-testid="url-input" id="url-input" name="url" aria-label="{e(t["url_label"])}" placeholder="{e(t["url_placeholder"])}">
          </div>
          <div class="field" style="margin-bottom:0;">
            <label for="category-select" id="category-label">{e(t["category_label"])}</label>
            <select class="select" data-testid="category-select" id="category-select" name="category" aria-label="{e(t["category_label"])}">
              <option value="" id="opt-cat-auto">{e(t["category_auto"])}</option>
              <option value="architecture" id="opt-cat-architecture">{e(t["cat_architecture"])}</option>
              <option value="backend" id="opt-cat-backend">{e(t["cat_backend"])}</option>
              <option value="data" id="opt-cat-data">{e(t["cat_data"])}</option>
              <option value="reliability" id="opt-cat-reliability">{e(t["cat_reliability"])}</option>
              <option value="security" id="opt-cat-security">{e(t["cat_security"])}</option>
              <option value="trend" id="opt-cat-trend">{e(t["cat_trend"])}</option>
            </select>
          </div>
        </div>

        <div class="field">
          <label for="memo-input" id="memo-label">{e(t["memo_label"])}</label>
          <textarea class="textarea" data-testid="memo-input" id="memo-input" name="memo" required aria-label="{e(t["memo_label"])}" placeholder="{e(t["memo_placeholder"])}"></textarea>
          <div class="field-meta">
            <span id="memo-char-count">0{e(t["char_count_suffix"])}</span>
          </div>
        </div>

        <button type="submit" class="btn btn-primary" data-testid="submit-learning-btn" id="submit-learning-btn" aria-label="{e(t["submit_learning_btn"])}">{e(t["submit_learning_btn"])}</button>
      </form>
    </section>

    <section class="panel" data-testid="skills-summary-panel" id="skills-summary-panel">
      <div class="panel-header">
        <h2 class="panel-title" id="skills-section-title">{e(t["skills_section_title"])}</h2>
      </div>
      <div class="skills-grid" id="skills-grid"></div>
    </section>
  </main>

  <script id="devforge-i18n-data" type="application/json">{i18n_json_safe}</script>
  <script>
  (function () {{
    "use strict";
    var rootEl = document.querySelector('[data-testid="app-root"]');
    var apiBaseUrl = (rootEl && rootEl.getAttribute("data-api-base-url")) || "";
    var currentLang = (rootEl && rootEl.getAttribute("data-initial-lang")) === "en" ? "en" : "ja";
    var i18nEl = document.getElementById("devforge-i18n-data");
    var I18N = i18nEl ? JSON.parse(i18nEl.textContent) : {{}};

    var DRAFT_STORAGE_KEY = "devforge_draft_learning_v1";
    var pendingLearningIdemKey = null;
    var pendingLearningSignature = null;
    var sessionStartedAtMs = Date.now();
    var currentSessionData = null;
    var currentSummaryData = null;

    function tr(key) {{
      var dict = I18N[currentLang] || I18N.ja || {{}};
      return Object.prototype.hasOwnProperty.call(dict, key) ? dict[key] : key;
    }}

    function makeIdemKey(prefix) {{
      var rand = Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
      return prefix + "-" + rand;
    }}

    function safeSaveDraft(draft) {{
      try {{
        window.localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(draft));
      }} catch (_e) {{}}
    }}

    function safeLoadDraft() {{
      try {{
        var raw = window.localStorage.getItem(DRAFT_STORAGE_KEY);
        return raw ? JSON.parse(raw) : null;
      }} catch (_e) {{
        return null;
      }}
    }}

    function safeClearDraft() {{
      try {{
        window.localStorage.removeItem(DRAFT_STORAGE_KEY);
      }} catch (_e) {{}}
    }}

    function categoryLabel(cat) {{
      var map = {{
        architecture: tr("cat_architecture"),
        backend: tr("cat_backend"),
        data: tr("cat_data"),
        reliability: tr("cat_reliability"),
        security: tr("cat_security"),
        trend: tr("cat_trend")
      }};
      return Object.prototype.hasOwnProperty.call(map, cat) ? map[cat] : tr("cat_unknown");
    }}

    function fetchStatusLabel(st) {{
      var map = {{
        fetched: tr("fetch_status_fetched"),
        not_provided: tr("fetch_status_not_provided"),
        fallback_used: tr("fetch_status_fallback_used")
      }};
      return Object.prototype.hasOwnProperty.call(map, st) ? map[st] : tr("fetch_status_unknown");
    }}

    function formatProblemError(problem) {{
      if (!problem || typeof problem !== "object") {{
        return tr("err_internal");
      }}
      var err = problem.error && typeof problem.error === "object" ? problem.error : {{}};
      var code = err.code || "";
      var msg = err.message || "";
      if (code === "VALIDATION_ERROR") {{
        return msg || tr("err_validation_default");
      }}
      if (code === "INVALID_URL_SCHEME_OR_HOST") {{
        return currentLang === "ja" && msg ? msg : tr("err_invalid_url");
      }}
      if (code === "RESOURCE_NOT_FOUND") {{
        return tr("err_not_found");
      }}
      if (code === "TEST_SEAM_DISABLED") {{
        return tr("err_test_disabled");
      }}
      if (code === "CHALLENGE_ALREADY_COMPLETED") {{
        return tr("err_already_completed");
      }}
      if (code === "REVIEW_CARD_NOT_DUE") {{
        return tr("err_card_not_due");
      }}
      if (code === "IDEMPOTENCY_KEY_MISMATCH") {{
        return tr("err_idempotency_mismatch");
      }}
      if (code === "INTERNAL_ERROR") {{
        return tr("err_internal");
      }}
      if (typeof problem.title === "string" && problem.title.trim()) {{
        return problem.title.trim();
      }}
      return tr("err_internal");
    }}

    function showValidationError(message) {{
      var banner = document.getElementById("validation-error-banner");
      var textEl = document.getElementById("validation-error-text");
      if (textEl) textEl.textContent = message;
      if (banner) banner.hidden = false;
    }}

    function hideValidationError() {{
      var banner = document.getElementById("validation-error-banner");
      if (banner) banner.hidden = true;
    }}

    function showOfflineBanner() {{
      var banner = document.getElementById("offline-error-banner");
      var textEl = document.getElementById("offline-error-text");
      if (textEl) textEl.textContent = tr("offline_error_text");
      if (banner) banner.hidden = false;
    }}

    function hideOfflineBanner() {{
      var banner = document.getElementById("offline-error-banner");
      if (banner) banner.hidden = true;
    }}

    function apiUrl(path) {{
      return apiBaseUrl ? apiBaseUrl + path : path;
    }}

    function updateCharCounter() {{
      var memoEl = document.getElementById("memo-input");
      var countEl = document.getElementById("memo-char-count");
      if (memoEl && countEl) {{
        countEl.textContent = String(memoEl.value.length) + tr("char_count_suffix");
      }}
    }}

    function renderSkills(summary) {{
      currentSummaryData = summary;
      if (!summary) return;
      var lvEl = document.getElementById("stat-val-level");
      var xpEl = document.getElementById("stat-val-xp");
      var stEl = document.getElementById("stat-val-streak");
      var wkEl = document.getElementById("stat-val-weekly");
      if (lvEl) lvEl.textContent = "Lv." + String(summary.overall_level || 1);
      if (xpEl) xpEl.textContent = String(summary.total_xp || 0) + " XP";
      if (stEl) stEl.textContent = String(summary.streak_days || 0) + (tr("unit_days") ? " " + tr("unit_days") : "");
      if (wkEl) wkEl.textContent = String(summary.weekly_mastered_count || 0) + (tr("unit_items") ? " " + tr("unit_items") : "");

      var grid = document.getElementById("skills-grid");
      if (!grid) return;
      while (grid.firstChild) grid.removeChild(grid.firstChild);

      var cats = Array.isArray(summary.categories) ? summary.categories : [];
      for (var i = 0; i < cats.length; i++) {{
        var item = cats[i] || {{}};
        var rawCat = typeof item.category === "string" ? item.category : "unknown";
        var known = ["architecture", "backend", "data", "reliability", "security", "trend"].indexOf(rawCat) >= 0;
        var safeCatKey = known ? rawCat : "unknown";
        var displayName = currentLang === "en"
          ? (known ? (item.label_en || categoryLabel(rawCat)) : tr("cat_unknown"))
          : (known ? (item.label_ja || categoryLabel(rawCat)) : tr("cat_unknown"));

        var totalXp = Number(item.total_xp || 0);
        var level = Number(item.level || 1);
        var toNext = Number(item.xp_to_next_level || 100);
        var progressPct = Math.max(0, Math.min(100, 100 - toNext));

        var card = document.createElement("div");
        card.className = "skill-card";
        card.setAttribute("data-testid", "category-card-" + safeCatKey);

        var head = document.createElement("div");
        head.className = "skill-card-head";
        var nameSpan = document.createElement("span");
        nameSpan.className = "skill-name";
        nameSpan.textContent = displayName;
        var lvlSpan = document.createElement("span");
        lvlSpan.className = "skill-level";
        lvlSpan.textContent = "Lv." + String(level);
        head.appendChild(nameSpan);
        head.appendChild(lvlSpan);

        var track = document.createElement("div");
        track.className = "progress-track";
        var fill = document.createElement("div");
        fill.className = "progress-fill";
        fill.style.width = String(progressPct) + "%";
        track.appendChild(fill);

        var foot = document.createElement("div");
        foot.className = "skill-foot";
        var xpSpan = document.createElement("span");
        xpSpan.textContent = String(totalXp) + " XP";
        var remSpan = document.createElement("span");
        remSpan.textContent = tr("xp_to_next_prefix") + String(toNext) + tr("xp_to_next_suffix");
        foot.appendChild(xpSpan);
        foot.appendChild(remSpan);

        card.appendChild(head);
        card.appendChild(track);
        card.appendChild(foot);
        grid.appendChild(card);
      }}
    }}

    function renderSession(session) {{
      currentSessionData = session;
      var emptyGuide = document.getElementById("empty-state-guide");
      var sessionPanel = document.getElementById("today-session-panel");
      var chlBox = document.getElementById("active-challenge-box");
      var revPanel = document.getElementById("review-card-panel");

      if (!session || session.is_empty) {{
        if (emptyGuide) {{
          document.getElementById("empty-guide-text").textContent =
            currentLang === "ja" && session && session.session_label_ja
              ? session.session_label_ja
              : tr("empty_guide_text");
          emptyGuide.hidden = false;
        }}
        if (sessionPanel) sessionPanel.hidden = true;
        return;
      }}

      if (emptyGuide) emptyGuide.hidden = true;
      if (sessionPanel) sessionPanel.hidden = false;

      var headerEl = document.getElementById("session-header");
      if (headerEl) {{
        headerEl.textContent = currentLang === "ja" && session.session_label_ja
          ? session.session_label_ja
          : tr("session_panel_title") + " (" + String(session.total_session_items || 0) + ")";
      }}

      if (session.active_challenge) {{
        var chl = session.active_challenge;
        chlBox.hidden = false;
        chlBox.setAttribute("data-challenge-id", chl.challenge_id);
        document.getElementById("active-challenge-cat-badge").textContent = categoryLabel(chl.category);
        document.getElementById("active-challenge-question").textContent = chl.question;
        document.getElementById("model-points-box").hidden = true;
        document.getElementById("challenge-submit-form").hidden = false;

        var checklist = document.getElementById("rubric-checklist");
        while (checklist.firstChild) checklist.removeChild(checklist.firstChild);
        var rubrics = Array.isArray(chl.rubric_items) ? chl.rubric_items : [];
        for (var r = 0; r < rubrics.length; r++) {{
          var rb = rubrics[r];
          var lbl = document.createElement("label");
          lbl.className = "rubric-check";
          var cb = document.createElement("input");
          cb.type = "checkbox";
          cb.className = "rubric-checkbox-item";
          cb.setAttribute("aria-label", rb.label_ja || "Rubric");
          var txtWrap = document.createElement("span");
          var strong = document.createElement("strong");
          strong.textContent = (rb.label_ja || "") + ": ";
          var desc = document.createElement("span");
          desc.textContent = rb.description_ja || "";
          txtWrap.appendChild(strong);
          txtWrap.appendChild(desc);
          lbl.appendChild(cb);
          lbl.appendChild(txtWrap);
          checklist.appendChild(lbl);
        }}
      }} else {{
        chlBox.hidden = true;
      }}

      var reviews = Array.isArray(session.due_reviews) ? session.due_reviews : [];
      if (reviews.length > 0) {{
        var card = reviews[0];
        revPanel.hidden = false;
        revPanel.setAttribute("data-card-id", card.card_id);
        document.getElementById("review-remaining-badge").textContent =
          tr("session_remaining_prefix") + ": " + String(session.total_due_count || reviews.length);
        document.getElementById("review-front-prompt").textContent = card.front_prompt;
        document.getElementById("review-back-summary").textContent = card.back_summary;
        document.getElementById("review-answer-area").hidden = true;
        document.getElementById("reveal-answer-btn").hidden = false;
      }} else {{
        revPanel.hidden = true;
      }}
    }}

    function loadDashboard() {{
      Promise.all([
        fetch(apiUrl("/api/v1/sessions/today"), {{ headers: {{ "Accept": "application/json" }} }}),
        fetch(apiUrl("/api/v1/skills/summary"), {{ headers: {{ "Accept": "application/json" }} }})
      ]).then(function (results) {{
        return Promise.all([results[0].json(), results[1].json()]);
      }}).then(function (payloads) {{
        sessionStartedAtMs = Date.now();
        renderSession(payloads[0]);
        renderSkills(payloads[1]);
      }}).catch(function () {{
        // Keep form usable even if initial fetch fails (e.g., offline test seam)
      }});
    }}

    function submitLearningForm() {{
      hideValidationError();
      var titleEl = document.getElementById("title-input");
      var urlEl = document.getElementById("url-input");
      var catEl = document.getElementById("category-select");
      var memoEl = document.getElementById("memo-input");
      var btnEl = document.getElementById("submit-learning-btn");

      var payload = {{
        title: titleEl.value.trim() ? titleEl.value : null,
        url: urlEl.value.trim() ? urlEl.value.trim() : null,
        memo: memoEl.value,
        category: catEl.value ? catEl.value : null
      }};

      safeSaveDraft({{
        title: titleEl.value,
        url: urlEl.value,
        category: catEl.value,
        memo: memoEl.value
      }});

      var sig = JSON.stringify(payload);
      if (pendingLearningSignature !== sig || !pendingLearningIdemKey) {{
        pendingLearningSignature = sig;
        pendingLearningIdemKey = makeIdemKey("ui-lrn");
      }}

      btnEl.disabled = true;
      btnEl.textContent = tr("submitting_btn");

      fetch(apiUrl("/api/v1/learnings"), {{
        method: "POST",
        headers: {{
          "Content-Type": "application/json",
          "Accept": "application/json",
          "Idempotency-Key": pendingLearningIdemKey
        }},
        body: JSON.stringify(payload)
      }}).then(function (resp) {{
        return resp.json().then(function (data) {{
          return {{ status: resp.status, ok: resp.ok, data: data }};
        }});
      }}).then(function (res) {{
        btnEl.disabled = false;
        btnEl.textContent = tr("submit_learning_btn");
        if (!res.ok) {{
          pendingLearningIdemKey = null;
          hideOfflineBanner();
          showValidationError(formatProblemError(res.data));
          return;
        }}
        hideOfflineBanner();
        hideValidationError();
        safeClearDraft();
        pendingLearningIdemKey = null;
        pendingLearningSignature = null;

        titleEl.value = "";
        urlEl.value = "";
        memoEl.value = "";
        catEl.value = "";
        updateCharCounter();

        var genPanel = document.getElementById("latest-generated-panel");
        var xpBadge = document.getElementById("xp-badge");
        var fetchBadge = document.getElementById("fetch-status-badge");
        var qPreview = document.getElementById("generated-question-preview");
        if (xpBadge) xpBadge.textContent = "+" + String(res.data.earned_xp || 15) + " XP";
        if (fetchBadge) fetchBadge.textContent = fetchStatusLabel(res.data.url_fetch_status);
        if (qPreview && res.data.challenge) qPreview.textContent = res.data.challenge.question;
        if (genPanel) genPanel.hidden = false;

        loadDashboard();
      }}).catch(function () {{
        btnEl.disabled = false;
        btnEl.textContent = tr("submit_learning_btn");
        // Preserve all form input values and show offline retry banner (AC-8)
        showOfflineBanner();
      }});
    }}

    function applyStaticTranslations() {{
      document.documentElement.lang = currentLang;
      document.title = tr("page_title");
      var idMap = {{
        "brand-subtitle": "brand_subtitle",
        "stat-label-level": "stat_overall_level",
        "stat-label-xp": "stat_total_xp",
        "stat-label-streak": "stat_streak",
        "stat-label-weekly": "stat_weekly_mastered",
        "offline-error-text": "offline_error_text",
        "retry-submit-btn": "retry_submit_btn",
        "empty-guide-text": "empty_guide_text",
        "empty-state-cta-btn": "empty_cta_btn",
        "generated-result-heading": "generated_result_heading",
        "answer-label": "answer_label",
        "rubric-heading": "rubric_heading",
        "submit-challenge-btn": "submit_challenge_btn",
        "model-points-heading": "model_points_heading",
        "review-section-heading": "review_section_heading",
        "reveal-answer-btn": "reveal_answer_btn",
        "back-summary-heading": "back_summary_heading",
        "grade-prompt": "grade_prompt",
        "grade-btn-1": "grade_1_btn",
        "grade-btn-2": "grade_2_btn",
        "grade-btn-3": "grade_3_btn",
        "grade-btn-4": "grade_4_btn",
        "form-section-title": "form_section_title",
        "form-section-desc": "form_section_desc",
        "title-label": "title_label",
        "url-label": "url_label",
        "category-label": "category_label",
        "opt-cat-auto": "category_auto",
        "opt-cat-architecture": "cat_architecture",
        "opt-cat-backend": "cat_backend",
        "opt-cat-data": "cat_data",
        "opt-cat-reliability": "cat_reliability",
        "opt-cat-security": "cat_security",
        "opt-cat-trend": "cat_trend",
        "memo-label": "memo_label",
        "submit-learning-btn": "submit_learning_btn",
        "skills-section-title": "skills_section_title"
      }};
      for (var id in idMap) {{
        var el = document.getElementById(id);
        if (el) el.textContent = tr(idMap[id]);
      }}
      var langBtn = document.getElementById("lang-toggle-btn");
      if (langBtn) {{
        langBtn.textContent = tr("lang_toggle_text");
        langBtn.setAttribute("aria-label", tr("lang_toggle_label"));
      }}
      var themeBtn = document.getElementById("theme-toggle-btn");
      if (themeBtn) {{
        themeBtn.textContent = tr("theme_toggle_text");
        themeBtn.setAttribute("aria-label", tr("theme_toggle_label"));
      }}
      document.getElementById("title-input").placeholder = tr("title_placeholder");
      document.getElementById("url-input").placeholder = tr("url_placeholder");
      document.getElementById("memo-input").placeholder = tr("memo_placeholder");
      document.getElementById("challenge-answer-input").placeholder = tr("answer_placeholder");
      updateCharCounter();
      if (currentSessionData) renderSession(currentSessionData);
      if (currentSummaryData) renderSkills(currentSummaryData);
    }}

    // Event bindings
    document.getElementById("learning-form").addEventListener("submit", function (ev) {{
      ev.preventDefault();
      submitLearningForm();
    }});

    document.getElementById("retry-submit-btn").addEventListener("click", function () {{
      submitLearningForm();
    }});

    document.getElementById("empty-state-cta-btn").addEventListener("click", function () {{
      var memoInput = document.getElementById("memo-input");
      if (memoInput) {{
        memoInput.scrollIntoView({{ behavior: "smooth", block: "center" }});
        memoInput.focus();
      }}
    }});

    document.getElementById("memo-input").addEventListener("input", function () {{
      updateCharCounter();
    }});

    document.getElementById("reveal-answer-btn").addEventListener("click", function () {{
      document.getElementById("review-answer-area").hidden = false;
      document.getElementById("reveal-answer-btn").hidden = true;
    }});

    var gradeButtons = [1, 2, 3, 4];
    gradeButtons.forEach(function (g) {{
      var gBtn = document.getElementById("grade-btn-" + String(g));
      if (!gBtn) return;
      gBtn.addEventListener("click", function () {{
        hideValidationError();
        var panel = document.getElementById("review-card-panel");
        var cardId = panel.getAttribute("data-card-id");
        if (!cardId) return;
        var elapsedSec = Math.max(1, Math.round((Date.now() - sessionStartedAtMs) / 1000));
        fetch(apiUrl("/api/v1/reviews/" + encodeURIComponent(cardId) + "/grade"), {{
          method: "POST",
          headers: {{
            "Content-Type": "application/json",
            "Accept": "application/json",
            "Idempotency-Key": makeIdemKey("ui-grd")
          }},
          body: JSON.stringify({{ grade: g, elapsed_seconds: elapsedSec }})
        }}).then(function (resp) {{
          return resp.json().then(function (d) {{ return {{ ok: resp.ok, data: d }}; }});
        }}).then(function (res) {{
          if (!res.ok) {{
            showValidationError(formatProblemError(res.data));
            return;
          }}
          loadDashboard();
        }}).catch(function () {{
          showOfflineBanner();
        }});
      }});
    }});

    document.getElementById("challenge-submit-form").addEventListener("submit", function (ev) {{
      ev.preventDefault();
      hideValidationError();
      var box = document.getElementById("active-challenge-box");
      var chlId = box.getAttribute("data-challenge-id");
      if (!chlId) return;
      var answerText = document.getElementById("challenge-answer-input").value;
      var checks = document.querySelectorAll(".rubric-checkbox-item:checked");
      var matchedCount = Math.min(3, checks.length);
      var elapsedSec = Math.max(1, Math.round((Date.now() - sessionStartedAtMs) / 1000));

      fetch(apiUrl("/api/v1/challenges/" + encodeURIComponent(chlId) + "/submit"), {{
        method: "POST",
        headers: {{
          "Content-Type": "application/json",
          "Accept": "application/json",
          "Idempotency-Key": makeIdemKey("ui-chl")
        }},
        body: JSON.stringify({{
          answer: answerText,
          matched_rubric_count: matchedCount,
          elapsed_seconds: elapsedSec
        }})
      }}).then(function (resp) {{
        return resp.json().then(function (d) {{ return {{ ok: resp.ok, data: d }}; }});
      }}).then(function (res) {{
        if (!res.ok) {{
          showValidationError(formatProblemError(res.data));
          return;
        }}
        document.getElementById("challenge-answer-input").value = "";
        document.getElementById("challenge-submit-form").hidden = true;
        var xpFb = document.getElementById("active-challenge-xp-feedback");
        xpFb.textContent = "+" + String(res.data.earned_xp || 20) + " XP";
        xpFb.hidden = false;

        var mpList = document.getElementById("model-points-list");
        while (mpList.firstChild) mpList.removeChild(mpList.firstChild);
        var pts = Array.isArray(res.data.model_points) ? res.data.model_points : [];
        for (var p = 0; p < pts.length; p++) {{
          var li = document.createElement("li");
          li.textContent = String(pts[p]);
          mpList.appendChild(li);
        }}
        document.getElementById("model-points-box").hidden = false;
        fetch(apiUrl("/api/v1/skills/summary"), {{ headers: {{ "Accept": "application/json" }} }})
          .then(function (r) {{ return r.json(); }})
          .then(function (s) {{ renderSkills(s); }})
          .catch(function () {{}});
      }}).catch(function () {{
        showOfflineBanner();
      }});
    }});

    document.getElementById("lang-toggle-btn").addEventListener("click", function () {{
      currentLang = currentLang === "ja" ? "en" : "ja";
      applyStaticTranslations();
    }});

    document.getElementById("theme-toggle-btn").addEventListener("click", function () {{
      var cur = document.documentElement.getAttribute("data-theme");
      var next = cur === "dark" ? "light" : "dark";
      document.documentElement.setAttribute("data-theme", next);
    }});

    // Restore unsent draft if present
    var savedDraft = safeLoadDraft();
    if (savedDraft && typeof savedDraft === "object") {{
      if (typeof savedDraft.title === "string") document.getElementById("title-input").value = savedDraft.title;
      if (typeof savedDraft.url === "string") document.getElementById("url-input").value = savedDraft.url;
      if (typeof savedDraft.category === "string") document.getElementById("category-select").value = savedDraft.category;
      if (typeof savedDraft.memo === "string") document.getElementById("memo-input").value = savedDraft.memo;
      updateCharCounter();
    }}

    // Passive visible-only timer display (zero network polling)
    function tickTimerDisplay() {{
      if (document.visibilityState === "visible") {{
        var tBadge = document.getElementById("session-timer-badge");
        if (tBadge) {{
          var sec = Math.max(0, Math.floor((Date.now() - sessionStartedAtMs) / 1000));
          tBadge.textContent = tr("session_timer_prefix") + " " + String(sec) + tr("session_timer_unit");
        }}
      }}
      window.setTimeout(tickTimerDisplay, 1000);
    }}
    window.setTimeout(tickTimerDisplay, 1000);

    loadDashboard();
  }})();
  </script>
</body>
</html>
"""
