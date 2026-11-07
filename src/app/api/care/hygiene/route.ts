import { NextRequest, NextResponse } from "next/server";
import { DEFAULT_CAT_ID, executeCareAction, getCatCareSnapshot } from "@/lib/care-repository";

/** GET /api/care/hygiene — Ambil kondisi kebersihan kucing dan status kotak pasir saat ini. */
export async function GET(req: NextRequest) {
  const catId = req.nextUrl.searchParams.get("catId") ?? DEFAULT_CAT_ID;
  const snapshot = await getCatCareSnapshot(catId);
  const lastClean = snapshot.recentInteractions.find((i) => i.type === "bersihkan");
  const litterDirty = snapshot.stats.hygiene < 65 || (!lastClean && snapshot.stats.hygiene < 85);

  return NextResponse.json({
    cat: snapshot.cat,
    stats: snapshot.stats,
    hygiene: snapshot.stats.hygiene,
    litterDirty,
    lastCleanAt: lastClean?.createdAt ?? null,
  });
}

/** POST /api/care/hygiene — Mandikan kucing atau bersihkan kotak pasir (action: "mandi" | "bersihkan"). */
export async function POST(req: NextRequest) {
  let body: { catId?: string; action?: string; itemType?: string; litterDirty?: boolean } = {};
  try {
    body = (await req.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "Payload JSON tidak valid" }, { status: 400 });
  }

  const action =
    body.action === "bersihkan" ? "bersihkan" : body.action === "mandi" || !body.action ? "mandi" : null;
  if (!action) {
    return NextResponse.json({ error: "Action harus bernilai 'mandi' atau 'bersihkan'" }, { status: 400 });
  }

  const { evaluation, snapshot } = await executeCareAction({
    catId: body.catId,
    action,
    itemType: body.itemType ?? (action === "mandi" ? "shampoo-lembut" : "sekop-pasir"),
    litterDirty: body.litterDirty ?? true,
  });

  if (!evaluation.allowed) {
    return NextResponse.json(
      {
        allowed: false,
        code: evaluation.code,
        reason: evaluation.reason,
        retryAfterMs: evaluation.retryAfterMs,
        stats: snapshot.stats,
        cat: snapshot.cat,
        litterDirty: action === "bersihkan" ? false : snapshot.stats.hygiene < 65,
      },
      { status: 422 },
    );
  }

  return NextResponse.json({
    allowed: true,
    action,
    label: evaluation.label,
    message: evaluation.message,
    deltas: evaluation.deltas,
    stats: snapshot.stats,
    cat: snapshot.cat,
    litterDirty: action === "bersihkan" ? false : snapshot.stats.hygiene < 65,
  });
}
