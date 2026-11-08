import { NextRequest, NextResponse } from "next/server";
import { PLAYER_COOKIE, recoverPlayer } from "@/lib/player-service";

/** POST /api/player/recover — Masuk kembali ke akun tamu memakai kode pemulihan. */
export async function POST(req: NextRequest) {
  let body: { code?: string } = {};
  try {
    body = (await req.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "Payload JSON tidak valid" }, { status: 400 });
  }
  if (typeof body.code !== "string" || !body.code.trim()) {
    return NextResponse.json({ error: "code wajib diisi" }, { status: 400 });
  }
  const player = await recoverPlayer(body.code);
  if (!player) return NextResponse.json({ error: "Kode pemulihan tidak valid" }, { status: 404 });

  const res = NextResponse.json({ recovered: true, ...player });
  res.cookies.set(PLAYER_COOKIE, player.userId, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
  });
  return res;
}
