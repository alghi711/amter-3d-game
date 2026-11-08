export type GuideCategory = "perawatan" | "mood" | "pertumbuhan" | "akun";

export type GuideSection = {
  id: string;
  category: GuideCategory;
  title: string;
  subtitle: string;
  icon: string;
  readTime: string;
  steps: {
    title: string;
    description: string;
    proTip?: string;
  }[];
  keyTakeaway: string;
};

export const CARE_GUIDE_SECTIONS: GuideSection[] = [
  {
    id: "makan-dan-minum",
    category: "perawatan",
    title: "Memberi Makan & Minum",
    subtitle: "Menjaga energi dan nutrisi Mochi agar selalu sehat dan aktif",
    icon: "🍗",
    readTime: "2 mnt baca",
    steps: [
      {
        title: "Periksa Mangkuk Kucing",
        description: "Lihat mangkuk makanan dan air di lantai ruangan. Jika mangkuk kosong atau indikator lapar di bawah 60%, Mochi akan mengeong pelan meminta makan.",
        proTip: "Memberi makan saat Mochi lapar memberikan bonus +15 XP pertumbuhan!",
      },
      {
        title: "Pilih Menu yang Tepat",
        description: "Buka dock 'Rawat Mochi' di bawah layar. Pilih biskuit kering untuk gizi harian, potongan salmon segar untuk kebahagiaan ekstra, atau semangkuk susu hangat.",
      },
      {
        title: "Perhatikan Reaksi Mochi",
        description: "Mochi akan berjalan mendekati mangkuk, menunduk, dan mengunyah dengan suara renyah yang menggemaskan sebelum kembali bermain.",
      },
    ],
    keyTakeaway: "Beri makan 2-3 kali sehari secara teratur untuk menjaga rasa kenyang di atas 80%.",
  },
  {
    id: "kebersihan-dan-sanitasi",
    category: "perawatan",
    title: "Memandikan & Kotak Pasir",
    subtitle: "Menjaga bulu Mochi tetap lembut, wangi, dan bebas kuman",
    icon: "🧼",
    readTime: "2 mnt baca",
    steps: [
      {
        title: "Cek Status Kebersihan Ruangan",
        description: "Jika kotak pasir kotor (terdapat indikator kerikil kotor) atau kebersihan di bawah 65%, segera bersihkan dengan mengklik kotak pasir.",
      },
      {
        title: "Sesi Mandi Busa Lembut",
        description: "Pilih tombol Mandi di panel rawat. Busa sabun lembut dan gemericik air hangat akan membersihkan seluruh badan Mochi secara menyeluruh.",
        proTip: "Setelah mandi, Mochi akan mengibaskan bulunya dan mendengkur puas!",
      },
    ],
    keyTakeaway: "Kucing yang bersih memiliki risiko stres lebih rendah dan suasana hati yang selalu ceria.",
  },
  {
    id: "bermain-dan-stimulasi",
    category: "perawatan",
    title: "Bermain & Mainan Interaktif",
    subtitle: "Menyalurkan naluri berburu alami kucing dengan gembira",
    icon: "🧶",
    readTime: "2 mnt baca",
    steps: [
      {
        title: "Pilih Mainan Favorit",
        description: "Pilih dari bola wol warna-warni, tongkat bulu bergoyang, atau titik laser lincah yang bergerak di lantai kayu.",
      },
      {
        title: "Lihat Gerakan Lincah 4 Kaki Mochi",
        description: "Kaki depan dan belakang Mochi akan melompat secara koordinatif menerkam mainan sambil mengeluarkan suara chirp riang.",
        proTip: "Bermain selama 1-2 menit meningkatkan kedekatan (closeness) secara cepat!",
      },
    ],
    keyTakeaway: "Aktivitas bermain rutin mencegah kebosanan dan membantu Mochi tidur lebih nyenyak di malam hari.",
  },
  {
    id: "sentuhan-dan-elusan",
    category: "mood",
    title: "Mengelus & Membangun Kedekatan",
    subtitle: "Sentuhan penuh kasih sayang yang menenangkan jiwa",
    icon: "💖",
    readTime: "1 mnt baca",
    steps: [
      {
        title: "Sentuh Tubuh Mochi di Layar",
        description: "Kamu bisa mengklik atau menyentuh tubuh Mochi langsung di ruang 3D, atau menekan tombol elus cepat di pojok kiri bawah.",
      },
      {
        title: "Dengarkan Dengkuran (Purring) 27Hz",
        description: "Saat dielus di bagian kepala atau dagu, Mochi akan memejamkan mata dan mengeluarkan dengkuran ritmis yang menenangkan.",
        proTip: "Hati mengambang (floating hearts) akan muncul sebagai tanda ikatan batin kalian semakin kuat.",
      },
    ],
    keyTakeaway: "Setiap elusan menambah skor kedekatan dan membuka lencana prestasi spesial.",
  },
  {
    id: "suasana-hati-dan-mood",
    category: "mood",
    title: "Memahami Suasana Hati Mochi",
    subtitle: "Membaca bahasa tubuh, ekspresi wajah, dan nada meong",
    icon: "🎭",
    readTime: "3 mnt baca",
    steps: [
      {
        title: "Mode Senang (Happy)",
        description: "Ekor tegak dengan ujung melengkung, mata berbinar ceria, dan meong bernada riang.",
      },
      {
        title: "Mode Lapar (Hungry)",
        description: "Mochi duduk di dekat mangkuk makanan dan sesekali menatap ke arahmu dengan tatapan memohon.",
      },
      {
        title: "Mode Ingin Main (Playful)",
        description: "Pupil mata melebar, tubuh sedikit membungkuk siap menerkam, dan ekor bergoyang aktif.",
      },
      {
        title: "Mode Mengantuk (Sleepy)",
        description: "Kelopak mata sayu, menguap lembut, dan berjalan santai menuju bantal kasur empuk.",
      },
    ],
    keyTakeaway: "Perhatikan balon ucapan di atas kepala Mochi untuk mengetahui apa yang ia inginkan setiap saat.",
  },
  {
    id: "tahap-pertumbuhan-dan-evolusi",
    category: "pertumbuhan",
    title: "Tahap Tumbuh Kembang Kucing",
    subtitle: "Perjalanan dari anak kucing menggemaskan hingga kucing dewasa anggun",
    icon: "🌱",
    readTime: "2 mnt baca",
    steps: [
      {
        title: "Tahap 1: Anak Kucing (Kitten)",
        description: "Ukuran tubuh mungil (skala 0.75x), langkah kaki lincah, rasa ingin tahu tinggi, dan suara meong bernada tinggi (pitch anak).",
      },
      {
        title: "Tahap 2: Kucing Remaja (Young Cat)",
        description: "Ukuran tubuh membesar proporsional (skala 0.9x), mulai lebih tenang namun tetap sangat suka bermain.",
      },
      {
        title: "Tahap 3: Kucing Dewasa (Adult Cat)",
        description: "Ukuran penuh (skala 1.05x), bulu tebal berkilau, suara dengkuran dalam dan berwibawa, serta ikatan batin yang sangat setia.",
        proTip: "Capai Level 5 untuk bertransformasi ke Kucing Remaja, dan Level 10 untuk Kucing Dewasa!",
      },
    ],
    keyTakeaway: "Setiap aktivitas harian menghasilkan XP yang membawa Mochi ke tahap kedewasaan barunya.",
  },
  {
    id: "kode-pemulihan-dan-cadangan",
    category: "akun",
    title: "Simpan & Pulihkan Akun (Cloud Sync)",
    subtitle: "Menjaga progres kucing kesayanganmu tetap aman selamanya",
    icon: "🛡️",
    readTime: "2 mnt baca",
    steps: [
      {
        title: "Catat Kode Pemulihan 12 Karakter",
        description: "Buka menu Akun untuk melihat kode pemulihan unikmu (format: MOCHI-XXXX-XXXX-XXXX). Kode ini bisa kamu salin ke catatan HP.",
      },
      {
        title: "Penyimpanan Otomatis (Autosave)",
        description: "Game secara otomatis menyimpan progres setiap selesai merawat. Kamu juga bisa mengklik tombol 'Simpan Sekarang' di kanan atas layar.",
      },
      {
        title: "Pulihkan di Perangkat / Browser Baru",
        description: "Jika berganti HP atau browser, cukup buka menu Akun, pilih 'Pulihkan Kucing', masukkan kodemu, dan Mochi langsung kembali!",
        proTip: "Daftarkan akun dengan email dan kata sandi untuk login multi-perangkat yang lebih praktis.",
      },
    ],
    keyTakeaway: "Jangan pernah khawatir kehilangan Mochi — progresmu terlindungi dengan enkripsi ganda dan backup lokal.",
  },
];
