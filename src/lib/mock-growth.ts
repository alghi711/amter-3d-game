export type GrowthStage = "anak" | "dewasa";

export type StageAppearance = {
  bodyScaleLabel: string;
  earProportion: string;
  collarLabel: string;
  stripeLabel: string;
  hasCollar: boolean;
  hasAdultStripes: boolean;
};

export type GrowthStageDefinition = {
  stage: GrowthStage;
  title: string;
  subtitle: string;
  icon: string;
  minLevel: number;
  scale3d: number;
  description: string;
  perks: string[];
  appearance: StageAppearance;
};

export const GROWTH_STAGES: Record<GrowthStage, GrowthStageDefinition> = {
  anak: {
    stage: "anak",
    title: "Anak Kucing (Kitten)",
    subtitle: "Level 1–5 · Mungil & Penuh Rasa Ingin Tahu",
    icon: "🐱",
    minLevel: 1,
    scale3d: 0.88,
    description: "Tubuh masih mungil, langkah lincah, dan senang mengejar bola lonceng.",
    perks: ["Gerakan ekstra lincah", "Suara meong halus", "Cepat akrab saat dielus"],
    appearance: {
      bodyScaleLabel: "0.88x (Mungil & bulat)",
      earProportion: "Telinga besar & mata bulat lebar",
      collarLabel: "Belum memakai kalung lonceng",
      stripeLabel: "Bulu halus polos hangat",
      hasCollar: false,
      hasAdultStripes: false,
    },
  },
  dewasa: {
    stage: "dewasa",
    title: "Kucing Dewasa",
    subtitle: "Level 6+ · Anggun, Tangguh & Setia",
    icon: "🐈",
    minLevel: 6,
    scale3d: 1.12,
    description: "Tubuh tumbuh proporsional, bulu makin lebat, dan ikatan batin denganmu makin kuat.",
    perks: ["Postur tubuh lebih besar", "Ekor lebih panjang & anggun", "Stamina bermain lebih tahan lama"],
    appearance: {
      bodyScaleLabel: "1.12x (Tegap & proporsional)",
      earProportion: "Telinga meruncing anggun & kumis panjang",
      collarLabel: "Kalung merah dengan lonceng emas",
      stripeLabel: "Corak belang dewasa & dada putih lebat",
      hasCollar: true,
      hasAdultStripes: true,
    },
  },
};

export type ClosenessTier = {
  id: string;
  minScore: number;
  label: string;
  icon: string;
  description: string;
};

export const CLOSENESS_TIERS: ClosenessTier[] = [
  {
    id: "kenalan",
    minScore: 0,
    label: "Teman Baru",
    icon: "🌱",
    description: "Masih mengamati gerak-gerikmu dan sesekali malu-malu.",
  },
  {
    id: "akrab",
    minScore: 40,
    label: "Teman Akrab",
    icon: "🐾",
    description: "Nyaman di dekatmu dan senang menghampiri saat dipanggil.",
  },
  {
    id: "sayang",
    minScore: 70,
    label: "Kesayangan",
    icon: "💕",
    description: "Selalu mendengkur keras saat dielus dan hafal kebiasaanmu.",
  },
  {
    id: "belahan-jiwa",
    minScore: 90,
    label: "Sahabat Sejati",
    icon: "👑",
    description: "Ikatan tak terpisahkan — percaya penuh dan selalu menunggumu pulang.",
  },
];

export type MockAchievement = {
  id: string;
  code: string;
  name: string;
  description: string;
  icon: string;
  progress: number; // 0..100
  unlocked: boolean;
  unlockedAtLabel?: string;
};

export const MOCK_ACHIEVEMENTS: MockAchievement[] = [
  {
    id: "ach-first-meal",
    code: "FIRST_MEAL",
    name: "Sajian Pertama",
    description: "Memberi makan Mochi untuk pertama kalinya dengan penuh kasih.",
    icon: "🍗",
    progress: 100,
    unlocked: true,
    unlockedAtLabel: "Hari ke-1",
  },
  {
    id: "ach-purr-friend",
    code: "PURR_FRIEND",
    name: "Tangan Hangat",
    description: "Mengelus Mochi hingga mendengkur bahagia berkali-kali.",
    icon: "💕",
    progress: 100,
    unlocked: true,
    unlockedAtLabel: "Level 2",
  },
  {
    id: "ach-clean-home",
    code: "CLEAN_HOME",
    name: "Rumah Wangi & Rapi",
    description: "Rutin memandikan Mochi dan menjaga kotak pasir tetap bersih.",
    icon: "🫧",
    progress: 80,
    unlocked: false,
  },
  {
    id: "ach-play-master",
    code: "PLAY_MASTER",
    name: "Teman Bermain Terbaik",
    description: "Mengajak Mochi bermain dengan semua jenis mainan di rumah.",
    icon: "🧶",
    progress: 65,
    unlocked: false,
  },
  {
    id: "ach-grow-adult",
    code: "GROW_ADULT",
    name: "Tumbuh Dewasa",
    description: "Merawat Mochi dengan sabar hingga mencapai tahap Kucing Dewasa (Level 6).",
    icon: "🌟",
    progress: 50,
    unlocked: false,
  },
];

export const XP_PER_LEVEL = 50;

/** Hitung level, tahap pertumbuhan, dan progres XP dari total pengalaman. */
export function computeGrowthProgress(totalXp: number, stageOverride?: GrowthStage | null) {
  const safeXp = Math.max(0, Math.round(totalXp));
  const level = Math.max(1, 1 + Math.floor(safeXp / XP_PER_LEVEL));
  const currentLevelXp = safeXp % XP_PER_LEVEL;
  const xpProgressPercent = Math.round((currentLevelXp / XP_PER_LEVEL) * 100);
  const naturalStage: GrowthStage = level >= GROWTH_STAGES.dewasa.minLevel ? "dewasa" : "anak";
  const stage: GrowthStage = stageOverride ?? naturalStage;

  return {
    totalXp: safeXp,
    level,
    currentLevelXp,
    xpForNextLevel: XP_PER_LEVEL,
    xpProgressPercent,
    stage,
    stageDef: GROWTH_STAGES[stage],
  };
}

/** Cari tingkatan kedekatan berdasarkan skor 0..100. */
export function resolveClosenessTier(closeness: number): ClosenessTier {
  const clamped = Math.max(0, Math.min(100, closeness));
  let chosen = CLOSENESS_TIERS[0];
  for (const tier of CLOSENESS_TIERS) {
    if (clamped >= tier.minScore) chosen = tier;
  }
  return chosen;
}
