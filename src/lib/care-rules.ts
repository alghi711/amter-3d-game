import type { CatStats } from "@/lib/mock-cat";
import {
  CARE_ACTIONS,
  getRefusalReason,
  MEAL_ITEMS,
  TOY_ITEMS,
  type CareAction,
} from "@/lib/use-care";

export type CareInteractionType = CareAction | "elus";

/** Cooldown minimum antar aksi yang sama (dalam milidetik) agar tidak di-spam. */
export const ACTION_COOLDOWN_MS: Record<CareInteractionType, number> = {
  makan: 1500,
  minum: 1500,
  mandi: 3000,
  bersihkan: 2000,
  main: 1800,
  elus: 800,
};

/** Penurunan alami kondisi kucing per jam (bila ditinggal lama). */
export const HOURLY_DECAY_RATES: Record<keyof CatStats, number> = {
  hunger: 6,
  thirst: 8,
  hygiene: 4,
  happiness: 5,
  energy: 3,
};

const clampStat = (v: number): number => Math.max(0, Math.min(100, Math.round(v * 10) / 10));

/** Hitung kondisi kucing setelah memperhitungkan waktu berlalu sejak update terakhir. */
export function applyTimeDecay(stats: CatStats, lastUpdatedAtMs: number, nowMs = Date.now()): CatStats {
  const elapsedHours = Math.max(0, Math.min(24, (nowMs - lastUpdatedAtMs) / 3_600_000));
  if (elapsedHours < 0.01) return { ...stats };
  return {
    hunger: clampStat(stats.hunger - HOURLY_DECAY_RATES.hunger * elapsedHours),
    thirst: clampStat(stats.thirst - HOURLY_DECAY_RATES.thirst * elapsedHours),
    hygiene: clampStat(stats.hygiene - HOURLY_DECAY_RATES.hygiene * elapsedHours),
    happiness: clampStat(stats.happiness - HOURLY_DECAY_RATES.happiness * elapsedHours),
    energy: clampStat(stats.energy - HOURLY_DECAY_RATES.energy * elapsedHours),
  };
}

/** Tentukan efek stat, label item, dan nilai utama berdasarkan jenis aksi & item yang dipilih. */
export function resolveActionEffect(
  action: CareInteractionType,
  itemType?: string | null,
): { effect: Partial<CatStats>; label: string; message: string; primaryValue: number } {
  if (action === "elus") {
    return {
      effect: { happiness: 8 },
      label: "Elus lembut",
      message: "mendengkur senang saat dielus 💕",
      primaryValue: 8,
    };
  }

  if (action === "makan" || action === "minum") {
    const found = MEAL_ITEMS[action].find((m) => m.id === itemType);
    if (found) {
      const primary = action === "makan" ? (found.effect.hunger ?? 25) : (found.effect.thirst ?? 30);
      return { effect: found.effect, label: found.label, message: found.message, primaryValue: primary };
    }
  }

  if (action === "main" && itemType) {
    const toy = TOY_ITEMS.find((t) => t.id === itemType);
    if (toy) {
      return {
        effect: toy.effect,
        label: toy.label,
        message: toy.message,
        primaryValue: toy.effect.happiness ?? 20,
      };
    }
  }

  const base = CARE_ACTIONS[action];
  const primary =
    action === "makan"
      ? (base.effect.hunger ?? 25)
      : action === "minum"
        ? (base.effect.thirst ?? 30)
        : action === "mandi" || action === "bersihkan"
          ? (base.effect.hygiene ?? 20)
          : (base.effect.happiness ?? 20);

  return {
    effect: base.effect,
    label: base.label,
    message: base.message,
    primaryValue: primary,
  };
}

export type CareEvaluationResult =
  | {
      allowed: false;
      code: "NEEDS_FULL" | "LOW_ENERGY" | "COOLDOWN";
      reason: string;
      retryAfterMs?: number;
    }
  | {
      allowed: true;
      nextStats: CatStats;
      deltas: Partial<CatStats>;
      xpGain: number;
      closenessGain: number;
      label: string;
      message: string;
      primaryValue: number;
    };

/**
 * Evaluasi aturan perawatan & batas aksi:
 * 1. Cek batas cooldown dari interaksi terakhir.
 * 2. Cek batas kebutuhan penuh / energi minimum.
 * 3. Hitung perubahan stat (0..100), XP, dan peningkatan kedekatan.
 */
export function evaluateCareAction(params: {
  action: CareInteractionType;
  itemType?: string | null;
  currentStats: CatStats;
  catName: string;
  litterDirty?: boolean;
  lastActionAtMs?: number | null;
  nowMs?: number;
}): CareEvaluationResult {
  const {
    action,
    itemType,
    currentStats,
    catName,
    litterDirty = currentStats.hygiene < 65,
    lastActionAtMs,
    nowMs = Date.now(),
  } = params;

  const cooldownMs = ACTION_COOLDOWN_MS[action] ?? 1000;
  if (lastActionAtMs && nowMs - lastActionAtMs < cooldownMs) {
    const retryAfterMs = cooldownMs - (nowMs - lastActionAtMs);
    return {
      allowed: false,
      code: "COOLDOWN",
      reason: `Tunggu sebentar ya, ${catName} masih menikmati perhatian sebelumnya 🐾`,
      retryAfterMs,
    };
  }

  if (action !== "elus") {
    const refusal = getRefusalReason(action, currentStats, catName, litterDirty);
    if (refusal) {
      const isLowEnergy = action === "main" && currentStats.energy < 15;
      return {
        allowed: false,
        code: isLowEnergy ? "LOW_ENERGY" : "NEEDS_FULL",
        reason: refusal,
      };
    }
  } else if (currentStats.happiness >= 99) {
    return {
      allowed: false,
      code: "NEEDS_FULL",
      reason: `${catName} sudah sangat bahagia dan tertidur pulas 😻`,
    };
  }

  const { effect, label, message, primaryValue } = resolveActionEffect(action, itemType);
  const nextStats: CatStats = { ...currentStats };
  const deltas: Partial<CatStats> = {};

  for (const [k, delta] of Object.entries(effect) as [keyof CatStats, number][]) {
    const updated = clampStat(nextStats[k] + delta);
    const actualDelta = Math.round((updated - nextStats[k]) * 10) / 10;
    if (actualDelta !== 0) {
      deltas[k] = actualDelta;
    }
    nextStats[k] = updated;
  }

  const xpGain = action === "elus" ? 3 : 8;
  const closenessGain = action === "elus" || action === "main" ? 2 : 1;

  return {
    allowed: true,
    nextStats,
    deltas,
    xpGain,
    closenessGain,
    label,
    message: `${catName} ${message}`,
    primaryValue,
  };
}
