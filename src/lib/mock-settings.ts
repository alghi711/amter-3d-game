import { QualityLevel } from "./quality";

export type GameSettings = {
  // Suara & Musik
  soundEnabled: boolean;
  sfxVolume: number; // 0 - 100
  musicEnabled: boolean;
  musicVolume: number; // 0 - 100
  vocalPitch: "anak" | "dewasa";

  // Grafis & Performa
  graphicsQuality: QualityLevel | "auto";
  shadowsEnabled: boolean;
  batterySaver: boolean;
  frameRateLimit: 30 | 60;
  cameraSpeed: "lambat" | "normal" | "cepat";

  // Notifikasi & Permainan
  gentleReminders: boolean;
  cloudAutosave: boolean;
  hapticFeedback: boolean;
};

export const defaultSettings: GameSettings = {
  soundEnabled: true,
  sfxVolume: 80,
  musicEnabled: true,
  musicVolume: 60,
  vocalPitch: "anak",

  graphicsQuality: "sedang",
  shadowsEnabled: true,
  batterySaver: false,
  frameRateLimit: 60,
  cameraSpeed: "normal",

  gentleReminders: true,
  cloudAutosave: true,
  hapticFeedback: true,
};

export type FaqItem = {
  question: string;
  answer: string;
  icon: string;
};

export const GAME_FAQS: FaqItem[] = [
  {
    icon: "🍗",
    question: "Bagaimana cara memberi makan dan minum Mochi?",
    answer:
      "Buka panel 'Rawat Mochi' di bagian bawah layar, lalu pilih menu makan (biskuit, salmon, atau camilan) dan minuman (air segar atau susu). Kucing akan berjalan menuju mangkuk dan makan dengan lahap!",
  },
  {
    icon: "🧼",
    question: "Kapan saya harus memandikan Mochi dan membersihkan kandang?",
    answer:
      "Perhatikan indikator Kebersihan di panel status. Bila angka kebersihan di bawah 65% atau kotak pasir kotor, mandikan kucing dengan sabun lembut atau bersihkan kotak pasirnya agar Mochi tetap harum dan sehat.",
  },
  {
    icon: "🌱",
    question: "Bagaimana Mochi bisa tumbuh besar?",
    answer:
      "Setiap kali kamu merawat, memberi makan, bermain, dan mengelus Mochi, ia memperoleh Experience (XP) dan Tingkat Kedekatan. Saat XP mencapai level tertentu, Mochi akan tumbuh dari tahap Anak Kucing menjadi Kucing Dewasa!",
  },
  {
    icon: "🛡️",
    question: "Apa fungsi Kode Pemulihan Akun (Recovery Code)?",
    answer:
      "Kode pemulihan adalah kunci cadangan 12 karakter (contoh: MOCHI-XXXX-XXXX-XXXX). Jika kamu berganti HP atau browser, kamu cukup memasukkan kode ini di halaman Akun untuk mengembalikan kucing dan seluruh progresmu secara instan.",
  },
  {
    icon: "🌙",
    question: "Apakah suasana ruangan bisa diubah?",
    answer:
      "Bisa! Klik tombol suasana cahaya di kanan atas untuk berpindah antara mode Siang Cerah, Sore Santai, dan Malam Lembut. Di malam hari, lampu gantung rotan dan lampu meja akan berpendar hangat.",
  },
];

export const APP_INFO = {
  name: "MOCHI — Your Virtual Cat",
  version: "1.0.0-fase5",
  build: "2026.11.08",
  engine: "Next.js 16 + React Three Fiber + Drizzle ORM",
  license: "MIT License",
  credits: "Dibuat dengan penuh cinta untuk seluruh pecinta kucing di dunia 🐾",
};
