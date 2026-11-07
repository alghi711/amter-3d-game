"use client";

import type { CareInteractionType } from "@/lib/care-rules";

export type SoundEffectType =
  | "meow"
  | "purr_meow"
  | "chirp"
  | "eat"
  | "drink"
  | "bath"
  | "clean"
  | "sleep"
  | "pop"
  | "chime";

let audioCtx: AudioContext | null = null;
let noiseBuffer: AudioBuffer | null = null;
let soundEnabledState = true;

export function isSoundEnabled(): boolean {
  return soundEnabledState;
}

export function setSoundEnabled(enabled: boolean): void {
  soundEnabledState = enabled;
}

function initAudio(): AudioContext | null {
  if (typeof window === "undefined") return null;
  const Ctx = window.AudioContext || (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!audioCtx && Ctx) {
    audioCtx = new Ctx();
  }
  if (audioCtx && audioCtx.state === "suspended") {
    void audioCtx.resume();
  }
  if (audioCtx && !noiseBuffer) {
    const bufferSize = audioCtx.sampleRate * 2;
    noiseBuffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
    const data = noiseBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }
  }
  return audioCtx;
}

export function synthCatMeow(
  options: {
    startFreq?: number;
    peakFreq?: number;
    endFreq?: number;
    duration?: number;
    vibratoRate?: number;
    vibratoDepth?: number;
    delay?: number;
    isKitten?: boolean;
  } = {},
): void {
  if (!soundEnabledState) return;
  try {
    const ctx = initAudio();
    if (!ctx) return;
    const {
      startFreq = 480,
      peakFreq = 790,
      endFreq = 410,
      duration = 0.48,
      vibratoRate = 11,
      vibratoDepth = 16,
      delay = 0,
      isKitten = false,
    } = options;

    const pitchMult = isKitten ? 1.32 : 1.0;
    const now = ctx.currentTime + delay;

    const osc1 = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    osc1.type = "sawtooth";
    osc2.type = "triangle";

    const sF = startFreq * pitchMult;
    const pF = peakFreq * pitchMult;
    const eF = endFreq * pitchMult;

    osc1.frequency.setValueAtTime(sF, now);
    osc1.frequency.exponentialRampToValueAtTime(pF, now + duration * 0.34);
    osc1.frequency.exponentialRampToValueAtTime(eF, now + duration);

    osc2.frequency.setValueAtTime(sF * 0.995, now);
    osc2.frequency.exponentialRampToValueAtTime(pF * 1.005, now + duration * 0.34);
    osc2.frequency.exponentialRampToValueAtTime(eF, now + duration);

    const lfo = ctx.createOscillator();
    const lfoGain = ctx.createGain();
    lfo.frequency.setValueAtTime(vibratoRate, now);
    lfoGain.gain.setValueAtTime(vibratoDepth * pitchMult, now);
    lfo.connect(lfoGain);
    lfoGain.connect(osc1.frequency);
    lfoGain.connect(osc2.frequency);

    const formant1 = ctx.createBiquadFilter();
    formant1.type = "bandpass";
    formant1.Q.setValueAtTime(4.2, now);
    formant1.frequency.setValueAtTime(850 * pitchMult, now);
    formant1.frequency.exponentialRampToValueAtTime(1650 * pitchMult, now + duration * 0.38);
    formant1.frequency.exponentialRampToValueAtTime(920 * pitchMult, now + duration);

    const warmFilter = ctx.createBiquadFilter();
    warmFilter.type = "lowpass";
    warmFilter.frequency.setValueAtTime(3400, now);

    const masterGain = ctx.createGain();
    masterGain.gain.setValueAtTime(0.001, now);
    masterGain.gain.linearRampToValueAtTime(0.24, now + duration * 0.14);
    masterGain.gain.setValueAtTime(0.22, now + duration * 0.65);
    masterGain.gain.exponentialRampToValueAtTime(0.001, now + duration);

    osc1.connect(formant1);
    osc2.connect(formant1);
    formant1.connect(warmFilter);
    warmFilter.connect(masterGain);
    masterGain.connect(ctx.destination);

    osc1.start(now);
    osc2.start(now);
    lfo.start(now);
    osc1.stop(now + duration + 0.02);
    osc2.stop(now + duration + 0.02);
    lfo.stop(now + duration + 0.02);
  } catch {
    // abaikan bila autoplay belum diizinkan browser
  }
}

export function synthCatPurr(duration = 1.6): void {
  if (!soundEnabledState) return;
  try {
    const ctx = initAudio();
    if (!ctx || !noiseBuffer) return;
    const now = ctx.currentTime;

    const rumbleOsc = ctx.createOscillator();
    rumbleOsc.type = "sawtooth";
    rumbleOsc.frequency.setValueAtTime(26, now);
    rumbleOsc.frequency.linearRampToValueAtTime(29, now + duration * 0.5);
    rumbleOsc.frequency.linearRampToValueAtTime(25, now + duration);

    const rumbleFilter = ctx.createBiquadFilter();
    rumbleFilter.type = "lowpass";
    rumbleFilter.frequency.setValueAtTime(195, now);

    const noiseSrc = ctx.createBufferSource();
    noiseSrc.buffer = noiseBuffer;
    noiseSrc.loop = true;

    const noiseFilter = ctx.createBiquadFilter();
    noiseFilter.type = "bandpass";
    noiseFilter.frequency.setValueAtTime(320, now);
    noiseFilter.Q.setValueAtTime(2.5, now);

    const amLfo = ctx.createOscillator();
    amLfo.type = "sine";
    amLfo.frequency.setValueAtTime(26, now);

    const amGain = ctx.createGain();
    amGain.gain.setValueAtTime(0.08, now);
    amLfo.connect(amGain.gain);

    const envGain = ctx.createGain();
    envGain.gain.setValueAtTime(0.001, now);
    envGain.gain.linearRampToValueAtTime(0.22, now + 0.25);
    envGain.gain.setValueAtTime(0.2, now + duration - 0.35);
    envGain.gain.exponentialRampToValueAtTime(0.001, now + duration);

    rumbleOsc.connect(rumbleFilter);
    rumbleFilter.connect(envGain);

    noiseSrc.connect(noiseFilter);
    noiseFilter.connect(amGain);
    amGain.connect(envGain);

    envGain.connect(ctx.destination);

    rumbleOsc.start(now);
    noiseSrc.start(now);
    amLfo.start(now);

    rumbleOsc.stop(now + duration);
    noiseSrc.stop(now + duration);
    amLfo.stop(now + duration);
  } catch {
    // abaikan
  }
}

export function synthCatChirp(isKitten = false): void {
  if (!soundEnabledState) return;
  try {
    const ctx = initAudio();
    if (!ctx) return;
    const pitchMult = isKitten ? 1.32 : 1.0;
    const now = ctx.currentTime;

    const osc = ctx.createOscillator();
    osc.type = "triangle";
    osc.frequency.setValueAtTime(520 * pitchMult, now);
    osc.frequency.exponentialRampToValueAtTime(980 * pitchMult, now + 0.14);
    osc.frequency.exponentialRampToValueAtTime(680 * pitchMult, now + 0.28);

    const trillLfo = ctx.createOscillator();
    const trillGain = ctx.createGain();
    trillLfo.frequency.setValueAtTime(38, now);
    trillGain.gain.setValueAtTime(65 * pitchMult, now);
    trillLfo.connect(trillGain);
    trillGain.connect(osc.frequency);

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.001, now);
    gain.gain.linearRampToValueAtTime(0.22, now + 0.04);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    trillLfo.start(now);
    osc.stop(now + 0.31);
    trillLfo.stop(now + 0.31);
  } catch {
    // abaikan
  }
}

export function playCatSound(type: SoundEffectType, isKitten = false): void {
  if (!soundEnabledState) return;
  try {
    const ctx = initAudio();
    if (!ctx) return;
    const now = ctx.currentTime;

    if (type === "meow") {
      const v = (Math.random() - 0.5) * 70;
      synthCatMeow({
        startFreq: 490 + v,
        peakFreq: 810 + v,
        endFreq: 430 + v * 0.5,
        duration: 0.46 + Math.random() * 0.12,
        isKitten,
      });
    } else if (type === "purr_meow") {
      synthCatPurr(1.55);
      synthCatMeow({
        startFreq: 540,
        peakFreq: 840,
        endFreq: 490,
        duration: 0.42,
        delay: 0.08,
        isKitten,
      });
    } else if (type === "chirp") {
      synthCatChirp(isKitten);
      synthCatMeow({
        startFreq: 610,
        peakFreq: 920,
        endFreq: 560,
        duration: 0.34,
        delay: 0.26,
        isKitten,
      });
    } else if (type === "eat") {
      for (let i = 0; i < 3; i++) {
        const t = now + i * 0.22;
        if (noiseBuffer) {
          const src = ctx.createBufferSource();
          src.buffer = noiseBuffer;
          const bp = ctx.createBiquadFilter();
          bp.type = "bandpass";
          bp.frequency.setValueAtTime(1350 + i * 180, t);
          bp.Q.setValueAtTime(3.0, t);
          const g = ctx.createGain();
          g.gain.setValueAtTime(0.22, t);
          g.gain.exponentialRampToValueAtTime(0.001, t + 0.1);
          src.connect(bp);
          bp.connect(g);
          g.connect(ctx.destination);
          src.start(t);
          src.stop(t + 0.11);
        }
      }
      synthCatMeow({ startFreq: 550, peakFreq: 780, endFreq: 520, duration: 0.32, delay: 0.68, isKitten });
    } else if (type === "drink") {
      for (let i = 0; i < 3; i++) {
        const t = now + i * 0.2;
        const osc = ctx.createOscillator();
        const g = ctx.createGain();
        osc.type = "sine";
        osc.frequency.setValueAtTime(340, t);
        osc.frequency.exponentialRampToValueAtTime(780, t + 0.09);
        g.gain.setValueAtTime(0.14, t);
        g.gain.exponentialRampToValueAtTime(0.001, t + 0.11);
        osc.connect(g);
        g.connect(ctx.destination);
        osc.start(t);
        osc.stop(t + 0.12);
      }
      setTimeout(() => synthCatChirp(isKitten), 620);
    } else if (type === "bath") {
      [480, 640, 820, 960].forEach((freq, idx) => {
        const t = now + idx * 0.09;
        const osc = ctx.createOscillator();
        const g = ctx.createGain();
        osc.type = "sine";
        osc.frequency.setValueAtTime(freq, t);
        osc.frequency.exponentialRampToValueAtTime(freq * 1.45, t + 0.07);
        g.gain.setValueAtTime(0.14, t);
        g.gain.exponentialRampToValueAtTime(0.001, t + 0.08);
        osc.connect(g);
        g.connect(ctx.destination);
        osc.start(t);
        osc.stop(t + 0.09);
      });
      synthCatMeow({ startFreq: 620, peakFreq: 960, endFreq: 510, duration: 0.44, delay: 0.38, isKitten });
    } else if (type === "clean") {
      if (noiseBuffer) {
        for (let i = 0; i < 2; i++) {
          const t = now + i * 0.22;
          const src = ctx.createBufferSource();
          src.buffer = noiseBuffer;
          const hp = ctx.createBiquadFilter();
          hp.type = "bandpass";
          hp.frequency.setValueAtTime(2200, t);
          const g = ctx.createGain();
          g.gain.setValueAtTime(0.12, t);
          g.gain.exponentialRampToValueAtTime(0.001, t + 0.16);
          src.connect(hp);
          hp.connect(g);
          g.connect(ctx.destination);
          src.start(t);
          src.stop(t + 0.17);
        }
      }
      synthCatMeow({ startFreq: 520, peakFreq: 860, endFreq: 620, duration: 0.36, delay: 0.45, isKitten });
    } else if (type === "sleep") {
      synthCatMeow({ startFreq: 520, peakFreq: 580, endFreq: 330, duration: 0.62, vibratoDepth: 6, isKitten });
      setTimeout(() => synthCatPurr(2.0), 450);
    } else if (type === "pop") {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "triangle";
      osc.frequency.setValueAtTime(380, now);
      osc.frequency.exponentialRampToValueAtTime(840, now + 0.11);
      gain.gain.setValueAtTime(0.15, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.13);
    } else if (type === "chime") {
      [523.25, 659.25, 783.99, 1046.5].forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "sine";
        osc.frequency.setValueAtTime(freq, now + idx * 0.07);
        gain.gain.setValueAtTime(0.12, now + idx * 0.07);
        gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.07 + 0.35);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now + idx * 0.07);
        osc.stop(now + idx * 0.07 + 0.36);
      });
    }
  } catch {
    // abaikan
  }
}

export function playSoundForCareAction(action: CareInteractionType, isKitten = false): void {
  if (action === "makan") playCatSound("eat", isKitten);
  else if (action === "minum") playCatSound("drink", isKitten);
  else if (action === "mandi") playCatSound("bath", isKitten);
  else if (action === "bersihkan") playCatSound("clean", isKitten);
  else if (action === "main") playCatSound("chirp", isKitten);
  else if (action === "elus") playCatSound("purr_meow", isKitten);
}
