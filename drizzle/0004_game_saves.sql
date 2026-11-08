-- Migrasi 0004: Progres tersimpan dan cadangan permainan
CREATE TABLE IF NOT EXISTS game_saves (
  id TEXT PRIMARY KEY,
  cat_id TEXT NOT NULL REFERENCES cats(id) ON DELETE CASCADE,
  kind TEXT NOT NULL DEFAULT 'auto',
  snapshot_json TEXT NOT NULL,
  backup_code TEXT,
  device_label TEXT NOT NULL DEFAULT 'Browser Perangkat Ini',
  version INTEGER NOT NULL DEFAULT 1,
  created_at INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_game_saves_cat_kind ON game_saves(cat_id, kind, created_at DESC);
CREATE UNIQUE INDEX IF NOT EXISTS idx_game_saves_backup_code ON game_saves(backup_code) WHERE backup_code IS NOT NULL;
