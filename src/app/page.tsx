"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import { mockCat } from "@/lib/mock-cat";
import { useInputKind } from "@/lib/use-input-kind";
import { pickReaction } from "@/lib/cat-reactions";
import type { CatTouch } from "@/components/room/CatRoomScene";
import { ANIM_LABELS, type CatAnimState } from "@/lib/cat-animation";
import { SPOT_LABELS, type HouseSpot } from "@/components/room/CatHouse";
import CarePanel from "@/components/care/CarePanel";
import CareStatusPanel from "@/components/care/CareStatusPanel";
import { CARE_ACTIONS, getRefusalReason, MEAL_ITEMS, TOY_ITEMS, useCare, type CareAction, type MealItem, type ToyItem } from "@/lib/use-care";

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
  const input = useInputKind();
  const [cameraReset, setCameraReset] = useState(0);
  const [toast, setToast] = useState<string | null>(null);
  const [anim, setAnim] = useState<CatAnimState>("diam");

  useEffect(() => {
    if (!toast) return;
    const id = setTimeout(() => setToast(null), 2200);
    return () => clearTimeout(id);
  }, [toast]);

  const { stats, lastDeltas, history, perform } = useCare();
  const [showStatus, setShowStatus] = useState(false);
  const [foodFill, setFoodFill] = useState(MEAL_ITEMS.makan[0].fillColor);
  const [waterFill, setWaterFill] = useState(MEAL_ITEMS.minum[0].fillColor);
  const [bathing, setBathing] = useState(false);
  const [litterDirty, setLitterDirty] = useState(true);
  const [toyColor, setToyColor] = useState(TOY_ITEMS[0].color);

  useEffect(() => {
    if (!bathing) return;
    const id = setTimeout(() => {
      setBathing(false);
      setToast(`${cat.name} menggoyangkan bulu — sekarang bersih dan wangi! ✨`);
    }, 2600);
    return () => clearTimeout(id);
  }, [bathing, cat.name]);

  // Setelah selesai beraktivitas di suatu benda (kecuali tidur), kembali santai ke karpet tengah
  useEffect(() => {
    if (!spot || spot === "bed" || anim === "jalan") return;
    const id = setTimeout(() => {
      setSpot(null);
    }, 4500);
    return () => clearTimeout(id);
  }, [spot, anim]);

  const doCare = (a: CareAction) => {
    const refusal = getRefusalReason(a, stats, cat.name, litterDirty || stats.hygiene < 65);
    if (refusal) {
      setToast(refusal);
      return;
    }
    const def = CARE_ACTIONS[a];
    perform(a);
    if (a === "mandi") {
      setSpot(null);
      setBathing(true);
    } else if (a === "bersihkan") {
      setLitterDirty(false);
      setSpot("litterBox");
    } else if (def.spot) {
      setSpot(def.spot);
    }
    setToast(`${cat.name} ${def.message}`);
  };

  const serveMeal = (item: MealItem) => {
    const refusal = getRefusalReason(item.action, stats, cat.name, litterDirty || stats.hygiene < 65);
    if (refusal) {
      setToast(refusal);
      return;
    }
    perform({ effect: item.effect, label: item.label, icon: item.icon, action: item.action, itemType: item.id });
    if (item.action === "makan") {
      setFoodFill(item.fillColor);
      setSpot("foodBowl");
    } else {
      setWaterFill(item.fillColor);
      setSpot("waterBowl");
    }
    setToast(`${cat.name} ${item.message}`);
  };

  const playToy = (toy: ToyItem) => {
    const refusal = getRefusalReason("main", stats, cat.name, litterDirty || stats.hygiene < 65);
    if (refusal) {
      if (stats.energy < 15) setSpot("bed");
      setToast(refusal);
      return;
    }
    perform({ effect: toy.effect, label: toy.label, icon: toy.icon, action: "main", itemType: toy.id });
    setToyColor(toy.color);
    setSpot(toy.spot);
    setToast(`${cat.name} ${toy.message}`);
  };

  const touchCat = (t: CatTouch) => setToast(pickReaction(t, cat.name));

  const useObject = (s: HouseSpot) => {
    if (s === "foodBowl") {
      serveMeal(MEAL_ITEMS.makan[0]);
      return;
    }
    if (s === "waterBowl") {
      serveMeal(MEAL_ITEMS.minum[0]);
      return;
    }
    if (s === "litterBox" && litterDirty) {
      doCare("bersihkan");
      return;
    }
    if (s === "toy") {
      playToy(TOY_ITEMS[0]);
      return;
    }
    if (s === "scratchPost") {
      playToy(TOY_ITEMS[2]);
      return;
    }
    setSpot(s);
    setToast(`${cat.name} menuju ${SPOT_LABELS[s].toLowerCase()}`);
  };
  return (
    <main className="relative h-dvh w-full overflow-hidden bg-[#fff6ef] text-stone-800">
      <div className="absolute inset-0">
        <CatRoomScene furColor={cat.furColor} catSpot={spot} onAnimState={setAnim} onUseObject={useObject} onCatTouch={touchCat} cameraReset={cameraReset} foodBowlState={{ level: stats.hunger / 100, fill: foodFill }} waterBowlState={{ level: stats.thirst / 100, fill: waterFill }} bathing={bathing} litterDirty={litterDirty || stats.hygiene < 65} toyColor={toyColor} playingToy={anim === "main"} />
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
          <p className="mt-1 text-xs font-medium text-amber-700" aria-live="polite">
            ● {ANIM_LABELS[anim]}
          </p>
        </div>
        <div className="pointer-events-auto flex flex-col items-end gap-2">
          <span className="rounded-full bg-white/80 px-3 py-1 text-xs font-semibold text-amber-700 shadow backdrop-blur">
            MOCHI
          </span>
          <button
            type="button"
            onClick={() => setCameraReset((n) => n + 1)}
            className="rounded-full bg-white/80 px-3 py-1.5 text-xs font-medium text-stone-700 shadow backdrop-blur transition hover:bg-white active:scale-95"
            aria-label="Kembalikan kamera"
          >
            🎥 Reset kamera
          </button>
        </div>
      </header>

      {toast && (
        <div className="pointer-events-none absolute inset-x-0 top-24 flex justify-center px-4">
          <span className="rounded-full bg-amber-500/90 px-4 py-2 text-sm font-medium text-white shadow-lg">{toast}</span>
        </div>
      )}

      <footer className="pointer-events-none absolute inset-x-0 bottom-0 flex flex-col gap-2 px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
        <p className="text-center text-[11px] text-stone-500">
          {input === "sentuh"
            ? "Ketuk benda untuk dipakai · geser 1 jari memutar kamera · cubit untuk zoom"
            : "Klik benda untuk dipakai · seret mouse memutar kamera · scroll untuk zoom"}
        </p>
        {showStatus ? (
          <CareStatusPanel
            stats={stats}
            deltas={lastDeltas}
            history={history}
            name={cat.name}
            onAction={doCare}
            onClose={() => setShowStatus(false)}
          />
        ) : (
          <CarePanel
            stats={stats}
            deltas={lastDeltas}
            onAction={doCare}
            onServeMeal={serveMeal}
            onPlayToy={playToy}
            litterDirty={litterDirty || stats.hygiene < 65}
            onOpenStatus={() => setShowStatus(true)}
          />
        )}
      </footer>
    </main>
  );
}
