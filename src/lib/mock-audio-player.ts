"use client";

import { useSyncExternalStore } from "react";
import {
  setSoundEnabled,
  setMusicEnabled,
  setSfxVolume,
  setMusicVolume,
  playCatVocal,
  type SoundEffectType,
} from "./cat-audio";

export type BgmTrackInfo = {
  id: string;
  title: string;
  genre: string;
  bpm: number;
  description: string;
};

export const BGM_TRACKS: BgmTrackInfo[] = [
  {
    id: "cozy-room",
    title: "Melodi Kamar Santai",
    genre: "Lo-Fi Ambient",
    bpm: 72,
    description: "Alunan akord Cmaj7 hangat untuk menemani waktu santai bersama Mochi.",
  },
  {
    id: "sunny-garden",
    title: "Siang Cerah Ceria",
    genre: "Acoustic Pentatonic",
    bpm: 88,
    description: "Melodi riang berfrekuensi ceria saat Mochi aktif mengejar bola wol.",
  },
  {
    id: "peaceful-night",
    title: "Malam Hening & Hangat",
    genre: "Warm Lullaby",
    bpm: 60,
    description: "Dua lapis nada lembut berpadu dengkuran relaksasi untuk tidur pulas.",
  },
];

export type AudioPlayerState = {
  soundEnabled: boolean;
  sfxVolume: number;
  musicEnabled: boolean;
  musicVolume: number;
  currentTrackId: string;
  lastPlayedSfx: SoundEffectType | null;
  lastPlayedAt: string | null;
  audioLogs: string[];
};

let audioState: AudioPlayerState = {
  soundEnabled: true,
  sfxVolume: 80,
  musicEnabled: false,
  musicVolume: 60,
  currentTrackId: "cozy-room",
  lastPlayedSfx: null,
  lastPlayedAt: null,
  audioLogs: ["Inisialisasi sistem pemutar audio Mochi siap."],
};

const listeners = new Set<() => void>();

function notify() {
  listeners.forEach((listener) => listener());
}

function addLog(msg: string) {
  const timestamp = new Date().toLocaleTimeString("id-ID", { hour12: false });
  const entry = `[${timestamp}] ${msg}`;
  audioState = {
    ...audioState,
    audioLogs: [entry, ...audioState.audioLogs.slice(0, 19)],
  };
}

export function getAudioPlayerSnapshot(): AudioPlayerState {
  return audioState;
}

export function getAudioPlayerServerSnapshot(): AudioPlayerState {
  return audioState;
}

export function subscribeAudioPlayer(callback: () => void): () => void {
  listeners.add(callback);
  return () => {
    listeners.delete(callback);
  };
}

export const mockAudioPlayer = {
  toggleSound(): boolean {
    const next = !audioState.soundEnabled;
    setSoundEnabled(next);
    audioState = { ...audioState, soundEnabled: next };
    addLog(`Efek suara kucing ${next ? "diaktifkan 🔊" : "dimatikan 🔇"}`);
    notify();
    return next;
  },

  setSoundEnabled(enabled: boolean) {
    setSoundEnabled(enabled);
    audioState = { ...audioState, soundEnabled: enabled };
    addLog(`Status efek suara: ${enabled ? "Aktif" : "Nonaktif"}`);
    notify();
  },

  setSfxVolume(vol: number) {
    setSfxVolume(vol);
    audioState = { ...audioState, sfxVolume: vol };
    addLog(`Volume SFX diubah menjadi ${vol}%`);
    notify();
  },

  toggleMusic(): boolean {
    const next = !audioState.musicEnabled;
    setMusicEnabled(next);
    audioState = { ...audioState, musicEnabled: next };
    const track = BGM_TRACKS.find((t) => t.id === audioState.currentTrackId);
    addLog(`Musik latar ${next ? `diputar: '${track?.title}' 🎵` : "dihentikan ⏸️"}`);
    notify();
    return next;
  },

  setMusicEnabled(enabled: boolean) {
    setMusicEnabled(enabled);
    audioState = { ...audioState, musicEnabled: enabled };
    const track = BGM_TRACKS.find((t) => t.id === audioState.currentTrackId);
    addLog(`Status musik latar: ${enabled ? `Memutar '${track?.title}'` : "Mati"}`);
    notify();
  },

  setMusicVolume(vol: number) {
    setMusicVolume(vol);
    audioState = { ...audioState, musicVolume: vol };
    addLog(`Volume BGM diubah menjadi ${vol}%`);
    notify();
  },

  selectTrack(trackId: string) {
    const track = BGM_TRACKS.find((t) => t.id === trackId);
    if (!track) return;
    audioState = { ...audioState, currentTrackId: trackId };
    addLog(`Trek musik diganti ke: '${track.title}' (${track.genre})`);
    if (audioState.musicEnabled) {
      setMusicEnabled(false);
      setTimeout(() => {
        setMusicEnabled(true);
      }, 150);
    }
    notify();
  },

  playSfx(type: SoundEffectType, isKitten = false) {
    if (!audioState.soundEnabled) return;
    playCatVocal(type, isKitten);
    audioState = {
      ...audioState,
      lastPlayedSfx: type,
      lastPlayedAt: new Date().toLocaleTimeString("id-ID", { hour12: false }),
    };
    addLog(`Memutar sampel SFX: '${type}' (pitch: ${isKitten ? "anak" : "dewasa"})`);
    notify();
  },
};

export function useAudioPlayer() {
  const state = useSyncExternalStore(
    subscribeAudioPlayer,
    getAudioPlayerSnapshot,
    getAudioPlayerServerSnapshot
  );

  return {
    ...state,
    ...mockAudioPlayer,
    tracks: BGM_TRACKS,
    currentTrack: BGM_TRACKS.find((t) => t.id === state.currentTrackId) || BGM_TRACKS[0],
  };
}
