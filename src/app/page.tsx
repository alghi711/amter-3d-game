"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import { mockCat } from "@/lib/mock-cat";
import { HOUSE_SPOTS, SPOT_LABELS, type HouseSpot } from "@/components/room/CatHouse";

const CatRoomScene = dynamic(() => import("@/components/room/CatRoomScene"), {
  ssr: false,
  loading: () => (
    <div className="flex h-full items-center justify-center text-amber-700">Menyiapkan rumah Mochi…</div>
  ),
});

const moodEmoji = { senang: "😺", lapar: "🍽️", bosan: "😿", ngantuk: "😴" } as const;

export default function Home() {
  const cat = mockCat;
  const [spot, setSpot] = useState<HouseSpot | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const target: readonly [number, number] = spot ? [HOUSE_SPOTS[spot][0], HOUSE_SPOTS[spot][2]] : [0, 0.6];

  useEffect(() => {
    if (!toast) return;
    const id = setTimeout(() => setToast(null), 2200);
    return () => clearTimeout(id);
  }, [toast]);

  const useObject = (s: HouseSpot) => {
    setSpot(s);
    setToast(`${cat.name} menuju ${SPOT_LABELS[s].toLowerCase()}`);
  };
  return (
    <main className="relative h-dvh w-full overflow-hidden bg-[#fff6ef] text-stone-800">
      <div className="absolute inset-0">
        <CatRoomScene furColor={cat.furColor} catTarget={target} onUseObject={useObject} />
      </div>

      {/* Header info kucing */}
      <header className="pointer-events-none absolute inset-x-0 top-0 flex items-start justify-between p-3 pt-[max(0.75rem,env(safe-area-inset-top))] sm:p-6">
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

      {toast && (
        <div className="pointer-events-none absolute inset-x-0 top-24 flex justify-center px-4">
          <span className="rounded-full bg-amber-500/90 px-4 py-2 text-sm font-medium text-white shadow-lg">{toast}</span>
        </div>
      )}

      <p className="pointer-events-none absolute inset-x-0 bottom-[max(1rem,env(safe-area-inset-bottom))] px-4 text-center text-xs text-stone-500">
        Ketuk benda untuk dipakai · geser untuk memutar kamera · cubit / scroll untuk memperbesar
      </p>
    </main>
  );
}
