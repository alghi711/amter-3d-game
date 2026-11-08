import { randomBytes } from "node:crypto";
import { and, desc, eq, gt } from "drizzle-orm";
import { ensureCareSchema } from "@/db";
import {
  catBadges,
  cats,
  catStats,
  gameSaves,
  playerSessions,
  userAchievements,
  users,
} from "@/db/schema";
import type { CatStats } from "@/lib/mock-cat";

const SESSION_TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30 hari

/** Buat token sesi baru untuk akun pemain. */
export async function createPlayerSession(userId: string, deviceLabel = "Browser"): Promise<{
  sessionId: string;
  token: string;
  expiresAt: number;
}> {
  const db = await ensureCareSchema();
  const sessionId = `sess-${randomBytes(12).toString("hex")}`;
  const token = randomBytes(32).toString("hex");
  const now = Date.now();
  const expiresAt = now + SESSION_TTL_MS;

  await db.insert(playerSessions).values({
    id: sessionId,
    userId,
    token,
    deviceLabel,
    createdAt: now,
    expiresAt,
  });

  return { sessionId, token, expiresAt };
}

/** Validasi token sesi aktif dan ambil data pengguna pemiliknya. */
export async function validatePlayerSession(token: string | undefined) {
  if (!token) return null;
  const db = await ensureCareSchema();
  const now = Date.now();

  const [session] = await db
    .select()
    .from(playerSessions)
    .where(and(eq(playerSessions.token, token), gt(playerSessions.expiresAt, now)))
    .limit(1);

  if (!session) return null;

  const [user] = await db.select().from(users).where(eq(users.id, session.userId)).limit(1);
  if (!user) return null;

  return { session, user };
}

/** Hapus sesi ketika pemain logout. */
export async function destroyPlayerSession(token: string) {
  const db = await ensureCareSchema();
  await db.delete(playerSessions).where(eq(playerSessions.token, token));
}

/** Tautkan / transfer kepemilikan kucing dari akun tamu ke akun pengguna terdaftar baru. */
export async function transferCatOwnership(catId: string, toUserId: string): Promise<boolean> {
  const db = await ensureCareSchema();
  const now = Date.now();

  const [cat] = await db.select().from(cats).where(eq(cats.id, catId)).limit(1);
  if (!cat) return false;

  await db.transaction(async (tx) => {
    // 1. Update kepemilikan kucing
    await tx.update(cats).set({ userId: toUserId, lastPlayedAt: now }).where(eq(cats.id, catId));

    // 2. Salin lencana kucing ke user_achievements
    const badges = await tx.select().from(catBadges).where(eq(catBadges.catId, catId));
    for (const b of badges) {
      await tx
        .insert(userAchievements)
        .values({
          userId: toUserId,
          achievementId: b.badgeId,
          unlockedAt: b.unlockedAt,
          progress: 100,
        })
        .onConflictDoNothing();
    }
  });

  return true;
}

/** Ambil profil kucing & progres lengkap milik seorang pengguna. */
export async function getUserCatWithProgress(userId: string) {
  const db = await ensureCareSchema();
  const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
  if (!user) return null;

  const [cat] = await db.select().from(cats).where(eq(cats.userId, userId)).limit(1);
  if (!cat) return null;

  const [statRow] = await db.select().from(catStats).where(eq(catStats.catId, cat.id)).limit(1);
  const [latestSave] = await db
    .select()
    .from(gameSaves)
    .where(eq(gameSaves.catId, cat.id))
    .orderBy(desc(gameSaves.createdAt))
    .limit(1);

  const stats: CatStats = statRow
    ? {
        hunger: statRow.hunger,
        thirst: statRow.thirst,
        hygiene: statRow.hygiene,
        happiness: statRow.happiness,
        energy: statRow.energy,
      }
    : { hunger: 70, thirst: 55, hygiene: 80, happiness: 85, energy: 60 };

  return {
    user,
    cat,
    stats,
    latestSave: latestSave ?? null,
  };
}
