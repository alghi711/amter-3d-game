"use client";

import { useState } from "react";
import type { CatStats } from "@/lib/mock-cat";
import { careScore, careStatus } from "./CareStatusPanel";
import { CARE_ACTIONS, MEAL_ITEMS, STAT_LABELS, type CareAction, type MealItem } from "@/lib/use-care";

/** Bilah kondisi ringkas (5 kebutuhan). */
export function StatBars({ stats }: { stats: CatStats }) {
  return (
    <ul className="grid grid-cols-5 gap-2" aria-label="Kondisi kucing">
      {(Object.keys(STAT_LABELS) as (keyof CatStats)[]).map((k) => {
        const v = Math.round(stats[k]);
        const color = v < 30 ? "bg-rose-400" : v < 60 ? "bg-amber-400" : "bg-emerald-400";
        return (
          <li key={k} className="flex flex-col items-center gap-1" title={`${STAT_LABELS[k].label} ${v}%`}>
            <span className="text-base leading-none" aria-hidden>
              {STAT_LABELS[k].icon}
            </span>
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-stone-200" role="progressbar" aria-valuenow={v} aria-valuemin={0} aria-valuemax={100} aria-label={STAT_LABELS[k].label}>
              <div className={`h-full rounded-full transition-all duration-500 ${color}`} style={{ width: `${v}%` }} />
            </div>
            <span className="text-[10px] text-stone-500">{STAT_LABELS[k].label}</span>
          </li>
        );
      })}
    </ul>
  );
}

/** Panel rawat di bawah layar: kondisi + tombol aksi perawatan + pilihan sajian makan/minum. */
export default function CarePanel({
  stats,
  onAction,
  onServeMeal,
  busy,
  onOpenStatus,
}: {
  stats: CatStats;
  onAction: (a: CareAction) => void;
  onServeMeal?: (item: MealItem) => void;
  busy?: boolean;
  /** buka panel detail kondisi perawatan */
  onOpenStatus?: () => void;
}) {
  const [mealMenu, setMealMenu] = useState<"makan" | "minum" | null>(null);
  const score = careScore(stats);
  const status = careStatus(score);

  const handleClick = (a: CareAction) => {
    if ((a === "makan" || a === "minum") && onServeMeal) {
      setMealMenu((cur) => (cur === a ? null : a));
      return;
    }
    setMealMenu(null);
    onAction(a);
  };

  return (
    <section
      aria-label="Rawat kucing"
      className="pointer-events-auto mx-auto w-full max-w-md rounded-3xl bg-white/85 p-3 shadow-xl backdrop-blur sm:p-4"
    >
      <button
        type="button"
        onClick={onOpenStatus}
        className="mb-2 flex w-full items-center justify-between rounded-xl px-1 text-left text-xs hover:bg-amber-50"
        aria-label="Lihat detail kondisi perawatan"
      >
        <span className={`font-semibold ${status.tone}`}>
          {status.emoji} {status.label}
        </span>
        <span className="text-stone-500">
          Skor {score} · Detail ›
        </span>
      </button>
      <StatBars stats={stats} />

      {mealMenu && (
        <div className="mt-2.5 flex items-center gap-2 rounded-2xl bg-amber-100/80 p-2" role="group" aria-label={`Pilih ${mealMenu}`}>
          {MEAL_ITEMS[mealMenu].map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => {
                onServeMeal?.(item);
                setMealMenu(null);
              }}
              className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-white px-2 py-1.5 text-xs font-medium text-stone-700 shadow-sm transition hover:bg-amber-50 active:scale-95"
            >
              <span className="text-base" aria-hidden>
                {item.icon}
              </span>
              <span>{item.label}</span>
            </button>
          ))}
        </div>
      )}

      <div className="mt-3 grid grid-cols-5 gap-2">
        {(Object.keys(CARE_ACTIONS) as CareAction[]).map((a) => {
          const active = mealMenu === a;
          return (
            <button
              key={a}
              type="button"
              disabled={busy}
              aria-pressed={active}
              onClick={() => handleClick(a)}
              className={`flex flex-col items-center gap-0.5 rounded-2xl py-2 text-xs font-medium shadow-sm transition active:scale-95 disabled:opacity-50 ${
                active ? "bg-amber-400 text-white" : "bg-amber-50 text-stone-700 hover:bg-amber-100"
              }`}
            >
              <span className="text-xl" aria-hidden>
                {CARE_ACTIONS[a].icon}
              </span>
              {CARE_ACTIONS[a].label}
            </button>
          );
        })}
      </div>
    </section>
  );
}
