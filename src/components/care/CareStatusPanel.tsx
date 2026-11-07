"use client";

import type { CatStats } from "@/lib/mock-cat";
import { STAT_LABELS } from "@/lib/use-care";

/** Skor perawatan keseluruhan 0..100 (rata-rata berbobot). */
export function careScore(s: CatStats): number {
  const w: Record<keyof CatStats, number> = { hunger: 0.25, thirst: 0.2, hygiene: 0.2, happiness: 0.25, energy: 0.1 };
  return Math.round((Object.keys(w) as (keyof CatStats)[]).reduce((sum, k) => sum + s[k] * w[k], 0));
}

export function careStatus(score: number): { label: string; emoji: string; tone: string } {
  if (score >= 80) return { label: "Sangat terawat", emoji: "🌟", tone: "text-emerald-600" };
  if (score >= 60) return { label: "Terawat", emoji: "😊", tone: "text-emerald-500" };
  if (score >= 40) return { label: "Butuh perhatian", emoji: "😐", tone: "text-amber-600" };
  return { label: "Kurang terawat", emoji: "🥺", tone: "text-rose-600" };
}

const TIPS: Record<keyof CatStats, string> = {
  hunger: "Mangkuk makannya hampir kosong — beri makan, yuk.",
  thirst: "Sepertinya haus. Isi mangkuk minumnya.",
  hygiene: "Bulunya mulai kusam. Mandikan atau bersihkan kandang.",
  happiness: "Ia tampak bosan. Ajak main bola!",
  energy: "Mulai lelah. Biarkan tidur sebentar di kasur.",
};

/** Panel detail Kondisi Perawatan: skor keseluruhan, tiap kebutuhan, dan saran. */
export default function CareStatusPanel({ stats, name, onClose }: { stats: CatStats; name: string; onClose: () => void }) {
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
          const color = v < 30 ? "bg-rose-400" : v < 60 ? "bg-amber-400" : "bg-emerald-400";
          return (
            <li key={k} className="flex items-center gap-2 text-sm">
              <span className="w-24 shrink-0">
                {STAT_LABELS[k].icon} {STAT_LABELS[k].label}
              </span>
              <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-stone-200">
                <div className={`h-full rounded-full transition-all duration-500 ${color}`} style={{ width: `${v}%` }} />
              </div>
              <span className="w-10 text-right tabular-nums text-stone-600">{v}%</span>
            </li>
          );
        })}
      </ul>

      <div className="mt-3 rounded-2xl bg-amber-50 p-3 text-xs text-stone-600">
        {tips.length ? (
          <ul className="list-inside list-disc space-y-1">
            {tips.slice(0, 2).map((k) => (
              <li key={k}>{TIPS[k]}</li>
            ))}
          </ul>
        ) : (
          <p>{name} sedang dalam kondisi prima. Terus rawat dengan penuh kasih! 💕</p>
        )}
      </div>
    </div>
  );
}
