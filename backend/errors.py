"""RFC 9457 Problem Details error definitions (application/problem+json)."""

from typing import Any, Dict, Optional

PROBLEM_SPECS: Dict[str, tuple] = {
    "VALIDATION_ERROR": (
        "https://devforge.local/problems/validation-error",
        "入力内容に誤りがあります",
        400,
    ),
    "INVALID_URL_SCHEME_OR_HOST": (
        "https://devforge.local/problems/invalid-url-scheme-or-host",
        "指定されたURLは許可されていません",
        400,
    ),
    "TEST_SEAM_DISABLED": (
        "https://devforge.local/problems/test-seam-disabled",
        "テスト用エンドポイントは利用できません",
        403,
    ),
    "RESOURCE_NOT_FOUND": (
        "https://devforge.local/problems/resource-not-found",
        "対象のデータが見つかりません",
        404,
    ),
    "CHALLENGE_ALREADY_COMPLETED": (
        "https://devforge.local/problems/challenge-already-completed",
        "この問題はすでに回答済みです",
        409,
    ),
    "REVIEW_CARD_NOT_DUE": (
        "https://devforge.local/problems/review-card-not-due",
        "このカードはまだ復習の期限が来ていません",
        409,
    ),
    "IDEMPOTENCY_KEY_MISMATCH": (
        "https://devforge.local/problems/idempotency-key-mismatch",
        "同じ冪等キーで違う内容が送られました",
        422,
    ),
    "RATE_LIMIT_EXCEEDED": (
        "https://devforge.local/problems/rate-limit-exceeded",
        "リクエスト回数の上限を超えました",
        429,
    ),
    "INTERNAL_ERROR": (
        "https://devforge.local/problems/internal-error",
        "サーバー内部エラーが発生しました",
        500,
    ),
}


class ApiProblemError(Exception):
    """Structured API error mapped directly to RFC 9457 ProblemDetails."""

    def __init__(
        self,
        code: str,
        message: str,
        field: Optional[str] = None,
        status_override: Optional[int] = None,
        headers: Optional[Dict[str, str]] = None,
    ) -> None:
        super().__init__(message)
        spec = PROBLEM_SPECS.get(code, PROBLEM_SPECS["INTERNAL_ERROR"])
        self.code = code
        self.problem_type = spec[0]
        self.title = spec[1]
        self.status = status_override if status_override is not None else spec[2]
        self.message = message
        self.field = field
        self.headers = headers or {}

    def to_dict(self, instance: str) -> Dict[str, Any]:
        error_obj: Dict[str, Any] = {
            "code": self.code,
            "message": self.message,
        }
        if self.field is not None:
            error_obj["field"] = self.field
        return {
            "type": self.problem_type,
            "title": self.title,
            "status": self.status,
            "detail": self.message,
            "instance": instance,
            "error": error_obj,
        }


def build_internal_error_payload(instance: str, message: str = "予期しないサーバー内部エラーが発生しました") -> Dict[str, Any]:
    """Build a safe 500 ProblemDetails payload that never leaks stack traces or SQL."""
    problem = ApiProblemError(code="INTERNAL_ERROR", message=message)
    return problem.to_dict(instance=instance)
