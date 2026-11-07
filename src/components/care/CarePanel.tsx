"use client";

import type { CatStats } from "@/lib/mock-cat";
import { careScore, careStatus } from "./CareStatusPanel";
import { CARE_ACTIONS, STAT_LABELS, type CareAction } from "@/lib/use-care";

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

/** Panel rawat di bawah layar: kondisi + tombol aksi perawatan. */
export default function CarePanel({
  stats,
  onAction,
  busy,
  onOpenStatus,
}: {
  stats: CatStats;
  onAction: (a: CareAction) => void;
  busy?: boolean;
  /** buka panel detail kondisi perawatan */
  onOpenStatus?: () => void;
}) {
  const score = careScore(stats);
  const status = careStatus(score);
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
      <div className="mt-3 grid grid-cols-5 gap-2">
        {(Object.keys(CARE_ACTIONS) as CareAction[]).map((a) => (
          <button
            key={a}
            type="button"
            disabled={busy}
            onClick={() => onAction(a)}
            className="flex flex-col items-center gap-0.5 rounded-2xl bg-amber-50 py-2 text-xs font-medium text-stone-700 shadow-sm transition hover:bg-amber-100 active:scale-95 disabled:opacity-50"
          >
            <span className="text-xl" aria-hidden>
              {CARE_ACTIONS[a].icon}
            </span>
            {CARE_ACTIONS[a].label}
          </button>
        ))}
      </div>
    </section>
  );
}
