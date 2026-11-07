"use client";

import { useReducer } from "react";
import type { HouseSpot } from "@/components/room/CatHouse";
import { mockCat, type CatStats } from "@/lib/mock-cat";

/** Aksi perawatan yang bisa dilakukan pemain. */
export type CareAction = "makan" | "minum" | "mandi" | "bersihkan" | "main";

export type MealItem = {
  id: string;
  action: "makan" | "minum";
  label: string;
  icon: string;
  fillColor: string;
  effect: Partial<CatStats>;
  message: string;
};

export const MEAL_ITEMS: Record<"makan" | "minum", MealItem[]> = {
  makan: [
    { id: "kibble", action: "makan", label: "Biskuit Ikan", icon: "🐟", fillColor: "#a0522d", effect: { hunger: 25, happiness: 5 }, message: "melahap biskuit ikan dengan lahap" },
    { id: "salmon", action: "makan", label: "Salmon Segar", icon: "🍣", fillColor: "#fa8072", effect: { hunger: 40, happiness: 15 }, message: "sangat senang makan salmon segar!" },
    { id: "snack", action: "makan", label: "Camilan Krim", icon: "🍮", fillColor: "#fde68a", effect: { hunger: 15, happiness: 20 }, message: "menjilat camilan krim sampai habis" },
  ],
  minum: [
    { id: "water", action: "minum", label: "Air Segar", icon: "💧", fillColor: "#93c5fd", effect: { thirst: 30 }, message: "minum air segar" },
    { id: "milk", action: "minum", label: "Susu Kucing", icon: "🥛", fillColor: "#fffbeb", effect: { thirst: 35, hunger: 10, happiness: 12 }, message: "minum susu kucing hangat dengan nikmat" },
  ],
};

export type ToyItem = {
  id: string;
  label: string;
  icon: string;
  color: string;
  spot: HouseSpot;
  effect: Partial<CatStats>;
  message: string;
};

export const TOY_ITEMS: ToyItem[] = [
  { id: "ball", label: "Bola Lonceng", icon: "🧶", color: "#ffd166", spot: "toy", effect: { happiness: 20, energy: -10 }, message: "asyik mengejar bola lonceng" },
  { id: "wand", label: "Tongkat Bulu", icon: "🪶", color: "#f472b6", spot: "toy", effect: { happiness: 28, energy: -15, hunger: -5 }, message: "melompat lincah menangkap tongkat bulu!" },
  { id: "scratch", label: "Garuk Tiang", icon: "🪵", color: "#c49a6c", spot: "scratchPost", effect: { happiness: 18, energy: -8 }, message: "puas mengasah kuku di tiang garuk" },
];

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

type CareDispatch = CareAction | { effect: Partial<CatStats> };

function reducer(stats: CatStats, input: CareDispatch): CatStats {
  const next = { ...stats };
  const effect = typeof input === "string" ? CARE_ACTIONS[input].effect : input.effect;
  for (const [k, v] of Object.entries(effect) as [keyof CatStats, number][]) {
    next[k] = clamp(next[k] + v);
  }
  return next;
}

/** State perawatan sementara (data tiruan, belum tersimpan) — nanti diganti store + backend. */
export function useCare(initial: CatStats = mockCat.stats) {
  const [stats, perform] = useReducer(reducer, initial);
  return { stats, perform };
}
