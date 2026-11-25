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
  sfxVolume: 100,
  musicEnabled: true,
  musicVolume: 85,
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

export type ReleaseMilestone = {
  phase: string;
  title: string;
  status: "selesai" | "aktif";
  highlights: string[];
};

export const APP_INFO = {
  name: "MOCHI — Your Virtual Cat",
  tagline: "Sahabat Kucing Virtual 3D di Browser Kamu",
  version: "1.0.0-fase5",
  build: "2026.11.08-rc5",
  environment: "Production / Edge Ready",
  engine: "Next.js 16 + React 19 + React Three Fiber + Drizzle ORM",
  license: "MIT License",
  credits: "Dibuat dengan penuh cinta untuk seluruh pecinta kucing di dunia 🐾",
  contact: "support@mochi-cat.dev",
  milestones: [
    {
      phase: "Fase 1",
      title: "Kamar 3D & Kebutuhan Dasar",
      status: "selesai",
      highlights: [
        "Ruang 3D realistis 4 dinding, jendela bukit, dan lampu gantung",
        "Sistem rawat makan, minum, mandi busa, dan kotak pasir",
        "Animasi kinematik jalan 4 kaki dan kecerdasan berkeliaran mandiri",
      ],
    },
    {
      phase: "Fase 2",
      title: "Suasana Hati & Siklus Harian",
      status: "selesai",
      highlights: [
        "Siklus waktu sirkadian 24 jam & mode pencahayaan siang/sore/malam",
        "4 ragam emosi kucing dinamis (senang, lapar, main, mengantuk)",
        "Pengingat kasih sayang lembut (gentle reminder banners)",
      ],
    },
    {
      phase: "Fase 3",
      title: "Tumbuh Kembang & Galeri Lencana",
      status: "selesai",
      highlights: [
        "Evolusi anak kucing mungil menjadi kucing dewasa berwibawa",
        "Skor kedekatan batin & sistem Experience (XP)",
        "Galeri 8 lencana pencapaian & penyimpanan cloud autosave",
      ],
    },
    {
      phase: "Fase 4",
      title: "Akun Pemain & Keamanan Progres",
      status: "selesai",
      highlights: [
        "Autentikasi akun email, kata sandi, dan mode tamu instan",
        "Kunci kode pemulihan unik 12 karakter (MOCHI-XXXX-XXXX)",
        "Sistem multi-sesi dan sinkronisasi lintas browser",
      ],
    },
    {
      phase: "Fase 5",
      title: "Audio Synthesizer & Pengaturan Grafis",
      status: "aktif",
      highlights: [
        "Formant bio-acoustic vocal synthesis meow & purr 27Hz",
        "Pemutar melodi lo-fi ambient kamar kucing multi-trek",
        "Preset kualitas grafis adaptif (rendah, sedang, tinggi, otomatis)",
        "Buku panduan lengkap merawat kucing & navigasi pengaturan",
      ],
    },
  ] as ReleaseMilestone[],
  techStack: [
    { name: "Next.js 16", role: "App Router Framework & Server Components" },
    { name: "React 19", role: "Modern UI Architecture & Concurrent Features" },
    { name: "Three.js & R3F", role: "High-Performance 3D Scene & Lighting" },
    { name: "Web Audio API", role: "Bio-acoustic Meow & Formant Synthesis" },
    { name: "Drizzle ORM", role: "Type-safe SQLite Data Persistence" },
    { name: "Tailwind CSS", role: "Warm Pastel Responsive UI Design" },
  ],
};
