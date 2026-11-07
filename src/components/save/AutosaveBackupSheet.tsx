"use client";

import { useState } from "react";
import type { CatStats } from "@/lib/mock-cat";
import type { GrowthStage } from "@/lib/mock-growth";
import type { CatMood } from "@/lib/mock-mood";
import {
  decodeBackupSnapshot,
  encodeBackupSnapshot,
  MOCK_SAVE_SLOTS,
  type AutosaveState,
  type GameSaveSnapshot,
} from "@/lib/mock-saves";

/** Indikator kecil status Simpan Otomatis di pojok layar permainan. */
export function AutosaveStatusPill({
  status,
  lastSavedLabel,
  justSaved = false,
  onClick,
}: {
  status: AutosaveState;
  lastSavedLabel: string;
  justSaved?: boolean;
  onClick?: () => void;
}) {
  const dotColor =
    status === "menyimpan"
      ? "bg-amber-400 animate-ping"
      : status === "tersimpan"
        ? "bg-emerald-500"
        : status === "lokal"
          ? "bg-sky-500"
          : "bg-rose-500";

  const label =
    status === "menyimpan"
      ? "Menyimpan progres…"
      : justSaved
        ? "✓ Progres tersimpan"
        : status === "tersimpan"
          ? `Tersimpan · ${lastSavedLabel}`
          : status === "lokal"
            ? "Tersimpan di perangkat"
            : "Gagal simpan";

  return (
    <button
      type="button"
      onClick={onClick}
      aria-live="polite"
      className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium shadow backdrop-blur transition-all duration-300 active:scale-95 ${
        status === "menyimpan"
          ? "bg-amber-50/90 text-amber-800 ring-1 ring-amber-300"
          : justSaved
            ? "bg-emerald-50/95 text-emerald-800 ring-1 ring-emerald-300"
            : "bg-white/85 text-stone-700 hover:bg-white"
      }`}
      aria-label="Buka pengaturan simpan otomatis dan cadangan"
    >
      <span className="relative flex h-2 w-2 items-center justify-center" aria-hidden>
        <span className={`h-2 w-2 rounded-full ${dotColor}`} />
      </span>
      <span>💾 {label}</span>
    </button>
  );
}

/** Panel Simpan Otomatis, Lanjutkan Permainan Terakhir, dan Cadangan Progres. */
export default function AutosaveBackupSheet({
  catName,
  stage,
  level,
  experience,
  closeness,
  mood,
  stats,
  autosaveStatus,
  lastSavedLabel,
  onSaveNow,
  onRestoreSnapshot,
  onClose,
}: {
  catName: string;
  stage: GrowthStage;
  level: number;
  experience: number;
  closeness: number;
  mood: CatMood;
  stats: CatStats;
  autosaveStatus: AutosaveState;
  lastSavedLabel: string;
  onSaveNow: () => void;
  onRestoreSnapshot: (snap: Partial<GameSaveSnapshot>, label: string) => void;
  onClose: () => void;
}) {
  const [pasteCode, setPasteCode] = useState("");
  const [feedback, setFeedback] = useState<string | null>(null);

  const currentBackupCode = encodeBackupSnapshot({
    id: "save-manual",
    catId: "cat-mochi",
    catName,
    stage,
    level,
    experience,
    closeness,
    mood,
    stats,
    savedAtLabel: lastSavedLabel,
    savedAtMs: 0,
    deviceLabel: "Browser Perangkat Ini",
  });

  const handleCopyCode = async () => {
    try {
      await navigator.clipboard.writeText(currentBackupCode);
      setFeedback("Kode cadangan berhasil disalin! Simpan di catatanmu.");
    } catch {
      setFeedback("Salin kode dari kotak di bawah secara manual.");
    }
  };

  const handleRestoreFromCode = () => {
    const decoded = decodeBackupSnapshot(pasteCode);
    if (!decoded) {
      setFeedback("Kode cadangan tidak dikenali. Pastikan diawali MOCHI1-");
      return;
    }
    onRestoreSnapshot(decoded, "Kode Cadangan");
    setFeedback("Progres berhasil dipulihkan dari kode cadangan!");
    setPasteCode("");
  };

  return (
    <div
      role="dialog"
      aria-label="Simpan Otomatis dan Cadangan Progres"
      className="pointer-events-auto mx-auto w-full max-w-md rounded-3xl bg-white/95 p-4 shadow-2xl backdrop-blur"
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-xs text-stone-500">Simpan Otomatis & Cadangan</p>
          <h2 className="text-base font-bold text-stone-800">💾 Progres Rumah {catName}</h2>
          <p className="text-xs text-emerald-700">
            Status: {autosaveStatus === "menyimpan" ? "Sedang menyimpan…" : `Tersimpan otomatis (${lastSavedLabel})`}
          </p>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Tutup panel simpan otomatis"
          className="rounded-full px-2.5 py-1 text-sm text-stone-400 hover:bg-stone-100"
        >
          ✕
        </button>
      </div>

      {/* Ringkasan Snapshot Saat Ini + Tombol Simpan Sekarang */}
      <div className="mt-3 flex items-center justify-between gap-2 rounded-2xl bg-amber-50/90 p-3 text-xs">
        <div>
          <p className="font-bold text-stone-800">
            Kondisi Saat Ini · Lv.{level} ({stage})
          </p>
          <p className="text-[11px] text-stone-600">
            Kedekatan {Math.round(closeness)}% · Kenyang {Math.round(stats.hunger)}% · Ceria {Math.round(stats.happiness)}%
          </p>
        </div>
        <button
          type="button"
          onClick={() => {
            onSaveNow();
            setFeedback("Kondisi terbaru berhasil disimpan!");
          }}
          className="shrink-0 rounded-full bg-amber-500 px-3 py-1.5 font-semibold text-white shadow-sm hover:bg-amber-600 active:scale-95"
        >
          Simpan Sekarang
        </button>
      </div>

      {/* Daftar Titik Simpanan (Lanjutkan Permainan) */}
      <div className="mt-3 space-y-1.5 text-xs">
        <p className="font-semibold text-stone-600">🕒 Titik Simpanan Terakhir</p>
        {MOCK_SAVE_SLOTS.map((slot) => (
          <div
            key={slot.id}
            className="flex items-center justify-between gap-2 rounded-2xl border border-stone-100 bg-stone-50/80 px-3 py-2"
          >
            <div>
              <p className="font-semibold text-stone-800">
                {slot.savedAtLabel} · <span className="text-amber-800">Lv.{slot.level}</span>
              </p>
              <p className="text-[11px] text-stone-500">
                {slot.deviceLabel} · Kedekatan {slot.closeness}%
              </p>
            </div>
            <button
              type="button"
              onClick={() => onRestoreSnapshot(slot, slot.savedAtLabel)}
              className="shrink-0 rounded-full bg-white px-2.5 py-1 text-[11px] font-semibold text-amber-800 shadow-sm ring-1 ring-amber-200 hover:bg-amber-50"
            >
              Muat
            </button>
          </div>
        ))}
      </div>

      {/* Ekspor & Impor Kode Cadangan */}
      <div className="mt-3 space-y-2 rounded-2xl border border-stone-200/80 bg-stone-50/70 p-3 text-xs">
        <div className="flex items-center justify-between">
          <span className="font-semibold text-stone-700">📦 Cadangkan / Pindah Perangkat</span>
          <button
            type="button"
            onClick={handleCopyCode}
            className="rounded-full bg-stone-800 px-2.5 py-1 text-[11px] font-semibold text-white hover:bg-stone-700"
          >
            Salin Kode Cadangan
          </button>
        </div>
        <input
          type="text"
          readOnly
          value={currentBackupCode}
          aria-label="Kode cadangan progres saat ini"
          className="w-full rounded-xl border border-stone-200 bg-white px-2.5 py-1 font-mono text-[10px] text-stone-600"
        />
        <div className="flex gap-1.5">
          <input
            type="text"
            value={pasteCode}
            onChange={(e) => setPasteCode(e.target.value)}
            placeholder="Tempel kode MOCHI1-... untuk memulihkan"
            aria-label="Tempel kode cadangan"
            className="min-w-0 flex-1 rounded-xl border border-stone-200 bg-white px-2.5 py-1 text-[11px] text-stone-700"
          />
          <button
            type="button"
            onClick={handleRestoreFromCode}
            className="shrink-0 rounded-xl bg-amber-500 px-3 py-1 text-[11px] font-semibold text-white hover:bg-amber-600"
          >
            Pulihkan
          </button>
        </div>
        {feedback && <p className="text-[11px] font-medium text-emerald-700">{feedback}</p>}
      </div>
    </div>
  );
}
