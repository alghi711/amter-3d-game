/** Metrik yang dipakai menilai kemajuan sebuah lencana. */
export type BadgeMetric = "meals" | "plays" | "pets" | "hygiene" | "level" | "closeness";

export type BadgeDefinitionSeed = {
  code: string;
  name: string;
  description: string;
  icon: string;
  metric: BadgeMetric;
  threshold: number;
  sortOrder: number;
};

/** Katalog lencana pencapaian pemain (dipakai untuk seed tabel `badge_definitions`). */
export const BADGE_DEFINITIONS: BadgeDefinitionSeed[] = [
  { code: "FIRST_MEAL", name: "Sajian Pertama", description: "Memberi makan Mochi untuk pertama kalinya dengan penuh kasih.", icon: "🍗", metric: "meals", threshold: 1, sortOrder: 1 },
  { code: "PURR_FRIEND", name: "Tangan Hangat", description: "Mengelus Mochi hingga mendengkur bahagia berkali-kali.", icon: "💕", metric: "pets", threshold: 5, sortOrder: 2 },
  { code: "CLEAN_HOME", name: "Rumah Wangi & Rapi", description: "Rutin memandikan Mochi dan menjaga kotak pasir tetap bersih.", icon: "🫧", metric: "hygiene", threshold: 95, sortOrder: 3 },
  { code: "PLAY_MASTER", name: "Teman Bermain Terbaik", description: "Mengajak Mochi bermain berkali-kali dengan mainan di rumah.", icon: "🧶", metric: "plays", threshold: 10, sortOrder: 4 },
  { code: "GROW_ADULT", name: "Tumbuh Dewasa", description: "Merawat Mochi hingga mencapai tahap Kucing Dewasa (Level 6).", icon: "🌟", metric: "level", threshold: 6, sortOrder: 5 },
  { code: "SOULMATE_BOND", name: "Sahabat Sejati", description: "Mencapai tingkat kedekatan 90% dengan Mochi.", icon: "👑", metric: "closeness", threshold: 90, sortOrder: 6 },
];
