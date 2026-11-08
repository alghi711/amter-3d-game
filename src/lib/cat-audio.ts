"use client";

import type { CareInteractionType } from "@/lib/care-rules";

export type SoundEffectType =
  | "meow"
  | "happy_meow"
  | "purr_meow"
  | "purr"
  | "chirp"
  | "eat"
  | "drink"
  | "crunch"
  | "lap"
  | "bath"
  | "clean"
  | "sleep"
  | "pop"
  | "chime";

let audioCtx: AudioContext | null = null;
let soundEnabledState = true;
let sfxVolumeState = 0.8; // 0.0 - 1.0

let musicEnabledState = false;
let musicVolumeState = 0.6; // 0.0 - 1.0
let bgmGainNode: GainNode | null = null;
let bgmIntervalId: NodeJS.Timeout | null = null;
let bgmStep = 0;

const realCatAudio: { meow1?: HTMLAudioElement; meow2?: HTMLAudioElement; purr?: HTMLAudioElement } = {};

function initRealAudio() {
  if (typeof window === "undefined" || realCatAudio.meow1) return;
  try {
    realCatAudio.meow1 = new Audio("https://upload.wikimedia.org/wikipedia/commons/6/66/Meow.ogg");
    realCatAudio.meow2 = new Audio("https://upload.wikimedia.org/wikipedia/commons/0/06/Meow_domestic_cat.ogg");
    realCatAudio.purr = new Audio("https://upload.wikimedia.org/wikipedia/commons/6/60/Cat_purring.ogg");
    Object.values(realCatAudio).forEach((a) => {
      if (a) {
        a.crossOrigin = "anonymous";
        a.preload = "auto";
        a.volume = Math.max(0, Math.min(1, 0.65 * sfxVolumeState));
      }
    });
  } catch {
    // abaikan di SSR / lingkungan tanpa audio
  }
}

export function isSoundEnabled(): boolean {
  return soundEnabledState;
}

export function setSoundEnabled(enabled: boolean): void {
  soundEnabledState = enabled;
}

export function getSfxVolume(): number {
  return Math.round(sfxVolumeState * 100);
}

export function setSfxVolume(volPercent: number): void {
  sfxVolumeState = Math.max(0, Math.min(100, volPercent)) / 100;
  Object.values(realCatAudio).forEach((a) => {
    if (a) a.volume = Math.max(0, Math.min(1, 0.65 * sfxVolumeState));
  });
}

export function isMusicEnabled(): boolean {
  return musicEnabledState;
}

export function getMusicVolume(): number {
  return Math.round(musicVolumeState * 100);
}

export function setMusicVolume(volPercent: number): void {
  musicVolumeState = Math.max(0, Math.min(100, volPercent)) / 100;
  if (bgmGainNode && audioCtx) {
    const targetGain = musicEnabledState ? musicVolumeState * 0.14 : 0;
    bgmGainNode.gain.cancelScheduledValues(audioCtx.currentTime);
    bgmGainNode.gain.linearRampToValueAtTime(targetGain, audioCtx.currentTime + 0.1);
  }
}

function ensureAudioContext(): AudioContext | null {
  if (typeof window === "undefined") return null;
  const Ctx = window.AudioContext || (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!audioCtx && Ctx) {
    audioCtx = new Ctx();
  }
  if (audioCtx && audioCtx.state === "suspended") {
    void audioCtx.resume();
  }
  initRealAudio();
  return audioCtx;
}

// Chords sequence for soothing lo-fi room ambience: Cmaj7 -> Am9 -> Fmaj7 -> Gsus4
const CHORD_PROGRESSION: number[][] = [
  [130.81, 196.0, 246.94, 329.63, 392.0], // C3, G3, B3, E4, G4
  [110.0, 164.81, 196.0, 261.63, 329.63], // A2, E3, G3, C4, E4
  [87.31, 130.81, 164.81, 220.0, 261.63], // F2, C3, E3, A3, C4
  [98.0, 146.83, 196.0, 246.94, 293.66],  // G2, D3, G3, B3, D4
];

function playAmbientChord(ctx: AudioContext, masterGain: GainNode, chordIdx: number) {
  const notes = CHORD_PROGRESSION[chordIdx % CHORD_PROGRESSION.length];
  const now = ctx.currentTime;

  notes.forEach((freq, idx) => {
    const osc = ctx.createOscillator();
    const noteGain = ctx.createGain();
    const filter = ctx.createBiquadFilter();

    osc.type = idx % 2 === 0 ? "sine" : "triangle";
    osc.frequency.setValueAtTime(freq, now + idx * 0.12);

    filter.type = "lowpass";
    filter.frequency.setValueAtTime(900, now);
    filter.Q.setValueAtTime(1.2, now);

    const noteStart = now + idx * 0.12;
    const noteDur = 2.4;

    noteGain.gain.setValueAtTime(0.0001, noteStart);
    noteGain.gain.linearRampToValueAtTime(0.18 / notes.length, noteStart + 0.35);
    noteGain.gain.exponentialRampToValueAtTime(0.0001, noteStart + noteDur);

    osc.connect(filter);
    filter.connect(noteGain);
    noteGain.connect(masterGain);

    osc.start(noteStart);
    osc.stop(noteStart + noteDur + 0.05);
  });
}

export function startBackgroundMusic(): void {
  if (typeof window === "undefined") return;
  const ctx = ensureAudioContext();
  if (!ctx) return;

  if (!bgmGainNode) {
    bgmGainNode = ctx.createGain();
    bgmGainNode.connect(ctx.destination);
  }

  musicEnabledState = true;
  const targetGain = musicVolumeState * 0.14;
  bgmGainNode.gain.cancelScheduledValues(ctx.currentTime);
  bgmGainNode.gain.setValueAtTime(bgmGainNode.gain.value, ctx.currentTime);
  bgmGainNode.gain.linearRampToValueAtTime(targetGain, ctx.currentTime + 0.8);

  if (bgmIntervalId) return;

  // Langsung bunyikan akord pertama
  playAmbientChord(ctx, bgmGainNode, bgmStep);
  bgmStep++;

  bgmIntervalId = setInterval(() => {
    if (!musicEnabledState || !bgmGainNode || !audioCtx) return;
    playAmbientChord(audioCtx, bgmGainNode, bgmStep);
    bgmStep++;
  }, 2400);
}

export function stopBackgroundMusic(): void {
  musicEnabledState = false;
  if (bgmGainNode && audioCtx) {
    bgmGainNode.gain.cancelScheduledValues(audioCtx.currentTime);
    bgmGainNode.gain.setValueAtTime(bgmGainNode.gain.value, audioCtx.currentTime);
    bgmGainNode.gain.linearRampToValueAtTime(0.0001, audioCtx.currentTime + 0.6);
  }
  if (bgmIntervalId) {
    clearInterval(bgmIntervalId);
    bgmIntervalId = null;
  }
}

export function setMusicEnabled(enabled: boolean): void {
  if (enabled) {
    startBackgroundMusic();
  } else {
    stopBackgroundMusic();
  }
}

export function toggleBackgroundMusic(): boolean {
  if (musicEnabledState) {
    stopBackgroundMusic();
    return false;
  } else {
    startBackgroundMusic();
    return true;
  }
}

/** Formant-filtered realistic cat vocalization + real sample hybrid. */
export function playCatVocal(type: SoundEffectType, isKitten = false): void {
  if (!soundEnabledState || sfxVolumeState <= 0) return;
  try {
    const ctx = ensureAudioContext();
    const now = ctx ? ctx.currentTime : 0;
    const pitchMult = isKitten ? 1.38 : 1.0;

    // Putar rekaman sampel kucing asli jika tersedia untuk meow / purr
    if (type === "meow" || type === "happy_meow") {
      const sample = type === "happy_meow" ? realCatAudio.meow1 : realCatAudio.meow2;
      if (sample) {
        sample.volume = Math.max(0, Math.min(1, 0.65 * sfxVolumeState));
        sample.currentTime = 0;
        sample.playbackRate = isKitten ? 1.32 : 1.04;
        sample.play().catch(() => {});
      }
    } else if (type === "purr") {
      if (realCatAudio.purr) {
        realCatAudio.purr.volume = Math.max(0, Math.min(1, 0.65 * sfxVolumeState));
        realCatAudio.purr.currentTime = 0;
        realCatAudio.purr.play().catch(() => {});
        setTimeout(() => {
          try {
            realCatAudio.purr?.pause();
          } catch {}
        }, 1600);
      }
    }

    if (!ctx) return;

    if (type === "meow" || type === "happy_meow" || type === "chirp") {
      // Bio-acoustic double-formant cat meow ("M-eee-aaa-oow")
      const dur = type === "chirp" ? 0.26 : 0.52;
      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const filter1 = ctx.createBiquadFilter();
      const filter2 = ctx.createBiquadFilter();
      const masterGain = ctx.createGain();

      osc1.type = "sawtooth";
      osc2.type = "triangle";

      const baseF = (type === "chirp" ? 620 : 490) * pitchMult;
      const peakF = (type === "chirp" ? 920 : 760) * pitchMult;
      const endF = (type === "chirp" ? 680 : 410) * pitchMult;

      osc1.frequency.setValueAtTime(baseF, now);
      osc1.frequency.exponentialRampToValueAtTime(peakF, now + dur * 0.35);
      osc1.frequency.exponentialRampToValueAtTime(endF, now + dur);

      osc2.frequency.setValueAtTime(baseF * 1.005, now);
      osc2.frequency.exponentialRampToValueAtTime(peakF * 1.005, now + dur * 0.35);
      osc2.frequency.exponentialRampToValueAtTime(endF * 1.005, now + dur);

      // Sapuan formant vokal ("ee" -> "ah" -> "oh")
      filter1.type = "bandpass";
      filter1.Q.setValueAtTime(4.5, now);
      filter1.frequency.setValueAtTime(800 * pitchMult, now);
      filter1.frequency.exponentialRampToValueAtTime(1450 * pitchMult, now + dur * 0.4);
      filter1.frequency.exponentialRampToValueAtTime(650 * pitchMult, now + dur);

      filter2.type = "bandpass";
      filter2.Q.setValueAtTime(3.2, now);
      filter2.frequency.setValueAtTime(2200, now);

      masterGain.gain.setValueAtTime(0.001, now);
      masterGain.gain.linearRampToValueAtTime(0.22 * sfxVolumeState, now + 0.06);
      masterGain.gain.exponentialRampToValueAtTime(0.001, now + dur);

      osc1.connect(filter1);
      osc2.connect(filter1);
      filter1.connect(filter2);
      filter2.connect(masterGain);
      masterGain.connect(ctx.destination);

      osc1.start(now);
      osc2.start(now);
      osc1.stop(now + dur + 0.02);
      osc2.stop(now + dur + 0.02);
    } else if (type === "purr") {
      // Rhythmic 27Hz feline purr
      const osc = ctx.createOscillator();
      const lfo = ctx.createOscillator();
      const lfoGain = ctx.createGain();
      const filter = ctx.createBiquadFilter();
      const gain = ctx.createGain();

      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(27, now);

      lfo.type = "sine";
      lfo.frequency.setValueAtTime(3.2, now);
      lfoGain.gain.setValueAtTime(0.08, now);

      filter.type = "lowpass";
      filter.frequency.setValueAtTime(190, now);

      gain.gain.setValueAtTime(0.01, now);
      gain.gain.linearRampToValueAtTime(0.16 * sfxVolumeState, now + 0.2);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 1.3);

      lfo.connect(lfoGain);
      lfoGain.connect(gain.gain);
      osc.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      lfo.start(now);
      osc.stop(now + 1.35);
      lfo.stop(now + 1.35);
    } else if (type === "crunch" || type === "eat") {
      // Crunching kibbles
      for (let i = 0; i < 3; i++) {
        const t = now + i * 0.24;
        const osc = ctx.createOscillator();
        const g = ctx.createGain();
        osc.type = "triangle";
        osc.frequency.setValueAtTime(280 + i * 60, t);
        osc.frequency.exponentialRampToValueAtTime(120, t + 0.09);
        g.gain.setValueAtTime(0.18 * sfxVolumeState, t);
        g.gain.exponentialRampToValueAtTime(0.001, t + 0.1);
        osc.connect(g);
        g.connect(ctx.destination);
        osc.start(t);
        osc.stop(t + 0.11);
      }
      setTimeout(() => playCatVocal("meow", isKitten), 550);
    } else if (type === "lap" || type === "drink") {
      // Water lapping droplets
      for (let i = 0; i < 3; i++) {
        const t = now + i * 0.22;
        const osc = ctx.createOscillator();
        const g = ctx.createGain();
        osc.type = "sine";
        osc.frequency.setValueAtTime(420, t);
        osc.frequency.exponentialRampToValueAtTime(880, t + 0.08);
        g.gain.setValueAtTime(0.14 * sfxVolumeState, t);
        g.gain.exponentialRampToValueAtTime(0.001, t + 0.09);
        osc.connect(g);
        g.connect(ctx.destination);
        osc.start(t);
        osc.stop(t + 0.1);
      }
      setTimeout(() => playCatVocal("chirp", isKitten), 520);
    } else if (type === "purr_meow") {
      playCatVocal("purr", isKitten);
      setTimeout(() => playCatVocal("happy_meow", isKitten), 240);
    } else if (type === "bath") {
      playCatVocal("chime", isKitten);
      setTimeout(() => playCatVocal("happy_meow", isKitten), 350);
    } else if (type === "clean") {
      playCatVocal("chime", isKitten);
      setTimeout(() => playCatVocal("chirp", isKitten), 250);
    } else if (type === "sleep") {
      playCatVocal("purr", isKitten);
    } else if (type === "chime" || type === "pop") {
      const notes = type === "chime" ? [523.25, 659.25, 783.99, 1046.5] : [440, 680];
      notes.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "sine";
        osc.frequency.setValueAtTime(freq, now + idx * 0.065);
        gain.gain.setValueAtTime(0.11 * sfxVolumeState, now + idx * 0.065);
        gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.065 + 0.28);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now + idx * 0.065);
        osc.stop(now + idx * 0.065 + 0.3);
      });
    }
  } catch {
    // abaikan kesalahan audio
  }
}

/** Kompatibilitas mundur dengan nama lama `playCatSound`. */
export function playCatSound(type: SoundEffectType, isKitten = false): void {
  playCatVocal(type, isKitten);
}

export function playSoundForCareAction(action: CareInteractionType, isKitten = false): void {
  if (action === "makan") playCatVocal("crunch", isKitten);
  else if (action === "minum") playCatVocal("lap", isKitten);
  else if (action === "mandi") playCatVocal("bath", isKitten);
  else if (action === "bersihkan") playCatVocal("clean", isKitten);
  else if (action === "main") {
    playCatVocal("chirp", isKitten);
    setTimeout(() => playCatVocal("happy_meow", isKitten), 320);
  } else if (action === "elus") {
    playCatVocal("purr", isKitten);
    setTimeout(() => playCatVocal("happy_meow", isKitten), 240);
  }
}
