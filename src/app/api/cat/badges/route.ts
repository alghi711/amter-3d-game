import { NextRequest, NextResponse } from "next/server";
import { DEFAULT_CAT_ID } from "@/lib/care-repository";
import { evaluateBadges } from "@/lib/badge-service";

/** GET /api/cat/badges — Daftar lencana beserta progres; lencana yang syaratnya terpenuhi dibuka otomatis. */
export async function GET(req: NextRequest) {
  const catId = req.nextUrl.searchParams.get("catId") ?? DEFAULT_CAT_ID;
  const result = await evaluateBadges(catId);
  if (!result) {
    return NextResponse.json({ error: "Kucing tidak ditemukan" }, { status: 404 });
  }
  return NextResponse.json({
    catId,
    unlockedCount: result.badges.filter((b) => b.unlocked).length,
    total: result.badges.length,
    badges: result.badges,
    newlyUnlocked: result.newlyUnlocked,
  });
}
