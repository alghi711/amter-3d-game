import { randomUUID } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { ensureCareSchema } from "@/db";
import { catGrowth, catMoods, cats, catStats, playerRecoveryCodes, users } from "@/db/schema";
import { hashPassword } from "@/lib/auth-service";
import { createPlayerSession, transferCatOwnership } from "@/lib/account-progress-service";
import { PLAYER_COOKIE } from "@/lib/player-service";

export const SESSION_COOKIE = "mochi_session";

const COOKIE_OPTS = {
  httpOnly: true,
  sameSite: "lax" as const,
  path: "/",
  maxAge: 60 * 60 * 24 * 365,
};

const CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

function generateRecoveryCode(): string {
  const chars = Array.from({ length: 12 }, () =>
    CODE_ALPHABET.charAt(Math.floor(Math.random() * CODE_ALPHABET.length)),
  ).join("");
  return `MOCHI-${chars.slice(0, 4)}-${chars.slice(4, 8)}-${chars.slice(8, 12)}`;
}

/**
 * POST /api/auth/register
 * Mendaftarkan akun pengguna baru dengan email & kata sandi,
 * membuat kucing baru atau mentransfer kucing tamu yang sedang dimainkan.
 */
export async function POST(req: NextRequest) {
  let body: {
    name?: string;
    email?: string;
    password?: string;
    catName?: string;
    catFurColor?: string;
    guestCatId?: string;
  } = {};

  try {
    body = (await req.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "Payload JSON tidak valid." }, { status: 400 });
  }

  const name = body.name?.trim();
  const email = body.email?.trim().toLowerCase();
  const password = body.password;
  const catName = body.catName?.trim() || "Mochi";
  const catFurColor = body.catFurColor || "#f4b673";

  // Validasi input
  if (!name || name.length < 2) {
    return NextResponse.json(
      { error: "Nama pemain minimal 2 karakter." },
      { status: 400 },
    );
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!email || !emailRegex.test(email)) {
    return NextResponse.json(
      { error: "Format alamat email tidak valid." },
      { status: 400 },
    );
  }

  if (!password || password.length < 6) {
    return NextResponse.json(
      { error: "Kata sandi minimal 6 karakter." },
      { status: 400 },
    );
  }

  const db = await ensureCareSchema();

  // Cek apakah email sudah terdaftar
  const [existingUser] = await db
    .select()
    .from(users)
    .where(eq(users.email, email))
    .limit(1);

  if (existingUser) {
    return NextResponse.json(
      { error: "Email sudah terdaftar. Silakan masuk atau gunakan email lain." },
      { status: 409 },
    );
  }

  const now = Date.now();
  const userId = `user-${randomUUID()}`;
  const passwordHash = hashPassword(password);
  const recoveryCode = generateRecoveryCode();

  let finalCatId = body.guestCatId;

  await db.transaction(async (tx) => {
    // 1. Simpan pengguna baru
    await tx.insert(users).values({
      id: userId,
      email,
      name,
      passwordHash,
      avatar: "🐱",
      isGuest: false,
      createdAt: now,
      updatedAt: now,
    });

    // 2. Simpan kode pemulihan
    await tx.insert(playerRecoveryCodes).values({
      userId,
      code: recoveryCode,
      createdAt: now,
    });

    // 3. Tautkan kucing tamu jika ada, atau buat kucing baru
    let hasTransferred = false;
    if (finalCatId) {
      const [existingCat] = await tx
        .select()
        .from(cats)
        .where(eq(cats.id, finalCatId))
        .limit(1);
      if (existingCat) {
        await tx
          .update(cats)
          .set({ userId, lastPlayedAt: now })
          .where(eq(cats.id, finalCatId));
        hasTransferred = true;
      }
    }

    if (!hasTransferred) {
      finalCatId = `cat-${randomUUID()}`;
      await tx.insert(cats).values({
        id: finalCatId,
        userId,
        name: catName,
        stage: "anak",
        level: 1,
        experience: 0,
        closeness: 50,
        appearanceJson: JSON.stringify({ furColor: catFurColor }),
        lastPlayedAt: now,
      });

      await tx.insert(catStats).values({ catId: finalCatId, updatedAt: now });
      await tx.insert(catMoods).values({ catId: finalCatId, updatedAt: now });
      await tx.insert(catGrowth).values({
        catId: finalCatId,
        stageChangedAt: now,
        updatedAt: now,
      });
    }
  });

  // Jika mentransfer kucing tamu yang memiliki lencana, salin lencana ke user_achievements
  if (body.guestCatId) {
    await transferCatOwnership(body.guestCatId, userId);
  }

  // 4. Buat sesi aktif pengguna
  const { token: sessionToken } = await createPlayerSession(userId, "Browser Web");

  const [createdCat] = await db
    .select()
    .from(cats)
    .where(eq(cats.id, finalCatId!))
    .limit(1);

  const res = NextResponse.json(
    {
      success: true,
      user: {
        id: userId,
        name,
        email,
        avatar: "🐱",
        isGuest: false,
      },
      cat: createdCat
        ? {
            id: createdCat.id,
            name: createdCat.name,
            stage: createdCat.stage,
            level: createdCat.level,
            experience: createdCat.experience,
            closeness: createdCat.closeness,
            furColor: catFurColor,
          }
        : null,
      recoveryCode,
      message: "Akun pemain berhasil didaftarkan! Selamat datang di Mochi Kucing Virtual 🐾",
    },
    { status: 201 },
  );

  res.cookies.set(SESSION_COOKIE, sessionToken, COOKIE_OPTS);
  res.cookies.set(PLAYER_COOKIE, userId, COOKIE_OPTS);

  return res;
}
