// Data tiruan (stub) untuk fase frontend — nanti diganti data dari backend.
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

export const mockCat: MockCat = {
  id: "cat-mochi",
  name: "Mochi",
  stage: "anak",
  level: 3,
  experience: 45,
  closeness: 62,
  mood: "senang",
  furColor: "#f4b673",
  stats: { hunger: 70, thirst: 55, hygiene: 80, happiness: 85, energy: 60 },
};
