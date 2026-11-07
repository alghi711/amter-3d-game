"use client";

import { CLOSENESS_TIERS, resolveClosenessTier } from "@/lib/mock-growth";

/** Panel Tingkat Kedekatan dengan label sederhana yang hangat dan mudah dipahami pemain. */
export default function ClosenessLevelPanel({
  name,
  closeness,
  onPetBond,
}: {
  name: string;
  closeness: number;
  onPetBond?: () => void;
}) {
  const safeScore = Math.max(0, Math.min(100, Math.round(closeness)));
  const currentTier = resolveClosenessTier(safeScore);
  const currentIndex = CLOSENESS_TIERS.findIndex((t) => t.id === currentTier.id);
  const nextTier = currentIndex + 1 < CLOSENESS_TIERS.length ? CLOSENESS_TIERS[currentIndex + 1] : null;
  const pointsToNext = nextTier ? Math.max(0, nextTier.minScore - safeScore) : 0;

  return (
    <div className="space-y-2.5 text-xs">
      {/* Kartu status kedekatan utama dengan label sederhana */}
      <div className="rounded-2xl bg-rose-50/90 p-3">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white text-xl shadow-sm" aria-hidden>
              {currentTier.icon}
            </span>
            <div>
              <p className="text-[11px] font-medium text-rose-700">Status Kedekatan {name}</p>
              <p className="text-sm font-bold text-rose-950">{currentTier.label}</p>
            </div>
          </div>
          <span className="rounded-full bg-rose-200/80 px-2.5 py-1 text-xs font-bold text-rose-900">
            {safeScore}%
          </span>
        </div>

        <div
          className="mt-2 h-2.5 w-full overflow-hidden rounded-full bg-rose-200/60"
          role="progressbar"
          aria-valuenow={safeScore}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label="Persentase tingkat kedekatan"
        >
          <div
            className="h-full rounded-full bg-rose-400 transition-all duration-500"
            style={{ width: `${safeScore}%` }}
          />
        </div>

        <p className="mt-1.5 text-[11px] text-stone-600">{currentTier.description}</p>

        <div className="mt-2 flex items-center justify-between border-t border-rose-200/60 pt-2 text-[11px] text-stone-600">
          <span>
            {nextTier
              ? `${pointsToNext}% lagi menuju "${nextTier.label}" ${nextTier.icon}`
              : `💖 ${name} sudah menganggapmu Sahabat Sejati!`}
          </span>
          {onPetBond && (
            <button
              type="button"
              onClick={onPetBond}
              className="ml-2 shrink-0 rounded-full bg-rose-500 px-2.5 py-1 font-semibold text-white shadow-sm hover:bg-rose-600 active:scale-95"
            >
              💕 Sapa & Elus
            </button>
          )}
        </div>
      </div>

      {/* Daftar 4 jenjang label sederhana */}
      <ul className="space-y-1.5" aria-label="Jenjang tingkat kedekatan">
        {CLOSENESS_TIERS.map((tier) => {
          const reached = safeScore >= tier.minScore;
          const isCurrent = tier.id === currentTier.id;
          return (
            <li
              key={tier.id}
              className={`flex items-center justify-between gap-2 rounded-2xl border px-3 py-2 transition ${
                isCurrent
                  ? "border-rose-400 bg-rose-50/70 text-stone-900 shadow-sm"
                  : reached
                    ? "border-rose-200 bg-white text-stone-700"
                    : "border-stone-100 bg-stone-50 text-stone-400"
              }`}
            >
              <div className="flex items-center gap-2">
                <span className="text-base" aria-hidden>
                  {tier.icon}
                </span>
                <div>
                  <p className="font-semibold">{tier.label}</p>
                  <p className="text-[11px] text-stone-500">{tier.description}</p>
                </div>
              </div>
              <span
                className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                  isCurrent
                    ? "bg-rose-500 text-white"
                    : reached
                      ? "bg-emerald-100 text-emerald-700"
                      : "bg-stone-100 text-stone-500"
                }`}
              >
                {isCurrent ? "Saat ini" : reached ? "✓ Akrab" : `Mulai ${tier.minScore}%`}
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
