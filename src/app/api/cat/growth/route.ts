import { NextRequest, NextResponse } from "next/server";
import { DEFAULT_CAT_ID } from "@/lib/care-repository";
import { addExperience, MAX_XP_PER_REQUEST } from "@/lib/growth-service";

/** POST /api/cat/growth — Tambah pengalaman kucing; otomatis naik level & naik tahap (anak → dewasa). */
export async function POST(req: NextRequest) {
  let body: { catId?: string; xp?: number; reason?: string } = {};
  try {
    body = (await req.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "Payload JSON tidak valid" }, { status: 400 });
  }

  const xp = body.xp;
  if (typeof xp !== "number" || !Number.isInteger(xp) || xp < 1 || xp > MAX_XP_PER_REQUEST) {
    return NextResponse.json(
      { error: `xp harus bilangan bulat antara 1 dan ${MAX_XP_PER_REQUEST}` },
      { status: 400 },
    );
  }

  const reason = typeof body.reason === "string" && body.reason.trim() ? body.reason.trim().slice(0, 40) : "xp";
  const result = await addExperience(body.catId ?? DEFAULT_CAT_ID, xp, reason);
  if (!result) {
    return NextResponse.json({ error: "Kucing tidak ditemukan" }, { status: 404 });
  }

  const messages: string[] = [];
  if (result.leveledUp) messages.push(`Naik ke Level ${result.level}! 🎉`);
  if (result.stageChanged) messages.push("Mochi tumbuh menjadi Kucing Dewasa! 🐈");
  return NextResponse.json({ ...result, messages });
}
