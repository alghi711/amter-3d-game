import { NextRequest } from "next/server";
import { eq } from "drizzle-orm";
import { ensureCareSchema } from "@/db";
import { cats } from "@/db/schema";
import { validatePlayerSession } from "@/lib/account-progress-service";
import { getPlayerById } from "@/lib/player-service";
import { DEFAULT_CAT_ID } from "@/lib/care-repository";

export type AuthContext = {
  userId: string;
  isGuest: boolean;
  name: string;
  email: string | null;
};

/**
 * Ekstrak dan validasi identitas pemain dari request headers (diteruskan middleware)
 * atau cookies langsung.
 */
export async function getAuthenticatedPlayer(req: NextRequest): Promise<AuthContext | null> {
  const sessionToken =
    req.headers.get("x-mochi-session") || req.cookies.get("mochi_session")?.value;
  const playerCookieId =
    req.headers.get("x-mochi-player") || req.cookies.get("mochi_player")?.value;

  // 1. Coba verifikasi token sesi akun terdaftar
  if (sessionToken) {
    const sessionData = await validatePlayerSession(sessionToken);
    if (sessionData) {
      return {
        userId: sessionData.user.id,
        isGuest: sessionData.user.isGuest,
        name: sessionData.user.name,
        email: sessionData.user.email,
      };
    }
  }

  // 2. Fallback ke identitas pemain tamu via cookie player ID
  if (playerCookieId) {
    const guestPlayer = await getPlayerById(playerCookieId);
    if (guestPlayer) {
      return {
        userId: guestPlayer.userId,
        isGuest: true,
        name: guestPlayer.name,
        email: null,
      };
    }
  }

  return null;
}

/**
 * Pastikan bahwa pemain yang melakukan request memiliki hak akses terhadap kucing tersebut.
 * Kucing bawaan sistem ("cat-mochi") diizinkan untuk semua pemain single-player lokal,
 * sedangkan kucing kustom hanya boleh diakses oleh pemiliknya.
 */
export async function verifyCatAccess(catId: string, userId: string): Promise<boolean> {
  if (catId === DEFAULT_CAT_ID) {
    return true; // Kucing default demo/single-player selalu bisa diakses
  }

  const db = await ensureCareSchema();
  const [cat] = await db
    .select()
    .from(cats)
    .where(eq(cats.id, catId))
    .limit(1);

  if (!cat) return false;
  return cat.userId === userId;
}
