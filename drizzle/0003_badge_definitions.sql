-- Migrasi 0003: Katalog lencana pencapaian (syarat metrik + ambang)
CREATE TABLE IF NOT EXISTS badge_definitions (
  code TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  icon TEXT NOT NULL,
  metric TEXT NOT NULL,
  threshold INTEGER NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0
);
-- cat_badges (dibuat di 0002) menyimpan lencana terbuka per kucing: badge_id = badge_definitions.code
