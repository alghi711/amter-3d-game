import { NextRequest, NextResponse } from "next/server";
import { consumePasswordResetToken } from "@/lib/auth-service";

/**
 * POST /api/auth/reset-password
 * Mengatur ulang kata sandi pengguna menggunakan token reset atau kode OTP 6-digit.
 */
export async function POST(req: NextRequest) {
  let body: {
    tokenOrCode?: string;
    newPassword?: string;
  } = {};

  try {
    body = (await req.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "Payload JSON tidak valid." }, { status: 400 });
  }

  const tokenOrCode = body.tokenOrCode?.trim();
  const newPassword = body.newPassword;

  if (!tokenOrCode) {
    return NextResponse.json(
      { error: "Token atau kode verifikasi wajib diisi." },
      { status: 400 },
    );
  }

  if (!newPassword || newPassword.length < 6) {
    return NextResponse.json(
      { error: "Kata sandi baru minimal 6 karakter." },
      { status: 400 },
    );
  }

  const result = await consumePasswordResetToken(tokenOrCode, newPassword);

  if (!result.success) {
    return NextResponse.json(
      { error: result.error || "Gagal mengatur ulang kata sandi." },
      { status: 400 },
    );
  }

  return NextResponse.json({
    success: true,
    message: "Kata sandi berhasil diperbarui! Silakan masuk dengan kata sandi barumu 🔑",
  });
}
