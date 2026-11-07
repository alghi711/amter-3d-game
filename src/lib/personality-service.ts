import { desc, eq } from "drizzle-orm";
import { ensureCareSchema } from "@/db";
import { catPersonality, interactions } from "@/db/schema";
import { DEFAULT_CAT_ID, getCatCareSnapshot } from "@/lib/care-repository";
import { MOCK_PERSONALITY_TRAITS, type PersonalityTrait } from "@/lib/mock-mood";

const BASE_TRAIT_POOL: PersonalityTrait[] = [
  ...MOCK_PERSONALITY_TRAITS,
  {
    id: "rapi",
    name: "Bersih & Pesolek",
    icon: "🫧",
    score: 70,
    formedBy: "Rutin dimandikan dan kandangnya selalu bersih",
    description: "Senang menjilati bulu agar selalu berkilau dan wangi.",
  },
  {
    id: "tenang",
    name: "Kalem & Pendiam",
    icon: "☁️",
    score: 60,
    formedBy: "Cukup waktu tidur siang di kasur empuk",
    description: "Suka rebahan santai sambil mengamati suasana rumah.",
  },
];

const clampScore = (v: number) => Math.max(15, Math.min(100, Math.round(v)));

/**
 * Evaluasi & simpan pembentukan kepribadian kucing ke tabel `cat_personality`
 * berdasarkan riwayat interaksi nyata di tabel `interactions` serta kondisi perawatan.
 */
export async function evaluateAndPersistCatPersonality(catId = DEFAULT_CAT_ID): Promise<{
  catId: string;
  dominantTrait: PersonalityTrait;
  traits: PersonalityTrait[];
  formedBy: string;
  updatedAt: number;
}> {
  const db = await ensureCareSchema();
  const snapshot = await getCatCareSnapshot(catId);
  const recentRows = await db
    .select()
    .from(interactions)
    .where(eq(interactions.catId, catId))
    .orderBy(desc(interactions.createdAt))
    .limit(40);

  const counts = { meal: 0, play: 0, clean: 0, pet: 0 };
  for (const row of recentRows) {
    if (row.type === "elus" || row.itemType === "elus") counts.pet++;
    else if (row.type === "mandi" || row.type === "bersihkan") counts.clean++;
    else if (row.type === "main") counts.play++;
    else if (row.type === "makan" || row.type === "minum") counts.meal++;
  }

  const traits: PersonalityTrait[] = BASE_TRAIT_POOL.map((base) => {
    let delta = 0;
    if (base.id === "manja") {
      delta = (snapshot.stats.happiness - 70) * 0.25 + counts.pet * 4;
    } else if (base.id === "aktif") {
      delta = (snapshot.stats.energy - 55) * 0.2 + counts.play * 5;
    } else if (base.id === "kuliner") {
      delta = (snapshot.stats.hunger - 65) * 0.25 + counts.meal * 4;
    } else if (base.id === "rapi") {
      delta = (snapshot.stats.hygiene - 70) * 0.3 + counts.clean * 5;
    } else if (base.id === "tenang") {
      delta = (100 - snapshot.stats.energy) * 0.15;
    }
    return {
      ...base,
      score: clampScore(base.score + delta),
    };
  }).sort((a, b) => b.score - a.score);

  const dominantTrait = traits[0];
  const formedBy = dominantTrait.formedBy;
  const now = Date.now();

  await db
    .insert(catPersonality)
    .values({
      catId,
      traitsJson: JSON.stringify(traits),
      formedBy,
      updatedAt: now,
    })
    .onConflictDoUpdate({
      target: catPersonality.catId,
      set: {
        traitsJson: JSON.stringify(traits),
        formedBy,
        updatedAt: now,
      },
    });

  return {
    catId,
    dominantTrait,
    traits,
    formedBy,
    updatedAt: now,
  };
}
