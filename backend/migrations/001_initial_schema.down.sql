-- Migration 001 DOWN: Rollback initial schema for 001-personal-learning-loop

DROP TABLE IF EXISTS telemetry_events;
DROP TABLE IF EXISTS idempotency_keys;
DROP TABLE IF EXISTS user_stats;
DROP TABLE IF EXISTS skill_progress;
DROP TABLE IF EXISTS review_cards;
DROP TABLE IF EXISTS challenges;
DROP TABLE IF EXISTS learnings;
