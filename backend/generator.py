"""Deterministic rule & heuristic generator for practical thinking challenges and SM-2 cards."""

from abc import ABC, abstractmethod
from dataclasses import dataclass
from typing import Dict, List, Optional, Tuple

from backend.domain import VALID_CATEGORIES


@dataclass(frozen=True)
class GeneratedLearningArtifacts:
    resolved_title: str
    category: str
    question: str
    rubric_items: List[Dict[str, object]]
    model_points: List[str]
    front_prompt: str
    back_summary: str


class ChallengeGenerator(ABC):
    """Pluggable interface for challenge & review card generation (ADR 001)."""

    @abstractmethod
    def generate(
        self,
        *,
        title: Optional[str],
        memo: str,
        url: Optional[str],
        category: Optional[str],
        fetched_title: str = "",
    ) -> GeneratedLearningArtifacts:
        raise NotImplementedError


_CATEGORY_KEYWORDS: List[Tuple[str, Tuple[str, ...]]] = [
    (
        "data",
        (
            "redis",
            "cache",
            "キャッシュ",
            "stampede",
            "db",
            "database",
            "データベース",
            "sql",
            "sqlite",
            "postgres",
            "postgresql",
            "mysql",
            "index",
            "インデックス",
            "クエリ",
            "トランザクション",
            "acid",
            "レプリケーション",
            "シャーディング",
            "正規化",
            "スキーマ",
            "wal",
        ),
    ),
    (
        "reliability",
        (
            "分散ロック",
            "スプリットブレイン",
            "フェンシング",
            "サーキットブレーカー",
            "circuit breaker",
            "タイムアウト",
            "timeout",
            "リトライ",
            "フォールバック",
            "監視",
            "slo",
            "sla",
            "sre",
            "障害",
            "フェイルオーバー",
            "冗長",
            "k8s",
            "kubernetes",
            "インフラ",
            "縮退",
            "可用性",
            "レート制限",
        ),
    ),
    (
        "security",
        (
            "ssrf",
            "xss",
            "csrf",
            "インジェクション",
            "injection",
            "認証",
            "認可",
            "oauth",
            "oidc",
            "jwt",
            "パスキー",
            "暗号",
            "脆弱性",
            "権限",
            "セキュリティ",
            "cors",
            "tls",
            "署名",
            "owasp",
        ),
    ),
    (
        "backend",
        (
            "api",
            "rest",
            "graphql",
            "grpc",
            "http",
            "エンドポイント",
            "冪等",
            "idempotency",
            "レートリミット",
            "rate limit",
            "バックエンド",
            "サーバー",
            "非同期",
            "キュー",
            "webhook",
            "ページング",
            "openapi",
        ),
    ),
    (
        "trend",
        (
            "llm",
            "生成ai",
            "aiエージェント",
            "agent",
            "rag",
            "wasm",
            "webassembly",
            "rust",
            "トレンド",
            "新機能",
            "ベクトル",
            "マルチモーダル",
            "推論",
        ),
    ),
    (
        "architecture",
        (
            "設計",
            "アーキテクチャ",
            "architecture",
            "ddd",
            "ドメイン",
            "クリーンアーキテクチャ",
            "マイクロサービス",
            "モノリス",
            "モジュラ",
            "トレードオフ",
            "結合",
            "凝集",
            "責務",
            "インターフェース",
            "adr",
            "デザインパターン",
        ),
    ),
]

_CATEGORY_PERSPECTIVE_HINTS: Dict[str, Tuple[str, str, str]] = {
    "architecture": (
        "チーム規模・変更頻度・境界づけられたコンテキストなどの前提条件とシステム制約を明示しているか",
        "別アーキテクチャ案（モノリス vs 分割、同期 vs 非同期など）との保守性・複雑性の利点と欠点を比較しているか",
        "境界間の障害伝播や要件変化で前提が崩れた際の縮退・移行戦略を具体化しているか",
    ),
    "backend": (
        "想定リクエスト量（QPS）・許容レイテンシ・クライアント互換性などの前提条件と制約を明示しているか",
        "代替API設計や再試行・冪等制御方式との実装コスト・整合性の利点と欠点を比較しているか",
        "ネットワーク切断・二重送信・下流タイムアウト発生時の安全なエラー応答と保護策を具体化しているか",
    ),
    "data": (
        "トラフィック特性・データ整合性要件・許容レイテンシやデータ量などの前提条件と制約を明示しているか",
        "別案（ロック方式 vs TTLジッター、強整合 vs 結果整合、索引追加コスト等）との利点・欠点を比較して選択理由を述べているか",
        "キャッシュノード障害・DBロック競合・ホットキー発生時などのフォールバックと縮退運転を具体化しているか",
    ),
    "reliability": (
        "許容ダウンタイム（SLO）・ネットワーク遅延・クロックずれ等の分散システム上の前提と制約を明示しているか",
        "代替の耐障害方式（リース期限・フェイルファスト・キュー緩衝等）との可用性・一貫性のトレードオフを比較しているか",
        "ノードクラッシュ・ネットワーク分断（スプリットブレイン）・連鎖障害時の隔離と復旧手順を具体化しているか",
    ),
    "security": (
        "守るべき資産・信頼境界・攻撃者の到達経路などの脅威モデル上の前提と制約を明示しているか",
        "利便性や性能への影響を含め、多層防御の代替手段とのトレードオフを比較して選択理由を述べているか",
        "検証バイパス（TOCTOU・別表記・権限昇格）や秘密漏洩が起きた際の検知・遮断・被害局所化策を具体化しているか",
    ),
    "trend": (
        "導入対象のユースケース・レイテンシ上限・運用コストや成熟度などの採用前提と制約を明示しているか",
        "枯れた既存技術で解く代替案と新技術導入の学習コスト・ロックイン・将来性のトレードオフを比較しているか",
        "外部依存の仕様変更・精度劣化・障害発生時に既存ロジックへ安全にフォールバックし撤退できる設計を具体化しているか",
    ),
}


def classify_category(title: str, memo: str, url: Optional[str] = None) -> str:
    """Deterministically classify input text into one of the 6 core skill categories."""
    combined = f"{title} {memo} {url or ''}".lower()
    best_cat = "architecture"
    best_score = 0

    for cat, keywords in _CATEGORY_KEYWORDS:
        score = 0
        for kw in keywords:
            if kw in combined:
                # Title hits carry slightly higher weight for disambiguation
                score += 2 if kw in title.lower() else 1
        if score > best_score:
            best_score = score
            best_cat = cat

    return best_cat


def _derive_title(title: Optional[str], fetched_title: str, memo: str) -> str:
    if title is not None and title.strip():
        return title.strip()[:200]
    if fetched_title and fetched_title.strip():
        return fetched_title.strip()[:200]
    cleaned = " ".join(memo.strip().split())
    for sep in ("。", "．", "\n", ". "):
        idx = cleaned.find(sep)
        if 4 <= idx <= 36:
            return cleaned[:idx][:200]
    if len(cleaned) > 32:
        return cleaned[:32] + "…"
    return cleaned[:200]


class RuleBasedChallengeGenerator(ChallengeGenerator):
    """Zero-dependency, <5ms deterministic generator satisfying Seam #5."""

    def generate(
        self,
        *,
        title: Optional[str],
        memo: str,
        url: Optional[str],
        category: Optional[str],
        fetched_title: str = "",
    ) -> GeneratedLearningArtifacts:
        resolved_title = _derive_title(title, fetched_title, memo)
        resolved_category = (
            category if (category and category in VALID_CATEGORIES) else classify_category(resolved_title, memo, url)
        )

        normalized_memo = " ".join(memo.strip().split())
        excerpt = normalized_memo if len(normalized_memo) <= 120 else normalized_memo[:120] + "…"

        question = (
            f"【実践思考：{resolved_title}】「{excerpt}」を踏まえ、"
            "(1)この設計を採用する前提条件と制約、"
            "(2)代替案とのトレードオフ、"
            "(3)障害やエッジケース発生時の対策を説明してください。"
        )

        p0, p1, p2 = _CATEGORY_PERSPECTIVE_HINTS[resolved_category]
        rubric_items: List[Dict[str, object]] = [
            {
                "index": 0,
                "perspective": "premise_constraints",
                "label_ja": "前提・制約の明確化",
                "description_ja": p0,
            },
            {
                "index": 1,
                "perspective": "tradeoff_comparison",
                "label_ja": "トレードオフ比較",
                "description_ja": p1,
            },
            {
                "index": 2,
                "perspective": "failure_edge_cases",
                "label_ja": "障害・エッジケース対策",
                "description_ja": p2,
            },
        ]

        model_points = [
            f"前提・制約：「{resolved_title}」を適用する規模・許容レイテンシ・整合性や運用上の制約条件を最初に定義する（{p0}）",
            f"トレードオフ：「{excerpt}」の手法と単純な代替方式を、性能・実装複雑性・保守コストの軸で比較して選択根拠を示す",
            f"障害・エッジケース：依存先の停止・高負荷・境界値入力が起きた際のタイムアウト・フォールバック・縮退運転を明示する",
        ]

        front_prompt = f"【{resolved_title}】の要点・トレードオフ・障害対策を自分の言葉で説明してください。"
        back_summary = normalized_memo if len(normalized_memo) <= 600 else normalized_memo[:600] + "…"

        return GeneratedLearningArtifacts(
            resolved_title=resolved_title,
            category=resolved_category,
            question=question,
            rubric_items=rubric_items,
            model_points=model_points,
            front_prompt=front_prompt,
            back_summary=back_summary,
        )


default_generator = RuleBasedChallengeGenerator()
