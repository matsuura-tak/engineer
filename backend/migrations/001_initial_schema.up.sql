-- Migration 001 UP: Initial schema for 001-personal-learning-loop (Stage: Add)

CREATE TABLE IF NOT EXISTS learnings (
    learning_id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    url TEXT,
    memo TEXT NOT NULL,
    category TEXT NOT NULL CHECK (category IN ('architecture', 'backend', 'data', 'reliability', 'security', 'trend')),
    earned_xp INTEGER NOT NULL CHECK (earned_xp >= 0),
    url_fetch_status TEXT NOT NULL CHECK (url_fetch_status IN ('fetched', 'not_provided', 'fallback_used')),
    processing_ms INTEGER NOT NULL CHECK (processing_ms >= 0),
    created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS challenges (
    challenge_id TEXT PRIMARY KEY,
    learning_id TEXT NOT NULL REFERENCES learnings(learning_id) ON DELETE CASCADE,
    category TEXT NOT NULL CHECK (category IN ('architecture', 'backend', 'data', 'reliability', 'security', 'trend')),
    question TEXT NOT NULL,
    rubric_json TEXT NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('pending', 'completed')),
    answer TEXT,
    matched_rubric_count INTEGER CHECK (matched_rubric_count IS NULL OR (matched_rubric_count >= 0 AND matched_rubric_count <= 3)),
    earned_xp INTEGER CHECK (earned_xp IS NULL OR earned_xp >= 0),
    model_points_json TEXT,
    created_at TEXT NOT NULL,
    completed_at TEXT
);

CREATE INDEX IF NOT EXISTS idx_challenges_learning_id ON challenges(learning_id);
CREATE INDEX IF NOT EXISTS idx_challenges_status_created_at ON challenges(status, created_at);
CREATE INDEX IF NOT EXISTS idx_challenges_completed_at ON challenges(completed_at);

CREATE TABLE IF NOT EXISTS review_cards (
    card_id TEXT PRIMARY KEY,
    learning_id TEXT NOT NULL REFERENCES learnings(learning_id) ON DELETE CASCADE,
    category TEXT NOT NULL CHECK (category IN ('architecture', 'backend', 'data', 'reliability', 'security', 'trend')),
    front_prompt TEXT NOT NULL,
    back_summary TEXT NOT NULL,
    interval_days INTEGER NOT NULL CHECK (interval_days >= 1),
    ease_factor REAL NOT NULL CHECK (ease_factor >= 1.3),
    repetition_count INTEGER NOT NULL CHECK (repetition_count >= 0),
    next_review_at TEXT NOT NULL,
    last_grade INTEGER CHECK (last_grade IS NULL OR (last_grade >= 1 AND last_grade <= 4)),
    graded_at TEXT,
    created_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_review_cards_learning_id ON review_cards(learning_id);
CREATE INDEX IF NOT EXISTS idx_review_cards_next_review_at ON review_cards(next_review_at, card_id);
CREATE INDEX IF NOT EXISTS idx_review_cards_graded_at ON review_cards(graded_at);

CREATE TABLE IF NOT EXISTS skill_progress (
    category TEXT PRIMARY KEY CHECK (category IN ('architecture', 'backend', 'data', 'reliability', 'security', 'trend')),
    total_xp INTEGER NOT NULL DEFAULT 0 CHECK (total_xp >= 0),
    updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS user_stats (
    id INTEGER PRIMARY KEY CHECK (id = 1),
    streak_days INTEGER NOT NULL DEFAULT 0 CHECK (streak_days >= 0),
    last_study_date TEXT
);

CREATE TABLE IF NOT EXISTS idempotency_keys (
    idempotency_key TEXT PRIMARY KEY,
    endpoint TEXT NOT NULL,
    request_hash TEXT NOT NULL,
    status_code INTEGER NOT NULL,
    response_json TEXT NOT NULL,
    created_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_idempotency_keys_created_at ON idempotency_keys(created_at);

CREATE TABLE IF NOT EXISTS telemetry_events (
    event_id TEXT PRIMARY KEY,
    event_name TEXT NOT NULL,
    properties_json TEXT NOT NULL,
    created_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_telemetry_events_created_at ON telemetry_events(created_at);

INSERT OR IGNORE INTO skill_progress (category, total_xp, updated_at) VALUES
    ('architecture', 0, '1970-01-01T00:00:00Z'),
    ('backend', 0, '1970-01-01T00:00:00Z'),
    ('data', 0, '1970-01-01T00:00:00Z'),
    ('reliability', 0, '1970-01-01T00:00:00Z'),
    ('security', 0, '1970-01-01T00:00:00Z'),
    ('trend', 0, '1970-01-01T00:00:00Z');

INSERT OR IGNORE INTO user_stats (id, streak_days, last_study_date) VALUES (1, 0, NULL);
