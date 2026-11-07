-- Migrasi 0000: Skema kondisi perawatan kucing & riwayat interaksi
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE,
  name TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS cats (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  stage TEXT NOT NULL DEFAULT 'anak',
  level INTEGER NOT NULL DEFAULT 1,
  experience INTEGER NOT NULL DEFAULT 0,
  closeness INTEGER NOT NULL DEFAULT 50,
  appearance_json TEXT NOT NULL DEFAULT '{"furColor":"#f4b673"}',
  last_played_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS cat_stats (
  cat_id TEXT PRIMARY KEY REFERENCES cats(id) ON DELETE CASCADE,
  hunger REAL NOT NULL DEFAULT 70,
  thirst REAL NOT NULL DEFAULT 55,
  hygiene REAL NOT NULL DEFAULT 80,
  happiness REAL NOT NULL DEFAULT 85,
  energy REAL NOT NULL DEFAULT 60,
  updated_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS interactions (
  id TEXT PRIMARY KEY,
  cat_id TEXT NOT NULL REFERENCES cats(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  item_type TEXT,
  value REAL NOT NULL DEFAULT 0,
  created_at INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_interactions_cat_created ON interactions(cat_id, created_at DESC);
