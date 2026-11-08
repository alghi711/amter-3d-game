"use client";

import type { CatStats } from "@/lib/mock-cat";
import { careScore, careStatus, STAT_LABELS } from "@/lib/care-rules";
import { CARE_ACTIONS, type CareAction, type CareLogEntry } from "@/lib/use-care";

export { careScore, careStatus };

const TIPS: Record<keyof CatStats, { text: string; action?: CareAction }> = {
  hunger: { text: "Mangkuk makannya hampir kosong — beri makan, yuk.", action: "makan" },
  thirst: { text: "Sepertinya haus. Isi mangkuk minumnya.", action: "minum" },
  hygiene: { text: "Bulunya mulai kusam. Mandikan atau bersihkan kandang.", action: "mandi" },
  happiness: { text: "Ia tampak bosan. Ajak main bola!", action: "main" },
  energy: { text: "Mulai lelah. Biarkan tidur sebentar di kasur." },
};

/** Panel detail Kondisi Perawatan: skor keseluruhan, tiap kebutuhan, dan saran. */
export default function CareStatusPanel({
  stats,
  deltas,
  history = [],
  name,
  onAction,
  onClose,
}: {
  stats: CatStats;
  deltas?: Partial<CatStats>;
  history?: CareLogEntry[];
  name: string;
  onAction?: (a: CareAction) => void;
  onClose: () => void;
}) {
  const score = careScore(stats);
  const status = careStatus(score);
  const keys = Object.keys(STAT_LABELS) as (keyof CatStats)[];
  const tips = keys.filter((k) => stats[k] < 50).sort((a, b) => stats[a] - stats[b]);

  return (
    <div role="dialog" aria-label="Kondisi perawatan" className="pointer-events-auto mx-auto w-full max-w-md rounded-3xl bg-white/95 p-4 shadow-2xl backdrop-blur">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs text-stone-500">Kondisi perawatan {name}</p>
          <p className={`text-xl font-bold ${status.tone}`}>
            {status.emoji} {status.label}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="rounded-full bg-amber-100 px-3 py-1 text-lg font-bold text-amber-700">{score}</span>
          <button type="button" onClick={onClose} aria-label="Tutup" className="rounded-full px-2 py-1 text-stone-400 hover:bg-stone-100">
            ✕
          </button>
        </div>
      </div>

      <ul className="mt-3 space-y-2">
        {keys.map((k) => {
          const v = Math.round(stats[k]);
          const d = deltas?.[k];
          const color = v < 30 ? "bg-rose-400" : v < 60 ? "bg-amber-400" : "bg-emerald-400";
          return (
            <li key={k} className="flex items-center gap-2 text-sm">
              <span className="w-24 shrink-0">
                {STAT_LABELS[k].icon} {STAT_LABELS[k].label}
              </span>
              <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-stone-200">
                <div className={`h-full rounded-full transition-all duration-500 ${color}`} style={{ width: `${v}%` }} />
              </div>
              <span className="w-14 text-right tabular-nums text-stone-600">
                {v}%
                {d !== undefined && d !== 0 && (
                  <span className={`ml-1 text-[11px] font-bold ${d > 0 ? "text-emerald-600" : "text-amber-600"}`}>
                    ({d > 0 ? `+${d}` : d})
                  </span>
                )}
              </span>
            </li>
          );
        })}
      </ul>

      <div className="mt-3 rounded-2xl bg-amber-50 p-3 text-xs text-stone-600">
        {tips.length ? (
          <ul className="space-y-1.5">
            {tips.slice(0, 2).map((k) => {
              const tip = TIPS[k];
              return (
                <li key={k} className="flex items-center justify-between gap-2">
                  <span>• {tip.text}</span>
                  {tip.action && onAction && (
                    <button
                      type="button"
                      onClick={() => onAction(tip.action!)}
                      className="shrink-0 rounded-full bg-amber-500 px-2.5 py-1 text-[11px] font-semibold text-white shadow-sm hover:bg-amber-600 active:scale-95"
                    >
                      {CARE_ACTIONS[tip.action].icon} {CARE_ACTIONS[tip.action].label}
                    </button>
                  )}
                </li>
              );
            })}
          </ul>
        ) : (
          <p>{name} sedang dalam kondisi prima. Terus rawat dengan penuh kasih! 💕</p>
        )}
      </div>

      {history.length > 0 && (
        <div className="mt-2.5 flex items-center gap-1.5 overflow-x-auto text-[11px] text-stone-500">
          <span className="shrink-0 font-medium">Baru saja:</span>
          {history.slice(0, 3).map((h) => (
            <span key={h.id} className="shrink-0 rounded-full bg-stone-100 px-2 py-0.5 text-stone-700">
              {h.icon} {h.label}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
