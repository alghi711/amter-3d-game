-- Migrasi 0001: Skema suasana hati, rutinitas harian, dan kepribadian kucing
CREATE TABLE IF NOT EXISTS cat_moods (
  cat_id TEXT PRIMARY KEY REFERENCES cats(id) ON DELETE CASCADE,
  mood TEXT NOT NULL DEFAULT 'senang',
  reason TEXT NOT NULL DEFAULT 'Semua kebutuhan harian terpenuhi dengan baik',
  updated_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS cat_personality (
  cat_id TEXT PRIMARY KEY REFERENCES cats(id) ON DELETE CASCADE,
  traits_json TEXT NOT NULL DEFAULT '[]',
  formed_by TEXT NOT NULL DEFAULT 'Perawatan harian yang penuh kasih',
  updated_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS routines (
  id TEXT PRIMARY KEY,
  cat_id TEXT NOT NULL REFERENCES cats(id) ON DELETE CASCADE,
  activity TEXT NOT NULL,
  start_hour INTEGER NOT NULL,
  end_hour INTEGER NOT NULL,
  is_active INTEGER NOT NULL DEFAULT 1,
  last_triggered_at INTEGER
);

CREATE INDEX IF NOT EXISTS idx_routines_cat ON routines(cat_id, start_hour);
