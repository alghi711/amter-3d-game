-- Migrasi 0005: Kode pemulihan identitas pemain
CREATE TABLE IF NOT EXISTS player_recovery_codes (
  user_id TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  code TEXT NOT NULL UNIQUE,
  created_at INTEGER NOT NULL,
  last_used_at INTEGER
);
