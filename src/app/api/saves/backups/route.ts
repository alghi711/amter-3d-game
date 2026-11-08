import { NextRequest, NextResponse } from "next/server";
import { DEFAULT_CAT_ID } from "@/lib/care-repository";
import { createBackup, listBackups, parseSnapshot } from "@/lib/save-service";

/** GET /api/saves/backups — Daftar cadangan progres (terbaru dulu). */
export async function GET(req: NextRequest) {
  const catId = req.nextUrl.searchParams.get("catId") ?? DEFAULT_CAT_ID;
  const backups = await listBackups(catId);
  return NextResponse.json({ catId, count: backups.length, backups });
}

/** POST /api/saves/backups — Buat cadangan baru dari snapshot dan kembalikan kode cadangan. */
export async function POST(req: NextRequest) {
  let body: { catId?: string; deviceLabel?: string; snapshot?: unknown } = {};
  try {
    body = (await req.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "Payload JSON tidak valid" }, { status: 400 });
  }
  const parsed = parseSnapshot(body.snapshot);
  if (!parsed.ok) return NextResponse.json({ error: parsed.error }, { status: 400 });

  const backup = await createBackup(
    body.catId ?? DEFAULT_CAT_ID,
    parsed.snapshot,
    typeof body.deviceLabel === "string" && body.deviceLabel.trim() ? body.deviceLabel.trim() : undefined,
  );
  if (!backup) return NextResponse.json({ error: "Kucing tidak ditemukan" }, { status: 404 });
  return NextResponse.json(backup, { status: 201 });
}
