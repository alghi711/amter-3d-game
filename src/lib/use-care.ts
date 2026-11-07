"use client";

import { useCallback, useEffect, useReducer } from "react";
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

export type CareLogEntry = {
  id: number;
  label: string;
  icon: string;
  deltas: Partial<CatStats>;
};

type CareState = {
  stats: CatStats;
  lastDeltas: Partial<CatStats>;
  history: CareLogEntry[];
};

type CareDispatch =
  | CareAction
  | { effect: Partial<CatStats>; label?: string; icon?: string }
  | { syncStats: CatStats; deltas?: Partial<CatStats> };

let logSeq = 1;

function reducer(state: CareState, input: CareDispatch): CareState {
  if (typeof input === "object" && "syncStats" in input) {
    return {
      ...state,
      stats: input.syncStats,
      lastDeltas: input.deltas ?? state.lastDeltas,
    };
  }
  const next = { ...state.stats };
  const effect = typeof input === "string" ? CARE_ACTIONS[input].effect : input.effect;
  const label = typeof input === "string" ? CARE_ACTIONS[input].label : (input.label ?? "Rawat");
  const icon = typeof input === "string" ? CARE_ACTIONS[input].icon : (input.icon ?? "✨");
  const deltas: Partial<CatStats> = {};
  for (const [k, v] of Object.entries(effect) as [keyof CatStats, number][]) {
    const updated = clamp(next[k] + v);
    const diff = Math.round(updated - next[k]);
    if (diff !== 0) deltas[k] = diff;
    next[k] = updated;
  }
  const entry: CareLogEntry = { id: logSeq++, label, icon, deltas };
  return {
    stats: next,
    lastDeltas: deltas,
    history: [entry, ...state.history].slice(0, 4),
  };
}

/** State perawatan sementara (data tiruan, belum tersimpan) — nanti diganti store + backend. */
export function useCare(initial: CatStats = mockCat.stats) {
  const [state, dispatch] = useReducer(reducer, { stats: initial, lastDeltas: {}, history: [] });

  useEffect(() => {
    let active = true;
    fetch("/api/care/summary")
      .then((r) => (r.ok ? r.json() : null))
      .then((data: { stats?: CatStats } | null) => {
        if (active && data?.stats) {
          dispatch({ syncStats: data.stats });
        }
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, []);

  const perform = useCallback((input: CareAction | { effect: Partial<CatStats>; label?: string; icon?: string; action?: CareAction; itemType?: string }) => {
    dispatch(input);
    const action: CareAction | undefined = typeof input === "string" ? input : input.action;
    const itemType = typeof input === "object" ? input.itemType : undefined;
    if (!action) return;

    const endpoint =
      action === "makan" || action === "minum"
        ? "/api/care/feed"
        : action === "mandi" || action === "bersihkan"
          ? "/api/care/hygiene"
          : "/api/care/play";

    fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action, itemType }),
    })
      .then((r) => r.json())
      .then((data: { stats?: CatStats; deltas?: Partial<CatStats> }) => {
        if (data?.stats) {
          dispatch({ syncStats: data.stats, deltas: data.deltas });
        }
      })
      .catch(() => {});
  }, []);

  const replaceStats = useCallback((nextStats: CatStats, deltas?: Partial<CatStats>) => {
    dispatch({ syncStats: nextStats, deltas });
  }, []);

  return { stats: state.stats, lastDeltas: state.lastDeltas, history: state.history, perform, replaceStats };
}

const FULL_THRESHOLD = 95;

/** Cek apakah kebutuhan untuk aksi tertentu sudah penuh; kembalikan pesan penolakan ramah bila ya. */
export function getRefusalReason(
  action: CareAction,
  stats: CatStats,
  name: string,
  litterDirty = true,
): string | null {
  if (action === "makan" && stats.hunger >= FULL_THRESHOLD) {
    return `${name} menggeleng pelan — perutnya sudah kenyang sekali 😸`;
  }
  if (action === "minum" && stats.thirst >= FULL_THRESHOLD) {
    return `${name} mengendus mangkuk lalu pergi — belum haus lagi 💧`;
  }
  if (action === "mandi" && stats.hygiene >= FULL_THRESHOLD) {
    return `Bulu ${name} sudah bersih dan wangi, belum perlu mandi lagi ✨`;
  }
  if (action === "bersihkan" && !litterDirty && stats.hygiene >= FULL_THRESHOLD) {
    return `Kotak pasir ${name} masih bersih dan rapi 🌟`;
  }
  if (action === "main") {
    if (stats.energy < 15) {
      return `${name} menguap lebar — terlalu mengantuk untuk bermain 😴`;
    }
    if (stats.happiness >= FULL_THRESHOLD) {
      return `${name} rebahan santai — sudah puas bermain hari ini 🐾`;
    }
  }
  return null;
}
