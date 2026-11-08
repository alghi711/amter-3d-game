import { integer, primaryKey, real, sqliteTable, text } from "drizzle-orm/sqlite-core";

/** Tabel pengguna (pemilik kucing). */
export const users = sqliteTable("users", {
  id: text("id").primaryKey(),
  email: text("email").unique(),
  name: text("name").notNull(),
  createdAt: integer("created_at").notNull(),
  updatedAt: integer("updated_at").notNull(),
});

/** Tabel profil kucing virtual. */
export const cats = sqliteTable("cats", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  stage: text("stage").notNull().default("anak"), // "anak" | "dewasa"
  level: integer("level").notNull().default(1),
  experience: integer("experience").notNull().default(0),
  closeness: integer("closeness").notNull().default(50),
  appearanceJson: text("appearance_json").notNull().default('{"furColor":"#f4b673"}'),
  lastPlayedAt: integer("last_played_at").notNull(),
});

/** Tabel kondisi perawatan harian kucing (hunger, thirst, hygiene, happiness, energy). */
export const catStats = sqliteTable("cat_stats", {
  catId: text("cat_id")
    .primaryKey()
    .references(() => cats.id, { onDelete: "cascade" }),
  hunger: real("hunger").notNull().default(70),
  thirst: real("thirst").notNull().default(55),
  hygiene: real("hygiene").notNull().default(80),
  happiness: real("happiness").notNull().default(85),
  energy: real("energy").notNull().default(60),
  updatedAt: integer("updated_at").notNull(),
});

/** Tabel riwayat interaksi perawatan (makan, minum, mandi, bersihkan, bermain, elus). */
export const interactions = sqliteTable("interactions", {
  id: text("id").primaryKey(),
  catId: text("cat_id")
    .notNull()
    .references(() => cats.id, { onDelete: "cascade" }),
  type: text("type").notNull(), // makan | minum | mandi | bersihkan | main | elus
  itemType: text("item_type"),
  value: real("value").notNull().default(0),
  createdAt: integer("created_at").notNull(),
});

/** Tabel suasana hati kucing (senang, lapar, bosan, ngantuk) beserta penyebabnya. */
export const catMoods = sqliteTable("cat_moods", {
  catId: text("cat_id")
    .primaryKey()
    .references(() => cats.id, { onDelete: "cascade" }),
  mood: text("mood").notNull().default("senang"), // senang | lapar | bosan | ngantuk
  reason: text("reason").notNull().default("Semua kebutuhan harian terpenuhi dengan baik"),
  updatedAt: integer("updated_at").notNull(),
});

/** Tabel kepribadian kucing (daftar sifat khas dalam JSON & penyebab terbentuknya). */
export const catPersonality = sqliteTable("cat_personality", {
  catId: text("cat_id")
    .primaryKey()
    .references(() => cats.id, { onDelete: "cascade" }),
  traitsJson: text("traits_json").notNull().default("[]"),
  formedBy: text("formed_by").notNull().default("Perawatan harian yang penuh kasih"),
  updatedAt: integer("updated_at").notNull(),
});

/** Tabel jadwal rutinitas harian kucing (tidur, makan, bermain). */
export const routines = sqliteTable("routines", {
  id: text("id").primaryKey(),
  catId: text("cat_id")
    .notNull()
    .references(() => cats.id, { onDelete: "cascade" }),
  activity: text("activity").notNull(), // tidur | makan | bermain
  startHour: integer("start_hour").notNull(),
  endHour: integer("end_hour").notNull(),
  isActive: integer("is_active", { mode: "boolean" }).notNull().default(true),
  lastTriggeredAt: integer("last_triggered_at"),
});

/** Tabel ringkasan pertumbuhan kucing (jumlah interaksi & waktu naik tahap). */
export const catGrowth = sqliteTable("cat_growth", {
  catId: text("cat_id")
    .primaryKey()
    .references(() => cats.id, { onDelete: "cascade" }),
  totalInteractions: integer("total_interactions").notNull().default(0),
  totalXp: integer("total_xp").notNull().default(0),
  stageChangedAt: integer("stage_changed_at").notNull(),
  updatedAt: integer("updated_at").notNull(),
});

/** Tabel riwayat peristiwa pertumbuhan (tambah XP, naik level, ganti tahap). */
export const growthEvents = sqliteTable("growth_events", {
  id: text("id").primaryKey(),
  catId: text("cat_id")
    .notNull()
    .references(() => cats.id, { onDelete: "cascade" }),
  kind: text("kind").notNull(), // xp | level_up | stage_up
  fromStage: text("from_stage"),
  toStage: text("to_stage"),
  level: integer("level").notNull(),
  xpGain: integer("xp_gain").notNull().default(0),
  createdAt: integer("created_at").notNull(),
});

/** Tabel lencana pencapaian yang sudah terbuka beserta waktunya. */
export const catBadges = sqliteTable(
  "cat_badges",
  {
    catId: text("cat_id")
      .notNull()
      .references(() => cats.id, { onDelete: "cascade" }),
    badgeId: text("badge_id").notNull(),
    unlockedAt: integer("unlocked_at").notNull(),
  },
  (t) => [primaryKey({ columns: [t.catId, t.badgeId] })],
);

/** Katalog lencana: syarat (metrik + ambang) untuk membuka tiap pencapaian. */
export const badgeDefinitions = sqliteTable("badge_definitions", {
  code: text("code").primaryKey(),
  name: text("name").notNull(),
  description: text("description").notNull(),
  icon: text("icon").notNull(),
  metric: text("metric").notNull(), // meals | plays | pets | hygiene | level | closeness
  threshold: integer("threshold").notNull(),
  sortOrder: integer("sort_order").notNull().default(0),
});

/** Tabel progres tersimpan & cadangan: snapshot permainan (otomatis, manual, atau cadangan). */
export const gameSaves = sqliteTable("game_saves", {
  id: text("id").primaryKey(),
  catId: text("cat_id")
    .notNull()
    .references(() => cats.id, { onDelete: "cascade" }),
  kind: text("kind").notNull().default("auto"), // auto | manual | backup
  snapshotJson: text("snapshot_json").notNull(),
  backupCode: text("backup_code"),
  deviceLabel: text("device_label").notNull().default("Browser Perangkat Ini"),
  version: integer("version").notNull().default(1),
  createdAt: integer("created_at").notNull(),
});

/** Tabel kode pemulihan: satu kode unik per pemain untuk masuk kembali di perangkat lain. */
export const playerRecoveryCodes = sqliteTable("player_recovery_codes", {
  userId: text("user_id")
    .primaryKey()
    .references(() => users.id, { onDelete: "cascade" }),
  code: text("code").notNull().unique(),
  createdAt: integer("created_at").notNull(),
  lastUsedAt: integer("last_used_at"),
});
