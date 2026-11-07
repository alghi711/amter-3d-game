"use client";

import { useState } from "react";
import type { CatStats } from "@/lib/mock-cat";
import { computeGrowthProgress, MOCK_ACHIEVEMENTS, type MockAchievement } from "@/lib/mock-growth";
import type { CareLogEntry } from "@/lib/use-care";

type BadgeFilter = "semua" | "terbuka" | "terkunci";

/** Hitung progres & status buka tiap lencana pencapaian secara dinamis dari kondisi permainan. */
export function evaluateAchievementBadges(params: {
  experience: number;
  closeness: number;
  stats?: CatStats;
  history?: CareLogEntry[];
}): MockAchievement[] {
  const { experience, closeness, stats, history = [] } = params;
  const growth = computeGrowthProgress(experience);
  const cleanProgress = stats ? Math.min(100, Math.round(stats.hygiene)) : 80;
  const playCount = history.filter((h) => h.label.toLowerCase().includes("bola") || h.label.toLowerCase().includes("bulu") || h.label.toLowerCase().includes("tiang") || h.label.toLowerCase().includes("main")).length;
  const playProgress = Math.min(100, 65 + playCount * 15);
  const adultProgress = Math.min(100, Math.round((growth.level / 6) * 100));

  return [
    ...MOCK_ACHIEVEMENTS.map((ach) => {
      if (ach.code === "CLEAN_HOME") {
        const unlocked = cleanProgress >= 95;
        return { ...ach, progress: unlocked ? 100 : cleanProgress, unlocked, unlockedAtLabel: unlocked ? "Baru terbuka" : undefined };
      }
      if (ach.code === "PLAY_MASTER") {
        const unlocked = playProgress >= 100;
        return { ...ach, progress: playProgress, unlocked, unlockedAtLabel: unlocked ? "Baru terbuka" : undefined };
      }
      if (ach.code === "GROW_ADULT") {
        const unlocked = growth.stage === "dewasa" || growth.level >= 6;
        return { ...ach, progress: unlocked ? 100 : adultProgress, unlocked, unlockedAtLabel: unlocked ? "Level 6" : undefined };
      }
      return ach;
    }),
    {
      id: "ach-soulmate",
      code: "SOULMATE_BOND",
      name: "Sahabat Sejati",
      description: "Mencapai tingkat kedekatan 90% dengan Mochi berkat perhatian tulus.",
      icon: "👑",
      progress: Math.min(100, Math.round((closeness / 90) * 100)),
      unlocked: closeness >= 90,
      unlockedAtLabel: closeness >= 90 ? "Kedekatan 90%" : undefined,
    },
  ];
}

/** Tampilan Koleksi Lencana Pencapaian dengan filter, ringkasan progres, dan detail lencana terpilih. */
export default function BadgeCollectionGallery({
  badges,
}: {
  badges: MockAchievement[];
}) {
  const [filter, setFilter] = useState<BadgeFilter>("semua");
  const [selectedId, setSelectedId] = useState<string>(badges[0]?.id ?? "");

  const unlockedCount = badges.filter((b) => b.unlocked).length;
  const filtered = badges.filter((b) =>
    filter === "semua" ? true : filter === "terbuka" ? b.unlocked : !b.unlocked,
  );
  const selectedBadge = badges.find((b) => b.id === selectedId) ?? filtered[0] ?? badges[0];

  return (
    <div className="space-y-2.5 text-xs">
      {/* Header ringkasan koleksi & filter */}
      <div className="flex items-center justify-between gap-2 rounded-2xl bg-amber-50/90 px-3 py-2">
        <div>
          <p className="font-bold text-stone-800">
            🏆 {unlockedCount} / {badges.length} Lencana Terbuka
          </p>
          <p className="text-[11px] text-stone-500">Kumpulkan lencana dari merawat dan menyayangi Mochi</p>
        </div>
        <div className="flex gap-1 rounded-xl bg-white p-0.5 shadow-sm">
          {(
            [
              ["semua", "Semua"],
              ["terbuka", "Terbuka"],
              ["terkunci", "Progres"],
            ] as const
          ).map(([key, label]) => (
            <button
              key={key}
              type="button"
              onClick={() => setFilter(key)}
              className={`rounded-lg px-2 py-1 text-[10px] font-semibold transition ${
                filter === key ? "bg-amber-500 text-white" : "text-stone-600 hover:bg-stone-100"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Grid Lencana */}
      <div className="grid grid-cols-3 gap-2" role="list" aria-label="Koleksi lencana pencapaian">
        {filtered.map((ach) => {
          const isSelected = selectedBadge?.id === ach.id;
          return (
            <button
              key={ach.id}
              type="button"
              onClick={() => setSelectedId(ach.id)}
              className={`flex flex-col items-center rounded-2xl border p-2 text-center transition ${
                isSelected
                  ? "border-amber-400 bg-amber-100/80 shadow-sm"
                  : ach.unlocked
                    ? "border-amber-200 bg-white hover:bg-amber-50/60"
                    : "border-stone-200 bg-stone-50/70 opacity-75 hover:opacity-100"
              }`}
            >
              <span
                className={`flex h-9 w-9 items-center justify-center rounded-xl text-lg shadow-sm ${
                  ach.unlocked ? "bg-amber-50" : "bg-stone-200/70 grayscale"
                }`}
              >
                {ach.icon}
              </span>
              <span className="mt-1 line-clamp-1 font-semibold text-stone-800">{ach.name}</span>
              <span
                className={`mt-0.5 text-[10px] font-semibold ${
                  ach.unlocked ? "text-emerald-700" : "text-stone-500"
                }`}
              >
                {ach.unlocked ? "✓ Terbuka" : `${ach.progress}%`}
              </span>
            </button>
          );
        })}
      </div>

      {/* Detail lencana terpilih */}
      {selectedBadge && (
        <div className="rounded-2xl border border-stone-200/80 bg-stone-50/90 p-2.5">
          <div className="flex items-center justify-between gap-2">
            <span className="font-bold text-stone-800">
              {selectedBadge.icon} {selectedBadge.name}
            </span>
            <span
              className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                selectedBadge.unlocked ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-800"
              }`}
            >
              {selectedBadge.unlocked
                ? `Diraih · ${selectedBadge.unlockedAtLabel ?? "Selesai"}`
                : `Progres ${selectedBadge.progress}%`}
            </span>
          </div>
          <p className="mt-1 text-[11px] text-stone-600">{selectedBadge.description}</p>
          <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-stone-200">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                selectedBadge.unlocked ? "bg-emerald-500" : "bg-amber-400"
              }`}
              style={{ width: `${selectedBadge.progress}%` }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
