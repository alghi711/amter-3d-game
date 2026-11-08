"use client";

import { useSyncExternalStore } from "react";
import { defaultSettings, type GameSettings } from "./mock-settings";
import { setSoundEnabled } from "./cat-audio";

const SETTINGS_STORAGE_KEY = "mochi_game_settings_v1";

let memorySettings: GameSettings = { ...defaultSettings };
const listeners = new Set<() => void>();

function notify() {
  listeners.forEach((listener) => listener());
}

function loadInitialSettings(): GameSettings {
  if (typeof window === "undefined") {
    return defaultSettings;
  }
  try {
    const raw = window.localStorage.getItem(SETTINGS_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return { ...defaultSettings, ...parsed };
    }
  } catch {
    // fallback default
  }
  return defaultSettings;
}

// Inisialisasi awal di client
if (typeof window !== "undefined") {
  memorySettings = loadInitialSettings();
  setSoundEnabled(memorySettings.soundEnabled);
}

export function getSettingsSnapshot(): GameSettings {
  return memorySettings;
}

export function getServerSnapshot(): GameSettings {
  return defaultSettings;
}

export function subscribeSettings(callback: () => void): () => void {
  listeners.add(callback);
  return () => {
    listeners.delete(callback);
  };
}

export function updateGameSettings(updates: Partial<GameSettings>): GameSettings {
  memorySettings = {
    ...memorySettings,
    ...updates,
  };

  if (typeof updates.soundEnabled === "boolean") {
    setSoundEnabled(updates.soundEnabled);
  }

  if (typeof window !== "undefined") {
    try {
      window.localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(memorySettings));
    } catch {
      // localStorage gagal (quota/private mode)
    }
  }

  notify();
  return memorySettings;
}

export function resetGameSettings(): GameSettings {
  memorySettings = { ...defaultSettings };
  setSoundEnabled(memorySettings.soundEnabled);
  if (typeof window !== "undefined") {
    try {
      window.localStorage.removeItem(SETTINGS_STORAGE_KEY);
    } catch {
      // abaikan
    }
  }
  notify();
  return memorySettings;
}

export function useGameSettings() {
  const settings = useSyncExternalStore(
    subscribeSettings,
    getSettingsSnapshot,
    getServerSnapshot
  );

  return {
    settings,
    updateSettings: updateGameSettings,
    resetSettings: resetGameSettings,
  };
}
