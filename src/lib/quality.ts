/** Profil kualitas grafis — "auto" memilih berdasar kemampuan perangkat. */
export type QualityLevel = "rendah" | "sedang" | "tinggi";

export type QualityProfile = {
  dpr: [number, number];
  shadows: boolean;
  shadowMapSize: number;
  contactShadows: boolean;
  antialias: boolean;
};

export const QUALITY_PROFILES: Record<QualityLevel, QualityProfile> = {
  rendah: { dpr: [0.75, 1], shadows: false, shadowMapSize: 256, contactShadows: false, antialias: false },
  sedang: { dpr: [1, 1.5], shadows: false, shadowMapSize: 512, contactShadows: true, antialias: true },
  tinggi: { dpr: [1, 2], shadows: true, shadowMapSize: 1024, contactShadows: true, antialias: true },
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
