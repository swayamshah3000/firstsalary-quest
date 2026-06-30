-- FirstSalary Quest — local SQLite schema
-- Educational simulator only. Stores no real financial account data.
--
-- This file is the single source of truth for the database structure. It is
-- embedded into the Tauri backend as a v1 migration (see src-tauri/src/lib.rs),
-- so editing it here changes what the app creates on first launch.

PRAGMA foreign_keys = ON;

-- The player's simulated character.
CREATE TABLE IF NOT EXISTS user_profile (
    id                INTEGER PRIMARY KEY AUTOINCREMENT,
    name              TEXT    NOT NULL,
    city              TEXT    NOT NULL,
    salary            INTEGER NOT NULL,            -- simulated monthly take-home (INR)
    family_dependency TEXT    NOT NULL,            -- e.g. 'none' | 'partial' | 'high'
    job_type          TEXT    NOT NULL,            -- e.g. 'salaried' | 'freelance' | 'govt'
    created_at        TEXT    NOT NULL DEFAULT (datetime('now'))
);

-- One running game per user. `scores` is the five-meter snapshot, stored as JSON.
CREATE TABLE IF NOT EXISTS game_progress (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id       INTEGER NOT NULL,
    current_month INTEGER NOT NULL DEFAULT 1,      -- 1..12
    scores        TEXT    NOT NULL DEFAULT '{}',   -- JSON: the five meters
    created_at    TEXT    NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (user_id) REFERENCES user_profile (id) ON DELETE CASCADE
);

-- Every choice the player commits to, in order.
CREATE TABLE IF NOT EXISTS decision_history (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id     INTEGER NOT NULL,
    card_id     TEXT    NOT NULL,                  -- decision card id (e.g. 'm1-rent-vs-pg')
    choice_made INTEGER NOT NULL,                  -- index into the card's choices[]
    month       INTEGER NOT NULL,
    created_at  TEXT    NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (user_id) REFERENCES user_profile (id) ON DELETE CASCADE
);

-- Badges the player has unlocked.
CREATE TABLE IF NOT EXISTS badges (
    id        INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id   INTEGER NOT NULL,
    badge_id  TEXT    NOT NULL,                    -- e.g. 'first-sip'
    earned_at TEXT    NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (user_id) REFERENCES user_profile (id) ON DELETE CASCADE,
    UNIQUE (user_id, badge_id)
);

-- Per-question quiz outcomes for the learning modules.
CREATE TABLE IF NOT EXISTS quiz_results (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id     INTEGER NOT NULL,
    question_id TEXT    NOT NULL,
    correct     INTEGER NOT NULL,                  -- 0 | 1 (SQLite has no bool)
    answered_at TEXT    NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (user_id) REFERENCES user_profile (id) ON DELETE CASCADE
);

-- Helpful lookups for the dashboard and game loop.
CREATE INDEX IF NOT EXISTS idx_game_progress_user   ON game_progress (user_id);
CREATE INDEX IF NOT EXISTS idx_decisions_user_month ON decision_history (user_id, month);
CREATE INDEX IF NOT EXISTS idx_badges_user          ON badges (user_id);
CREATE INDEX IF NOT EXISTS idx_quiz_user            ON quiz_results (user_id);
