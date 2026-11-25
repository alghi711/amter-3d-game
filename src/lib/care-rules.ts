import type { CatStats } from "@/lib/mock-cat";
import type { HouseSpot } from "@/components/room/CatHouse";

/** Aksi perawatan yang bisa dilakukan pemain. */
export type CareAction = "makan" | "minum" | "mandi" | "bersihkan" | "main";

export type MealItem = {
  id: string;
  action: "makan" | "minum";
  label: string;
  icon: string;
  fillColor: string;
  effect: Partial<CatStats>;
  message: string;
  cooldownMs?: number;
  isPremium?: boolean;
};

export const MEAL_ITEMS: Record<"makan" | "minum", MealItem[]> = {
  makan: [
    {
      id: "amter_food",
      action: "makan",
      label: "Amter Food",
      icon: "👑",
      fillColor: "#f59e0b",
      effect: { hunger: 100, happiness: 45, energy: 30, thirst: 20, hygiene: 15 },
      message: "melompat kegirangan menyantap Amter Food spesial! 😻✨",
      cooldownMs: 120_000,
      isPremium: true,
    },
    { id: "kibble", action: "makan", label: "Biskuit Ikan", icon: "🐟", fillColor: "#a0522d", effect: { hunger: 25, happiness: 5 }, message: "melahap biskuit ikan dengan lahap" },
    { id: "salmon", action: "makan", label: "Salmon Segar", icon: "🍣", fillColor: "#fa8072", effect: { hunger: 40, happiness: 15 }, message: "sangat senang makan salmon segar!" },
    { id: "snack", action: "makan", label: "Camilan Krim", icon: "🍮", fillColor: "#fde68a", effect: { hunger: 15, happiness: 20 }, message: "menjilat camilan krim sampai habis" },
  ],
  minum: [
    { id: "water", action: "minum", label: "Air Segar", icon: "💧", fillColor: "#93c5fd", effect: { thirst: 30 }, message: "minum air segar" },
    { id: "milk", action: "minum", label: "Susu Kucing", icon: "🥛", fillColor: "#fffbeb", effect: { thirst: 35, hunger: 10, happiness: 12 }, message: "minum susu kucing hangat dengan nikmat" },
  ],
};

export type ToyItem = {
  id: string;
  label: string;
  icon: string;
  color: string;
  spot: HouseSpot;
  effect: Partial<CatStats>;
  message: string;
};

export const TOY_ITEMS: ToyItem[] = [
  { id: "ball", label: "Bola Lonceng", icon: "🧶", color: "#ffd166", spot: "toy", effect: { happiness: 20, energy: -10 }, message: "asyik mengejar bola lonceng" },
  { id: "wand", label: "Tongkat Bulu", icon: "🪶", color: "#f472b6", spot: "toy", effect: { happiness: 28, energy: -15, hunger: -5 }, message: "melompat lincah menangkap tongkat bulu!" },
  { id: "scratch", label: "Garuk Tiang", icon: "🪵", color: "#c49a6c", spot: "scratchPost", effect: { happiness: 18, energy: -8 }, message: "puas mengasah kuku di tiang garuk" },
];

export const CARE_ACTIONS: Record<
  CareAction,
  { label: string; icon: string; spot: HouseSpot | null; effect: Partial<CatStats>; message: string }
> = {
  makan: { label: "Makan", icon: "🍗", spot: "foodBowl", effect: { hunger: 25, happiness: 5 }, message: "makan dengan lahap" },
  minum: { label: "Minum", icon: "💧", spot: "waterBowl", effect: { thirst: 30 }, message: "minum air segar" },
  mandi: { label: "Mandi", icon: "🛁", spot: null, effect: { hygiene: 35, happiness: -5 }, message: "dimandikan sampai wangi" },
  bersihkan: { label: "Bersihkan", icon: "🧹", spot: "litterBox", effect: { hygiene: 15 }, message: "senang kandangnya bersih" },
  main: { label: "Main", icon: "🧶", spot: "toy", effect: { happiness: 20, energy: -10 }, message: "asyik bermain bola" },
};

export const STAT_LABELS: Record<keyof CatStats, { label: string; icon: string }> = {
  hunger: { label: "Kenyang", icon: "🍗" },
  thirst: { label: "Minum", icon: "💧" },
  hygiene: { label: "Bersih", icon: "🫧" },
  happiness: { label: "Ceria", icon: "😺" },
  energy: { label: "Energi", icon: "⚡" },
};

/** Skor perawatan keseluruhan 0..100 (rata-rata berbobot). */
export function careScore(s: CatStats): number {
  const w: Record<keyof CatStats, number> = { hunger: 0.25, thirst: 0.2, hygiene: 0.2, happiness: 0.25, energy: 0.1 };
  return Math.round((Object.keys(w) as (keyof CatStats)[]).reduce((sum, k) => sum + s[k] * w[k], 0));
}

export function careStatus(score: number): { label: string; emoji: string; tone: string } {
  if (score >= 80) return { label: "Sangat terawat", emoji: "🌟", tone: "text-emerald-600" };
  if (score >= 60) return { label: "Terawat", emoji: "😊", tone: "text-emerald-500" };
  if (score >= 40) return { label: "Butuh perhatian", emoji: "😐", tone: "text-amber-600" };
  return { label: "Kurang terawat", emoji: "🥺", tone: "text-rose-600" };
}

const FULL_THRESHOLD = 95;

/** Cek apakah kebutuhan untuk aksi tertentu sudah penuh; kembalikan pesan penolakan ramah bila ya. */
export function getRefusalReason(
  action: CareAction,
  stats: CatStats,
  name: string,
  litterDirty = true,
): string | null {
  if (action === "makan" && stats.hunger >= FULL_THRESHOLD) {
    return `${name} menggeleng pelan — perutnya sudah kenyang sekali 😸`;
  }
  if (action === "minum" && stats.thirst >= FULL_THRESHOLD) {
    return `${name} mengendus mangkuk lalu pergi — belum haus lagi 💧`;
  }
  if (action === "mandi" && stats.hygiene >= FULL_THRESHOLD) {
    return `Bulu ${name} sudah bersih dan wangi, belum perlu mandi lagi ✨`;
  }
  if (action === "bersihkan" && !litterDirty && stats.hygiene >= FULL_THRESHOLD) {
    return `Kotak pasir ${name} masih bersih dan rapi 🌟`;
  }
  if (action === "main") {
    if (stats.energy < 15) {
      return `${name} menguap lebar — terlalu mengantuk untuk bermain 😴`;
    }
    if (stats.happiness >= FULL_THRESHOLD) {
      return `${name} rebahan santai — sudah puas bermain hari ini 🐾`;
    }
  }
  return null;
}

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

/** Penurunan alami kondisi kucing per menit (dan saat offline ditinggal lama). */
export const HOURLY_DECAY_RATES: Record<keyof CatStats, number> = {
  hunger: 22,
  thirst: 25,
  hygiene: 18,
  happiness: 24,
  energy: 12,
};

const clampStat = (v: number): number => Math.max(0, Math.min(100, Math.round(v * 10) / 10));

/** Hitung kondisi kucing setelah memperhitungkan waktu berlalu sejak update terakhir. */
export function applyTimeDecay(stats: CatStats, lastUpdatedAtMs: number, nowMs = Date.now()): CatStats {
  const elapsedHours = Math.max(0, Math.min(24, (nowMs - lastUpdatedAtMs) / 3_600_000));
  if (elapsedHours < 0.005) return { ...stats };
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
