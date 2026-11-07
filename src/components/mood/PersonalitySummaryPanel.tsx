"use client";

import type { CatStats } from "@/lib/mock-cat";
import { MOCK_PERSONALITY_TRAITS, type PersonalityTrait } from "@/lib/mock-mood";
import type { CareLogEntry } from "@/lib/use-care";

const EXTRA_TRAIT_POOL: PersonalityTrait[] = [
  ...MOCK_PERSONALITY_TRAITS,
  {
    id: "rapi",
    name: "Bersih & Pesolek",
    icon: "🫧",
    score: 70,
    formedBy: "Rutin dimandikan dan kandangnya selalu bersih",
    description: "Senang menjilati bulu agar selalu berkilau dan wangi.",
  },
  {
    id: "tenang",
    name: "Kalem & Pendiam",
    icon: "☁️",
    score: 60,
    formedBy: "Cukup waktu tidur siang di kasur empuk",
    description: "Suka rebahan santai sambil mengamati suasana rumah.",
  },
];

const clamp = (n: number) => Math.max(15, Math.min(100, Math.round(n)));

/** Hitung skor sifat kepribadian kucing berdasarkan kondisi perawatan & riwayat interaksi pemain. */
export function derivePersonalityTraits(stats: CatStats, history: CareLogEntry[] = []): PersonalityTrait[] {
  const counts = { meal: 0, play: 0, clean: 0, pet: 0 };
  for (const item of history) {
    const l = item.label.toLowerCase();
    if (l.includes("elus") || l.includes("sentuh")) counts.pet++;
    else if (l.includes("mandi") || l.includes("bersih")) counts.clean++;
    else if (l.includes("bola") || l.includes("bulu") || l.includes("tiang") || l.includes("main")) counts.play++;
    else counts.meal++;
  }

  return EXTRA_TRAIT_POOL.map((t) => {
    let bonus = 0;
    if (t.id === "manja") bonus = (stats.happiness - 70) * 0.25 + counts.pet * 5;
    if (t.id === "aktif") bonus = (stats.energy - 55) * 0.2 + counts.play * 6;
    if (t.id === "kuliner") bonus = (stats.hunger - 65) * 0.25 + counts.meal * 5;
    if (t.id === "rapi") bonus = (stats.hygiene - 70) * 0.3 + counts.clean * 6;
    if (t.id === "tenang") bonus = (100 - stats.energy) * 0.15;
    return {
      ...t,
      score: clamp(t.score + bonus),
    };
  }).sort((a, b) => b.score - a.score);
}

/** Panel ringkasan kepribadian kucing: sifat dominan, skor tiap sifat, dan penyebab terbentuknya. */
export default function PersonalitySummaryPanel({
  name,
  stats,
  history = [],
}: {
  name: string;
  stats: CatStats;
  history?: CareLogEntry[];
}) {
  const traits = derivePersonalityTraits(stats, history);
  const dominant = traits[0];

  return (
    <div className="space-y-2.5">
      {/* Kartu sifat utama / julukan */}
      <div className="flex items-center justify-between gap-3 rounded-2xl bg-amber-50/90 p-3 text-xs">
        <div className="flex items-center gap-2.5">
          <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white text-2xl shadow-sm" aria-hidden>
            {dominant.icon}
          </span>
          <div>
            <p className="text-[11px] font-medium text-amber-800">Kepribadian Utama {name}</p>
            <p className="text-sm font-bold text-stone-800">{dominant.name}</p>
            <p className="text-[11px] text-stone-600">{dominant.description}</p>
          </div>
        </div>
        <span className="shrink-0 rounded-full bg-amber-200/80 px-2.5 py-1 text-xs font-bold text-amber-900">
          {dominant.score}%
        </span>
      </div>

      {/* Daftar sifat yang terbentuk */}
      <div className="max-h-44 space-y-2 overflow-y-auto pr-1" aria-label="Daftar sifat kepribadian">
        {traits.slice(0, 4).map((trait) => (
          <div key={trait.id} className="rounded-2xl border border-stone-100 bg-stone-50/80 p-2.5 text-xs">
            <div className="flex items-center justify-between font-semibold text-stone-800">
              <span>
                {trait.icon} {trait.name}
              </span>
              <span className="tabular-nums text-amber-700">{trait.score}%</span>
            </div>
            <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-stone-200">
              <div
                className="h-full rounded-full bg-amber-400 transition-all duration-500"
                style={{ width: `${trait.score}%` }}
              />
            </div>
            <p className="mt-1 text-[11px] text-stone-600">{trait.description}</p>
            <p className="mt-0.5 text-[10px] text-stone-400">Terbentuk karena: {trait.formedBy}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
