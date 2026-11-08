import { NextRequest, NextResponse } from "next/server";
import { createGuestPlayer, getPlayerById, PLAYER_COOKIE } from "@/lib/player-service";

const COOKIE_OPTS = {
  httpOnly: true,
  sameSite: "lax" as const,
  path: "/",
  maxAge: 60 * 60 * 24 * 365,
};

/** GET /api/player — Identitas pemain dari cookie; pemain tamu baru dibuat otomatis bila belum ada. */
export async function GET(req: NextRequest) {
  const existing = await getPlayerById(req.cookies.get(PLAYER_COOKIE)?.value);
  if (existing) return NextResponse.json({ created: false, ...existing });

  const player = await createGuestPlayer();
  const res = NextResponse.json({ created: true, ...player }, { status: 201 });
  res.cookies.set(PLAYER_COOKIE, player.userId, COOKIE_OPTS);
  return res;
}
