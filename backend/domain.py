"""Core domain rules: 6 skill categories, XP/level formulas, SM-2 scheduling, streak, and UTC clock."""

from datetime import date, datetime, timedelta, timezone
from decimal import Decimal, ROUND_HALF_UP
from typing import Dict, List, Optional, Tuple

from backend.errors import ApiProblemError

SKILL_CATEGORIES: List[Tuple[str, str, str]] = [
    ("architecture", "設計・アーキテクチャ", "Architecture & Design"),
    ("backend", "バックエンド・API", "Backend & API"),
    ("data", "データ・DB", "Data & Database"),
    ("reliability", "インフラ・信頼性", "Infrastructure & Reliability"),
    ("security", "セキュリティ", "Security"),
    ("trend", "技術トレンド", "Tech Trends"),
]

VALID_CATEGORIES = frozenset(cat for cat, _ja, _en in SKILL_CATEGORIES)
CATEGORY_LABELS: Dict[str, Tuple[str, str]] = {
    cat: (ja, en) for cat, ja, en in SKILL_CATEGORIES
}

CG_LEARNING_INITIAL_XP = 15
CG_REVIEW_CARD_XP = 10
WEEKLY_WINDOW_SECONDS = 604800  # 168 hours (7 * 24 * 3600)


def parse_iso8601_utc(value: str, field_name: str = "timestamp") -> datetime:
    """Parse an ISO 8601 datetime string (including trailing 'Z') into a UTC-aware datetime."""
    if not isinstance(value, str):
        raise ApiProblemError(
            code="VALIDATION_ERROR",
            message=f"{field_name} は有効な ISO 8601 日時文字列で指定してください",
            field=field_name,
        )
    s = value.strip()
    if not s or ("T" not in s and "t" not in s):
        raise ApiProblemError(
            code="VALIDATION_ERROR",
            message=f"{field_name} は有効な ISO 8601 日時文字列で指定してください",
            field=field_name,
        )
    normalized = s.replace("t", "T")
    if normalized.endswith(("Z", "z")):
        normalized = normalized[:-1] + "+00:00"
    try:
        dt = datetime.fromisoformat(normalized)
    except ValueError as exc:
        raise ApiProblemError(
            code="VALIDATION_ERROR",
            message=f"{field_name} の日時形式が不正です",
            field=field_name,
        ) from exc

    if dt.tzinfo is None:
        dt = dt.replace(tzinfo=timezone.utc)
    else:
        dt = dt.astimezone(timezone.utc)
    return dt


def format_iso8601_utc(dt: datetime) -> str:
    """Format a datetime as canonical UTC ISO 8601 string YYYY-MM-DDTHH:MM:SSZ."""
    utc_dt = dt.astimezone(timezone.utc)
    return utc_dt.strftime("%Y-%m-%dT%H:%M:%SZ")


def resolve_now(test_now_header: Optional[str], is_production: bool) -> datetime:
    """Resolve reference UTC timestamp (ignores X-Test-Now in production)."""
    if not is_production and test_now_header is not None and test_now_header != "":
        return parse_iso8601_utc(test_now_header, field_name="X-Test-Now")
    return datetime.now(timezone.utc).replace(microsecond=0)


def compute_level(total_xp: int) -> int:
    """Level formula: floor(total_xp / 100) + 1."""
    return (int(total_xp) // 100) + 1


def compute_xp_to_next_level(total_xp: int) -> int:
    """Remaining XP to next level: 100 - (total_xp % 100)."""
    return 100 - (int(total_xp) % 100)


def round_half_up(value: Decimal) -> int:
    """Standard round-half-up for positive numbers: floor(x + 0.5) without float precision drift."""
    return int(value.quantize(Decimal("1"), rounding=ROUND_HALF_UP))


def compute_sm2_review(
    repetition_count: int,
    interval_days: int,
    ease_factor: float,
    grade: int,
) -> Tuple[int, int, float]:
    """
    Compute updated (repetition_count, interval_days, ease_factor) per contracts/openapi.yaml:
    - grade 1: rep=0, ivl=1, ef=max(1.3, round(ef - 0.20, 2))
    - grade 2: rep=rep+1, ivl=max(1, round_half_up(ivl * 1.2)), ef=max(1.3, round(ef - 0.15, 2))
    - grade 3: rep=rep+1, sm2_base (1 -> 1, 2 -> 6, >=3 -> max(1, round_half_up(ivl * ef))), ef unchanged
    - grade 4: rep=rep+1, max(1, round_half_up(sm2_base * 1.3)), ef=max(1.3, round(ef + 0.10, 2))
    """
    rep = int(repetition_count)
    d_ivl = Decimal(int(interval_days))
    d_ef = Decimal(str(ease_factor))
    min_ef = Decimal("1.3")

    if grade == 1:
        new_rep = 0
        new_ivl = 1
        new_ef = max(min_ef, (d_ef - Decimal("0.20")).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP))
    elif grade == 2:
        new_rep = rep + 1
        new_ivl = max(1, round_half_up(d_ivl * Decimal("1.2")))
        new_ef = max(min_ef, (d_ef - Decimal("0.15")).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP))
    elif grade == 3:
        new_rep = rep + 1
        if new_rep == 1:
            sm2_base_ivl = 1
        elif new_rep == 2:
            sm2_base_ivl = 6
        else:
            sm2_base_ivl = max(1, round_half_up(d_ivl * d_ef))
        new_ivl = sm2_base_ivl
        new_ef = max(min_ef, d_ef.quantize(Decimal("0.01"), rounding=ROUND_HALF_UP))
    elif grade == 4:
        new_rep = rep + 1
        if new_rep == 1:
            sm2_base_dec = Decimal("1")
        elif new_rep == 2:
            sm2_base_dec = Decimal("6")
        else:
            sm2_base_dec = d_ivl * d_ef
        new_ivl = max(1, round_half_up(sm2_base_dec * Decimal("1.3")))
        new_ef = max(min_ef, (d_ef + Decimal("0.10")).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP))
    else:
        raise ApiProblemError(
            code="VALIDATION_ERROR",
            message="grade は 1 から 4 の整数で指定してください",
            field="grade",
        )

    return new_rep, new_ivl, float(new_ef)


def compute_streak_on_completion(
    current_streak: int,
    last_study_date_str: Optional[str],
    now_utc: datetime,
) -> Tuple[int, str]:
    """
    Update streak_days and last_study_date based on UTC calendar date (Contract D-6):
    - If last_study_date is None or >= 2 days ago: streak becomes 1, last_study_date = today
    - If last_study_date is yesterday: streak = current_streak + 1, last_study_date = today
    - If last_study_date is today or in the future: unchanged
    """
    today: date = now_utc.astimezone(timezone.utc).date()
    today_str = today.isoformat()

    if not last_study_date_str:
        return 1, today_str

    last_date = date.fromisoformat(last_study_date_str)
    diff_days = (today - last_date).days

    if diff_days <= 0:
        effective = current_streak if current_streak >= 1 else 1
        return effective, last_study_date_str
    if diff_days == 1:
        return int(current_streak) + 1, today_str
    return 1, today_str


def compute_effective_streak_for_summary(
    current_streak: int,
    last_study_date_str: Optional[str],
    now_utc: datetime,
) -> int:
    """Return 0 if last_study_date is None or >= 2 UTC days ago without mutating stored state."""
    if not last_study_date_str:
        return 0
    try:
        last_date = date.fromisoformat(last_study_date_str)
    except ValueError:
        return 0
    today: date = now_utc.astimezone(timezone.utc).date()
    if (today - last_date).days >= 2:
        return 0
    return max(0, int(current_streak))


def is_within_weekly_window(timestamp_iso: Optional[str], now_utc: datetime) -> bool:
    """Check if `now - 604800s <= t <= now` (inclusive on both ends)."""
    if not timestamp_iso:
        return False
    try:
        t = parse_iso8601_utc(timestamp_iso)
    except ApiProblemError:
        return False
    window_start = now_utc - timedelta(seconds=WEEKLY_WINDOW_SECONDS)
    return window_start <= t <= now_utc
