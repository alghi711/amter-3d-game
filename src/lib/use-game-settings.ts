"use client";

import { useSyncExternalStore } from "react";
import { defaultSettings, type GameSettings } from "./mock-settings";
import {
  setSoundEnabled,
  setSfxVolume,
  setMusicEnabled,
  setMusicVolume,
} from "./cat-audio";
import {
  saveAudioPreferences,
  resetAudioPreferences,
  loadAudioPreferences,
} from "./audio-storage";

const SETTINGS_STORAGE_KEY = "mochi_game_settings_v1";

let memorySettings: GameSettings = { ...defaultSettings };
const listeners = new Set<() => void>();

function notify() {
  listeners.forEach((listener) => listener());
}

function syncAudioModules(st: GameSettings) {
  setSoundEnabled(st.soundEnabled);
  setSfxVolume(st.sfxVolume);
  setMusicEnabled(st.musicEnabled);
  setMusicVolume(st.musicVolume);
}

function loadInitialSettings(): GameSettings {
  if (typeof window === "undefined") {
    return defaultSettings;
  }
  const audioPrefs = loadAudioPreferences();
  const baseSettings: GameSettings = {
    ...defaultSettings,
    soundEnabled: audioPrefs.soundEnabled,
    sfxVolume: audioPrefs.sfxVolume,
    musicEnabled: audioPrefs.musicEnabled,
    musicVolume: audioPrefs.musicVolume,
    vocalPitch: audioPrefs.vocalPitch,
  };
  try {
    const raw = window.localStorage.getItem(SETTINGS_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return { ...baseSettings, ...parsed };
    }
  } catch {
    // fallback default
  }
  return baseSettings;
}

// Inisialisasi awal di client
if (typeof window !== "undefined") {
  memorySettings = loadInitialSettings();
  syncAudioModules(memorySettings);
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

  const audioUpdates: Record<string, unknown> = {};
  if (typeof updates.soundEnabled === "boolean") {
    setSoundEnabled(updates.soundEnabled);
    audioUpdates.soundEnabled = updates.soundEnabled;
  }
  if (typeof updates.sfxVolume === "number") {
    setSfxVolume(updates.sfxVolume);
    audioUpdates.sfxVolume = updates.sfxVolume;
  }
  if (typeof updates.musicEnabled === "boolean") {
    setMusicEnabled(updates.musicEnabled);
    audioUpdates.musicEnabled = updates.musicEnabled;
  }
  if (typeof updates.musicVolume === "number") {
    setMusicVolume(updates.musicVolume);
    audioUpdates.musicVolume = updates.musicVolume;
  }
  if (updates.vocalPitch) {
    audioUpdates.vocalPitch = updates.vocalPitch;
  }
  if (Object.keys(audioUpdates).length > 0) {
    saveAudioPreferences(audioUpdates);
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
  syncAudioModules(memorySettings);
  resetAudioPreferences();
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
