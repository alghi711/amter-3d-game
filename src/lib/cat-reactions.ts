import type { CatPart, CatTouch } from "@/components/room/CatRoomScene";

/** Kumpulan respons per jenis sentuhan & bagian tubuh. `{name}` diganti nama kucing. */
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

const last = new Map<string, number>();

/** Ambil respons acak tanpa mengulang respons terakhir untuk kombinasi yang sama. */
export function pickReaction({ kind, part }: CatTouch, name: string, rand: () => number = Math.random): string {
  const pool = RESPONSES[kind][part];
  const key = `${kind}:${part}`;
  let i = Math.floor(rand() * pool.length);
  if (pool.length > 1 && i === last.get(key)) i = (i + 1) % pool.length;
  last.set(key, i);
  return pool[i].replaceAll("{name}", name);
}
