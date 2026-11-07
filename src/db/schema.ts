import { integer, real, sqliteTable, text } from "drizzle-orm/sqlite-core";

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
