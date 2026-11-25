"use client";

export interface AudioPreferences {
  soundEnabled: boolean;
  sfxVolume: number; // 0 - 100
  musicEnabled: boolean;
  musicVolume: number; // 0 - 100
  vocalPitch: "anak" | "dewasa";
  currentTrackId: string;
}

export const DEFAULT_AUDIO_PREFERENCES: AudioPreferences = {
  soundEnabled: true,
  sfxVolume: 100,
  musicEnabled: true,
  musicVolume: 85,
  vocalPitch: "anak",
  currentTrackId: "cozy-room",
};

export const AUDIO_STORAGE_KEY = "mochi_audio_preferences_v1";

/**
 * Membaca preferensi audio dari localStorage dengan validasi aman dan fallback default.
 */
export function loadAudioPreferences(): AudioPreferences {
  if (typeof window === "undefined") {
    return { ...DEFAULT_AUDIO_PREFERENCES };
  }

  try {
    const raw = window.localStorage.getItem(AUDIO_STORAGE_KEY);
    if (!raw) return { ...DEFAULT_AUDIO_PREFERENCES };

    const parsed = JSON.parse(raw);
    return {
      soundEnabled: typeof parsed.soundEnabled === "boolean" ? parsed.soundEnabled : true,
      sfxVolume: typeof parsed.sfxVolume === "number" ? Math.max(90, Math.min(100, parsed.sfxVolume)) : 100,
      musicEnabled: typeof parsed.musicEnabled === "boolean" ? parsed.musicEnabled : true,
      musicVolume: typeof parsed.musicVolume === "number" ? Math.max(80, Math.min(100, parsed.musicVolume)) : 85,
      vocalPitch: parsed.vocalPitch === "dewasa" ? "dewasa" : "anak",
      currentTrackId: typeof parsed.currentTrackId === "string" ? parsed.currentTrackId : DEFAULT_AUDIO_PREFERENCES.currentTrackId,
    };
  } catch {
    return { ...DEFAULT_AUDIO_PREFERENCES };
  }
}

/**
 * Menyimpan preferensi audio ke localStorage dan menyiarkan perubahan.
 */
export function saveAudioPreferences(updates: Partial<AudioPreferences>): AudioPreferences {
  const current = loadAudioPreferences();
  const next: AudioPreferences = {
    ...current,
    ...updates,
  };

  if (typeof window !== "undefined") {
    try {
      window.localStorage.setItem(AUDIO_STORAGE_KEY, JSON.stringify(next));
    } catch {
      // Abaikan jika localStorage dibatasi atau penuh (Private Mode)
    }
  }

  return next;
}

/**
 * Menghapus preferensi dari localStorage dan mengembalikan konfigurasi awal.
 */
export function resetAudioPreferences(): AudioPreferences {
  if (typeof window !== "undefined") {
    try {
      window.localStorage.removeItem(AUDIO_STORAGE_KEY);
    } catch {
      // Abaikan
    }
  }
  return { ...DEFAULT_AUDIO_PREFERENCES };
}
