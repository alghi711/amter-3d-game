import { Metadata } from "next";
import Link from "next/link";
import CareGuideView from "@/components/help/CareGuideView";

export const metadata: Metadata = {
  title: "Bantuan & Panduan Merawat Kucing — MOCHI Kucing Virtual",
  description: "Buku panduan lengkap cara merawat, memberi makan, bermain, memahami suasana hati, dan memulihkan akun Mochi Kucing Virtual.",
};

export default function BantuanPage() {
  return (
    <main className="min-h-screen w-full bg-[#f8f3eb] py-8 px-4 sm:py-12 flex flex-col items-center">
      <div className="w-full max-w-4xl mb-4 flex items-center justify-between">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-xs font-semibold text-amber-800 hover:text-amber-900 bg-amber-100/70 hover:bg-amber-200/80 px-3.5 py-2 rounded-xl transition shadow-xs"
        >
          <span>←</span>
          <span>Kembali ke Kamar Mochi</span>
        </Link>
        <span className="text-xs text-stone-500 font-medium">📖 Pusat Bantuan & Kiat Bermain</span>
      </div>

      <CareGuideView />
    </main>
  );
}
