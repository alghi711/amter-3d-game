// Data awal kucing virtual AMTER untuk pemain baru (mulai dari Level 1 & 0 XP).
export type CatStats = {
  hunger: number; // 0-100, makin tinggi makin kenyang
  thirst: number;
  hygiene: number;
  happiness: number;
  energy: number;
};

export type MockCat = {
  id: string;
  name: string;
  stage: "anak" | "dewasa";
  level: number;
  experience: number;
  closeness: number;
  mood: "senang" | "lapar" | "bosan" | "ngantuk";
  furColor: string;
  stats: CatStats;
};

export const INITIAL_CAT_STATS: CatStats = {
  hunger: 55,
  thirst: 55,
  hygiene: 65,
  happiness: 65,
  energy: 75,
};

export const mockCat: MockCat = {
  id: "cat-amter",
  name: "Amter",
  stage: "anak",
  level: 1,
  experience: 0,
  closeness: 10,
  mood: "senang",
  furColor: "#f4b673",
  stats: { ...INITIAL_CAT_STATS },
};
