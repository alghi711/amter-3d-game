"use client";

import dynamic from "next/dynamic";
import { mockCat } from "@/lib/mock-cat";

const CatRoomScene = dynamic(() => import("@/components/room/CatRoomScene"), {
  ssr: false,
  loading: () => (
    <div className="flex h-full items-center justify-center text-amber-700">Menyiapkan rumah Mochi…</div>
  ),
});

const moodEmoji = { senang: "😺", lapar: "🍽️", bosan: "😿", ngantuk: "😴" } as const;

export default function Home() {
  const cat = mockCat;
  return (
    <main className="relative h-dvh w-full overflow-hidden bg-[#fff6ef] text-stone-800">
      <div className="absolute inset-0">
        <CatRoomScene furColor={cat.furColor} />
      </div>

      {/* Header info kucing */}
      <header className="pointer-events-none absolute inset-x-0 top-0 flex items-start justify-between p-4">
        <div className="pointer-events-auto rounded-2xl bg-white/80 px-4 py-3 shadow-md backdrop-blur">
          <h1 className="text-lg font-bold">
            {cat.name} {moodEmoji[cat.mood]}
          </h1>
          <p className="text-xs text-stone-500">
            Tahap {cat.stage} · Level {cat.level} · Kedekatan {cat.closeness}%
          </p>
        </div>
        <span className="rounded-full bg-white/80 px-3 py-1 text-xs font-semibold text-amber-700 shadow backdrop-blur">
          MOCHI
        </span>
      </header>

      <p className="pointer-events-none absolute inset-x-0 bottom-4 text-center text-xs text-stone-500">
        Geser untuk memutar kamera · cubit / scroll untuk memperbesar
      </p>
    </main>
  );
}
