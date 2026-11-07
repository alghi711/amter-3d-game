import type { HouseSpot } from "@/components/room/CatHouse";

/** Semua state animasi kucing. Model glTF nanti memetakan tiap state ke satu klip animasi. */
export type CatAnimState = "diam" | "jalan" | "makan" | "minum" | "main" | "tidur" | "garuk" | "pup" | "dielus" | "kaget" | "kesal";

/** Aktivitas yang dimulai begitu kucing tiba di sebuah benda. */
export const SPOT_ACTIVITY: Record<HouseSpot, CatAnimState> = {
  foodBowl: "makan",
  waterBowl: "minum",
  toy: "main",
  bed: "tidur",
  scratchPost: "garuk",
  litterBox: "pup",
};

/** Label ramah untuk UI. */
export const ANIM_LABELS: Record<CatAnimState, string> = {
  diam: "Santai",
  jalan: "Berjalan",
  makan: "Makan dengan lahap",
  minum: "Minum",
  main: "Bermain bola",
  tidur: "Tidur siang",
  garuk: "Menggaruk tiang",
  pup: "Di kotak pasir",
  dielus: "Dielus-elus",
  kaget: "Kaget!",
  kesal: "Kesal",
};

export type AnimInputs = {
  /** sedang bergerak menuju target */
  moving: boolean;
  /** benda yang sedang dituju / sudah dicapai */
  spot: HouseSpot | null;
  /** reaksi sentuhan aktif (prioritas tertinggi) */
  reaction: "sentuh" | "elus" | "kesal" | null;
};

/** Tentukan state animasi dari kondisi saat ini. Urutan prioritas: reaksi > jalan > aktivitas > diam. */
export function resolveAnimState({ moving, spot, reaction }: AnimInputs): CatAnimState {
  if (reaction === "kesal") return "kesal";
  if (reaction === "elus") return "dielus";
  if (reaction === "sentuh") return "kaget";
  if (moving) return "jalan";
  if (spot) return SPOT_ACTIVITY[spot];
  return "diam";
}
