"use client";

import { detectQuality, type QualityLevel } from "./quality";

export interface GraphicsPreferences {
  graphicsQuality: QualityLevel | "auto";
  shadowsEnabled: boolean;
  batterySaver: boolean;
  frameRateLimit: 30 | 60;
  cameraSpeed: "lambat" | "normal" | "cepat";
  autoAdaptedLevel?: QualityLevel;
  lastUpdated: string;
}

export const GRAPHICS_STORAGE_KEY = "mochi_graphics_preferences_v1";

export const DEFAULT_GRAPHICS_PREFERENCES: GraphicsPreferences = {
  graphicsQuality: "sedang",
  shadowsEnabled: true,
  batterySaver: false,
  frameRateLimit: 60,
  cameraSpeed: "normal",
  lastUpdated: new Date().toISOString(),
};

/**
 * Membaca preferensi grafis dan tampilan dari localStorage secara aman.
 */
export function loadGraphicsPreferences(): GraphicsPreferences {
  if (typeof window === "undefined") {
    return { ...DEFAULT_GRAPHICS_PREFERENCES };
  }

  try {
    const raw = window.localStorage.getItem(GRAPHICS_STORAGE_KEY);
    if (!raw) return { ...DEFAULT_GRAPHICS_PREFERENCES };

    const parsed = JSON.parse(raw);
    const validQualities: (QualityLevel | "auto")[] = ["rendah", "sedang", "tinggi", "auto"];
    const quality = validQualities.includes(parsed.graphicsQuality) ? parsed.graphicsQuality : DEFAULT_GRAPHICS_PREFERENCES.graphicsQuality;

    return {
      graphicsQuality: quality,
      shadowsEnabled: typeof parsed.shadowsEnabled === "boolean" ? parsed.shadowsEnabled : DEFAULT_GRAPHICS_PREFERENCES.shadowsEnabled,
      batterySaver: typeof parsed.batterySaver === "boolean" ? parsed.batterySaver : DEFAULT_GRAPHICS_PREFERENCES.batterySaver,
      frameRateLimit: parsed.frameRateLimit === 30 || parsed.frameRateLimit === 60 ? parsed.frameRateLimit : DEFAULT_GRAPHICS_PREFERENCES.frameRateLimit,
      cameraSpeed: ["lambat", "normal", "cepat"].includes(parsed.cameraSpeed) ? parsed.cameraSpeed : DEFAULT_GRAPHICS_PREFERENCES.cameraSpeed,
      autoAdaptedLevel: parsed.autoAdaptedLevel,
      lastUpdated: parsed.lastUpdated || new Date().toISOString(),
    };
  } catch {
    return { ...DEFAULT_GRAPHICS_PREFERENCES };
  }
}

/**
 * Menyimpan preferensi grafis secara otomatis ke localStorage.
 */
export function saveGraphicsPreferences(updates: Partial<GraphicsPreferences>): GraphicsPreferences {
  const current = loadGraphicsPreferences();
  const next: GraphicsPreferences = {
    ...current,
    ...updates,
    lastUpdated: new Date().toISOString(),
  };

  if (typeof window !== "undefined") {
    try {
      window.localStorage.setItem(GRAPHICS_STORAGE_KEY, JSON.stringify(next));
    } catch {
      // localStorage dibatasi / private mode
    }
  }

  return next;
}

/**
 * Mengembalikan konfigurasi grafis ke setelan bawaan.
 */
export function resetGraphicsPreferences(): GraphicsPreferences {
  if (typeof window !== "undefined") {
    try {
      window.localStorage.removeItem(GRAPHICS_STORAGE_KEY);
    } catch {
      // abaikan
    }
  }
  return { ...DEFAULT_GRAPHICS_PREFERENCES };
}

/**
 * Menghitung tingkat kualitas efektif berdasarkan hardware dan preferensi pemain.
 */
export function resolveEffectiveQuality(prefs: GraphicsPreferences): QualityLevel {
  if (prefs.graphicsQuality === "auto") {
    return prefs.autoAdaptedLevel || detectQuality();
  }
  return prefs.graphicsQuality;
}
