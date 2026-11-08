import { NextRequest, NextResponse } from "next/server";
import { DEFAULT_CAT_ID, executeCareAction, getCatCareSnapshot } from "@/lib/care-repository";
import { TOY_ITEMS } from "@/lib/care-rules";

/** GET /api/care/play — Ambil daftar mainan yang tersedia beserta tingkat keceriaan & energi kucing. */
export async function GET(req: NextRequest) {
  const catId = req.nextUrl.searchParams.get("catId") ?? DEFAULT_CAT_ID;
  const snapshot = await getCatCareSnapshot(catId);
  return NextResponse.json({
    cat: snapshot.cat,
    stats: snapshot.stats,
    toys: TOY_ITEMS,
    canPlay: snapshot.stats.energy >= 15 && snapshot.stats.happiness < 95,
  });
}

/** POST /api/care/play — Ajak kucing bermain dengan mainan pilihan atau elus (action?: "main" | "elus", itemType?: string). */
export async function POST(req: NextRequest) {
  let body: { catId?: string; action?: string; itemType?: string } = {};
  try {
    body = (await req.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "Payload JSON tidak valid" }, { status: 400 });
  }

  const action = body.action === "elus" ? "elus" : body.action === "main" || !body.action ? "main" : null;
  if (!action) {
    return NextResponse.json({ error: "Action harus bernilai 'main' atau 'elus'" }, { status: 400 });
  }

  const toy = action === "main" ? (TOY_ITEMS.find((t) => t.id === body.itemType) ?? TOY_ITEMS[0]) : null;

  const { evaluation, snapshot } = await executeCareAction({
    catId: body.catId,
    action,
    itemType: toy?.id ?? body.itemType ?? null,
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
    toy: toy ?? null,
    label: evaluation.label,
    message: evaluation.message,
    deltas: evaluation.deltas,
    stats: snapshot.stats,
    cat: snapshot.cat,
  });
}
