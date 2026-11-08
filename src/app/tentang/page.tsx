import { Metadata } from "next";
import Link from "next/link";
import { APP_INFO } from "@/lib/mock-settings";

export const metadata: Metadata = {
  title: "Tentang MOCHI — Informasi Aplikasi & Versi",
  description: "Informasi versi aplikasi, teknologi Next.js 16 + R3F, lisensi, dan catatan rilis Mochi Kucing Virtual 3D.",
};

export default function TentangPage() {
  return (
    <main className="min-h-screen w-full bg-[#f8f3eb] py-8 px-4 sm:py-12 flex flex-col items-center">
      <div className="w-full max-w-3xl mb-4 flex items-center justify-between">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-xs font-semibold text-amber-800 hover:text-amber-900 bg-amber-100/70 hover:bg-amber-200/80 px-3.5 py-2 rounded-xl transition shadow-xs"
        >
          <span>←</span>
          <span>Kembali ke Kamar Mochi</span>
        </Link>
        <span className="text-xs text-stone-500 font-medium">ℹ️ Informasi Sistem & Versi</span>
      </div>

      <div className="w-full max-w-3xl bg-white/95 dark:bg-stone-900/95 backdrop-blur-md rounded-3xl p-6 sm:p-8 shadow-xl border border-stone-200 dark:border-stone-800 space-y-6">
        {/* Banner */}
        <div className="text-center space-y-3 pb-6 border-b border-stone-100 dark:border-stone-800">
          <div className="w-20 h-20 mx-auto rounded-3xl bg-gradient-to-tr from-amber-400 to-orange-500 text-white flex items-center justify-center text-4xl shadow-lg shadow-amber-500/20">
            🐱
          </div>
          <div>
            <h1 className="text-2xl font-black text-stone-900 dark:text-white tracking-tight">
              {APP_INFO.name}
            </h1>
            <p className="text-xs font-semibold text-amber-600 dark:text-amber-400 mt-0.5">
              {APP_INFO.tagline}
            </p>
          </div>
          <p className="text-xs text-stone-600 dark:text-stone-300 max-w-md mx-auto leading-relaxed">
            {APP_INFO.credits}
          </p>
          <div className="inline-flex flex-wrap items-center justify-center gap-2 px-3 py-1.5 rounded-full bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 text-xs font-semibold">
            <span>Versi {APP_INFO.version}</span>
            <span>•</span>
            <span>Build {APP_INFO.build}</span>
            <span>•</span>
            <span>{APP_INFO.environment}</span>
          </div>
        </div>

        {/* Specs */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          <div className="p-4 rounded-2xl bg-stone-50 dark:bg-stone-850 border border-stone-200 dark:border-stone-750 space-y-1">
            <span className="text-stone-400 text-[10px] uppercase font-bold tracking-wider">Engine Utama</span>
            <p className="font-semibold text-stone-800 dark:text-stone-200">{APP_INFO.engine}</p>
          </div>
          <div className="p-4 rounded-2xl bg-stone-50 dark:bg-stone-850 border border-stone-200 dark:border-stone-750 space-y-1">
            <span className="text-stone-400 text-[10px] uppercase font-bold tracking-wider">Lisensi Perangkat Lunak</span>
            <p className="font-semibold text-stone-800 dark:text-stone-200">{APP_INFO.license} • Dukungan: {APP_INFO.contact}</p>
          </div>
        </div>

        {/* Milestones Roadmap */}
        <div className="space-y-3">
          <h2 className="text-sm font-bold text-stone-900 dark:text-white flex items-center gap-2">
            <span>🗺️</span>
            <span>Catatan Rilis & Milestone Pengembangan</span>
          </h2>
          <div className="space-y-3">
            {APP_INFO.milestones.map((m) => (
              <div
                key={m.phase}
                className="p-4 rounded-2xl bg-stone-50 dark:bg-stone-850 border border-stone-200 dark:border-stone-750 space-y-1.5"
              >
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold text-stone-900 dark:text-white">
                    {m.phase}: {m.title}
                  </h3>
                  <span
                    className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${
                      m.status === "aktif"
                        ? "bg-amber-500 text-white animate-pulse"
                        : "bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300"
                    }`}
                  >
                    {m.status === "aktif" ? "Sedang Aktif" : "Selesai ✓"}
                  </span>
                </div>
                <ul className="space-y-1 text-xs text-stone-600 dark:text-stone-300 list-disc list-inside">
                  {m.highlights.map((h, i) => (
                    <li key={i}>{h}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        {/* Tech Stack Chips */}
        <div className="p-4 rounded-2xl bg-stone-100/70 dark:bg-stone-800/50 border border-stone-200 dark:border-stone-700 space-y-2.5">
          <span className="text-[10px] uppercase font-bold text-stone-400 tracking-wider">
            Teknologi & Modul Inti
          </span>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
            {APP_INFO.techStack.map((tech) => (
              <div
                key={tech.name}
                className="p-2.5 rounded-xl bg-white dark:bg-stone-900 border border-stone-200/80 dark:border-stone-750 space-y-0.5"
              >
                <div className="font-bold text-stone-800 dark:text-stone-200">{tech.name}</div>
                <div className="text-[11px] text-stone-500">{tech.role}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Back Button */}
        <div className="flex items-center justify-center gap-3 pt-3">
          <Link
            href="/bantuan"
            className="px-4 py-2.5 rounded-xl bg-stone-100 hover:bg-stone-200 dark:bg-stone-800 dark:hover:bg-stone-750 text-xs font-semibold text-stone-700 dark:text-stone-200 transition"
          >
            📖 Buku Panduan
          </Link>
          <Link
            href="/pengaturan"
            className="px-4 py-2.5 rounded-xl bg-stone-100 hover:bg-stone-200 dark:bg-stone-800 dark:hover:bg-stone-750 text-xs font-semibold text-stone-700 dark:text-stone-200 transition"
          >
            ⚙️ Pengaturan
          </Link>
          <Link
            href="/"
            className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold transition shadow-sm flex items-center gap-1.5"
          >
            <span>🐱</span>
            <span>Kembali ke Kamar Mochi</span>
          </Link>
        </div>
      </div>
    </main>
  );
}
