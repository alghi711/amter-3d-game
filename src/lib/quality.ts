/** Profil kualitas grafis — "auto" memilih berdasar kemampuan perangkat. */
export type QualityLevel = "rendah" | "sedang" | "tinggi";

export type QualityProfile = {
  dpr: [number, number];
  shadows: boolean;
  shadowMapSize: number;
  contactShadows: boolean;
  antialias: boolean;
  /** detail animasi & geometri kucing */
  anim: {
    sphereSegments: number;
    tailSegments: number;
    maxHearts: number;
    /** animasi sekunder (kedip, menoleh, condong, gelombang ekor) */
    secondary: boolean;
    /** perbarui animasi sekunder tiap N frame */
    secondaryEvery: number;
  };
};

export const QUALITY_PROFILES: Record<QualityLevel, QualityProfile> = {
  rendah: {
    dpr: [0.75, 1],
    shadows: false,
    shadowMapSize: 256,
    contactShadows: false,
    antialias: false,
    anim: { sphereSegments: 14, tailSegments: 3, maxHearts: 2, secondary: false, secondaryEvery: 3 },
  },
  sedang: {
    dpr: [1, 1.5],
    shadows: false,
    shadowMapSize: 512,
    contactShadows: true,
    antialias: true,
    anim: { sphereSegments: 24, tailSegments: 4, maxHearts: 4, secondary: true, secondaryEvery: 1 },
  },
  tinggi: {
    dpr: [1, 2],
    shadows: true,
    shadowMapSize: 1024,
    contactShadows: true,
    antialias: true,
    anim: { sphereSegments: 32, tailSegments: 5, maxHearts: 5, secondary: true, secondaryEvery: 1 },
  },
};

/** Tebak kualitas awal dari jumlah core, memori, dan apakah perangkat sentuh/kecil. */
export function detectQuality(): QualityLevel {
  if (typeof navigator === "undefined") return "sedang";
  const cores = navigator.hardwareConcurrency ?? 4;
  const memory = (navigator as Navigator & { deviceMemory?: number }).deviceMemory ?? 4;
  const mobile = typeof window !== "undefined" && window.matchMedia("(pointer: coarse)").matches;
  if (cores <= 4 || memory <= 2) return "rendah";
  if (mobile || cores <= 6 || memory <= 4) return "sedang";
  return "tinggi";
}

const ORDER: QualityLevel[] = ["rendah", "sedang", "tinggi"];
export const stepQuality = (q: QualityLevel, dir: -1 | 1): QualityLevel =>
  ORDER[Math.min(ORDER.length - 1, Math.max(0, ORDER.indexOf(q) + dir))];
