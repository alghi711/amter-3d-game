import { NextRequest, NextResponse } from "next/server";
import { destroyPlayerSession } from "@/lib/account-progress-service";
import { SESSION_COOKIE } from "@/app/api/auth/register/route";
import { PLAYER_COOKIE } from "@/lib/player-service";

/**
 * POST /api/auth/logout
 * Menghapus token sesi aktif dan membersihkan cookie autentikasi.
 */
export async function POST(req: NextRequest) {
  const sessionToken = req.cookies.get(SESSION_COOKIE)?.value;

  if (sessionToken) {
    try {
      await destroyPlayerSession(sessionToken);
    } catch {
      // Abaikan jika token sesi tidak ditemukan
    }
  }

  const res = NextResponse.json({
    success: true,
    message: "Berhasil keluar dari akun. Sampai jumpa lagi! 🐾",
  });

  // Hapus cookie sesi
  res.cookies.set(SESSION_COOKIE, "", {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });

  res.cookies.set(PLAYER_COOKIE, "", {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });

  return res;
}
