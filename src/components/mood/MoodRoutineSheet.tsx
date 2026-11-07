"use client";

import { useState } from "react";
import DailyRoutineSchedule from "./DailyRoutineSchedule";
import GentleReminderBanner from "./GentleReminderBanner";
import type { CareAction } from "@/lib/use-care";
import MoodExpressionPicker from "./MoodExpressionPicker";
import PersonalitySummaryPanel from "./PersonalitySummaryPanel";
import type { CareLogEntry } from "@/lib/use-care";
import type { HouseSpot } from "@/components/room/CatHouse";
import type { CatStats } from "@/lib/mock-cat";
import {
  buildGentleReminders,
  deriveCatMood,
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
  careHistory = [],
  onQuickCare,
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
  careHistory?: CareLogEntry[];
  onQuickCare?: (action: CareAction) => void;
  onGoToSpot?: (spot: HouseSpot | null, label: string) => void;
  onClose: () => void;
}) {
  const [tab, setTab] = useState<TabKey>("mood");
  const moodInfo = deriveCatMood(stats, simulatedHour, moodOverride);
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
          <GentleReminderBanner
            reminders={reminders}
            onQuickAction={(a) => {
              onQuickCare?.(a);
              onClose();
            }}
          />
        </div>
      )}

      {/* Isi Tab: Rutinitas Harian */}
      {tab === "rutinitas" && (
        <div className="mt-3">
          <DailyRoutineSchedule
            name={name}
            simulatedHour={simulatedHour}
            onChangeHour={onChangeHour}
            onTriggerRoutine={onGoToSpot}
          />
        </div>
      )}

      {/* Isi Tab: Kepribadian */}
      {tab === "kepribadian" && (
        <div className="mt-3">
          <PersonalitySummaryPanel name={name} stats={stats} history={careHistory} />
        </div>
      )}
    </div>
  );
}
