"use client";

import type { MockAchievement } from "@/lib/mock-growth";

/** Notifikasi perayaan saat lencana pencapaian baru terbuka. */
export default function BadgeUnlockToast({
  badge,
  onViewCollection,
  onDismiss,
}: {
  badge: MockAchievement;
  onViewCollection?: () => void;
  onDismiss: () => void;
}) {
  return (
    <div
      role="alert"
      aria-live="assertive"
      className="pointer-events-auto mx-auto flex w-full max-w-sm items-center justify-between gap-2.5 rounded-2xl border-2 border-amber-400 bg-gradient-to-r from-amber-50 via-white to-amber-50 px-3.5 py-2.5 text-xs shadow-xl"
    >
      <div className="flex min-w-0 items-center gap-2.5">
        <span
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-amber-400/20 text-2xl shadow-inner"
          aria-hidden
        >
          {badge.icon}
        </span>
        <div className="min-w-0">
          <p className="text-[10px] font-bold tracking-wide text-amber-700 uppercase">
            🎉 Lencana Baru Terbuka!
          </p>
          <p className="truncate text-sm font-bold text-stone-900">{badge.name}</p>
          <p className="truncate text-[11px] text-stone-600">{badge.description}</p>
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-1">
        {onViewCollection && (
          <button
            type="button"
            onClick={onViewCollection}
            className="rounded-full bg-amber-500 px-2.5 py-1 text-[11px] font-semibold text-white shadow-sm hover:bg-amber-600 active:scale-95"
          >
            Lihat ›
          </button>
        )}
        <button
          type="button"
          onClick={onDismiss}
          aria-label="Tutup notifikasi lencana"
          className="rounded-full px-1.5 py-0.5 text-stone-400 hover:bg-stone-100 hover:text-stone-600"
        >
          ✕
        </button>
      </div>
    </div>
  );
}
