import type { CatPart, CatTouch } from "@/components/room/CatRoomScene";
import { resolveClosenessTier } from "@/lib/mock-growth";

/** Kumpulan respons dasar per jenis sentuhan & bagian tubuh. `{name}` diganti nama kucing. */
const RESPONSES: Record<CatTouch["kind"], Record<CatPart, string[]>> = {
  elus: {
    kepala: [
      "{name} memejamkan mata… purrr 💕",
      "{name} menyundul tanganmu minta lagi!",
      "{name} mendengkur keras sekali 😻",
      "{name} memiringkan kepala, keenakan",
    ],
    badan: [
      "{name} berguling manja 🐾",
      "{name} melengkungkan punggung, senang!",
      "{name} meregangkan badan sambil mendengkur",
      "{name} menguleni karpet dengan kaki depan",
    ],
    ekor: [
      "{name} mengibaskan ekor… kurang suka 😾",
      "{name} melirik tajam. Ekor itu wilayah pribadi!",
      "{name} menarik ekornya pelan-pelan",
    ],
  },
  sentuh: {
    kepala: ["{name} menoleh: “Meong?”", "{name} mengedipkan mata pelan — tanda sayang", "{name} mengendus jarimu"],
    badan: ["{name} kaget sedikit, lalu santai lagi", "{name} melompat kecil 😸", "{name} menatapmu penasaran"],
    ekor: ["{name} memutar badan mengejar ekornya!", "{name} mendesis kecil… jangan ekor!", "Ekor {name} berkedut-kedut"],
  },
};

/** Variasi reaksi khusus berdasarkan jenjang tingkat kedekatan. */
export const CLOSENESS_REACTIONS: Record<
  string,
  {
    summary: string;
    elus: Partial<Record<CatPart, string[]>>;
    sentuh: Partial<Record<CatPart, string[]>>;
  }
> = {
  kenalan: {
    summary: "Masih agak malu-malu, mengendus tanganmu dulu sebelum mau dielus.",
    elus: {
      kepala: [
        "{name} awalnya ragu, lalu pelan-pelan menikmati elusanmu 🌱",
        "{name} mengendus jarimu dulu sebelum membiarkanmu mengelus kepala",
      ],
      badan: [
        "{name} menoleh hati-hati, tapi tetap diam saat punggungnya dielus",
      ],
    },
    sentuh: {
      kepala: ["{name} mundur setengah langkah karena masih malu-malu 🐾"],
      badan: ["{name} langsung siaga menatapmu dengan mata bulat"],
    },
  },
  akrab: {
    summary: "Langsung mendekat dan mengangkat ekor saat kamu menyapanya.",
    elus: {
      kepala: [
        "{name} menyambut tanganmu dan mendengkur hangat 🐾",
        "{name} mengusapkan pipinya ke telapak tanganmu",
      ],
      badan: [
        "{name} mengangkat punggung mengikuti usapan tanganmu",
      ],
    },
    sentuh: {
      kepala: ["{name} mengeong pendek penuh semangat menyapamu!"],
    },
  },
  sayang: {
    summary: "Berguling memperlihatkan perut dan mendengkur kencang saat dielus.",
    elus: {
      kepala: [
        "{name} langsung merem keenakan dan menyundul tanganmu terus 💕",
        "{name} menjilati ujung jarimu tanda sayang sekali 😻",
      ],
      badan: [
        "{name} berguling terlentang memperlihatkan perutnya — percaya penuh padamu! 💕",
        "{name} menguleni karpet sambil mendengkur tanpa henti",
      ],
    },
    sentuh: {
      kepala: ["{name} memberikan kedipan lambat penuh kasih sayang 💖"],
    },
  },
  "belahan-jiwa": {
    summary: "Tak mau lepas darimu, bahkan tidak marah walau ekornya tak sengaja tersentuh.",
    elus: {
      kepala: [
        "{name} memeluk tanganmu dengan kaki depan sambil mendengkur bahagia 👑💖",
        "{name} menempelkan dahinya ke tanganmu — ikatan sahabat sejati!",
      ],
      badan: [
        "{name} rebahan manja di pangkuanmu dan enggan pindah 👑",
      ],
      ekor: [
        "{name} mengibaskan ekor pelan — karena sudah percaya penuh, ia tidak marah 💕",
      ],
    },
    sentuh: {
      kepala: ["{name} langsung berlari kecil menyambut sentuhanmu 👑"],
      ekor: ["{name} cuma menoleh manja walau ekornya tersentuh 😺"],
    },
  },
};

const last = new Map<string, number>();

/** Ambil respons acak sesuai bagian tubuh & tingkat kedekatan (0..100). */
export function pickReaction(
  { kind, part }: CatTouch,
  name: string,
  closeness = 62,
  rand: () => number = Math.random,
): string {
  const tier = resolveClosenessTier(closeness);
  const tierCustom = CLOSENESS_REACTIONS[tier.id]?.[kind]?.[part] ?? [];
  const basePool = RESPONSES[kind][part];
  // Pada tingkat belahan-jiwa, sentuh/elus ekor memakai respons ramah khusus
  const pool =
    tier.id === "belahan-jiwa" && part === "ekor" && tierCustom.length > 0
      ? tierCustom
      : [...tierCustom, ...basePool];

  const key = `${tier.id}:${kind}:${part}`;
  let i = Math.floor(rand() * pool.length);
  if (pool.length > 1 && i === last.get(key)) i = (i + 1) % pool.length;
  last.set(key, i);
  return pool[i].replaceAll("{name}", name);
}
