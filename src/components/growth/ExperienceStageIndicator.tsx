"use client";

import { computeGrowthProgress, GROWTH_STAGES, XP_PER_LEVEL, type GrowthStage } from "@/lib/mock-growth";

/** Bilah indikator ringkas XP & Tahap Pertumbuhan untuk kartu header utama. */
export function CompactGrowthBadge({
  experience,
  closeness,
  stageOverride,
  onClick,
}: {
  experience: number;
  closeness: number;
  stageOverride?: GrowthStage | null;
  onClick?: () => void;
}) {
  const growth = computeGrowthProgress(experience, stageOverride);

  return (
    <button
      type="button"
      onClick={onClick}
      className="mt-1 flex w-full flex-col gap-1 rounded-xl bg-amber-50/90 px-2.5 py-1.5 text-left text-xs transition hover:bg-amber-100/80"
      aria-label="Lihat detail pengalaman dan tahap pertumbuhan"
    >
      <div className="flex items-center justify-between gap-2">
        <span className="font-semibold text-stone-700">
          {growth.stageDef.icon} Tahap {growth.stage} · Lv.{growth.level}
        </span>
        <span className="text-[11px] font-medium text-amber-800">
          💕 {Math.round(closeness)}% · {growth.currentLevelXp}/{growth.xpForNextLevel} XP ›
        </span>
      </div>
      <div
        className="h-1.5 w-full overflow-hidden rounded-full bg-amber-200/70"
        role="progressbar"
        aria-valuenow={growth.xpProgressPercent}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label="Progres pengalaman level"
      >
        <div
          className="h-full rounded-full bg-amber-500 transition-all duration-500"
          style={{ width: `${growth.xpProgressPercent}%` }}
        />
      </div>
    </button>
  );
}

/** Komponen indikator pengalaman (XP), tonggak level 1..6+, dan tahapan pertumbuhan kucing. */
export default function ExperienceStageIndicator({
  experience,
  stageOverride,
  onSelectStage,
  onBoostGrowth,
}: {
  experience: number;
  stageOverride: GrowthStage | null;
  onSelectStage: (stage: GrowthStage | null) => void;
  onBoostGrowth?: () => void;
}) {
  const growth = computeGrowthProgress(experience, stageOverride);
  const adultTargetXp = (GROWTH_STAGES.dewasa.minLevel - 1) * XP_PER_LEVEL;
  const remainingToAdult = Math.max(0, adultTargetXp - growth.totalXp);
  const overallAdultPercent = Math.min(100, Math.round((growth.totalXp / adultTargetXp) * 100));

  return (
    <div className="space-y-3 text-xs">
      {/* Kartu XP & Level saat ini */}
      <div className="rounded-2xl bg-amber-50/90 p-3">
        <div className="flex items-center justify-between font-semibold text-stone-800">
          <span>
            Level {growth.level} · {growth.stageDef.title}
          </span>
          <span className="tabular-nums text-amber-800">
            {growth.currentLevelXp} / {growth.xpForNextLevel} XP ({growth.xpProgressPercent}%)
          </span>
        </div>

        <div
          className="mt-1.5 h-2.5 w-full overflow-hidden rounded-full bg-amber-200/60"
          role="progressbar"
          aria-valuenow={growth.xpProgressPercent}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label="Progres XP level saat ini"
        >
          <div
            className="h-full rounded-full bg-amber-500 transition-all duration-500"
            style={{ width: `${growth.xpProgressPercent}%` }}
          />
        </div>

        {/* Stepper Tonggak Level 1 -> 6 (Dewasa) */}
        <div className="mt-2.5 flex items-center justify-between">
          {[1, 2, 3, 4, 5, 6].map((lv) => {
            const reached = growth.level >= lv;
            const isAdultMilestone = lv === 6;
            return (
              <div key={lv} className="flex flex-col items-center gap-0.5">
                <span
                  className={`flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-bold transition ${
                    reached
                      ? isAdultMilestone
                        ? "bg-emerald-500 text-white shadow-sm"
                        : "bg-amber-500 text-white"
                      : "bg-white text-stone-400"
                  }`}
                >
                  {isAdultMilestone ? "🐈" : lv}
                </span>
                <span className="text-[9px] text-stone-500">{isAdultMilestone ? "Dewasa" : `Lv.${lv}`}</span>
              </div>
            );
          })}
        </div>

        <div className="mt-2.5 flex items-center justify-between border-t border-amber-200/60 pt-2 text-[11px] text-stone-600">
          <span>
            {remainingToAdult > 0
              ? `${remainingToAdult} XP lagi menuju Kucing Dewasa (${overallAdultPercent}%)`
              : "🎉 Mochi sudah mencapai tahap Kucing Dewasa!"}
          </span>
          {onBoostGrowth && (
            <button
              type="button"
              onClick={onBoostGrowth}
              className="ml-2 shrink-0 rounded-full bg-amber-500 px-2.5 py-1 font-semibold text-white shadow-sm hover:bg-amber-600 active:scale-95"
            >
              +Latih XP
            </button>
          )}
        </div>
      </div>

      {/* Pilihan Tahap & Keunggulan */}
      <div>
        <div className="flex items-center justify-between text-stone-500">
          <span>Tahap pertumbuhan kucing:</span>
          {stageOverride && (
            <button
              type="button"
              onClick={() => onSelectStage(null)}
              className="font-medium text-amber-700 underline"
            >
              Ikuti level asli
            </button>
          )}
        </div>
        <div className="mt-1.5 grid grid-cols-2 gap-2">
          {(["anak", "dewasa"] as GrowthStage[]).map((st) => {
            const def = GROWTH_STAGES[st];
            const active = growth.stage === st;
            return (
              <button
                key={st}
                type="button"
                onClick={() => onSelectStage(stageOverride === st ? null : st)}
                className={`flex flex-col items-start rounded-2xl border p-2.5 text-left transition ${
                  active
                    ? "border-amber-400 bg-amber-100/70 text-stone-900 shadow-sm"
                    : "border-stone-200 bg-white text-stone-600 hover:bg-stone-50"
                }`}
              >
                <div className="flex w-full items-center justify-between">
                  <span className="text-lg">{def.icon}</span>
                  <span className="rounded-full bg-white/80 px-2 py-0.5 text-[10px] font-semibold text-amber-800">
                    Lv.{def.minLevel}+
                  </span>
                </div>
                <p className="mt-1 font-bold">{def.title}</p>
                <p className="mt-0.5 text-[10px] font-medium text-amber-800">{def.appearance.bodyScaleLabel}</p>
                <ul className="mt-1 space-y-0.5 text-[10px] text-stone-600">
                  <li>• {def.appearance.collarLabel}</li>
                  <li>• {def.appearance.stripeLabel}</li>
                </ul>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
