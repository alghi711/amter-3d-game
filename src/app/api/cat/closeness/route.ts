import { NextRequest, NextResponse } from "next/server";
import { DEFAULT_CAT_ID } from "@/lib/care-repository";
import { addCloseness, MAX_CLOSENESS_PER_REQUEST } from "@/lib/growth-service";

/** POST /api/cat/closeness — Tambah tingkat kedekatan kucing dengan pemilik (0..100). */
export async function POST(req: NextRequest) {
  let body: { catId?: string; gain?: number } = {};
  try {
    body = (await req.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "Payload JSON tidak valid" }, { status: 400 });
  }

  const gain = body.gain;
  if (typeof gain !== "number" || !Number.isInteger(gain) || gain < 1 || gain > MAX_CLOSENESS_PER_REQUEST) {
    return NextResponse.json(
      { error: `gain harus bilangan bulat antara 1 dan ${MAX_CLOSENESS_PER_REQUEST}` },
      { status: 400 },
    );
  }

  const result = await addCloseness(body.catId ?? DEFAULT_CAT_ID, gain);
  if (!result) {
    return NextResponse.json({ error: "Kucing tidak ditemukan" }, { status: 404 });
  }
  return NextResponse.json({
    ...result,
    message: result.tierChanged ? `Hubungan naik menjadi ${result.tier.label} ${result.tier.icon}` : null,
  });
}
