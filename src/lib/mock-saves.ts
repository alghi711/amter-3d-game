import { INITIAL_CAT_STATS, type CatStats } from "@/lib/mock-cat";
import type { GrowthStage } from "@/lib/mock-growth";
import type { CatMood } from "@/lib/mock-mood";

export type AutosaveState = "tersimpan" | "menyimpan" | "lokal" | "gagal";

export type GameSaveSnapshot = {
  id: string;
  catId: string;
  catName: string;
  stage: GrowthStage;
  level: number;
  experience: number;
  closeness: number;
  mood: CatMood;
  stats: CatStats;
  savedAtLabel: string;
  savedAtMs: number;
  deviceLabel: string;
  backupCode: string;
};

export const MOCK_SAVE_SLOTS: GameSaveSnapshot[] = [
  {
    id: "save-auto-latest",
    catId: "cat-mochi",
    catName: "Mochi",
    stage: "anak",
    level: 1,
    experience: 0,
    closeness: 10,
    mood: "senang",
    stats: { ...INITIAL_CAT_STATS },
    savedAtLabel: "Awal Permainan (Lv.1)",
    savedAtMs: Date.now(),
    deviceLabel: "Browser Perangkat Ini",
    backupCode: "MOCHI-LV1-START",
  },
];

const LOCAL_STORAGE_KEY = "mochi:autosave:v2";

/** Buat kode cadangan ringkas (base64 JSON) yang mudah disalin pemain untuk pindah perangkat. */
export function encodeBackupSnapshot(snapshot: Omit<GameSaveSnapshot, "backupCode">): string {
  try {
    const payload = JSON.stringify({
      v: 1,
      n: snapshot.catName,
      s: snapshot.stage,
      lv: snapshot.level,
      xp: snapshot.experience,
      cl: snapshot.closeness,
      m: snapshot.mood,
      st: snapshot.stats,
      dv: snapshot.deviceLabel,
    });
    if (typeof window !== "undefined" && typeof window.btoa === "function") {
      return `MOCHI1-${window.btoa(encodeURIComponent(payload))}`;
    }
    return `MOCHI1-${Buffer.from(payload, "utf-8").toString("base64")}`;
  } catch {
    return "MOCHI-BACKUP-ERR";
  }
}

/** Baca kembali kode cadangan yang ditempel pemain. */
export function decodeBackupSnapshot(code: string): Partial<GameSaveSnapshot> | null {
  const trimmed = code.trim();
  if (!trimmed.startsWith("MOCHI1-")) return null;
  const rawBase64 = trimmed.slice("MOCHI1-".length);
  try {
    const jsonStr =
      typeof window !== "undefined" && typeof window.atob === "function"
        ? decodeURIComponent(window.atob(rawBase64))
        : Buffer.from(rawBase64, "base64").toString("utf-8");
    const parsed = JSON.parse(jsonStr) as {
      n?: string;
      s?: GrowthStage;
      lv?: number;
      xp?: number;
      cl?: number;
      m?: CatMood;
      st?: CatStats;
      dv?: string;
    };
    if (!parsed.st || typeof parsed.xp !== "number") return null;
    return {
      catName: parsed.n ?? "Mochi",
      stage: parsed.s === "dewasa" ? "dewasa" : "anak",
      level: parsed.lv ?? 1,
      experience: parsed.xp,
      closeness: parsed.cl ?? 10,
      mood: parsed.m ?? "senang",
      stats: parsed.st,
      deviceLabel: parsed.dv ?? "Pulihan Cadangan",
    };
  } catch {
    return null;
  }
}

/** Simpan snapshot permainan ke localStorage browser. */
export function writeLocalAutosave(snapshot: GameSaveSnapshot): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(snapshot));
  } catch {
    // abaikan bila storage penuh
  }
}

/** Hapus simpanan lokal untuk reset progres ke awal. */
export function clearLocalAutosave(): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(LOCAL_STORAGE_KEY);
    window.localStorage.removeItem("mochi:autosave:v1");
  } catch {
    // abaikan
  }
}

/** Muat snapshot permainan terakhir dari localStorage browser. */
export function readLocalAutosave(): GameSaveSnapshot | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(LOCAL_STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as GameSaveSnapshot;
  } catch {
    return null;
  }
}
