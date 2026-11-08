import { NextRequest, NextResponse } from "next/server";
import { DEFAULT_CAT_ID } from "@/lib/care-repository";
import { parseSnapshot, readLatestAutosave, writeAutosave } from "@/lib/save-service";
import { getAuthenticatedPlayer, verifyCatAccess } from "@/lib/auth-guard";

/** GET /api/saves/auto — Muat simpanan otomatis terbaru (404 bila belum ada). */
export async function GET(req: NextRequest) {
  const catId = req.nextUrl.searchParams.get("catId") ?? DEFAULT_CAT_ID;
  const save = await readLatestAutosave(catId);
  if (!save) return NextResponse.json({ error: "Belum ada simpanan otomatis" }, { status: 404 });
  return NextResponse.json(save);
}

/** PUT /api/saves/auto — Simpan otomatis progres permainan (menimpa slot otomatis sebelumnya). */
export async function PUT(req: NextRequest) {
  let body: { catId?: string; deviceLabel?: string; snapshot?: unknown } = {};
  try {
    body = (await req.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "Payload JSON tidak valid" }, { status: 400 });
  }

  const catId = body.catId ?? DEFAULT_CAT_ID;
  const player = await getAuthenticatedPlayer(req);
  if (player && !(await verifyCatAccess(catId, player.userId))) {
    return NextResponse.json(
      { error: "Akses ditolak: Anda tidak memiliki izin untuk menyimpan progres kucing ini." },
      { status: 403 },
    );
  }

  const parsed = parseSnapshot(body.snapshot);
  if (!parsed.ok) return NextResponse.json({ error: parsed.error }, { status: 400 });

  const save = await writeAutosave(
    catId,
    parsed.snapshot,
    typeof body.deviceLabel === "string" && body.deviceLabel.trim() ? body.deviceLabel.trim() : undefined,
  );
  if (!save) return NextResponse.json({ error: "Kucing tidak ditemukan" }, { status: 404 });
  return NextResponse.json({ saved: true, id: save.id, createdAt: save.createdAt });
}
