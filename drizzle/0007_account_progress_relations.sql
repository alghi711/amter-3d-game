-- Migrasi 0007: Relasi akun pemain ke progres kucing & sesi perangkat
CREATE TABLE IF NOT EXISTS user_achievements (
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  achievement_id TEXT NOT NULL,
  unlocked_at INTEGER NOT NULL,
  progress REAL NOT NULL DEFAULT 100,
  PRIMARY KEY (user_id, achievement_id)
);

CREATE INDEX IF NOT EXISTS idx_user_achievements_user ON user_achievements(user_id);

CREATE TABLE IF NOT EXISTS player_sessions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token TEXT NOT NULL UNIQUE,
  device_label TEXT NOT NULL DEFAULT 'Browser',
  created_at INTEGER NOT NULL,
  expires_at INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_player_sessions_user ON player_sessions(user_id, expires_at);
CREATE INDEX IF NOT EXISTS idx_player_sessions_token ON player_sessions(token);
