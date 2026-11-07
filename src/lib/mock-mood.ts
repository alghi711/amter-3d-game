import type { HouseSpot } from "@/components/room/CatHouse";
import type { CatStats } from "@/lib/mock-cat";

export type CatMood = "senang" | "lapar" | "bosan" | "ngantuk";

export type MoodInfo = {
  mood: CatMood;
  label: string;
  emoji: string;
  badgeColor: string;
  reason: string;
  expression: string;
  sound: string;
};

export const MOOD_DEFINITIONS: Record<CatMood, Omit<MoodInfo, "reason">> = {
  senang: {
    mood: "senang",
    label: "Senang & Nyaman",
    emoji: "😺",
    badgeColor: "bg-emerald-100 text-emerald-700",
    expression: "Mata berbinar & ekor bergoyang santai",
    sound: "Purrr… meong lembut 💕",
  },
  lapar: {
    mood: "lapar",
    label: "Lapar & Haus",
    emoji: "🍽️",
    badgeColor: "bg-amber-100 text-amber-800",
    expression: "Menatap mangkuk sambil menjilat bibir",
    sound: "Meooong~! (minta makan)",
  },
  bosan: {
    mood: "bosan",
    label: "Bosan & Butuh Teman",
    emoji: "😿",
    badgeColor: "bg-rose-100 text-rose-700",
    expression: "Telinga turun & ekor bergerak pelan",
    sound: "Mrrp… (mengajak main)",
  },
  ngantuk: {
    mood: "ngantuk",
    label: "Mengantuk",
    emoji: "😴",
    badgeColor: "bg-indigo-100 text-indigo-700",
    expression: "Kelopak mata sayu & sering menguap",
    sound: "Hoaam… zzz",
  },
};

export type RoutineActivity = "makan" | "main" | "tidur" | "santai";

export type RoutineItem = {
  id: string;
  title: string;
  activity: RoutineActivity;
  spot: HouseSpot | null;
  startHour: number;
  endHour: number;
  icon: string;
  description: string;
};

export const MOCK_ROUTINES: RoutineItem[] = [
  {
    id: "rt-pagi-makan",
    title: "Sarapan Pagi",
    activity: "makan",
    spot: "foodBowl",
    startHour: 6,
    endHour: 9,
    icon: "🌅",
    description: "Bangun tidur dan menunggu mangkuk sarapan diisi.",
  },
  {
    id: "rt-pagi-main",
    title: "Main & Eksplorasi",
    activity: "main",
    spot: "toy",
    startHour: 9,
    endHour: 12,
    icon: "🧶",
    description: "Energi penuh untuk mengejar bola dan mengasah kuku.",
  },
  {
    id: "rt-siang-tidur",
    title: "Tidur Siang Hangat",
    activity: "tidur",
    spot: "bed",
    startHour: 12,
    endHour: 16,
    icon: "☀️",
    description: "Meringkuk di kasur empuk sambil berjemur.",
  },
  {
    id: "rt-sore-makan",
    title: "Makan Sore & Manja",
    activity: "makan",
    spot: "foodBowl",
    startHour: 16,
    endHour: 19,
    icon: "🌇",
    description: "Menyambut sore dengan camilan ikan dan elusan.",
  },
  {
    id: "rt-malam-main",
    title: "Aktif Malam",
    activity: "main",
    spot: "scratchPost",
    startHour: 19,
    endHour: 22,
    icon: "🌙",
    description: "Lari-lari kecil sebelum waktunya istirahat malam.",
  },
  {
    id: "rt-malam-tidur",
    title: "Tidur Malam Pulas",
    activity: "tidur",
    spot: "bed",
    startHour: 22,
    endHour: 6,
    icon: "💤",
    description: "Tidur nyenyak sampai matahari terbit kembali.",
  },
];

export type PersonalityTrait = {
  id: string;
  name: string;
  icon: string;
  score: number; // 0..100
  formedBy: string;
  description: string;
};

export const MOCK_PERSONALITY_TRAITS: PersonalityTrait[] = [
  {
    id: "manja",
    name: "Manja & Penyayang",
    icon: "💕",
    score: 78,
    formedBy: "Sering dielus di kepala dan punggung",
    description: "Suka mendekat dan mendengkur keras saat disentuh.",
  },
  {
    id: "aktif",
    name: "Lincah & Penasaran",
    icon: "⚡",
    score: 65,
    formedBy: "Rutin diajak bermain bola lonceng",
    description: "Cepat berlari mengejar mainan di dalam ruangan.",
  },
  {
    id: "kuliner",
    name: "Pecinta Kuliner",
    icon: "🍣",
    score: 72,
    formedBy: "Diberi variasi makanan tepat waktu",
    description: "Hafal jadwal makan dan langsung menghampiri mangkuk.",
  },
];

export type GentleReminder = {
  id: string;
  icon: string;
  title: string;
  message: string;
  priority: "tinggi" | "sedang" | "rendah";
};

/** Tentukan suasana hati kucing berdasarkan kondisi perawatan & jam saat ini. */
export function deriveCatMood(stats: CatStats, hour = 9, override?: CatMood | null): MoodInfo {
  if (override) {
    const base = MOOD_DEFINITIONS[override];
    return { ...base, reason: "Dipilih dari simulasi suasana hati" };
  }
  if (stats.hunger < 45 || stats.thirst < 40) {
    return {
      ...MOOD_DEFINITIONS.lapar,
      reason: stats.hunger < 45 ? "Perut mulai keroncongan minta diisi" : "Tenggorokan terasa haus",
    };
  }
  if (stats.energy < 35 || hour >= 22 || hour < 6) {
    return {
      ...MOOD_DEFINITIONS.ngantuk,
      reason: stats.energy < 35 ? "Energi mulai habis setelah beraktivitas" : "Sudah memasuki jam tidur malam",
    };
  }
  if (stats.happiness < 55 || stats.hygiene < 45) {
    return {
      ...MOOD_DEFINITIONS.bosan,
      reason: stats.happiness < 55 ? "Sudah agak lama belum diajak bermain" : "Merasa kurang nyaman karena bulu kotor",
    };
  }
  return {
    ...MOOD_DEFINITIONS.senang,
    reason: "Semua kebutuhan harian terpenuhi dengan baik",
  };
}

/** Cari rutinitas yang aktif pada jam tertentu (0..23). */
export function getActiveRoutine(hour = 9): RoutineItem {
  for (const r of MOCK_ROUTINES) {
    if (r.startHour < r.endHour) {
      if (hour >= r.startHour && hour < r.endHour) return r;
    } else {
      // lintas tengah malam (mis. 22..6)
      if (hour >= r.startHour || hour < r.endHour) return r;
    }
  }
  return MOCK_ROUTINES[0];
}

/** Susun pengingat lembut berdasarkan kondisi perawatan & jadwal rutinitas. */
export function buildGentleReminders(stats: CatStats, name: string, hour = 9): GentleReminder[] {
  const list: GentleReminder[] = [];
  if (stats.hunger < 50) {
    list.push({
      id: "rem-hunger",
      icon: "🍗",
      title: `${name} mulai lapar`,
      message: `Kenyang tinggal ${Math.round(stats.hunger)}%. Yuk sajikan makanan favoritnya.`,
      priority: stats.hunger < 30 ? "tinggi" : "sedang",
    });
  }
  if (stats.thirst < 50) {
    list.push({
      id: "rem-thirst",
      icon: "💧",
      title: `Mangkuk minum perlu dicek`,
      message: `${name} tampak haus (${Math.round(stats.thirst)}%). Air segar akan membuatnya segar kembali.`,
      priority: stats.thirst < 30 ? "tinggi" : "sedang",
    });
  }
  if (stats.hygiene < 60) {
    list.push({
      id: "rem-hygiene",
      icon: "🫧",
      title: `Waktunya bersih-bersih`,
      message: `Kebersihan ${Math.round(stats.hygiene)}%. Mandikan atau bersihkan kotak pasirnya ya.`,
      priority: "sedang",
    });
  }
  if (stats.happiness < 60) {
    list.push({
      id: "rem-play",
      icon: "🧶",
      title: `${name} ingin ditemani`,
      message: `Elus atau ajak main sebentar supaya hatinya kembali ceria.`,
      priority: "sedang",
    });
  }
  const active = getActiveRoutine(hour);
  list.push({
    id: `rem-routine-${active.id}`,
    icon: active.icon,
    title: `Rutinitas saat ini: ${active.title}`,
    message: active.description,
    priority: "rendah",
  });
  return list;
}
