"use client";

import { useState } from "react";
import ExperienceStageIndicator from "./ExperienceStageIndicator";
import {
  CLOSENESS_TIERS,
  computeGrowthProgress,
  MOCK_ACHIEVEMENTS,
  resolveClosenessTier,
  type GrowthStage,
} from "@/lib/mock-growth";

type GrowthTab = "tahap" | "kedekatan" | "pencapaian";

/** Panel utama Tumbuh Besar: tahap pertumbuhan (anak → dewasa), tingkat kedekatan, dan pencapaian. */
export default function GrowthSheet({
  name,
  experience,
  closeness,
  stageOverride,
  onSelectStage,
  onBoostGrowth,
  onClose,
}: {
  name: string;
  experience: number;
  closeness: number;
  stageOverride: GrowthStage | null;
  onSelectStage: (stage: GrowthStage | null) => void;
  onBoostGrowth?: () => void;
  onClose: () => void;
}) {
  const [tab, setTab] = useState<GrowthTab>("tahap");
  const growth = computeGrowthProgress(experience, stageOverride);
  const closenessTier = resolveClosenessTier(closeness);

  return (
    <div
      role="dialog"
      aria-label="Pertumbuhan, Kedekatan, dan Pencapaian"
      className="pointer-events-auto mx-auto w-full max-w-md rounded-3xl bg-white/95 p-4 shadow-2xl backdrop-blur"
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2.5">
          <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-amber-100 text-2xl shadow-sm" aria-hidden>
            {growth.stageDef.icon}
          </span>
          <div>
            <p className="text-xs text-stone-500">Pertumbuhan & Kedekatan {name}</p>
            <h2 className="text-base font-bold text-stone-800">
              {growth.stageDef.title} · Lv.{growth.level}
            </h2>
            <p className="text-xs text-amber-700">
              {closenessTier.icon} {closenessTier.label} ({Math.round(closeness)}%)
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Tutup panel tumbuh besar"
          className="rounded-full px-2.5 py-1 text-sm text-stone-400 hover:bg-stone-100"
        >
          ✕
        </button>
      </div>

      {/* Navigasi Tab */}
      <div className="mt-3 grid grid-cols-3 gap-1 rounded-2xl bg-stone-100 p-1 text-xs font-medium">
        {(
          [
            ["tahap", "🌱 Pertumbuhan"],
            ["kedekatan", "💕 Kedekatan"],
            ["pencapaian", "🏆 Pencapaian"],
          ] as const
        ).map(([key, label]) => (
          <button
            key={key}
            type="button"
            onClick={() => setTab(key)}
            className={`rounded-xl py-1.5 transition ${
              tab === key ? "bg-white font-semibold text-amber-700 shadow-sm" : "text-stone-600 hover:text-stone-800"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Tab 1: Tahap Pertumbuhan */}
      {tab === "tahap" && (
        <div className="mt-3">
          <ExperienceStageIndicator
            experience={experience}
            stageOverride={stageOverride}
            onSelectStage={onSelectStage}
            onBoostGrowth={onBoostGrowth}
          />
        </div>
      )}

      {/* Tab 2: Tingkat Kedekatan */}
      {tab === "kedekatan" && (
        <div className="mt-3 space-y-2.5 text-xs">
          <div className="rounded-2xl bg-rose-50/80 p-3">
            <div className="flex items-center justify-between">
              <span className="font-bold text-rose-900">
                {closenessTier.icon} {closenessTier.label}
              </span>
              <span className="rounded-full bg-rose-200/80 px-2.5 py-0.5 font-bold text-rose-900">
                {Math.round(closeness)}%
              </span>
            </div>
            <div className="mt-1.5 h-2 w-full overflow-hidden rounded-full bg-rose-200/60">
              <div
                className="h-full rounded-full bg-rose-400 transition-all duration-500"
                style={{ width: `${Math.min(100, Math.max(0, closeness))}%` }}
              />
            </div>
            <p className="mt-1.5 text-[11px] text-stone-600">{closenessTier.description}</p>
          </div>

          <ul className="space-y-1.5">
            {CLOSENESS_TIERS.map((tier) => {
              const reached = closeness >= tier.minScore;
              return (
                <li
                  key={tier.id}
                  className={`flex items-center justify-between rounded-2xl border px-3 py-2 ${
                    reached ? "border-rose-200 bg-white text-stone-800" : "border-stone-100 bg-stone-50 text-stone-400"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-base">{tier.icon}</span>
                    <div>
                      <p className="font-semibold">{tier.label}</p>
                      <p className="text-[11px] text-stone-500">{tier.description}</p>
                    </div>
                  </div>
                  <span className="shrink-0 text-[10px] font-semibold">
                    {reached ? "✓ Tercapai" : `${tier.minScore}%`}
                  </span>
                </li>
              );
            })}
          </ul>
        </div>
      )}

      {/* Tab 3: Pencapaian */}
      {tab === "pencapaian" && (
        <div className="mt-3 max-h-52 space-y-2 overflow-y-auto pr-1 text-xs">
          {MOCK_ACHIEVEMENTS.map((ach) => (
            <div
              key={ach.id}
              className={`flex items-center justify-between gap-2.5 rounded-2xl border p-2.5 ${
                ach.unlocked
                  ? "border-amber-300 bg-amber-50/70 text-stone-800"
                  : "border-stone-100 bg-stone-50/70 text-stone-500"
              }`}
            >
              <div className="flex items-center gap-2.5">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white text-lg shadow-sm">
                  {ach.icon}
                </span>
                <div>
                  <p className="font-bold">{ach.name}</p>
                  <p className="text-[11px]">{ach.description}</p>
                </div>
              </div>
              <span
                className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                  ach.unlocked ? "bg-emerald-100 text-emerald-700" : "bg-stone-200 text-stone-600"
                }`}
              >
                {ach.unlocked ? "Terbuka" : `${ach.progress}%`}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
