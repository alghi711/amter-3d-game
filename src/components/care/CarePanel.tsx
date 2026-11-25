"use client";

import { useEffect, useState } from "react";
import type { CatStats } from "@/lib/mock-cat";
import { careScore, careStatus } from "./CareStatusPanel";
import { CARE_ACTIONS, getRefusalReason, MEAL_ITEMS, STAT_LABELS, TOY_ITEMS, type CareAction, type MealItem, type ToyItem } from "@/lib/use-care";

function formatCooldown(secondsLeft: number): string {
  const m = Math.floor(secondsLeft / 60);
  const s = secondsLeft % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

/** Bilah kondisi ringkas (5 kebutuhan). */
export function StatBars({ stats, deltas }: { stats: CatStats; deltas?: Partial<CatStats> }) {
  return (
    <ul className="grid grid-cols-5 gap-1.5 sm:gap-2" aria-label="Kondisi kucing">
      {(Object.keys(STAT_LABELS) as (keyof CatStats)[]).map((k) => {
        const v = Math.round(stats[k]);
        const d = deltas?.[k];
        const color = v < 30 ? "bg-rose-400" : v < 60 ? "bg-amber-400" : "bg-emerald-400";
        return (
          <li key={k} className="relative flex flex-col items-center gap-0.5 sm:gap-1" title={`${STAT_LABELS[k].label} ${v}%`}>
            <div className="flex items-center gap-0.5">
              <span className="text-sm sm:text-base leading-none" aria-hidden>
                {STAT_LABELS[k].icon}
              </span>
              {d !== undefined && d !== 0 && (
                <span className={`text-[9px] sm:text-[10px] font-bold ${d > 0 ? "text-emerald-600" : "text-amber-600"}`}>
                  {d > 0 ? `+${d}` : d}
                </span>
              )}
            </div>
            <div className="h-1 sm:h-1.5 w-full overflow-hidden rounded-full bg-stone-200" role="progressbar" aria-valuenow={v} aria-valuemin={0} aria-valuemax={100} aria-label={STAT_LABELS[k].label}>
              <div className={`h-full rounded-full transition-all duration-500 ${color}`} style={{ width: `${v}%` }} />
            </div>
            <span className="text-[9px] sm:text-[10px] text-stone-500 leading-tight">{STAT_LABELS[k].label}</span>
          </li>
        );
      })}
    </ul>
  );
}

/** Panel rawat di bawah layar: kondisi + tombol aksi perawatan + bisa dikecilkan/ditutup. */
export default function CarePanel({
  stats,
  deltas,
  onAction,
  onServeMeal,
  onPlayToy,
  busy,
  onOpenStatus,
  litterDirty = true,
  minimized = false,
  onToggleMinimize,
  amterFoodCooldownUntil = 0,
}: {
  stats: CatStats;
  deltas?: Partial<CatStats>;
  onAction: (a: CareAction) => void;
  onServeMeal?: (item: MealItem) => void;
  onPlayToy?: (toy: ToyItem) => void;
  busy?: boolean;
  /** buka panel detail kondisi perawatan */
  onOpenStatus?: () => void;
  litterDirty?: boolean;
  minimized?: boolean;
  onToggleMinimize?: () => void;
  amterFoodCooldownUntil?: number;
}) {
  const [subMenu, setSubMenu] = useState<"makan" | "minum" | "main" | null>(null);
  const [nowMs, setNowMs] = useState<number>(() => Date.now());
  const score = careScore(stats);
  const status = careStatus(score);

  useEffect(() => {
    if (!amterFoodCooldownUntil) return;
    const id = setInterval(() => {
      const cur = Date.now();
      setNowMs(cur);
      if (cur >= amterFoodCooldownUntil) clearInterval(id);
    }, 300);
    return () => clearInterval(id);
  }, [amterFoodCooldownUntil]);

  const amterCooldownSec = Math.max(0, Math.ceil((amterFoodCooldownUntil - nowMs) / 1000));

  const handleClick = (a: CareAction) => {
    if ((a === "makan" || a === "minum") && onServeMeal) {
      setSubMenu((cur) => (cur === a ? null : a));
      return;
    }
    if (getRefusalReason(a, stats, "Amter", litterDirty)) {
      setSubMenu(null);
      onAction(a);
      return;
    }
    if (a === "main" && onPlayToy) {
      setSubMenu((cur) => (cur === "main" ? null : "main"));
      return;
    }
    setSubMenu(null);
    onAction(a);
  };

  if (minimized) {
    return (
      <section
        aria-label="Rawat kucing (dikecilkan)"
        className="pointer-events-auto mx-auto flex w-fit max-w-full items-center gap-2 rounded-full border border-white/85 bg-white/90 px-3 py-1.5 shadow-lg backdrop-blur-md"
      >
        <button
          type="button"
          onClick={onOpenStatus}
          className="flex items-center gap-1.5 text-xs font-bold text-stone-700 hover:text-amber-700"
        >
          <span>{status.emoji}</span>
          <span>Skor {score}</span>
        </button>
        <span className="text-stone-300">|</span>
        <div className="flex items-center gap-1">
          {(Object.keys(CARE_ACTIONS) as CareAction[]).map((a) => (
            <button
              key={a}
              type="button"
              onClick={() => onAction(a)}
              className="flex h-7 w-7 items-center justify-center rounded-full bg-amber-50 text-sm transition hover:bg-amber-100 active:scale-90"
              title={CARE_ACTIONS[a].label}
            >
              {CARE_ACTIONS[a].icon}
            </button>
          ))}
        </div>
        {onToggleMinimize && (
          <button
            type="button"
            onClick={onToggleMinimize}
            className="ml-0.5 rounded-full bg-amber-500 px-2.5 py-1 text-[11px] font-extrabold text-white shadow-xs transition hover:bg-amber-600 active:scale-95"
            aria-label="Buka panel perawatan"
          >
            ▲ Buka
          </button>
        )}
      </section>
    );
  }

  return (
    <section
      aria-label="Rawat kucing"
      className="pointer-events-auto mx-auto w-full max-w-sm sm:max-w-md rounded-2xl sm:rounded-3xl bg-white/88 p-2.5 sm:p-3.5 shadow-xl backdrop-blur"
    >
      <div className="mb-1.5 sm:mb-2 flex items-center justify-between gap-2">
        <button
          type="button"
          onClick={onOpenStatus}
          className="flex flex-1 items-center justify-between rounded-xl px-1 py-0.5 text-left text-[11px] sm:text-xs hover:bg-amber-50"
          aria-label="Lihat detail kondisi perawatan"
        >
          <span className={`font-semibold ${status.tone}`}>
            {status.emoji} {status.label}
          </span>
          <span className="text-stone-500">
            Skor {score} · Detail ›
          </span>
        </button>

        {onToggleMinimize && (
          <button
            type="button"
            onClick={onToggleMinimize}
            className="shrink-0 rounded-full border border-stone-200 bg-stone-100/90 px-2 py-0.5 text-[10px] font-bold text-stone-600 transition hover:bg-stone-200 active:scale-95"
            title="Kecilkan panel bawah"
            aria-label="Kecilkan panel bawah"
          >
            ▼ Kecilkan
          </button>
        )}
      </div>

      <StatBars stats={stats} deltas={deltas} />

      {(subMenu === "makan" || subMenu === "minum") && (
        <div
          className={`mt-2 grid gap-1.5 sm:gap-2 rounded-xl sm:rounded-2xl bg-amber-100/85 p-1.5 sm:p-2 ${
            subMenu === "makan" ? "grid-cols-2 sm:grid-cols-4" : "grid-cols-2"
          }`}
          role="group"
          aria-label={`Pilih ${subMenu}`}
        >
          {MEAL_ITEMS[subMenu].map((item) => {
            const isAmter = item.id === "amter_food";
            const onCooldown = isAmter && amterCooldownSec > 0;
            return (
              <button
                key={item.id}
                type="button"
                disabled={onCooldown}
                onClick={() => {
                  onServeMeal?.(item);
                  setSubMenu(null);
                }}
                className={`relative flex items-center justify-center gap-1 rounded-lg sm:rounded-xl px-2 py-1.5 text-[11px] sm:text-xs font-bold shadow-sm transition active:scale-95 ${
                  isAmter
                    ? onCooldown
                      ? "cursor-not-allowed border border-amber-300/80 bg-stone-200/90 text-stone-500"
                      : "border-2 border-amber-400 bg-gradient-to-r from-amber-500 via-orange-500 to-amber-500 text-white shadow-md shadow-amber-500/25 hover:brightness-105"
                    : "bg-white text-stone-700 hover:bg-amber-50"
                }`}
              >
                <span className="text-sm sm:text-base" aria-hidden>
                  {onCooldown ? "⏳" : item.icon}
                </span>
                <span className="truncate">
                  {onCooldown ? `${item.label} (${formatCooldown(amterCooldownSec)})` : item.label}
                </span>
                {isAmter && !onCooldown && (
                  <span className="ml-0.5 rounded-full bg-white/25 px-1.5 py-0.2 text-[9px] font-extrabold text-white">
                    MAX
                  </span>
                )}
              </button>
            );
          })}
        </div>
      )}

      {subMenu === "main" && (
        <div className="mt-2 flex items-center gap-1.5 sm:gap-2 rounded-xl sm:rounded-2xl bg-amber-100/80 p-1.5 sm:p-2" role="group" aria-label="Pilih mainan">
          {TOY_ITEMS.map((toy) => (
            <button
              key={toy.id}
              type="button"
              onClick={() => {
                onPlayToy?.(toy);
                setSubMenu(null);
              }}
              className="flex flex-1 items-center justify-center gap-1 rounded-lg sm:rounded-xl bg-white px-1.5 py-1 sm:px-2 sm:py-1.5 text-[11px] sm:text-xs font-medium text-stone-700 shadow-sm transition hover:bg-amber-50 active:scale-95"
            >
              <span className="text-sm sm:text-base" aria-hidden>
                {toy.icon}
              </span>
              <span className="truncate">{toy.label}</span>
            </button>
          ))}
        </div>
      )}

      <div className="mt-2 sm:mt-2.5 grid grid-cols-5 gap-1.5 sm:gap-2">
        {(Object.keys(CARE_ACTIONS) as CareAction[]).map((a) => {
          const active = subMenu === a;
          const refused = Boolean(getRefusalReason(a, stats, "Amter", litterDirty));
          const urgent =
            (a === "makan" && stats.hunger < 45) ||
            (a === "minum" && stats.thirst < 40) ||
            (a === "mandi" && stats.hygiene < 45) ||
            (a === "bersihkan" && (litterDirty || stats.hygiene < 45)) ||
            (a === "main" && stats.happiness < 45);
          return (
            <button
              key={a}
              type="button"
              disabled={busy}
              aria-pressed={active}
              onClick={() => handleClick(a)}
              className={`relative flex flex-col items-center gap-0.5 rounded-xl sm:rounded-2xl py-1.5 sm:py-2 text-[11px] sm:text-xs font-medium shadow-sm transition active:scale-95 disabled:opacity-50 ${
                active
                  ? "bg-amber-400 text-white"
                  : urgent
                    ? "needs-attention font-extrabold"
                    : refused
                      ? "bg-stone-100 text-stone-500 hover:bg-stone-200/70"
                      : "bg-amber-50 text-stone-700 hover:bg-amber-100"
              }`}
            >
              <span className="text-base sm:text-xl leading-none" aria-hidden>
                {CARE_ACTIONS[a].icon}
              </span>
              <span className="leading-tight">{CARE_ACTIONS[a].label}</span>
              {urgent && !active && (
                <span className="absolute top-0.5 right-1 text-[9px] font-black text-rose-600 animate-bounce" aria-label="Butuh perhatian">
                  !
                </span>
              )}
              {refused && !urgent && (
                <span className="absolute top-0.5 right-1 text-[8px] sm:text-[9px] text-emerald-600" aria-label="Sudah penuh">
                  ✓
                </span>
              )}
            </button>
          );
        })}
      </div>
    </section>
  );
}
