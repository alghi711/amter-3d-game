-- Migrasi 0006: Skema autentikasi pengguna dan token reset kata sandi
ALTER TABLE users ADD COLUMN password_hash TEXT;
ALTER TABLE users ADD COLUMN avatar TEXT NOT NULL DEFAULT '🐱';
ALTER TABLE users ADD COLUMN is_guest INTEGER NOT NULL DEFAULT 1;

CREATE TABLE IF NOT EXISTS password_reset_tokens (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token TEXT NOT NULL UNIQUE,
  code TEXT NOT NULL,
  expires_at INTEGER NOT NULL,
  used_at INTEGER,
  created_at INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_password_reset_user ON password_reset_tokens(user_id, expires_at);
CREATE INDEX IF NOT EXISTS idx_password_reset_token ON password_reset_tokens(token);
CREATE INDEX IF NOT EXISTS idx_password_reset_code ON password_reset_tokens(code);
