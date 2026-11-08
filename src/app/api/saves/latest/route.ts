import { NextRequest, NextResponse } from "next/server";
import { cats } from "@/db/schema";
import { ensureCareSchema } from "@/db";
import { eq } from "drizzle-orm";
import { DEFAULT_CAT_ID, getCatCareSnapshot } from "@/lib/care-repository";
import { readLatestProgress } from "@/lib/save-service";

/**
 * GET /api/saves/latest — Progres terakhir pemain.
 * Memakai simpanan terbaru (otomatis/manual/cadangan); bila belum ada, `source` = "live"
 * dan data diambil dari kondisi kucing saat ini di database.
 */
export async function GET(req: NextRequest) {
  const catId = req.nextUrl.searchParams.get("catId") ?? DEFAULT_CAT_ID;
  const db = await ensureCareSchema();
  const [cat] = await db.select().from(cats).where(eq(cats.id, catId)).limit(1);
  if (!cat) return NextResponse.json({ error: "Kucing tidak ditemukan" }, { status: 404 });

  const save = await readLatestProgress(catId);
  if (save) return NextResponse.json({ source: "save", ...save });

  const snap = await getCatCareSnapshot(catId);
  return NextResponse.json({
    source: "live",
    catId,
    kind: null,
    snapshot: {
      catName: snap.cat.name,
      stage: snap.cat.stage,
      level: snap.cat.level,
      experience: snap.cat.experience,
      closeness: snap.cat.closeness,
      stats: snap.stats,
    },
    createdAt: snap.cat.lastPlayedAt,
  });
}
