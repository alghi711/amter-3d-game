"use client";

import { useReducer } from "react";
import type { HouseSpot } from "@/components/room/CatHouse";
import { mockCat, type CatStats } from "@/lib/mock-cat";

/** Aksi perawatan yang bisa dilakukan pemain. */
export type CareAction = "makan" | "minum" | "mandi" | "bersihkan" | "main";

export const CARE_ACTIONS: Record<
  CareAction,
  { label: string; icon: string; spot: HouseSpot | null; effect: Partial<CatStats>; message: string }
> = {
  makan: { label: "Makan", icon: "🍗", spot: "foodBowl", effect: { hunger: 25, happiness: 5 }, message: "makan dengan lahap" },
  minum: { label: "Minum", icon: "💧", spot: "waterBowl", effect: { thirst: 30 }, message: "minum air segar" },
  mandi: { label: "Mandi", icon: "🛁", spot: null, effect: { hygiene: 35, happiness: -5 }, message: "dimandikan sampai wangi" },
  bersihkan: { label: "Bersihkan", icon: "🧹", spot: "litterBox", effect: { hygiene: 15 }, message: "senang kandangnya bersih" },
  main: { label: "Main", icon: "🧶", spot: "toy", effect: { happiness: 20, energy: -10 }, message: "asyik bermain bola" },
};

export const STAT_LABELS: Record<keyof CatStats, { label: string; icon: string }> = {
  hunger: { label: "Kenyang", icon: "🍗" },
  thirst: { label: "Minum", icon: "💧" },
  hygiene: { label: "Bersih", icon: "🫧" },
  happiness: { label: "Ceria", icon: "😺" },
  energy: { label: "Energi", icon: "⚡" },
};

const clamp = (n: number) => Math.max(0, Math.min(100, n));

function reducer(stats: CatStats, action: CareAction): CatStats {
  const next = { ...stats };
  for (const [k, v] of Object.entries(CARE_ACTIONS[action].effect) as [keyof CatStats, number][]) {
    next[k] = clamp(next[k] + v);
  }
  return next;
}

/** State perawatan sementara (data tiruan, belum tersimpan) — nanti diganti store + backend. */
export function useCare(initial: CatStats = mockCat.stats) {
  const [stats, perform] = useReducer(reducer, initial);
  return { stats, perform };
}
