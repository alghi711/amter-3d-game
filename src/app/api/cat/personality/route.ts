import { NextRequest, NextResponse } from "next/server";
import { DEFAULT_CAT_ID, getCatCareSnapshot } from "@/lib/care-repository";
import { evaluateAndPersistCatPersonality } from "@/lib/personality-service";

/** GET /api/cat/personality — Mengembalikan ringkasan kepribadian kucing, sifat dominan, skor tiap sifat, dan penyebabnya. */
export async function GET(req: NextRequest) {
  const catId = req.nextUrl.searchParams.get("catId") ?? DEFAULT_CAT_ID;
  const [snapshot, personality] = await Promise.all([
    getCatCareSnapshot(catId),
    evaluateAndPersistCatPersonality(catId),
  ]);

  return NextResponse.json({
    cat: snapshot.cat,
    stats: snapshot.stats,
    dominantTrait: personality.dominantTrait,
    traits: personality.traits,
    formedBy: personality.formedBy,
    updatedAt: personality.updatedAt,
  });
}

/** POST /api/cat/personality — Hitung ulang & simpan kepribadian kucing dari riwayat perawatan terbaru. */
export async function POST(req: NextRequest) {
  let body: { catId?: string } = {};
  try {
    body = (await req.json()) as typeof body;
  } catch {
    // boleh tanpa body
  }

  const catId = body.catId ?? DEFAULT_CAT_ID;
  const personality = await evaluateAndPersistCatPersonality(catId);
  return NextResponse.json(personality);
}
