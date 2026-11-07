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
import { FloatingGentleReminder } from "@/components/mood/GentleReminderBanner";
import { CompactGrowthBadge } from "@/components/growth/ExperienceStageIndicator";
import GrowthSheet from "@/components/growth/GrowthSheet";
import MoodRoutineSheet from "@/components/mood/MoodRoutineSheet";
import { computeGrowthProgress, type GrowthStage } from "@/lib/mock-growth";
import { buildGentleReminders, deriveCatMood, evaluateMoodShift, getActiveRoutine, type CatMood, type MoodTransition } from "@/lib/mock-mood";
import { CARE_ACTIONS, getRefusalReason, MEAL_ITEMS, TOY_ITEMS, useCare, type CareAction, type MealItem, type ToyItem } from "@/lib/use-care";

const CatRoomScene = dynamic(() => import("@/components/room/CatRoomScene"), {
  ssr: false,
  loading: () => (
    <div className="flex h-full items-center justify-center text-amber-700">Menyiapkan rumah Mochi…</div>
  ),
});

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
  const [showMoodSheet, setShowMoodSheet] = useState(false);
  const [moodOverride, setMoodOverride] = useState<CatMood | null>(null);
  const [simulatedHour, setSimulatedHour] = useState<number>(9);
  const [moodHistory, setMoodHistory] = useState<MoodTransition[]>([]);
  const [showGrowthSheet, setShowGrowthSheet] = useState(false);
  const [experience, setExperience] = useState<number>(cat.experience + (cat.level - 1) * 50);
  const [closeness, setCloseness] = useState<number>(cat.closeness);
  const [stageOverride, setStageOverride] = useState<GrowthStage | null>(null);
  const growth = computeGrowthProgress(experience, stageOverride);
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

  const recordMoodFromEffect = (effect: Partial<typeof stats>, trigger: string, fallbackToast: string) => {
    const nextStats = { ...stats };
    for (const [k, v] of Object.entries(effect) as [keyof typeof stats, number][]) {
      nextStats[k] = Math.max(0, Math.min(100, nextStats[k] + v));
    }
    const shift = evaluateMoodShift({
      prevStats: stats,
      nextStats,
      hour: simulatedHour,
      trigger,
      catName: cat.name,
    });
    setMoodOverride(null);
    setExperience((xp) => xp + 8);
    setCloseness((c) => Math.min(100, c + 2));
    if (shift.changed) {
      setMoodHistory((prev) => [
        {
          id: prev.length + 1,
          from: shift.prevMood.mood,
          to: shift.nextMood.mood,
          trigger,
          reason: shift.nextMood.reason,
        },
        ...prev.slice(0, 4),
      ]);
      setToast(`${fallbackToast} · ${shift.prevMood.emoji}→${shift.nextMood.emoji} Kini ${shift.nextMood.mood}!`);
    } else {
      setToast(fallbackToast);
    }
  };

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
    recordMoodFromEffect(def.effect, def.label, `${cat.name} ${def.message}`);
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
    recordMoodFromEffect(item.effect, item.label, `${cat.name} ${item.message}`);
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
    recordMoodFromEffect(toy.effect, toy.label, `${cat.name} ${toy.message}`);
  };

  const touchCat = (t: CatTouch) => {
    const reactionText = pickReaction(t, cat.name);
    if (t.part === "ekor") {
      const eff = { happiness: -6 };
      perform({ effect: eff, label: "Sentuh ekor", icon: "😾" });
      recordMoodFromEffect(eff, "Sentuh ekor", reactionText);
    } else if (t.kind === "elus") {
      const eff = { happiness: 8 };
      perform({ effect: eff, label: `Elus ${t.part}`, icon: "💕", action: "main", itemType: "elus" });
      recordMoodFromEffect(eff, `Elus ${t.part}`, reactionText);
    } else {
      const eff = { happiness: 3 };
      perform({ effect: eff, label: `Sentuh ${t.part}`, icon: "🐾" });
      recordMoodFromEffect(eff, `Sentuh ${t.part}`, reactionText);
    }
  };

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
    if (s === "bed") {
      const eff = { energy: 30, happiness: 5 };
      perform({ effect: eff, label: "Tidur siang", icon: "😴" });
      setSpot("bed");
      recordMoodFromEffect(eff, "Tidur di kasur", `${cat.name} meringkuk tidur di kasur 😴`);
      return;
    }
    setSpot(s);
    setToast(`${cat.name} menuju ${SPOT_LABELS[s].toLowerCase()}`);
  };
  return (
    <main className="relative h-dvh w-full overflow-hidden bg-[#fff6ef] text-stone-800">
      <div className="absolute inset-0">
        <CatRoomScene furColor={cat.furColor} catSpot={spot} onAnimState={setAnim} onUseObject={useObject} onCatTouch={touchCat} cameraReset={cameraReset} foodBowlState={{ level: stats.hunger / 100, fill: foodFill }} waterBowlState={{ level: stats.thirst / 100, fill: waterFill }} bathing={bathing} litterDirty={litterDirty || stats.hygiene < 65} toyColor={toyColor} playingToy={anim === "main"} mood={deriveCatMood(stats, simulatedHour, moodOverride).mood} growthScale={growth.stageDef.scale3d} stage={growth.stage} />
      </div>

      {/* Header info kucing */}
      <header className="pointer-events-none absolute inset-x-0 top-0 flex items-start justify-between p-3 pt-[max(0.75rem,env(safe-area-inset-top))] sm:p-6">
        <div className="pointer-events-auto rounded-2xl bg-white/85 px-4 py-3 shadow-md backdrop-blur">
          <div className="flex items-center gap-2">
            <h1 className="text-lg font-bold">
              {cat.name} {deriveCatMood(stats, simulatedHour, moodOverride).emoji}
            </h1>
            <button
              type="button"
              onClick={() => {
                setShowStatus(false);
                setShowMoodSheet((v) => !v);
              }}
              className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold transition ${deriveCatMood(stats, simulatedHour, moodOverride).badgeColor}`}
            >
              {deriveCatMood(stats, simulatedHour, moodOverride).label} ›
            </button>
          </div>
          <CompactGrowthBadge
            experience={experience}
            closeness={closeness}
            stageOverride={stageOverride}
            onClick={() => {
              setShowStatus(false);
              setShowMoodSheet(false);
              setShowGrowthSheet((v) => !v);
            }}
          />
          <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs">
            <span className="font-medium text-amber-700" aria-live="polite">
              ● {ANIM_LABELS[anim]}
            </span>
            <span className="text-stone-400">·</span>
            <button
              type="button"
              onClick={() => {
                setShowStatus(false);
                setShowMoodSheet(true);
              }}
              className="text-stone-600 hover:text-amber-700"
            >
              {getActiveRoutine(simulatedHour).icon} {getActiveRoutine(simulatedHour).title}
            </button>
          </div>
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
          <button
            type="button"
            onClick={() => {
              setShowStatus(false);
              setShowGrowthSheet(false);
              setShowMoodSheet((v) => !v);
            }}
            className="rounded-full bg-white/80 px-3 py-1.5 text-xs font-medium text-amber-800 shadow backdrop-blur transition hover:bg-white active:scale-95"
          >
            😺 Mood & Rutinitas
          </button>
          <button
            type="button"
            onClick={() => {
              setShowStatus(false);
              setShowMoodSheet(false);
              setShowGrowthSheet((v) => !v);
            }}
            className="rounded-full bg-white/80 px-3 py-1.5 text-xs font-medium text-emerald-800 shadow backdrop-blur transition hover:bg-white active:scale-95"
          >
            🌱 Tumbuh Besar
          </button>
        </div>
      </header>

      <div className="pointer-events-none absolute inset-x-0 top-24 flex flex-col items-center gap-2 px-4">
        {toast ? (
          <span className="rounded-full bg-amber-500/90 px-4 py-2 text-sm font-medium text-white shadow-lg">{toast}</span>
        ) : (
          !showMoodSheet &&
          !showGrowthSheet &&
          !showStatus && (
            <FloatingGentleReminder
              reminders={buildGentleReminders(stats, cat.name, simulatedHour)}
              onQuickAction={doCare}
            />
          )
        )}
      </div>

      <footer className="pointer-events-none absolute inset-x-0 bottom-0 flex flex-col gap-2 px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
        <p className="text-center text-[11px] text-stone-500">
          {input === "sentuh"
            ? "Ketuk benda untuk dipakai · geser 1 jari memutar kamera · cubit untuk zoom"
            : "Klik benda untuk dipakai · seret mouse memutar kamera · scroll untuk zoom"}
        </p>
        {showGrowthSheet ? (
          <GrowthSheet
            name={cat.name}
            experience={experience}
            closeness={closeness}
            stageOverride={stageOverride}
            onSelectStage={setStageOverride}
            onBoostGrowth={() => {
              setExperience((xp) => xp + 25);
              setCloseness((c) => Math.min(100, c + 4));
              setToast(`${cat.name} bertambah pintar & makin dekat denganmu! 🌟`);
            }}
            onClose={() => setShowGrowthSheet(false)}
          />
        ) : showMoodSheet ? (
          <MoodRoutineSheet
            name={cat.name}
            stats={stats}
            moodOverride={moodOverride}
            onSelectMood={setMoodOverride}
            simulatedHour={simulatedHour}
            onChangeHour={(h) => {
              setSimulatedHour(h);
              const rt = getActiveRoutine(h);
              if (rt.spot) setSpot(rt.spot);
            }}
            moodHistory={moodHistory}
            careHistory={history}
            onQuickCare={doCare}
            onGoToSpot={(s, title) => {
              setSpot(s);
              setShowMoodSheet(false);
              setToast(`${cat.name} menjalani rutinitas: ${title}`);
            }}
            onClose={() => setShowMoodSheet(false)}
          />
        ) : showStatus ? (
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
