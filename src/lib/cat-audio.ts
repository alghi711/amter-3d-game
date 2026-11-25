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
let sfxVolumeState = 1.0; // 0.0 - 1.0 (Maksimal kencang & jernih)

let musicEnabledState = true;
let musicVolumeState = 0.85; // 0.0 - 1.0 (Keras & hangat)
let bgmGainNode: GainNode | null = null;
let bgmIntervalId: NodeJS.Timeout | null = null;
let bgmStep = 0;

const realCatAudio: { meow1?: HTMLAudioElement; meow2?: HTMLAudioElement; purr?: HTMLAudioElement } = {};

function initRealAudio() {
  if (typeof window === "undefined" || realCatAudio.purr) return;
  try {
    realCatAudio.meow1 = new Audio("/sounds/cat-meow.wav");
    realCatAudio.meow2 = new Audio("/sounds/cat-meow.wav");
    realCatAudio.purr = new Audio("/sounds/cat-purr.wav");
    Object.values(realCatAudio).forEach((a) => {
      if (a) {
        a.preload = "auto";
        a.volume = Math.max(0, Math.min(1, 1.0 * sfxVolumeState));
      }
    });
  } catch {
    // abaikan di SSR / lingkungan tanpa audio
  }
}

function playAudioSample(src: string, volume = 1.0, playbackRate = 1.0) {
  if (typeof window === "undefined") return;
  try {
    const audio = new Audio(src);
    audio.volume = Math.max(0, Math.min(1, volume * sfxVolumeState));
    audio.playbackRate = playbackRate;
    audio.play().catch(() => {});
  } catch {
    // abaikan jika dicegah browser
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
    if (a) a.volume = Math.max(0, Math.min(1, 1.0 * sfxVolumeState));
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
    const targetGain = musicEnabledState ? musicVolumeState * 0.65 : 0;
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
    osc.frequency.setValueAtTime(freq, now + idx * 0.08);

    filter.type = "lowpass";
    filter.frequency.setValueAtTime(1400, now);
    filter.Q.setValueAtTime(1.0, now);

    const noteStart = now + idx * 0.08;
    const noteDur = 2.6;

    noteGain.gain.setValueAtTime(0.0001, noteStart);
    noteGain.gain.linearRampToValueAtTime(0.55 / Math.sqrt(notes.length), noteStart + 0.25);
    noteGain.gain.exponentialRampToValueAtTime(0.0001, noteStart + noteDur);

    osc.connect(filter);
    filter.connect(noteGain);
    noteGain.connect(masterGain);

    osc.start(noteStart);
    osc.stop(noteStart + noteDur + 0.05);
  });

  // Melodic acoustic chime accent yang merdu dan jelas
  const melodyNotes = [523.25, 659.25, 783.99, 880.0, 1046.5];
  const chimeFreq = melodyNotes[(chordIdx * 2 + 1) % melodyNotes.length];
  const chimeOsc = ctx.createOscillator();
  const chimeGain = ctx.createGain();
  chimeOsc.type = "sine";
  chimeOsc.frequency.setValueAtTime(chimeFreq, now + 0.5);
  chimeGain.gain.setValueAtTime(0.0001, now + 0.5);
  chimeGain.gain.linearRampToValueAtTime(0.32, now + 0.58);
  chimeGain.gain.exponentialRampToValueAtTime(0.0001, now + 1.8);
  chimeOsc.connect(chimeGain);
  chimeGain.connect(masterGain);
  chimeOsc.start(now + 0.5);
  chimeOsc.stop(now + 1.85);
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
  const targetGain = musicVolumeState * 0.65;
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
      playAudioSample("/sounds/cat-meow.wav", 1.0, isKitten ? 1.28 : 1.0);
    } else if (type === "purr") {
      playAudioSample("/sounds/cat-purr.wav", 1.0, isKitten ? 1.12 : 1.0);
    }

    if (!ctx) return;

    if (type === "meow" || type === "happy_meow" || type === "chirp") {
      // Bio-acoustic double-formant cat meow ("M-eee-aaa-oow") - kencang & jernih
      const dur = type === "chirp" ? 0.32 : 0.62;
      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const filter1 = ctx.createBiquadFilter();
      const filter2 = ctx.createBiquadFilter();
      const masterGain = ctx.createGain();

      osc1.type = "sawtooth";
      osc2.type = "triangle";

      const baseF = (type === "chirp" ? 640 : 510) * pitchMult;
      const peakF = (type === "chirp" ? 960 : 790) * pitchMult;
      const endF = (type === "chirp" ? 700 : 430) * pitchMult;

      osc1.frequency.setValueAtTime(baseF, now);
      osc1.frequency.exponentialRampToValueAtTime(peakF, now + dur * 0.35);
      osc1.frequency.exponentialRampToValueAtTime(endF, now + dur);

      osc2.frequency.setValueAtTime(baseF * 1.005, now);
      osc2.frequency.exponentialRampToValueAtTime(peakF * 1.005, now + dur * 0.35);
      osc2.frequency.exponentialRampToValueAtTime(endF * 1.005, now + dur);

      // Sapuan formant vokal ("ee" -> "ah" -> "oh")
      filter1.type = "bandpass";
      filter1.Q.setValueAtTime(2.4, now);
      filter1.frequency.setValueAtTime(850 * pitchMult, now);
      filter1.frequency.exponentialRampToValueAtTime(1550 * pitchMult, now + dur * 0.4);
      filter1.frequency.exponentialRampToValueAtTime(700 * pitchMult, now + dur);

      filter2.type = "lowpass";
      filter2.Q.setValueAtTime(1.8, now);
      filter2.frequency.setValueAtTime(2800 * pitchMult, now);

      masterGain.gain.setValueAtTime(0.001, now);
      masterGain.gain.linearRampToValueAtTime(0.85 * sfxVolumeState, now + 0.07);
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
      // Dengkuran kucing bio-akustik (25.5Hz tremor laring + resonansi tenggorokan 95-180Hz)
      const dur = 2.4;
      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const osc3 = ctx.createOscillator();
      const lfo = ctx.createOscillator();
      const lfoDepth = ctx.createGain();
      const tremorGain = ctx.createGain();
      const filter = ctx.createBiquadFilter();
      const masterGain = ctx.createGain();

      osc1.type = "sawtooth";
      osc2.type = "triangle";
      osc3.type = "sine";

      // Frekuensi resonansi tenggorokan kucing (terdengar jelas di speaker HP)
      const baseFreq = (isKitten ? 118 : 96) * pitchMult;
      osc1.frequency.setValueAtTime(baseFreq, now);
      osc1.frequency.linearRampToValueAtTime(baseFreq * 1.12, now + dur * 0.45);
      osc1.frequency.linearRampToValueAtTime(baseFreq * 0.95, now + dur);

      osc2.frequency.setValueAtTime(baseFreq * 1.5, now);
      osc2.frequency.linearRampToValueAtTime(baseFreq * 1.68, now + dur * 0.45);
      osc2.frequency.linearRampToValueAtTime(baseFreq * 1.45, now + dur);

      osc3.frequency.setValueAtTime(baseFreq * 2.2, now);

      // Tremor laring 25.5Hz (denyut dengkuran kucing asli)
      lfo.type = "sine";
      lfo.frequency.setValueAtTime(25.5, now);

      lfoDepth.gain.setValueAtTime(0.48, now);
      tremorGain.gain.setValueAtTime(0.52, now);

      lfo.connect(lfoDepth);
      lfoDepth.connect(tremorGain.gain);

      // Filter rongga dada & tenggorokan kucing (hangat, lembut, dan tebal)
      filter.type = "lowpass";
      filter.frequency.setValueAtTime(540 * pitchMult, now);
      filter.Q.setValueAtTime(2.2, now);

      // Envelope pernapasan dengkuran (masuk lembut, mengalun 2 siklus napas, lalu pudar)
      masterGain.gain.setValueAtTime(0.001, now);
      masterGain.gain.linearRampToValueAtTime(0.85 * sfxVolumeState, now + 0.15);
      masterGain.gain.setValueAtTime(0.70 * sfxVolumeState, now + dur * 0.5);
      masterGain.gain.linearRampToValueAtTime(0.90 * sfxVolumeState, now + dur * 0.72);
      masterGain.gain.exponentialRampToValueAtTime(0.001, now + dur);

      osc1.connect(tremorGain);
      osc2.connect(tremorGain);
      osc3.connect(tremorGain);

      tremorGain.connect(filter);
      filter.connect(masterGain);
      masterGain.connect(ctx.destination);

      osc1.start(now);
      osc2.start(now);
      osc3.start(now);
      lfo.start(now);

      osc1.stop(now + dur + 0.05);
      osc2.stop(now + dur + 0.05);
      osc3.stop(now + dur + 0.05);
      lfo.stop(now + dur + 0.05);
    } else if (type === "crunch" || type === "eat") {
      // Crunching kibbles
      for (let i = 0; i < 3; i++) {
        const t = now + i * 0.24;
        const osc = ctx.createOscillator();
        const g = ctx.createGain();
        osc.type = "triangle";
        osc.frequency.setValueAtTime(320 + i * 70, t);
        osc.frequency.exponentialRampToValueAtTime(140, t + 0.1);
        g.gain.setValueAtTime(0.60 * sfxVolumeState, t);
        g.gain.exponentialRampToValueAtTime(0.001, t + 0.12);
        osc.connect(g);
        g.connect(ctx.destination);
        osc.start(t);
        osc.stop(t + 0.13);
      }
      setTimeout(() => playCatVocal("meow", isKitten), 550);
    } else if (type === "lap" || type === "drink") {
      // Water lapping droplets
      for (let i = 0; i < 3; i++) {
        const t = now + i * 0.22;
        const osc = ctx.createOscillator();
        const g = ctx.createGain();
        osc.type = "sine";
        osc.frequency.setValueAtTime(460, t);
        osc.frequency.exponentialRampToValueAtTime(940, t + 0.08);
        g.gain.setValueAtTime(0.55 * sfxVolumeState, t);
        g.gain.exponentialRampToValueAtTime(0.001, t + 0.1);
        osc.connect(g);
        g.connect(ctx.destination);
        osc.start(t);
        osc.stop(t + 0.11);
      }
      setTimeout(() => playCatVocal("chirp", isKitten), 520);
    } else if (type === "purr_meow") {
      playCatVocal("purr", isKitten);
      setTimeout(() => playCatVocal("happy_meow", isKitten), 1300);
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
        gain.gain.setValueAtTime(0.45 * sfxVolumeState, now + idx * 0.065);
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
    setTimeout(() => playCatVocal("happy_meow", isKitten), 1300);
  }
}
