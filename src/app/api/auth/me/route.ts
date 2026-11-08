import { NextRequest, NextResponse } from "next/server";
import { getUserCatWithProgress, validatePlayerSession } from "@/lib/account-progress-service";
import { SESSION_COOKIE } from "@/app/api/auth/register/route";
import { getPlayerById, PLAYER_COOKIE } from "@/lib/player-service";

/**
 * GET /api/auth/me
 * Mengembalikan data profil pemain dan kucing dari sesi aktif saat ini.
 */
export async function GET(req: NextRequest) {
  const sessionToken = req.cookies.get(SESSION_COOKIE)?.value;
  const playerCookieId = req.cookies.get(PLAYER_COOKIE)?.value;

  let userId: string | null = null;

  if (sessionToken) {
    const sessionData = await validatePlayerSession(sessionToken);
    if (sessionData) {
      userId = sessionData.user.id;
    }
  }

  if (!userId && playerCookieId) {
    const player = await getPlayerById(playerCookieId);
    if (player) {
      userId = player.userId;
    }
  }

  if (!userId) {
    return NextResponse.json({ authenticated: false, user: null, cat: null });
  }

  const profile = await getUserCatWithProgress(userId);
  if (!profile) {
    return NextResponse.json({ authenticated: false, user: null, cat: null });
  }

  let furColor = "#f4b673";
  try {
    const parsed = JSON.parse(profile.cat.appearanceJson) as { furColor?: string };
    if (parsed.furColor) furColor = parsed.furColor;
  } catch {
    // Default
  }

  return NextResponse.json({
    authenticated: true,
    user: {
      id: profile.user.id,
      name: profile.user.name,
      email: profile.user.email,
      avatar: profile.user.avatar,
      isGuest: profile.user.isGuest,
    },
    cat: {
      id: profile.cat.id,
      name: profile.cat.name,
      stage: profile.cat.stage,
      level: profile.cat.level,
      experience: profile.cat.experience,
      closeness: profile.cat.closeness,
      furColor,
      stats: profile.stats,
    },
  });
}
