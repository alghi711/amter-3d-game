import { createClient, type Client } from "@libsql/client";
import { drizzle, type LibSQLDatabase } from "drizzle-orm/libsql";
import { mkdirSync } from "node:fs";
import { dirname } from "node:path";
import { MOCK_PERSONALITY_TRAITS, MOCK_ROUTINES } from "@/lib/mock-mood";
import * as schema from "./schema";

const DEFAULT_DB_FILE = ".data/mochi.db";

let cachedClient: Client | null = null;
let cachedDb: LibSQLDatabase<typeof schema> | null = null;
let migrated = false;

function getClient(): Client {
  if (cachedClient) return cachedClient;
  const url = process.env.DATABASE_URL ?? `file:${DEFAULT_DB_FILE}`;
  if (url.startsWith("file:")) {
    const filePath = url.slice("file:".length);
    if (filePath && filePath !== ":memory:") {
      mkdirSync(dirname(filePath), { recursive: true });
    }
  }
  cachedClient = createClient({
    url,
    authToken: process.env.DATABASE_AUTH_TOKEN,
  });
  return cachedClient;
}

/** Inisialisasi koneksi Drizzle ORM (SQLite lokal / Turso). */
export function getDb(): LibSQLDatabase<typeof schema> {
  if (!cachedDb) {
    cachedDb = drizzle(getClient(), { schema });
  }
  return cachedDb;
}

/** Jalankan migrasi skema kondisi perawatan, suasana hati, rutinitas, dan kepribadian secara idempoten. */
export async function ensureCareSchema(): Promise<LibSQLDatabase<typeof schema>> {
  const client = getClient();
  const db = getDb();

  if (!migrated) {
    await client.batch(
      [
        `CREATE TABLE IF NOT EXISTS users (
          id TEXT PRIMARY KEY,
          email TEXT UNIQUE,
          name TEXT NOT NULL,
          created_at INTEGER NOT NULL,
          updated_at INTEGER NOT NULL
        )`,
        `CREATE TABLE IF NOT EXISTS cats (
          id TEXT PRIMARY KEY,
          user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          name TEXT NOT NULL,
          stage TEXT NOT NULL DEFAULT 'anak',
          level INTEGER NOT NULL DEFAULT 1,
          experience INTEGER NOT NULL DEFAULT 0,
          closeness INTEGER NOT NULL DEFAULT 50,
          appearance_json TEXT NOT NULL DEFAULT '{"furColor":"#f4b673"}',
          last_played_at INTEGER NOT NULL
        )`,
        `CREATE TABLE IF NOT EXISTS cat_stats (
          cat_id TEXT PRIMARY KEY REFERENCES cats(id) ON DELETE CASCADE,
          hunger REAL NOT NULL DEFAULT 70,
          thirst REAL NOT NULL DEFAULT 55,
          hygiene REAL NOT NULL DEFAULT 80,
          happiness REAL NOT NULL DEFAULT 85,
          energy REAL NOT NULL DEFAULT 60,
          updated_at INTEGER NOT NULL
        )`,
        `CREATE TABLE IF NOT EXISTS interactions (
          id TEXT PRIMARY KEY,
          cat_id TEXT NOT NULL REFERENCES cats(id) ON DELETE CASCADE,
          type TEXT NOT NULL,
          item_type TEXT,
          value REAL NOT NULL DEFAULT 0,
          created_at INTEGER NOT NULL
        )`,
        `CREATE INDEX IF NOT EXISTS idx_interactions_cat_created ON interactions(cat_id, created_at DESC)`,
        `CREATE TABLE IF NOT EXISTS cat_moods (
          cat_id TEXT PRIMARY KEY REFERENCES cats(id) ON DELETE CASCADE,
          mood TEXT NOT NULL DEFAULT 'senang',
          reason TEXT NOT NULL DEFAULT 'Semua kebutuhan harian terpenuhi dengan baik',
          updated_at INTEGER NOT NULL
        )`,
        `CREATE TABLE IF NOT EXISTS cat_personality (
          cat_id TEXT PRIMARY KEY REFERENCES cats(id) ON DELETE CASCADE,
          traits_json TEXT NOT NULL DEFAULT '[]',
          formed_by TEXT NOT NULL DEFAULT 'Perawatan harian yang penuh kasih',
          updated_at INTEGER NOT NULL
        )`,
        `CREATE TABLE IF NOT EXISTS routines (
          id TEXT PRIMARY KEY,
          cat_id TEXT NOT NULL REFERENCES cats(id) ON DELETE CASCADE,
          activity TEXT NOT NULL,
          start_hour INTEGER NOT NULL,
          end_hour INTEGER NOT NULL,
          is_active INTEGER NOT NULL DEFAULT 1,
          last_triggered_at INTEGER
        )`,
        `CREATE INDEX IF NOT EXISTS idx_routines_cat ON routines(cat_id, start_hour)`,
      ],
      "write",
    );

    const now = Date.now();
    const routineSeeds = MOCK_ROUTINES.map((r) => ({
      sql: `INSERT OR IGNORE INTO routines (id, cat_id, activity, start_hour, end_hour, is_active, last_triggered_at)
            VALUES (?, ?, ?, ?, ?, ?, ?)`,
      args: [r.id, "cat-mochi", r.activity === "main" ? "bermain" : r.activity, r.startHour, r.endHour, 1, null],
    }));

    await client.batch(
      [
        {
          sql: `INSERT OR IGNORE INTO users (id, email, name, created_at, updated_at) VALUES (?, ?, ?, ?, ?)`,
          args: ["user-guest", "guest@mochi.local", "Pemain Mochi", now, now],
        },
        {
          sql: `INSERT OR IGNORE INTO cats (id, user_id, name, stage, level, experience, closeness, appearance_json, last_played_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          args: ["cat-mochi", "user-guest", "Mochi", "anak", 3, 45, 62, '{"furColor":"#f4b673"}', now],
        },
        {
          sql: `INSERT OR IGNORE INTO cat_stats (cat_id, hunger, thirst, hygiene, happiness, energy, updated_at)
                VALUES (?, ?, ?, ?, ?, ?, ?)`,
          args: ["cat-mochi", 70, 55, 80, 85, 60, now],
        },
        {
          sql: `INSERT OR IGNORE INTO cat_moods (cat_id, mood, reason, updated_at)
                VALUES (?, ?, ?, ?)`,
          args: ["cat-mochi", "senang", "Semua kebutuhan harian terpenuhi dengan baik", now],
        },
        {
          sql: `INSERT OR IGNORE INTO cat_personality (cat_id, traits_json, formed_by, updated_at)
                VALUES (?, ?, ?, ?)`,
          args: [
            "cat-mochi",
            JSON.stringify(MOCK_PERSONALITY_TRAITS),
            "Sering dielus dan diberi makan teratur",
            now,
          ],
        },
        ...routineSeeds,
      ],
      "write",
    );

    migrated = true;
  }

  return db;
}
