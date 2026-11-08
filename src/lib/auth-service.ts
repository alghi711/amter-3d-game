import { randomBytes, scryptSync, timingSafeEqual } from "node:crypto";
import { and, desc, eq, gt, isNull } from "drizzle-orm";
import { ensureCareSchema } from "@/db";
import { passwordResetTokens, users } from "@/db/schema";

const RESET_TOKEN_TTL_MS = 15 * 60 * 1000; // 15 menit

/** Hash password menggunakan crypto scrypt bawaan Node.js (format: salt:key). */
export function hashPassword(plain: string): string {
  const salt = randomBytes(16).toString("hex");
  const key = scryptSync(plain, salt, 64).toString("hex");
  return `${salt}:${key}`;
}

/** Verifikasi kecocokan password polos dengan hash tersimpan secara timing-safe. */
export function verifyPassword(plain: string, storedHash: string | null | undefined): boolean {
  if (!storedHash || !storedHash.includes(":")) return false;
  const [salt, key] = storedHash.split(":");
  if (!salt || !key) return false;
  try {
    const keyBuffer = Buffer.from(key, "hex");
    const derived = scryptSync(plain, salt, keyBuffer.length);
    return timingSafeEqual(keyBuffer, derived);
  } catch {
    return false;
  }
}

/** Buat token reset & 6 digit kode OTP untuk pemulihan kata sandi. */
export async function createPasswordResetToken(userId: string): Promise<{
  id: string;
  token: string;
  code: string;
  expiresAt: number;
}> {
  const db = await ensureCareSchema();
  const now = Date.now();
  const id = `prt-${randomBytes(12).toString("hex")}`;
  const token = randomBytes(24).toString("hex");
  // 6 digit angka OTP (100000 - 999999)
  const code = (100000 + Math.floor(Math.random() * 900000)).toString();
  const expiresAt = now + RESET_TOKEN_TTL_MS;

  await db.insert(passwordResetTokens).values({
    id,
    userId,
    token,
    code,
    expiresAt,
    usedAt: null,
    createdAt: now,
  });

  return { id, token, code, expiresAt };
}

/** Cari dan validasi token reset atau kode OTP yang masih aktif & belum dipakai. */
export async function findActiveResetToken(tokenOrCode: string) {
  const db = await ensureCareSchema();
  const now = Date.now();
  const clean = tokenOrCode.trim().replace(/[^a-zA-Z0-9]/g, "");

  // Cari berdasarkan token lengkap atau 6-digit OTP
  const [record] = await db
    .select()
    .from(passwordResetTokens)
    .where(
      and(
        gt(passwordResetTokens.expiresAt, now),
        isNull(passwordResetTokens.usedAt),
        tokenOrCode.length > 10
          ? eq(passwordResetTokens.token, tokenOrCode.trim())
          : eq(passwordResetTokens.code, clean),
      ),
    )
    .orderBy(desc(passwordResetTokens.createdAt))
    .limit(1);

  return record ?? null;
}

/** Gunakan token/kode reset untuk mengganti kata sandi pengguna secara atomik. */
export async function consumePasswordResetToken(
  tokenOrCode: string,
  newPasswordPlain: string,
): Promise<{ success: boolean; userId?: string; error?: string }> {
  const db = await ensureCareSchema();
  const record = await findActiveResetToken(tokenOrCode);
  if (!record) {
    return { success: false, error: "Token atau kode pemulihan tidak valid atau sudah kedaluwarsa." };
  }

  const newHash = hashPassword(newPasswordPlain);
  const now = Date.now();

  await db.transaction(async (tx) => {
    await tx
      .update(passwordResetTokens)
      .set({ usedAt: now })
      .where(eq(passwordResetTokens.id, record.id));

    await tx
      .update(users)
      .set({ passwordHash: newHash, isGuest: false, updatedAt: now })
      .where(eq(users.id, record.userId));
  });

  return { success: true, userId: record.userId };
}
