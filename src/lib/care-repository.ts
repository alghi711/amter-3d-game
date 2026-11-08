import { evaluateBadges } from "@/lib/badge-service";
import { randomUUID } from "node:crypto";
import { and, desc, eq } from "drizzle-orm";
import { ensureCareSchema } from "@/db";
import { catMoods, cats, catStats, interactions } from "@/db/schema";
import { deriveCatMood } from "@/lib/mock-mood";
import { evaluateAndPersistCatPersonality } from "@/lib/personality-service";
import {
  applyTimeDecay,
  evaluateCareAction,
  type CareEvaluationResult,
  type CareInteractionType,
} from "@/lib/care-rules";
import type { CatStats } from "@/lib/mock-cat";

export const DEFAULT_CAT_ID = "cat-mochi";

export type CatCareSnapshot = {
  cat: {
    id: string;
    name: string;
    stage: "anak" | "dewasa";
    level: number;
    experience: number;
    closeness: number;
    furColor: string;
    lastPlayedAt: number;
  };
  stats: CatStats;
  updatedAt: number;
  recentInteractions: {
    id: string;
    type: string;
    itemType: string | null;
    value: number;
    createdAt: number;
  }[];
};

function parseFurColor(appearanceJson: string): string {
  try {
    const parsed = JSON.parse(appearanceJson) as { furColor?: string };
    return parsed.furColor ?? "#f4b673";
  } catch {
    return "#f4b673";
  }
}

/** Ambil snapshot kondisi kucing dari database (dan terapkan penurunan alami berdasarkan waktu). */
export async function getCatCareSnapshot(catId = DEFAULT_CAT_ID): Promise<CatCareSnapshot> {
  const db = await ensureCareSchema();
  const [catRow] = await db.select().from(cats).where(eq(cats.id, catId)).limit(1);
  const [statRow] = await db.select().from(catStats).where(eq(catStats.catId, catId)).limit(1);

  const now = Date.now();
  const rawStats: CatStats = statRow
    ? {
        hunger: statRow.hunger,
        thirst: statRow.thirst,
        hygiene: statRow.hygiene,
        happiness: statRow.happiness,
        energy: statRow.energy,
      }
    : { hunger: 70, thirst: 55, hygiene: 80, happiness: 85, energy: 60 };

  const decayed = statRow ? applyTimeDecay(rawStats, statRow.updatedAt, now) : rawStats;

  const recent = await db
    .select()
    .from(interactions)
    .where(eq(interactions.catId, catId))
    .orderBy(desc(interactions.createdAt))
    .limit(5);

  return {
    cat: {
      id: catRow?.id ?? catId,
      name: catRow?.name ?? "Mochi",
      stage: catRow?.stage === "dewasa" ? "dewasa" : "anak",
      level: catRow?.level ?? 3,
      experience: catRow?.experience ?? 45,
      closeness: catRow?.closeness ?? 62,
      furColor: catRow ? parseFurColor(catRow.appearanceJson) : "#f4b673",
      lastPlayedAt: catRow?.lastPlayedAt ?? now,
    },
    stats: decayed,
    updatedAt: statRow?.updatedAt ?? now,
    recentInteractions: recent,
  };
}

/** Jalankan aksi perawatan terhadap kucing, validasi batas aksi, lalu simpan ke database. */
export async function executeCareAction(params: {
  catId?: string;
  action: CareInteractionType;
  itemType?: string | null;
  litterDirty?: boolean;
}): Promise<{ evaluation: CareEvaluationResult; snapshot: CatCareSnapshot }> {
  const catId = params.catId ?? DEFAULT_CAT_ID;
  const db = await ensureCareSchema();
  const snapshot = await getCatCareSnapshot(catId);

  const [lastSameAction] = await db
    .select()
    .from(interactions)
    .where(and(eq(interactions.catId, catId), eq(interactions.type, params.action)))
    .orderBy(desc(interactions.createdAt))
    .limit(1);

  const now = Date.now();
  const evaluation = evaluateCareAction({
    action: params.action,
    itemType: params.itemType,
    currentStats: snapshot.stats,
    catName: snapshot.cat.name,
    litterDirty: params.litterDirty,
    lastActionAtMs: lastSameAction?.createdAt ?? null,
    nowMs: now,
  });

  if (!evaluation.allowed) {
    return { evaluation, snapshot };
  }

  const nextXp = snapshot.cat.experience + evaluation.xpGain;
  const nextLevel = Math.max(snapshot.cat.level, 1 + Math.floor(nextXp / 50));
  const nextStage = nextLevel >= 6 ? "dewasa" : snapshot.cat.stage;
  const nextCloseness = Math.min(100, snapshot.cat.closeness + evaluation.closenessGain);

  await db
    .update(catStats)
    .set({
      hunger: evaluation.nextStats.hunger,
      thirst: evaluation.nextStats.thirst,
      hygiene: evaluation.nextStats.hygiene,
      happiness: evaluation.nextStats.happiness,
      energy: evaluation.nextStats.energy,
      updatedAt: now,
    })
    .where(eq(catStats.catId, catId));

  await db
    .update(cats)
    .set({
      experience: nextXp,
      level: nextLevel,
      stage: nextStage,
      closeness: nextCloseness,
      lastPlayedAt: now,
    })
    .where(eq(cats.id, catId));

  await db.insert(interactions).values({
    id: randomUUID(),
    catId,
    type: params.action,
    itemType: params.itemType ?? null,
    value: evaluation.primaryValue,
    createdAt: now,
  });

  const nextMood = deriveCatMood(evaluation.nextStats, new Date(now).getHours(), null);
  await db
    .insert(catMoods)
    .values({
      catId,
      mood: nextMood.mood,
      reason: nextMood.reason,
      updatedAt: now,
    })
    .onConflictDoUpdate({
      target: catMoods.catId,
      set: {
        mood: nextMood.mood,
        reason: nextMood.reason,
        updatedAt: now,
      },
    });

  await evaluateAndPersistCatPersonality(catId);
  await evaluateBadges(catId);
  const updatedSnapshot = await getCatCareSnapshot(catId);
  return { evaluation, snapshot: updatedSnapshot };
}
