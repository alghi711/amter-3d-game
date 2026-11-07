"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { CatStats } from "@/lib/mock-cat";
import type { GrowthStage } from "@/lib/mock-growth";
import type { CatMood } from "@/lib/mock-mood";
import {
  encodeBackupSnapshot,
  readLocalAutosave,
  writeLocalAutosave,
  type AutosaveState,
  type GameSaveSnapshot,
} from "@/lib/mock-saves";

export type AutosaveInputState = {
  catId: string;
  catName: string;
  stage: GrowthStage;
  level: number;
  experience: number;
  closeness: number;
  mood: CatMood;
  stats: CatStats;
};

/**
 * Hook simpan otomatis (autosave) di latar belakang:
 * - Memuat progres terakhir dari localStorage saat sesi dimulai.
 * - Menyimpan otomatis setiap kali kondisi/level/kedekatan berubah (debounce 1.2 detik).
 * - Menyimpan segera saat tab disembunyikan (`visibilitychange`).
 */
export function useAutosave(
  input: AutosaveInputState,
  onHydrate?: (saved: GameSaveSnapshot) => void,
) {
  const [status, setStatus] = useState<AutosaveState>("tersimpan");
  const [lastSavedLabel, setLastSavedLabel] = useState<string>("Baru saja");
  const [justSaved, setJustSaved] = useState(false);
  const hydratedRef = useRef(false);
  const latestInputRef = useRef(input);

  useEffect(() => {
    latestInputRef.current = input;
  });

  // Muat simpanan lokal sekali saat komponen pertama kali dipasang
  useEffect(() => {
    if (hydratedRef.current) return;
    hydratedRef.current = true;
    const saved = readLocalAutosave();
    if (!saved) return;
    const timer = setTimeout(() => {
      onHydrate?.(saved);
      setLastSavedLabel(saved.savedAtLabel || "Dari sesi terakhir");
    }, 20);
    return () => clearTimeout(timer);
  }, [onHydrate]);

  const performSave = useCallback((customLabel = "Baru saja") => {
    const cur = latestInputRef.current;
    setStatus("menyimpan");

    const baseSnap = {
      id: "save-auto-latest",
      catId: cur.catId,
      catName: cur.catName,
      stage: cur.stage,
      level: cur.level,
      experience: cur.experience,
      closeness: cur.closeness,
      mood: cur.mood,
      stats: cur.stats,
      savedAtLabel: customLabel,
      savedAtMs: Date.now(),
      deviceLabel: "Browser Perangkat Ini",
    };

    const snapshot: GameSaveSnapshot = {
      ...baseSnap,
      backupCode: encodeBackupSnapshot(baseSnap),
    };

    writeLocalAutosave(snapshot);

    setTimeout(() => {
      setStatus("tersimpan");
      setLastSavedLabel(customLabel);
      setJustSaved(true);
    }, 300);
    setTimeout(() => {
      setJustSaved(false);
    }, 2200);
  }, []);

  // Debounce autosave setiap kali state permainan berubah
  const fingerprint = `${input.stage}:${input.level}:${input.experience}:${input.closeness}:${input.mood}:${Math.round(input.stats.hunger)}:${Math.round(input.stats.thirst)}:${Math.round(input.stats.hygiene)}:${Math.round(input.stats.happiness)}:${Math.round(input.stats.energy)}`;
  const initialFingerprintRef = useRef<string | null>(null);

  useEffect(() => {
    if (initialFingerprintRef.current === null) {
      initialFingerprintRef.current = fingerprint;
      return;
    }
    if (initialFingerprintRef.current === fingerprint) return;
    initialFingerprintRef.current = fingerprint;

    const debounceId = setTimeout(() => {
      performSave("Baru saja (Otomatis)");
    }, 1200);

    return () => clearTimeout(debounceId);
  }, [fingerprint, performSave]);

  // Simpan segera saat pengguna berpindah tab atau menutup layar di HP
  useEffect(() => {
    const handleVisibility = () => {
      if (document.visibilityState === "hidden") {
        performSave("Tersimpan saat keluar");
      }
    };
    document.addEventListener("visibilitychange", handleVisibility);
    return () => document.removeEventListener("visibilitychange", handleVisibility);
  }, [performSave]);

  return {
    autosaveStatus: status,
    lastSavedLabel,
    justSaved,
    saveNow: () => performSave("Baru saja"),
  };
}
