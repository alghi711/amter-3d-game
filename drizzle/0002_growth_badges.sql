-- Migrasi 0002: Skema pertumbuhan kucing, riwayat peristiwa, dan lencana
CREATE TABLE IF NOT EXISTS cat_growth (
  cat_id TEXT PRIMARY KEY REFERENCES cats(id) ON DELETE CASCADE,
  total_interactions INTEGER NOT NULL DEFAULT 0,
  total_xp INTEGER NOT NULL DEFAULT 0,
  stage_changed_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS growth_events (
  id TEXT PRIMARY KEY,
  cat_id TEXT NOT NULL REFERENCES cats(id) ON DELETE CASCADE,
  kind TEXT NOT NULL,
  from_stage TEXT,
  to_stage TEXT,
  level INTEGER NOT NULL,
  xp_gain INTEGER NOT NULL DEFAULT 0,
  created_at INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_growth_events_cat ON growth_events(cat_id, created_at DESC);

CREATE TABLE IF NOT EXISTS cat_badges (
  cat_id TEXT NOT NULL REFERENCES cats(id) ON DELETE CASCADE,
  badge_id TEXT NOT NULL,
  unlocked_at INTEGER NOT NULL,
  PRIMARY KEY (cat_id, badge_id)
);
