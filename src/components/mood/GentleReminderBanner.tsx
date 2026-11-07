"use client";

import { useState } from "react";
import type { GentleReminder } from "@/lib/mock-mood";
import { CARE_ACTIONS, type CareAction } from "@/lib/use-care";

const REMINDER_ACTION_MAP: Record<string, CareAction> = {
  "rem-hunger": "makan",
  "rem-thirst": "minum",
  "rem-hygiene": "mandi",
  "rem-play": "main",
};

/** Pita pengingat mengambang (lembut, tidak menghalangi layar) saat kucing butuh makan/perhatian. */
export function FloatingGentleReminder({
  reminders,
  onQuickAction,
}: {
  reminders: GentleReminder[];
  onQuickAction?: (action: CareAction) => void;
}) {
  const [dismissedIds, setDismissedIds] = useState<string[]>([]);
  const urgent = reminders.find(
    (r) => (r.priority === "tinggi" || r.priority === "sedang") && !dismissedIds.includes(r.id),
  );

  if (!urgent) return null;
  const quickAction = REMINDER_ACTION_MAP[urgent.id];

  return (
    <div
      role="status"
      aria-live="polite"
      className="pointer-events-auto mx-auto flex max-w-sm items-center justify-between gap-2 rounded-2xl border border-amber-300/80 bg-white/90 px-3 py-2 text-xs shadow-lg backdrop-blur"
    >
      <div className="flex min-w-0 items-center gap-2">
        <span className="text-lg leading-none" aria-hidden>
          {urgent.icon}
        </span>
        <div className="min-w-0">
          <p className="truncate font-semibold text-stone-800">{urgent.title}</p>
          <p className="truncate text-[11px] text-stone-500">{urgent.message}</p>
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-1">
        {quickAction && onQuickAction && (
          <button
            type="button"
            onClick={() => onQuickAction(quickAction)}
            className="rounded-full bg-amber-500 px-2.5 py-1 text-[11px] font-semibold text-white shadow-sm hover:bg-amber-600 active:scale-95"
          >
            {CARE_ACTIONS[quickAction].icon} {CARE_ACTIONS[quickAction].label}
          </button>
        )}
        <button
          type="button"
          onClick={() => setDismissedIds((prev) => [...prev, urgent.id])}
          aria-label="Sembunyikan pengingat"
          className="rounded-full px-1.5 py-0.5 text-stone-400 hover:bg-stone-100 hover:text-stone-600"
        >
          ✕
        </button>
      </div>
    </div>
  );
}

/** Daftar kartu pengingat lembut di dalam panel Suasana Hati & Rutinitas. */
export default function GentleReminderBanner({
  reminders,
  onQuickAction,
}: {
  reminders: GentleReminder[];
  onQuickAction?: (action: CareAction) => void;
}) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold text-stone-600">🔔 Pengingat Lembut</p>
        <span className="text-[10px] text-stone-400">{reminders.length} pesan</span>
      </div>
      {reminders.slice(0, 3).map((rem) => {
        const quickAction = REMINDER_ACTION_MAP[rem.id];
        const tone =
          rem.priority === "tinggi"
            ? "border-rose-300/80 bg-rose-50/70"
            : rem.priority === "sedang"
              ? "border-amber-200/80 bg-amber-50/60"
              : "border-stone-200/70 bg-stone-50/70";
        return (
          <div
            key={rem.id}
            className={`flex items-center justify-between gap-2 rounded-2xl border px-3 py-2 text-xs ${tone}`}
          >
            <div className="flex items-start gap-2">
              <span className="text-base leading-none" aria-hidden>
                {rem.icon}
              </span>
              <div>
                <p className="font-semibold text-stone-800">{rem.title}</p>
                <p className="text-[11px] text-stone-600">{rem.message}</p>
              </div>
            </div>
            {quickAction && onQuickAction && (
              <button
                type="button"
                onClick={() => onQuickAction(quickAction)}
                className="shrink-0 rounded-full bg-amber-500 px-2.5 py-1 text-[11px] font-semibold text-white shadow-sm hover:bg-amber-600 active:scale-95"
              >
                {CARE_ACTIONS[quickAction].label}
              </button>
            )}
          </div>
        );
      })}
    </div>
  );
}
