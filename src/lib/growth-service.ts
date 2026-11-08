import { eq } from "drizzle-orm";
import { ensureCareSchema } from "@/db";
import { catGrowth, cats, growthEvents } from "@/db/schema";
import { DEFAULT_CAT_ID } from "@/lib/care-repository";
import { computeGrowthProgress, XP_PER_LEVEL, type GrowthStage } from "@/lib/mock-growth";

export const MAX_XP_PER_REQUEST = 100;

export type GrowthResult = {
  catId: string;
  xpGain: number;
  totalXp: number;
  level: number;
  experience: number;
  xpForNextLevel: number;
  xpProgressPercent: number;
  stage: GrowthStage;
  leveledUp: boolean;
  stageChanged: boolean;
  previousStage: GrowthStage;
  previousLevel: number;
};

/** Tambah pengalaman; hitung naik level & naik tahap (anak → dewasa), simpan ke DB & catat peristiwa. */
export async function addExperience(
  catId: string = DEFAULT_CAT_ID,
  xpGain: number,
  reason = "xp",
): Promise<GrowthResult | null> {
  const db = await ensureCareSchema();
  const [cat] = await db.select().from(cats).where(eq(cats.id, catId)).limit(1);
  if (!cat) return null;

  // Kolom `experience` menyimpan XP dalam level berjalan; total XP = (level-1)*50 + experience.
  const prevTotal = (cat.level - 1) * XP_PER_LEVEL + cat.experience;
  const prevStage = (cat.stage === "dewasa" ? "dewasa" : "anak") as GrowthStage;
  const next = computeGrowthProgress(prevTotal + xpGain);
  // Tahap tidak pernah turun, hanya naik.
  const nextStage: GrowthStage = prevStage === "dewasa" ? "dewasa" : next.stage;
  const leveledUp = next.level > cat.level;
  const stageChanged = nextStage !== prevStage;
  const now = Date.now();

  await db
    .update(cats)
    .set({ level: next.level, experience: next.currentLevelXp, stage: nextStage, lastPlayedAt: now })
    .where(eq(cats.id, catId));

  const [growth] = await db.select().from(catGrowth).where(eq(catGrowth.catId, catId)).limit(1);
  await db
    .insert(catGrowth)
    .values({
      catId,
      totalInteractions: 1,
      totalXp: next.totalXp,
      stageChangedAt: now,
      updatedAt: now,
    })
    .onConflictDoUpdate({
      target: catGrowth.catId,
      set: {
        totalInteractions: (growth?.totalInteractions ?? 0) + 1,
        totalXp: next.totalXp,
        stageChangedAt: stageChanged ? now : (growth?.stageChangedAt ?? now),
        updatedAt: now,
      },
    });

  const events: (typeof growthEvents.$inferInsert)[] = [
    { id: crypto.randomUUID(), catId, kind: reason, level: next.level, xpGain, createdAt: now },
  ];
  if (leveledUp) {
    events.push({ id: crypto.randomUUID(), catId, kind: "level_up", level: next.level, xpGain: 0, createdAt: now });
  }
  if (stageChanged) {
    events.push({
      id: crypto.randomUUID(),
      catId,
      kind: "stage_up",
      fromStage: prevStage,
      toStage: nextStage,
      level: next.level,
      xpGain: 0,
      createdAt: now,
    });
  }
  await db.insert(growthEvents).values(events);

  return {
    catId,
    xpGain,
    totalXp: next.totalXp,
    level: next.level,
    experience: next.currentLevelXp,
    xpForNextLevel: XP_PER_LEVEL,
    xpProgressPercent: next.xpProgressPercent,
    stage: nextStage,
    leveledUp,
    stageChanged,
    previousStage: prevStage,
    previousLevel: cat.level,
  };
}
