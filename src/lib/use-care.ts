"use client";

import { useCallback, useEffect, useReducer } from "react";
import { mockCat, type CatStats } from "@/lib/mock-cat";
import {
  CARE_ACTIONS,
  getRefusalReason,
  MEAL_ITEMS,
  STAT_LABELS,
  TOY_ITEMS,
  type CareAction,
  type MealItem,
  type ToyItem,
} from "@/lib/care-rules";

export {
  CARE_ACTIONS,
  getRefusalReason,
  MEAL_ITEMS,
  STAT_LABELS,
  TOY_ITEMS,
  type CareAction,
  type MealItem,
  type ToyItem,
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

/** State perawatan kucing terhubung ke API backend `/api/care/*`. */
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
