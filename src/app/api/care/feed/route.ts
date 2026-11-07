import { NextRequest, NextResponse } from "next/server";
import { DEFAULT_CAT_ID, executeCareAction, getCatCareSnapshot } from "@/lib/care-repository";
import { MEAL_ITEMS } from "@/lib/use-care";

/** GET /api/care/feed — Ambil daftar menu makanan & minuman beserta kondisi lapar/haus kucing saat ini. */
export async function GET(req: NextRequest) {
  const catId = req.nextUrl.searchParams.get("catId") ?? DEFAULT_CAT_ID;
  const snapshot = await getCatCareSnapshot(catId);
  return NextResponse.json({
    cat: snapshot.cat,
    stats: snapshot.stats,
    menu: MEAL_ITEMS,
  });
}

/** POST /api/care/feed — Beri makan atau minum kucing (action: "makan" | "minum", itemType?: string). */
export async function POST(req: NextRequest) {
  let body: { catId?: string; action?: string; itemType?: string } = {};
  try {
    body = (await req.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "Payload JSON tidak valid" }, { status: 400 });
  }

  const action = body.action === "minum" ? "minum" : body.action === "makan" || !body.action ? "makan" : null;
  if (!action) {
    return NextResponse.json({ error: "Action harus bernilai 'makan' atau 'minum'" }, { status: 400 });
  }

  const { evaluation, snapshot } = await executeCareAction({
    catId: body.catId,
    action,
    itemType: body.itemType ?? null,
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
      },
      { status: 422 },
    );
  }

  return NextResponse.json({
    allowed: true,
    action,
    itemType: body.itemType ?? null,
    label: evaluation.label,
    message: evaluation.message,
    deltas: evaluation.deltas,
    stats: snapshot.stats,
    cat: snapshot.cat,
  });
}
