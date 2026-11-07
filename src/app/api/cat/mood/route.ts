import { eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";
import { ensureCareSchema } from "@/db";
import { catMoods } from "@/db/schema";
import { DEFAULT_CAT_ID, getCatCareSnapshot } from "@/lib/care-repository";
import { deriveCatMood, MOOD_DEFINITIONS, type CatMood } from "@/lib/mock-mood";

const VALID_MOODS: CatMood[] = ["senang", "lapar", "bosan", "ngantuk"];

/** GET /api/cat/mood — Ambil suasana hati kucing saat ini dari DB & kalkulasi kondisi perawatan. */
export async function GET(req: NextRequest) {
  const catId = req.nextUrl.searchParams.get("catId") ?? DEFAULT_CAT_ID;
  const hourParam = req.nextUrl.searchParams.get("hour");
  const hour = hourParam !== null ? Number(hourParam) : new Date().getHours();

  const db = await ensureCareSchema();
  const snapshot = await getCatCareSnapshot(catId);
  const [savedMood] = await db.select().from(catMoods).where(eq(catMoods.catId, catId)).limit(1);

  const computed = deriveCatMood(snapshot.stats, Number.isFinite(hour) ? hour : 9);
  const now = Date.now();

  if (!savedMood) {
    await db.insert(catMoods).values({
      catId,
      mood: computed.mood,
      reason: computed.reason,
      updatedAt: now,
    });
  } else if (savedMood.mood !== computed.mood && now - savedMood.updatedAt > 60_000) {
    await db
      .update(catMoods)
      .set({ mood: computed.mood, reason: computed.reason, updatedAt: now })
      .where(eq(catMoods.catId, catId));
  }

  return NextResponse.json({
    cat: snapshot.cat,
    stats: snapshot.stats,
    mood: computed.mood,
    label: computed.label,
    emoji: computed.emoji,
    reason: computed.reason,
    expression: computed.expression,
    sound: computed.sound,
    savedMood: savedMood ?? { catId, mood: computed.mood, reason: computed.reason, updatedAt: now },
  });
}

/** POST /api/cat/mood — Perbarui suasana hati kucing di database (otomatis dari stat atau override eksplisit). */
export async function POST(req: NextRequest) {
  let body: { catId?: string; mood?: CatMood; reason?: string; hour?: number } = {};
  try {
    body = (await req.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "Payload JSON tidak valid" }, { status: 400 });
  }

  const catId = body.catId ?? DEFAULT_CAT_ID;
  const db = await ensureCareSchema();
  const snapshot = await getCatCareSnapshot(catId);

  const validOverride = body.mood && VALID_MOODS.includes(body.mood) ? body.mood : null;
  if (body.mood && !validOverride) {
    return NextResponse.json({ error: "Mood harus salah satu dari: senang, lapar, bosan, ngantuk" }, { status: 400 });
  }

  const hour = typeof body.hour === "number" ? body.hour : new Date().getHours();
  const resolved = deriveCatMood(snapshot.stats, hour, validOverride);
  const finalReason = body.reason?.trim() || resolved.reason;
  const now = Date.now();

  await db
    .insert(catMoods)
    .values({
      catId,
      mood: resolved.mood,
      reason: finalReason,
      updatedAt: now,
    })
    .onConflictDoUpdate({
      target: catMoods.catId,
      set: {
        mood: resolved.mood,
        reason: finalReason,
        updatedAt: now,
      },
    });

  const def = MOOD_DEFINITIONS[resolved.mood];
  return NextResponse.json({
    catId,
    mood: resolved.mood,
    label: def.label,
    emoji: def.emoji,
    reason: finalReason,
    expression: def.expression,
    sound: def.sound,
    updatedAt: now,
  });
}
