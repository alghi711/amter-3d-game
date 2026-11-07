"use client";

import { useState, type ChangeEvent } from "react";
import type { CatStats } from "@/lib/mock-cat";
import type { GrowthStage } from "@/lib/mock-growth";
import type { CatMood } from "@/lib/mock-mood";
import {
  decodeBackupSnapshot,
  encodeBackupSnapshot,
  type GameSaveSnapshot,
} from "@/lib/mock-saves";

/** Panel khusus Cadangkan (Salin Kode / Unduh File JSON) dan Pulihkan Progres (Tempel Kode / Unggah File). */
export default function BackupRestorePanel({
  catName,
  stage,
  level,
  experience,
  closeness,
  mood,
  stats,
  lastSavedLabel,
  onRestoreSnapshot,
}: {
  catName: string;
  stage: GrowthStage;
  level: number;
  experience: number;
  closeness: number;
  mood: CatMood;
  stats: CatStats;
  lastSavedLabel: string;
  onRestoreSnapshot: (snap: Partial<GameSaveSnapshot>, label: string) => void;
}) {
  const [deviceLabel, setDeviceLabel] = useState("HP / Laptop Saya");
  const [pasteCode, setPasteCode] = useState("");
  const [feedback, setFeedback] = useState<{ text: string; tone: "ok" | "err" } | null>(null);

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
    deviceLabel: deviceLabel.trim() || "Perangkat Utama",
  });

  const handleCopyCode = async () => {
    try {
      await navigator.clipboard.writeText(currentBackupCode);
      setFeedback({ text: "Kode cadangan berhasil disalin! Simpan di catatanmu.", tone: "ok" });
    } catch {
      setFeedback({ text: "Salin kode dari kotak di bawah secara manual.", tone: "ok" });
    }
  };

  const handleDownloadJson = () => {
    const payload = {
      schema: "mochi.backup/v1",
      catName,
      stage,
      level,
      experience,
      closeness,
      mood,
      stats,
      deviceLabel: deviceLabel.trim() || "Perangkat Utama",
      backupCode: currentBackupCode,
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `mochi-backup-lv${level}.json`;
    a.click();
    URL.revokeObjectURL(url);
    setFeedback({ text: "File cadangan (.json) berhasil diunduh!", tone: "ok" });
  };

  const handleRestoreFromCode = () => {
    const decoded = decodeBackupSnapshot(pasteCode);
    if (!decoded) {
      setFeedback({ text: "Kode cadangan tidak dikenali. Pastikan diawali MOCHI1-", tone: "err" });
      return;
    }
    onRestoreSnapshot(decoded, decoded.deviceLabel || "Kode Cadangan");
    setFeedback({ text: "Progres berhasil dipulihkan dari kode cadangan!", tone: "ok" });
    setPasteCode("");
  };

  const handleUploadJson = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const text = String(reader.result ?? "");
        const parsed = JSON.parse(text) as Partial<GameSaveSnapshot> & { backupCode?: string };
        if (parsed.backupCode) {
          const fromCode = decodeBackupSnapshot(parsed.backupCode);
          if (fromCode) {
            onRestoreSnapshot(fromCode, file.name);
            setFeedback({ text: `Progres dipulihkan dari file ${file.name}!`, tone: "ok" });
            return;
          }
        }
        if (parsed.stats && typeof parsed.experience === "number") {
          onRestoreSnapshot(parsed, file.name);
          setFeedback({ text: `Progres dipulihkan dari file ${file.name}!`, tone: "ok" });
          return;
        }
        setFeedback({ text: "Format file cadangan tidak valid.", tone: "err" });
      } catch {
        setFeedback({ text: "Gagal membaca file cadangan.", tone: "err" });
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="mt-3 space-y-2 rounded-2xl border border-stone-200/80 bg-stone-50/80 p-3 text-xs">
      <div className="flex items-center justify-between gap-2">
        <span className="font-semibold text-stone-700">📦 Cadangkan & Pulihkan Progres</span>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={handleCopyCode}
            className="rounded-full bg-stone-800 px-2.5 py-1 text-[10px] font-semibold text-white hover:bg-stone-700"
          >
            Salin Kode
          </button>
          <button
            type="button"
            onClick={handleDownloadJson}
            className="rounded-full bg-amber-100 px-2.5 py-1 text-[10px] font-semibold text-amber-900 hover:bg-amber-200"
          >
            Unduh .json
          </button>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <label htmlFor="device-label-input" className="shrink-0 text-[11px] text-stone-500">
          Label perangkat:
        </label>
        <input
          id="device-label-input"
          type="text"
          value={deviceLabel}
          onChange={(e) => setDeviceLabel(e.target.value)}
          className="min-w-0 flex-1 rounded-xl border border-stone-200 bg-white px-2 py-1 text-[11px] text-stone-700"
        />
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

      <div className="flex items-center justify-between pt-0.5 text-[11px] text-stone-500">
        <span>Atau muat dari file cadangan:</span>
        <label className="cursor-pointer font-semibold text-amber-800 underline hover:text-amber-600">
          Pilih file .json
          <input type="file" accept="application/json,.json" onChange={handleUploadJson} className="hidden" />
        </label>
      </div>

      {feedback && (
        <p className={`text-[11px] font-medium ${feedback.tone === "ok" ? "text-emerald-700" : "text-rose-600"}`}>
          {feedback.text}
        </p>
      )}
    </div>
  );
}
