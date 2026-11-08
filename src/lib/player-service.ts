import { randomBytes, randomUUID } from "node:crypto";
import { eq } from "drizzle-orm";
import { ensureCareSchema } from "@/db";
import { catGrowth, catMoods, cats, catStats, playerRecoveryCodes, users } from "@/db/schema";

export const PLAYER_COOKIE = "mochi_player";
const CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // tanpa karakter membingungkan (0/O, 1/I)

/** Kode pemulihan acak 12 karakter: MOCHI-XXXX-XXXX-XXXX. */
function generateRecoveryCode(): string {
  const bytes = randomBytes(12);
  const chars = Array.from(bytes, (b) => CODE_ALPHABET[b % CODE_ALPHABET.length]).join("");
  return `MOCHI-${chars.slice(0, 4)}-${chars.slice(4, 8)}-${chars.slice(8, 12)}`;
}

export type PlayerIdentity = { userId: string; catId: string; name: string; recoveryCode: string };

/** Buat pemain tamu baru lengkap dengan kucing, kondisi awal, dan kode pemulihan. */
export async function createGuestPlayer(): Promise<PlayerIdentity> {
  const db = await ensureCareSchema();
  const now = Date.now();
  const userId = `user-${randomUUID()}`;
  const catId = `cat-${randomUUID()}`;
  const recoveryCode = generateRecoveryCode();
  const name = "Pemain Mochi";

  await db.transaction(async (tx) => {
    await tx.insert(users).values({ id: userId, email: null, name, createdAt: now, updatedAt: now });
    await tx.insert(cats).values({
      id: catId,
      userId,
      name: "Mochi",
      stage: "anak",
      level: 1,
      experience: 0,
      closeness: 50,
      lastPlayedAt: now,
    });
    await tx.insert(catStats).values({ catId, updatedAt: now });
    await tx.insert(catMoods).values({ catId, updatedAt: now });
    await tx.insert(catGrowth).values({ catId, stageChangedAt: now, updatedAt: now });
    await tx.insert(playerRecoveryCodes).values({ userId, code: recoveryCode, createdAt: now });
  });
  return { userId, catId, name, recoveryCode };
}

async function identityForUser(userId: string): Promise<PlayerIdentity | null> {
  const db = await ensureCareSchema();
  const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
  if (!user) return null;
  const [cat] = await db.select().from(cats).where(eq(cats.userId, userId)).limit(1);
  const [rec] = await db.select().from(playerRecoveryCodes).where(eq(playerRecoveryCodes.userId, userId)).limit(1);
  if (!cat || !rec) return null;
  return { userId, catId: cat.id, name: user.name, recoveryCode: rec.code };
}

/** Cari identitas pemain dari id di cookie. */
export async function getPlayerById(userId: string | undefined): Promise<PlayerIdentity | null> {
  if (!userId) return null;
  return identityForUser(userId);
}

/** Masuk kembali memakai kode pemulihan (tidak peka huruf besar/kecil). */
export async function recoverPlayer(code: string): Promise<PlayerIdentity | null> {
  const normalized = code.trim().toUpperCase();
  if (!/^MOCHI-[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}$/.test(normalized)) return null;
  const db = await ensureCareSchema();
  const [rec] = await db.select().from(playerRecoveryCodes).where(eq(playerRecoveryCodes.code, normalized)).limit(1);
  if (!rec) return null;
  await db.update(playerRecoveryCodes).set({ lastUsedAt: Date.now() }).where(eq(playerRecoveryCodes.userId, rec.userId));
  return identityForUser(rec.userId);
}
