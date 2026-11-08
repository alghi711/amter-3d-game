import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { ensureCareSchema } from "@/db";
import { playerRecoveryCodes, users } from "@/db/schema";
import { createPasswordResetToken } from "@/lib/auth-service";

/**
 * POST /api/auth/forgot-password
 * Meminta kode OTP 6-digit via email atau token reset via Kode Pemulihan Akun (Recovery Code).
 */
export async function POST(req: NextRequest) {
  let body: { email?: string; recoveryCode?: string } = {};

  try {
    body = (await req.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "Payload JSON tidak valid." }, { status: 400 });
  }

  const db = await ensureCareSchema();

  // 1. Pemulihan via Kode Pemulihan Akun (Recovery Code)
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
        { status: 404 },
      );
    }

    const { token, expiresAt } = await createPasswordResetToken(rec.userId);

    return NextResponse.json({
      success: true,
      method: "recoveryCode",
      resetToken: token,
      expiresAt,
      message: "Kode pemulihan valid. Silakan buat kata sandi baru untuk akunmu 🔑",
    });
  }

  // 2. Pemulihan via Alamat Email
  const email = body.email?.trim().toLowerCase();
  if (!email) {
    return NextResponse.json(
      { error: "Alamat email atau kode pemulihan wajib diisi." },
      { status: 400 },
    );
  }

  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.email, email))
    .limit(1);

  if (!user) {
    // Pesan aman yang ramah untuk mencegah enumerasi akun
    return NextResponse.json({
      success: true,
      method: "email",
      message: "Bila alamat email terdaftar, kode verifikasi OTP 6 digit telah dikirimkan.",
      simulatedOtp: "842-109",
    });
  }

  const { code, token, expiresAt } = await createPasswordResetToken(user.id);
  const formattedOtp = `${code.slice(0, 3)}-${code.slice(3, 6)}`;

  return NextResponse.json({
    success: true,
    method: "email",
    resetToken: token,
    simulatedOtp: formattedOtp,
    expiresAt,
    message: `Kode verifikasi 6 digit telah disiapkan untuk ${email}. Masukkan kode tersebut untuk mereset sandi.`,
  });
}
