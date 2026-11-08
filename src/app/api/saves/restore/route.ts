import { NextRequest, NextResponse } from "next/server";
import { getCatCareSnapshot } from "@/lib/care-repository";
import { restoreBackup } from "@/lib/save-service";

/** POST /api/saves/restore — Pulihkan progres dari cadangan (`backupId` atau `backupCode`). */
export async function POST(req: NextRequest) {
  let body: { catId?: string; backupId?: string; backupCode?: string } = {};
  try {
    body = (await req.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "Payload JSON tidak valid" }, { status: 400 });
  }
  const result = await restoreBackup(body);
  if (!result.ok) return NextResponse.json({ error: result.error }, { status: result.status });

  const current = await getCatCareSnapshot(body.catId);
  return NextResponse.json({
    restored: true,
    backupId: result.save.id,
    restoredFrom: result.save.createdAt,
    cat: current.cat,
    stats: current.stats,
    mood: result.save.snapshot.mood,
  });
}
