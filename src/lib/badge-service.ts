import { and, count, eq } from "drizzle-orm";
import { ensureCareSchema } from "@/db";
import { badgeDefinitions, catBadges, cats, catStats, interactions } from "@/db/schema";
import type { BadgeMetric } from "@/lib/badge-definitions";

export const DEFAULT_BADGE_CAT_ID = "cat-mochi";

export type BadgeStatus = {
  code: string;
  name: string;
  description: string;
  icon: string;
  metric: BadgeMetric;
  threshold: number;
  current: number;
  progress: number; // 0..100
  unlocked: boolean;
  unlockedAt: number | null;
};

async function countType(catId: string, type: string): Promise<number> {
  const db = await ensureCareSchema();
  const [row] = await db
    .select({ n: count() })
    .from(interactions)
    .where(and(eq(interactions.catId, catId), eq(interactions.type, type)));
  return row?.n ?? 0;
}

/** Kumpulkan nilai tiap metrik lencana dari DB. */
async function collectMetrics(catId: string): Promise<Record<BadgeMetric, number> | null> {
  const db = await ensureCareSchema();
  const [cat] = await db.select().from(cats).where(eq(cats.id, catId)).limit(1);
  if (!cat) return null;
  const [stats] = await db.select().from(catStats).where(eq(catStats.catId, catId)).limit(1);
  const [meals, plays, pets] = await Promise.all([
    countType(catId, "makan"),
    countType(catId, "main"),
    countType(catId, "elus"),
  ]);
  return {
    meals,
    plays,
    pets,
    hygiene: Math.round(stats?.hygiene ?? 0),
    level: cat.level,
    closeness: cat.closeness,
  };
}

/** Nilai ulang semua lencana; lencana yang syaratnya terpenuhi dibuka otomatis & disimpan. */
export async function evaluateBadges(
  catId: string = DEFAULT_BADGE_CAT_ID,
): Promise<{ badges: BadgeStatus[]; newlyUnlocked: BadgeStatus[] } | null> {
  const metrics = await collectMetrics(catId);
  if (!metrics) return null;
  const db = await ensureCareSchema();

  const defs = await db.select().from(badgeDefinitions).orderBy(badgeDefinitions.sortOrder);
  const owned = await db.select().from(catBadges).where(eq(catBadges.catId, catId));
  const ownedMap = new Map(owned.map((o) => [o.badgeId, o.unlockedAt]));
  const now = Date.now();

  const badges: BadgeStatus[] = [];
  const newlyUnlocked: BadgeStatus[] = [];
  for (const d of defs) {
    const metric = d.metric as BadgeMetric;
    const current = metrics[metric] ?? 0;
    const reached = current >= d.threshold;
    let unlockedAt = ownedMap.get(d.code) ?? null;
    if (reached && unlockedAt === null) {
      await db.insert(catBadges).values({ catId, badgeId: d.code, unlockedAt: now }).onConflictDoNothing();
      unlockedAt = now;
    }
    const status: BadgeStatus = {
      code: d.code,
      name: d.name,
      description: d.description,
      icon: d.icon,
      metric,
      threshold: d.threshold,
      current,
      progress: unlockedAt !== null ? 100 : Math.min(100, Math.round((current / d.threshold) * 100)),
      unlocked: unlockedAt !== null,
      unlockedAt,
    };
    badges.push(status);
    if (reached && !ownedMap.has(d.code)) newlyUnlocked.push(status);
  }
  return { badges, newlyUnlocked };
}
