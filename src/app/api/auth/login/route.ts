import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { ensureCareSchema } from "@/db";
import { playerRecoveryCodes, users } from "@/db/schema";
import { verifyPassword } from "@/lib/auth-service";
import { createPlayerSession, getUserCatWithProgress } from "@/lib/account-progress-service";
import { SESSION_COOKIE } from "@/app/api/auth/register/route";
import { PLAYER_COOKIE } from "@/lib/player-service";

const COOKIE_OPTS = {
  httpOnly: true,
  sameSite: "lax" as const,
  path: "/",
  maxAge: 60 * 60 * 24 * 365,
};

/**
 * POST /api/auth/login
 * Masuk ke akun menggunakan Email & Password atau Kode Pemulihan Akun (Recovery Code).
 */
export async function POST(req: NextRequest) {
  let body: {
    email?: string;
    password?: string;
    recoveryCode?: string;
    deviceLabel?: string;
  } = {};

  try {
    body = (await req.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "Payload JSON tidak valid." }, { status: 400 });
  }

  const db = await ensureCareSchema();
  let authenticatedUserId: string | null = null;

  // 1. Opsi Masuk via Kode Pemulihan
  if (body.recoveryCode) {
    const cleanCode = body.recoveryCode.trim().toUpperCase();
    const [rec] = await db
      .select()
      .from(playerRecoveryCodes)
      .where(eq(playerRecoveryCodes.code, cleanCode))
      .limit(1);

    if (!rec) {
      return NextResponse.json(
        { error: "Kode pemulihan akun tidak ditemukan atau salah ketik." },
        { status: 401 },
      );
    }

    // Catat waktu terakhir digunakan
    await db
      .update(playerRecoveryCodes)
      .set({ lastUsedAt: Date.now() })
      .where(eq(playerRecoveryCodes.code, cleanCode));

    authenticatedUserId = rec.userId;
  } else {
    // 2. Opsi Masuk via Email & Kata Sandi
    const email = body.email?.trim().toLowerCase();
    const password = body.password;

    if (!email || !password) {
      return NextResponse.json(
        { error: "Alamat email dan kata sandi wajib diisi." },
        { status: 400 },
      );
    }

    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    if (!user || !verifyPassword(password, user.passwordHash)) {
      return NextResponse.json(
        { error: "Alamat email atau kata sandi tidak cocok." },
        { status: 401 },
      );
    }

    authenticatedUserId = user.id;
  }

  // Ambil profil lengkap pemain dan kucing yang dimilikinya
  const profile = await getUserCatWithProgress(authenticatedUserId);
  if (!profile) {
    return NextResponse.json(
      { error: "Profil pemain tidak ditemukan." },
      { status: 404 },
    );
  }

  // Buat sesi login baru di database
  const { token: sessionToken } = await createPlayerSession(
    profile.user.id,
    body.deviceLabel || "Browser Web",
  );

  let furColor = "#f4b673";
  try {
    const parsed = JSON.parse(profile.cat.appearanceJson) as { furColor?: string };
    if (parsed.furColor) furColor = parsed.furColor;
  } catch {
    // Gunakan default jika gagal parse
  }

  const res = NextResponse.json({
    success: true,
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
    message: `Selamat datang kembali, ${profile.user.name}! 🐾`,
  });

  res.cookies.set(SESSION_COOKIE, sessionToken, COOKIE_OPTS);
  res.cookies.set(PLAYER_COOKIE, profile.user.id, COOKIE_OPTS);

  return res;
}
