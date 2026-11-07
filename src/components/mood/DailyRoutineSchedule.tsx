"use client";

import type { HouseSpot } from "@/components/room/CatHouse";
import { getActiveRoutine, MOCK_ROUTINES, type RoutineItem } from "@/lib/mock-mood";

const TIME_PERIODS = [
  { label: "🌅 Pagi", hour: 7 },
  { label: "☀️ Siang", hour: 13 },
  { label: "🌇 Sore", hour: 17 },
  { label: "🌙 Malam", hour: 21 },
] as const;

function getRoutineStatus(routine: RoutineItem, currentHour: number, activeId: string): "aktif" | "selesai" | "berikutnya" {
  if (routine.id === activeId) return "aktif";
  if (routine.startHour < routine.endHour) {
    return currentHour >= routine.endHour ? "selesai" : "berikutnya";
  }
  return "berikutnya";
}

function getNextRoutine(activeId: string): RoutineItem {
  const idx = MOCK_ROUTINES.findIndex((r) => r.id === activeId);
  return MOCK_ROUTINES[(idx + 1) % MOCK_ROUTINES.length];
}

/** Komponen jadwal rutinitas harian kucing (timeline 24 jam, periode waktu, kegiatan aktif & berikutnya). */
export default function DailyRoutineSchedule({
  name,
  simulatedHour,
  onChangeHour,
  onTriggerRoutine,
}: {
  name: string;
  simulatedHour: number;
  onChangeHour: (hour: number) => void;
  onTriggerRoutine?: (spot: HouseSpot | null, title: string) => void;
}) {
  const activeRoutine = getActiveRoutine(simulatedHour);
  const nextRoutine = getNextRoutine(activeRoutine.id);

  return (
    <div className="space-y-2.5">
      {/* Kartu ringkasan rutinitas aktif & berikutnya */}
      <div className="rounded-2xl bg-amber-50/90 p-3 text-xs">
        <div className="flex items-center justify-between gap-2">
          <div>
            <p className="text-[11px] font-medium text-amber-800">
              Sedang berlangsung ({String(simulatedHour).padStart(2, "0")}:00)
            </p>
            <p className="text-sm font-bold text-stone-800">
              {activeRoutine.icon} {activeRoutine.title}
            </p>
            <p className="text-[11px] text-stone-600">{activeRoutine.description}</p>
          </div>
          <button
            type="button"
            onClick={() => onTriggerRoutine?.(activeRoutine.spot, activeRoutine.title)}
            className="shrink-0 rounded-full bg-amber-500 px-3 py-1.5 text-[11px] font-semibold text-white shadow-sm transition hover:bg-amber-600 active:scale-95"
          >
            Ikuti ›
          </button>
        </div>
        <div className="mt-2 flex items-center justify-between border-t border-amber-200/60 pt-1.5 text-[11px] text-stone-500">
          <span>
            Berikutnya: <strong className="text-stone-700">{nextRoutine.icon} {nextRoutine.title}</strong>
          </span>
          <span>mulai {String(nextRoutine.startHour).padStart(2, "0")}:00</span>
        </div>
      </div>

      {/* Pemilih cepat periode waktu & slider jam */}
      <div className="space-y-1.5 rounded-2xl border border-stone-100 bg-stone-50/70 p-2.5 text-xs">
        <div className="flex items-center justify-between">
          <span className="text-stone-500">Jelajahi waktu rutinitas {name}:</span>
          <strong className="tabular-nums text-amber-800">{String(simulatedHour).padStart(2, "0")}:00 WIB</strong>
        </div>
        <div className="grid grid-cols-4 gap-1">
          {TIME_PERIODS.map((p) => {
            const selected = Math.abs(simulatedHour - p.hour) <= 2;
            return (
              <button
                key={p.label}
                type="button"
                onClick={() => onChangeHour(p.hour)}
                className={`rounded-xl py-1 text-[11px] font-medium transition ${
                  selected ? "bg-amber-400 text-white shadow-sm" : "bg-white text-stone-600 hover:bg-amber-50"
                }`}
              >
                {p.label}
              </button>
            );
          })}
        </div>
        <input
          type="range"
          min={0}
          max={23}
          value={simulatedHour}
          onChange={(e) => onChangeHour(Number(e.target.value))}
          aria-label="Simulasi jam harian"
          className="w-full accent-amber-500"
        />
      </div>

      {/* Daftar timeline jadwal harian */}
      <ul className="max-h-44 space-y-1.5 overflow-y-auto pr-1" aria-label="Daftar jadwal rutinitas harian">
        {MOCK_ROUTINES.map((r) => {
          const status = getRoutineStatus(r, simulatedHour, activeRoutine.id);
          return (
            <li
              key={r.id}
              className={`flex items-center justify-between gap-2 rounded-2xl border px-3 py-2 text-xs transition ${
                status === "aktif"
                  ? "border-amber-400 bg-amber-50/95 text-stone-900 shadow-sm"
                  : status === "selesai"
                    ? "border-stone-100 bg-stone-50/50 text-stone-400"
                    : "border-stone-100 bg-white text-stone-700"
              }`}
            >
              <div className="flex items-center gap-2.5">
                <span className="text-lg">{r.icon}</span>
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="font-semibold">{r.title}</span>
                    <span className="text-[10px] tabular-nums text-stone-400">
                      {String(r.startHour).padStart(2, "0")}:00–{String(r.endHour).padStart(2, "0")}:00
                    </span>
                  </div>
                  <p className="text-[11px] text-stone-500">{r.description}</p>
                </div>
              </div>

              {status === "aktif" ? (
                <span className="shrink-0 rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold text-emerald-700">
                  ● Aktif
                </span>
              ) : status === "selesai" ? (
                <span className="shrink-0 text-[10px] font-medium text-stone-400">✓ Selesai</span>
              ) : (
                <button
                  type="button"
                  onClick={() => onChangeHour(r.startHour)}
                  className="shrink-0 rounded-full bg-stone-100 px-2 py-0.5 text-[10px] font-medium text-stone-600 hover:bg-amber-100 hover:text-amber-800"
                >
                  Lihat jam
                </button>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
