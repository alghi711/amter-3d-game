import { randomUUID } from "node:crypto";
import { and, desc, eq } from "drizzle-orm";
import { ensureCareSchema } from "@/db";
import { catMoods, cats, catStats, gameSaves } from "@/db/schema";
import { computeGrowthProgress } from "@/lib/mock-growth";
import { DEFAULT_CAT_ID } from "@/lib/care-repository";
import type { CatStats } from "@/lib/mock-cat";

export const SAVE_VERSION = 1;
export type SaveKind = "auto" | "manual" | "backup";

export type SaveSnapshot = {
  catName: string;
  stage: "anak" | "dewasa";
  level: number;
  experience: number;
  closeness: number;
  mood: "senang" | "lapar" | "bosan" | "ngantuk";
  stats: CatStats;
};

const MOODS = ["senang", "lapar", "bosan", "ngantuk"] as const;
const STAT_KEYS: (keyof CatStats)[] = ["hunger", "thirst", "hygiene", "happiness", "energy"];

const isNum = (v: unknown, min: number, max: number): v is number =>
  typeof v === "number" && Number.isFinite(v) && v >= min && v <= max;

/** Validasi & normalisasi snapshot dari klien; kembalikan pesan error bila tidak valid. */
export function parseSnapshot(input: unknown): { ok: true; snapshot: SaveSnapshot } | { ok: false; error: string } {
  if (!input || typeof input !== "object") return { ok: false, error: "Snapshot harus berupa objek" };
  const o = input as Record<string, unknown>;
  if (typeof o.catName !== "string" || !o.catName.trim() || o.catName.length > 40) {
    return { ok: false, error: "catName wajib diisi (maks 40 karakter)" };
  }
  if (o.stage !== "anak" && o.stage !== "dewasa") return { ok: false, error: "stage harus 'anak' atau 'dewasa'" };
  if (!isNum(o.level, 1, 999) || !Number.isInteger(o.level)) return { ok: false, error: "level harus bilangan bulat 1-999" };
  if (!isNum(o.experience, 0, 1_000_000)) return { ok: false, error: "experience tidak valid" };
  if (!isNum(o.closeness, 0, 100)) return { ok: false, error: "closeness harus 0-100" };
  if (typeof o.mood !== "string" || !(MOODS as readonly string[]).includes(o.mood)) {
    return { ok: false, error: "mood tidak valid" };
  }
  const st = o.stats as Record<string, unknown> | undefined;
  if (!st || typeof st !== "object") return { ok: false, error: "stats wajib diisi" };
  const stats = {} as CatStats;
  for (const k of STAT_KEYS) {
    if (!isNum(st[k], 0, 100)) return { ok: false, error: `stats.${k} harus 0-100` };
    stats[k] = st[k] as number;
  }
  return {
    ok: true,
    snapshot: {
      catName: o.catName.trim(),
      stage: o.stage,
      level: o.level,
      experience: Math.round(o.experience),
      closeness: Math.round(o.closeness),
      mood: o.mood as SaveSnapshot["mood"],
      stats,
    },
  };
}

export type StoredSave = {
  id: string;
  catId: string;
  kind: SaveKind;
  snapshot: SaveSnapshot;
  deviceLabel: string;
  version: number;
  createdAt: number;
};

function toStored(row: typeof gameSaves.$inferSelect): StoredSave {
  return {
    id: row.id,
    catId: row.catId,
    kind: row.kind as SaveKind,
    snapshot: JSON.parse(row.snapshotJson) as SaveSnapshot,
    deviceLabel: row.deviceLabel,
    version: row.version,
    createdAt: row.createdAt,
  };
}

/** Simpan otomatis: hanya satu slot `auto` per kucing yang selalu ditimpa dengan snapshot terbaru. */
export async function writeAutosave(
  catId: string = DEFAULT_CAT_ID,
  snapshot: SaveSnapshot,
  deviceLabel = "Browser Perangkat Ini",
): Promise<StoredSave | null> {
  const db = await ensureCareSchema();
  const [cat] = await db.select().from(cats).where(eq(cats.id, catId)).limit(1);
  if (!cat) return null;

  const now = Date.now();
  const row = {
    id: randomUUID(),
    catId,
    kind: "auto",
    snapshotJson: JSON.stringify(snapshot),
    backupCode: null,
    deviceLabel: deviceLabel.slice(0, 60),
    version: SAVE_VERSION,
    createdAt: now,
  };
  await db.transaction(async (tx) => {
    await tx.delete(gameSaves).where(and(eq(gameSaves.catId, catId), eq(gameSaves.kind, "auto")));
    await tx.insert(gameSaves).values(row);
  });
  return toStored(row as typeof gameSaves.$inferSelect);
}

/** Ambil simpanan otomatis terbaru untuk kucing tertentu. */
export async function readLatestAutosave(catId: string = DEFAULT_CAT_ID): Promise<StoredSave | null> {
  const db = await ensureCareSchema();
  const [row] = await db
    .select()
    .from(gameSaves)
    .where(and(eq(gameSaves.catId, catId), eq(gameSaves.kind, "auto")))
    .orderBy(desc(gameSaves.createdAt))
    .limit(1);
  return row ? toStored(row) : null;
}

/** Ambil progres terakhir pemain dari semua jenis simpanan (otomatis, manual, cadangan). */
export async function readLatestProgress(catId: string = DEFAULT_CAT_ID): Promise<StoredSave | null> {
  const db = await ensureCareSchema();
  const [row] = await db
    .select()
    .from(gameSaves)
    .where(eq(gameSaves.catId, catId))
    .orderBy(desc(gameSaves.createdAt))
    .limit(1);
  return row ? toStored(row) : null;
}

export const MAX_BACKUPS_PER_CAT = 20;

/** Kode cadangan unik & mudah disalin, mis. MOCHI-LV3-A8F2C1. */
function makeBackupCode(level: number): string {
  return `MOCHI-LV${level}-${randomUUID().replace(/-/g, "").slice(0, 6).toUpperCase()}`;
}

/** Buat cadangan manual dari snapshot; cadangan terlama dihapus bila melebihi batas. */
export async function createBackup(
  catId: string = DEFAULT_CAT_ID,
  snapshot: SaveSnapshot,
  deviceLabel = "Browser Perangkat Ini",
): Promise<StoredSave & { backupCode: string } | null> {
  const db = await ensureCareSchema();
  const [cat] = await db.select().from(cats).where(eq(cats.id, catId)).limit(1);
  if (!cat) return null;

  const backupCode = makeBackupCode(snapshot.level);
  const row = {
    id: randomUUID(),
    catId,
    kind: "backup",
    snapshotJson: JSON.stringify(snapshot),
    backupCode,
    deviceLabel: deviceLabel.slice(0, 60),
    version: SAVE_VERSION,
    createdAt: Date.now(),
  };
  await db.insert(gameSaves).values(row);

  const all = await db
    .select({ id: gameSaves.id })
    .from(gameSaves)
    .where(and(eq(gameSaves.catId, catId), eq(gameSaves.kind, "backup")))
    .orderBy(desc(gameSaves.createdAt));
  for (const old of all.slice(MAX_BACKUPS_PER_CAT)) {
    await db.delete(gameSaves).where(eq(gameSaves.id, old.id));
  }
  return { ...toStored(row as typeof gameSaves.$inferSelect), backupCode };
}

/** Daftar cadangan (terbaru dulu). */
export async function listBackups(catId: string = DEFAULT_CAT_ID): Promise<(StoredSave & { backupCode: string })[]> {
  const db = await ensureCareSchema();
  const rows = await db
    .select()
    .from(gameSaves)
    .where(and(eq(gameSaves.catId, catId), eq(gameSaves.kind, "backup")))
    .orderBy(desc(gameSaves.createdAt))
    .limit(MAX_BACKUPS_PER_CAT);
  return rows.map((r) => ({ ...toStored(r), backupCode: r.backupCode ?? "" }));
}

/** Pulihkan progres kucing dari cadangan (berdasarkan id atau kode); terapkan ke tabel kucing, kondisi, dan suasana hati. */
export async function restoreBackup(params: {
  catId?: string;
  backupId?: string;
  backupCode?: string;
}): Promise<{ ok: true; save: StoredSave } | { ok: false; status: 400 | 404; error: string }> {
  const catId = params.catId ?? DEFAULT_CAT_ID;
  if (!params.backupId && !params.backupCode) {
    return { ok: false, status: 400, error: "backupId atau backupCode wajib diisi" };
  }
  const db = await ensureCareSchema();
  const [row] = await db
    .select()
    .from(gameSaves)
    .where(
      and(
        eq(gameSaves.catId, catId),
        eq(gameSaves.kind, "backup"),
        params.backupId ? eq(gameSaves.id, params.backupId) : eq(gameSaves.backupCode, params.backupCode!.trim().toUpperCase()),
      ),
    )
    .limit(1);
  if (!row) return { ok: false, status: 404, error: "Cadangan tidak ditemukan" };

  const save = toStored(row);
  const snap = save.snapshot;
  const growth = computeGrowthProgress(snap.experience);
  const now = Date.now();

  await db.transaction(async (tx) => {
    await tx
      .update(cats)
      .set({
        stage: snap.stage,
        level: growth.level,
        experience: growth.currentLevelXp,
        closeness: snap.closeness,
        lastPlayedAt: now,
      })
      .where(eq(cats.id, catId));
    await tx
      .update(catStats)
      .set({ ...snap.stats, updatedAt: now })
      .where(eq(catStats.catId, catId));
    await tx
      .insert(catMoods)
      .values({ catId, mood: snap.mood, reason: "Dipulihkan dari cadangan", updatedAt: now })
      .onConflictDoUpdate({
        target: catMoods.catId,
        set: { mood: snap.mood, reason: "Dipulihkan dari cadangan", updatedAt: now },
      });
  });
  return { ok: true, save };
}
