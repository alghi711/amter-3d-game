"use client";

import { useState } from "react";
import MoodExpressionPicker from "./MoodExpressionPicker";
import type { HouseSpot } from "@/components/room/CatHouse";
import type { CatStats } from "@/lib/mock-cat";
import {
  buildGentleReminders,
  deriveCatMood,
  getActiveRoutine,
  MOCK_PERSONALITY_TRAITS,
  MOCK_ROUTINES,
  MOOD_DEFINITIONS,
  type CatMood,
  type MoodTransition,
} from "@/lib/mock-mood";

type TabKey = "mood" | "rutinitas" | "kepribadian";

export default function MoodRoutineSheet({
  name,
  stats,
  moodOverride,
  onSelectMood,
  simulatedHour,
  onChangeHour,
  moodHistory = [],
  onGoToSpot,
  onClose,
}: {
  name: string;
  stats: CatStats;
  moodOverride: CatMood | null;
  onSelectMood: (m: CatMood | null) => void;
  simulatedHour: number;
  onChangeHour: (h: number) => void;
  moodHistory?: MoodTransition[];
  onGoToSpot?: (spot: HouseSpot | null, label: string) => void;
  onClose: () => void;
}) {
  const [tab, setTab] = useState<TabKey>("mood");
  const moodInfo = deriveCatMood(stats, simulatedHour, moodOverride);
  const activeRoutine = getActiveRoutine(simulatedHour);
  const reminders = buildGentleReminders(stats, name, simulatedHour);

  return (
    <div
      role="dialog"
      aria-label="Suasana Hati dan Rutinitas"
      className="pointer-events-auto mx-auto w-full max-w-md rounded-3xl bg-white/95 p-4 shadow-2xl backdrop-blur"
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-xs text-stone-500">Suasana Hati & Rutinitas {name}</p>
          <div className="mt-0.5 flex items-center gap-2">
            <span className="text-2xl" aria-hidden>
              {moodInfo.emoji}
            </span>
            <div>
              <h2 className="text-base font-bold text-stone-800">{moodInfo.label}</h2>
              <p className="text-xs text-stone-500">{moodInfo.reason}</p>
            </div>
          </div>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Tutup panel suasana hati"
          className="rounded-full px-2.5 py-1 text-sm text-stone-400 hover:bg-stone-100"
        >
          ✕
        </button>
      </div>

      {/* Tab navigasi */}
      <div className="mt-3 grid grid-cols-3 gap-1 rounded-2xl bg-stone-100 p-1 text-xs font-medium">
        {(
          [
            ["mood", "😺 Suasana Hati"],
            ["rutinitas", "🕰️ Rutinitas"],
            ["kepribadian", "✨ Kepribadian"],
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

      {/* Isi Tab: Suasana Hati */}
      {tab === "mood" && (
        <div className="mt-3 space-y-3">
          <MoodExpressionPicker
            activeMood={moodInfo.mood}
            moodOverride={moodOverride}
            onSelectMood={onSelectMood}
          />

          {moodHistory.length > 0 && (
            <div className="rounded-2xl bg-stone-50 p-2.5 text-xs">
              <p className="font-semibold text-stone-600"> Riwayat Perubahan Mood</p>
              <ul className="mt-1 space-y-1 text-[11px] text-stone-600">
                {moodHistory.slice(0, 3).map((item) => (
                  <li key={item.id} className="flex items-center justify-between gap-2">
                    <span>
                      {MOOD_DEFINITIONS[item.from].emoji} {item.from} →{" "}
                      <strong className="text-amber-800">
                        {MOOD_DEFINITIONS[item.to].emoji} {item.to}
                      </strong>
                    </span>
                    <span className="truncate text-stone-400">karena {item.trigger}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Pengingat Lembut */}
          <div className="space-y-1.5">
            <p className="text-xs font-semibold text-stone-600">🔔 Pengingat Lembut</p>
            {reminders.slice(0, 2).map((rem) => (
              <div
                key={rem.id}
                className="flex items-start gap-2 rounded-2xl border border-amber-200/70 bg-amber-50/50 px-3 py-2 text-xs"
              >
                <span className="text-base leading-none">{rem.icon}</span>
                <div>
                  <p className="font-semibold text-stone-800">{rem.title}</p>
                  <p className="text-stone-600">{rem.message}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Isi Tab: Rutinitas Harian */}
      {tab === "rutinitas" && (
        <div className="mt-3 space-y-3">
          <div className="flex items-center justify-between rounded-2xl bg-amber-50 px-3 py-2 text-xs">
            <div>
              <span className="text-stone-500">Jam permainan: </span>
              <strong className="text-stone-800">{String(simulatedHour).padStart(2, "0")}:00</strong>
            </div>
            <input
              type="range"
              min={0}
              max={23}
              value={simulatedHour}
              onChange={(e) => onChangeHour(Number(e.target.value))}
              aria-label="Simulasi jam harian"
              className="w-36 accent-amber-500"
            />
          </div>

          <ul className="max-h-48 space-y-1.5 overflow-y-auto pr-1">
            {MOCK_ROUTINES.map((r) => {
              const isCurrent = r.id === activeRoutine.id;
              return (
                <li
                  key={r.id}
                  className={`flex items-center justify-between gap-2 rounded-2xl border px-3 py-2 text-xs ${
                    isCurrent
                      ? "border-amber-400 bg-amber-50/90 text-stone-900"
                      : "border-stone-100 bg-stone-50/60 text-stone-600"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{r.icon}</span>
                    <div>
                      <p className="font-semibold">
                        {r.title}{" "}
                        <span className="font-normal text-stone-400">
                          ({String(r.startHour).padStart(2, "0")}:00–{String(r.endHour).padStart(2, "0")}:00)
                        </span>
                      </p>
                      <p className="text-[11px] text-stone-500">{r.description}</p>
                    </div>
                  </div>
                  {isCurrent && (
                    <button
                      type="button"
                      onClick={() => onGoToSpot?.(r.spot, r.title)}
                      className="shrink-0 rounded-full bg-amber-500 px-2.5 py-1 text-[11px] font-semibold text-white shadow-sm hover:bg-amber-600"
                    >
                      Jalankan
                    </button>
                  )}
                </li>
              );
            })}
          </ul>
        </div>
      )}

      {/* Isi Tab: Kepribadian */}
      {tab === "kepribadian" && (
        <div className="mt-3 space-y-2.5">
          <p className="text-xs text-stone-500">
            Kepribadian {name} terbentuk secara bertahap dari caramu merawatnya setiap hari:
          </p>
          {MOCK_PERSONALITY_TRAITS.map((trait) => (
            <div key={trait.id} className="rounded-2xl border border-stone-100 bg-stone-50/80 p-2.5 text-xs">
              <div className="flex items-center justify-between font-semibold text-stone-800">
                <span>
                  {trait.icon} {trait.name}
                </span>
                <span className="text-amber-700">{trait.score}%</span>
              </div>
              <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-stone-200">
                <div className="h-full rounded-full bg-amber-400" style={{ width: `${trait.score}%` }} />
              </div>
              <p className="mt-1 text-[11px] text-stone-600">{trait.description}</p>
              <p className="mt-0.5 text-[10px] text-stone-400">Terbentuk karena: {trait.formedBy}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
