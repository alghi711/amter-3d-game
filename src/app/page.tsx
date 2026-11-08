"use client";

import dynamic from "next/dynamic";
import { useCallback, useEffect, useRef, useState } from "react";
import { mockCat } from "@/lib/mock-cat";
import { useInputKind } from "@/lib/use-input-kind";
import { pickReaction } from "@/lib/cat-reactions";
import type { CatTouch } from "@/components/room/CatRoomScene";
import { ANIM_LABELS, type CatAnimState } from "@/lib/cat-animation";
import { type HouseSpot } from "@/components/room/CatHouse";
import CarePanel from "@/components/care/CarePanel";
import CareStatusPanel from "@/components/care/CareStatusPanel";
import AutosaveBackupSheet, { AutosaveStatusPill } from "@/components/save/AutosaveBackupSheet";
import type { GameSaveSnapshot } from "@/lib/mock-saves";
import { useAutosave } from "@/lib/use-autosave";
import { FloatingGentleReminder } from "@/components/mood/GentleReminderBanner";
import { CompactGrowthBadge } from "@/components/growth/ExperienceStageIndicator";
import { evaluateAchievementBadges } from "@/components/growth/BadgeCollectionGallery";
import BadgeUnlockToast from "@/components/growth/BadgeUnlockToast";
import GrowthSheet from "@/components/growth/GrowthSheet";
import MoodRoutineSheet from "@/components/mood/MoodRoutineSheet";
import AccountSheet from "@/components/account/AccountSheet";
import SettingsSheet from "@/components/settings/SettingsSheet";
import { useGameSettings } from "@/lib/use-game-settings";
import { usePlayerAccount } from "@/lib/use-player-account";
import type { PlayerAccount } from "@/lib/mock-account";
import { computeGrowthProgress, type GrowthStage, type MockAchievement } from "@/lib/mock-growth";
import { buildGentleReminders, deriveCatMood, evaluateMoodShift, getActiveRoutine, type CatMood, type MoodTransition } from "@/lib/mock-mood";
import { CARE_ACTIONS, getRefusalReason, MEAL_ITEMS, TOY_ITEMS, useCare, type CareAction, type MealItem, type ToyItem } from "@/lib/use-care";
import { playCatSound, playSoundForCareAction, type SoundEffectType } from "@/lib/cat-audio";
import { LIGHTING_PRESETS, type LightingMode } from "@/lib/procedural-textures";
import type { QualityLevel } from "@/lib/quality";

const CatRoomScene = dynamic(() => import("@/components/room/CatRoomScene"), {
  ssr: false,
  loading: () => (
    <div className="flex h-full items-center justify-center text-amber-700 font-semibold">Menyiapkan rumah 3D Mochi…</div>
  ),
});

export default function Home() {
  const cat = mockCat;
  const [spot, setSpot] = useState<HouseSpot | null>(null);
  const input = useInputKind();
  const [cameraReset, setCameraReset] = useState(0);
  const [toast, setToast] = useState<string | null>(null);
  const [anim, setAnim] = useState<CatAnimState>("diam");

  const { stats, lastDeltas, history, perform, replaceStats } = useCare();
  const [showStatus, setShowStatus] = useState(false);
  const [showMoodSheet, setShowMoodSheet] = useState(false);
  const [moodOverride, setMoodOverride] = useState<CatMood | null>(null);
  const [simulatedHour, setSimulatedHour] = useState<number>(9);
  const [moodHistory, setMoodHistory] = useState<MoodTransition[]>([]);
  const [showGrowthSheet, setShowGrowthSheet] = useState(false);
  const [showSaveSheet, setShowSaveSheet] = useState(false);
  const [showAccountSheet, setShowAccountSheet] = useState(false);
  const [showSettingsSheet, setShowSettingsSheet] = useState(false);
  const { account: playerAccount, saveAccount: setPlayerAccount } = usePlayerAccount();
  const [experience, setExperience] = useState<number>(cat.experience + (cat.level - 1) * 50);
  const [closeness, setCloseness] = useState<number>(cat.closeness);
  const [stageOverride, setStageOverride] = useState<GrowthStage | null>(null);
  const growth = computeGrowthProgress(experience, stageOverride);
  const [unlockedToastBadge, setUnlockedToastBadge] = useState<MockAchievement | null>(null);
  const seenBadgesRef = useRef<Set<string> | null>(null);

  // Suasana Cahaya 3D, Suara Web Audio Synthesizer, Balon Suara 3D, & Tooltip
  const { settings, updateSettings } = useGameSettings();
  const [lightingMode, setLightingMode] = useState<LightingMode>("day");
  const [voiceBubble, setVoiceBubble] = useState<{ text: string; icon: string } | null>(null);
  const [vocalizing, setVocalizing] = useState(false);
  const [floatingReaction, setFloatingReaction] = useState<{ id: number; text: string } | null>(null);
  const [hoverTooltip, setHoverTooltip] = useState<{ label: string; x: number; y: number } | null>(null);
  const voiceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const triggerVoiceBubble = useCallback((text: string, icon = "🔊", durationMs = 2400) => {
    if (voiceTimerRef.current) clearTimeout(voiceTimerRef.current);
    setVoiceBubble({ text, icon });
    setVocalizing(true);
    voiceTimerRef.current = setTimeout(() => {
      setVoiceBubble(null);
      setVocalizing(false);
    }, durationMs);
  }, []);

  const spawnFloatingReaction = useCallback((text: string) => {
    setFloatingReaction({ id: Date.now(), text });
  }, []);

  const handleAccountChange = useCallback(
    (newAcc: PlayerAccount) => {
      setPlayerAccount(newAcc);
      if (newAcc.linkedCat) {
        if (newAcc.linkedCat.experience !== undefined) setExperience(newAcc.linkedCat.experience);
        if (newAcc.linkedCat.closeness !== undefined) setCloseness(newAcc.linkedCat.closeness);
      }
      playCatSound("purr_meow", growth.stage === "anak");
      triggerVoiceBubble(`Meong~ Halo ${newAcc.name}! 💕`, "🐱", 2600);
      spawnFloatingReaction(`🐾 Masuk: ${newAcc.name}`);
      setToast(`Status akun terhubung: ${newAcc.name} (${newAcc.isGuest ? "Tamu" : "Terdaftar"}) ✨`);
    },
    [growth.stage, setPlayerAccount, triggerVoiceBubble, spawnFloatingReaction],
  );

  const handleQualityAutoAdjust = useCallback((newQ: QualityLevel) => {
    setToast(`⚡ Mode adaptif: kualitas grafis disesuaikan ke ${newQ.toUpperCase()}`);
  }, []);

  useEffect(() => {
    if (!floatingReaction) return;
    const id = setTimeout(() => setFloatingReaction(null), 900);
    return () => clearTimeout(id);
  }, [floatingReaction]);

  useEffect(() => {
    if (!toast) return;
    const id = setTimeout(() => setToast(null), 2200);
    return () => clearTimeout(id);
  }, [toast]);

  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      const targetTag = (e.target as HTMLElement)?.tagName?.toLowerCase();
      if (targetTag === "input" || targetTag === "textarea") return;

      if (e.key === "Escape") {
        setShowStatus(false);
        setShowMoodSheet(false);
        setShowGrowthSheet(false);
        setShowSaveSheet(false);
        setShowAccountSheet(false);
        setShowSettingsSheet(false);
      }
    };
    window.addEventListener("keydown", handleGlobalKeyDown);
    return () => window.removeEventListener("keydown", handleGlobalKeyDown);
  }, []);

  const handleHydrateSave = useCallback(
    (saved: GameSaveSnapshot) => {
      setExperience(saved.experience);
      setCloseness(saved.closeness);
      if (saved.stats) {
        replaceStats(saved.stats);
      }
      setToast(`Selamat datang kembali! Kondisi ${saved.catName} dilanjutkan dari sesi terakhir 🐾`);
    },
    [replaceStats],
  );

  const { autosaveStatus, lastSavedLabel, justSaved, saveNow: triggerManualSave } = useAutosave(
    {
      catId: cat.id,
      catName: cat.name,
      stage: growth.stage,
      level: growth.level,
      experience,
      closeness,
      mood: deriveCatMood(stats, simulatedHour, moodOverride).mood,
      stats,
    },
    handleHydrateSave,
  );

  useEffect(() => {
    const currentBadges = evaluateAchievementBadges({ experience, closeness, stats, history });
    const unlockedNow = currentBadges.filter((b) => b.unlocked);
    if (!seenBadgesRef.current) {
      seenBadgesRef.current = new Set(unlockedNow.map((b) => b.id));
      return;
    }
    const newlyUnlocked = unlockedNow.find((b) => !seenBadgesRef.current?.has(b.id));
    if (newlyUnlocked) {
      seenBadgesRef.current.add(newlyUnlocked.id);
      playCatSound("chime", growth.stage === "anak");
      const timer = setTimeout(() => setUnlockedToastBadge(newlyUnlocked), 50);
      const hideTimer = setTimeout(() => setUnlockedToastBadge(null), 5000);
      return () => {
        clearTimeout(timer);
        clearTimeout(hideTimer);
      };
    }
  }, [experience, closeness, stats, history, growth.stage]);

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

  const isKitten = growth.stage === "anak";

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
      playCatSound("meow", isKitten);
      triggerVoiceBubble("Miuw~ Nanti dulu ya! 🐾", "🐱", 2200);
      setToast(refusal);
      return;
    }
    const def = CARE_ACTIONS[a];
    perform(a);
    playSoundForCareAction(a, isKitten);

    if (a === "mandi") {
      setSpot(null);
      setBathing(true);
      triggerVoiceBubble("Byuur~ Meong wangi! 🫧", "🔊", 2600);
      spawnFloatingReaction("🫧 Bersih & Wangi! +Bersih · +8 XP");
    } else if (a === "bersihkan") {
      setLitterDirty(false);
      setSpot("litterBox");
      triggerVoiceBubble("Srek srek~ Bersih! ✨", "🔊", 2400);
      spawnFloatingReaction("🧹 Kamar Kinclong! +Bersih · +8 XP");
    } else if (a === "makan") {
      if (def.spot) setSpot(def.spot);
      triggerVoiceBubble("Nyam nyam~ Meong! 🍗", "🔊", 2600);
      spawnFloatingReaction("🍗 Nyam nyam! +Kenyang · +8 XP");
    } else if (a === "minum") {
      if (def.spot) setSpot(def.spot);
      triggerVoiceBubble("Slurp slurp~ Segar! 💧", "🔊", 2500);
      spawnFloatingReaction("💧 Segar sekali! +Minum · +8 XP");
    } else if (a === "main") {
      if (def.spot) setSpot(def.spot);
      triggerVoiceBubble("Prrr-mew! Seru~ 🧶", "🎶", 2600);
      spawnFloatingReaction("🧶 Seru banget! +Ceria · +8 XP");
    }
    recordMoodFromEffect(def.effect, def.label, `${cat.name} ${def.message}`);
  };

  const serveMeal = (item: MealItem) => {
    const refusal = getRefusalReason(item.action, stats, cat.name, litterDirty || stats.hygiene < 65);
    if (refusal) {
      playCatSound("meow", isKitten);
      setToast(refusal);
      return;
    }
    perform({ effect: item.effect, label: item.label, icon: item.icon, action: item.action, itemType: item.id });
    playSoundForCareAction(item.action, isKitten);
    if (item.action === "makan") {
      setFoodFill(item.fillColor);
      setSpot("foodBowl");
      triggerVoiceBubble(`Nyam nyam~ ${item.label}! 🍗`, "🔊", 2600);
      spawnFloatingReaction(`${item.icon} ${item.label}! +Kenyang · +8 XP`);
    } else {
      setWaterFill(item.fillColor);
      setSpot("waterBowl");
      triggerVoiceBubble(`Slurp slurp~ ${item.label}! 💧`, "🔊", 2500);
      spawnFloatingReaction(`${item.icon} ${item.label}! +Minum · +8 XP`);
    }
    recordMoodFromEffect(item.effect, item.label, `${cat.name} ${item.message}`);
  };

  const playToy = (toy: ToyItem) => {
    const refusal = getRefusalReason("main", stats, cat.name, litterDirty || stats.hygiene < 65);
    if (refusal) {
      if (stats.energy < 15) setSpot("bed");
      playCatSound("meow", isKitten);
      setToast(refusal);
      return;
    }
    perform({ effect: toy.effect, label: toy.label, icon: toy.icon, action: "main", itemType: toy.id });
    playCatSound("chirp", isKitten);
    setToyColor(toy.color);
    setSpot(toy.spot);
    triggerVoiceBubble(`Prrr-mew! Main ${toy.label}~ 🎶`, "🎶", 2600);
    spawnFloatingReaction(`${toy.icon} +Ceria · +8 XP`);
    recordMoodFromEffect(toy.effect, toy.label, `${cat.name} ${toy.message}`);
  };

  const touchCat = (t: CatTouch) => {
    const reactionText = pickReaction(t, cat.name, closeness);
    if (t.part === "ekor") {
      playCatSound("meow", isKitten);
      triggerVoiceBubble("Meong?! Jangan tarik ekorku~ 😾", "😾", 2200);
      const eff = { happiness: -6 };
      perform({ effect: eff, label: "Sentuh ekor", icon: "😾" });
      recordMoodFromEffect(eff, "Sentuh ekor", reactionText);
    } else if (t.kind === "elus") {
      playCatSound("purr_meow", isKitten);
      triggerVoiceBubble("Prrrrr~ Meong sayang! 💕", "🔊", 2400);
      spawnFloatingReaction("💞 Purrr~ +8 Ceria · +8 XP");
      const eff = { happiness: 8 };
      perform({ effect: eff, label: `Elus ${t.part}`, icon: "💕", action: "main", itemType: "elus" });
      recordMoodFromEffect(eff, `Elus ${t.part}`, reactionText);
    } else {
      playCatSound("purr_meow", isKitten);
      triggerVoiceBubble("Prrrrr~ Meong! 💕", "🔊", 2200);
      spawnFloatingReaction("💞 Purrr~ +5 Ceria · +8 XP");
      const eff = { happiness: 5 };
      perform({ effect: eff, label: `Sentuh ${t.part}`, icon: "🐾", action: "main", itemType: "elus" });
      recordMoodFromEffect(eff, `Sentuh ${t.part}`, reactionText);
    }
  };

  const callMochiVoice = () => {
    const phrases: { sound: SoundEffectType; bubble: string; icon: string }[] = [
      { sound: "meow", bubble: "Meong~ Halo! ♪", icon: "🐱" },
      { sound: "chirp", bubble: "Prrr-mew! Ayo main~", icon: "🎶" },
      { sound: "purr_meow", bubble: "Prrrrr~ Sayang kamu! 💕", icon: "💞" },
    ];
    const pick = phrases[Math.floor(Math.random() * phrases.length)];
    playCatSound(pick.sound, isKitten);
    triggerVoiceBubble(pick.bubble, pick.icon, 2500);
    spawnFloatingReaction("🐾 Mochi menoleh & mendengkur~");
    setSpot(null);
  };

  const cycleLightingMode = () => {
    playCatSound("pop", isKitten);
    setLightingMode((prev) => (prev === "day" ? "sunset" : prev === "sunset" ? "night" : "day"));
  };

  const toggleSound = () => {
    const next = !settings.soundEnabled;
    updateSettings({ soundEnabled: next });
    if (next) {
      playCatSound("meow", isKitten);
      triggerVoiceBubble("Meong~ Suara aktif! ♪", "🔊", 2000);
    }
  };

  const toggleMusic = () => {
    const next = !settings.musicEnabled;
    updateSettings({ musicEnabled: next });
    if (next) {
      triggerVoiceBubble("Melodi kamar santai aktif! 🎵", "🎶", 2000);
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
    if (s === "litterBox") {
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
      playCatSound("sleep", isKitten);
      triggerVoiceBubble("Huaah~ Prrrr... Zzz 💤", "🌙", 3200);
      spawnFloatingReaction("💤 Energi Pulih! +30 Energi");
      const eff = { energy: 30, happiness: 5 };
      perform({ effect: eff, label: "Tidur siang", icon: "😴" });
      setSpot("bed");
      recordMoodFromEffect(eff, "Tidur di kasur", `${cat.name} meringkuk tidur di kasur 😴`);
      return;
    }
  };

  const handleHoverSpot = useCallback((label: string | null, clientX?: number, clientY?: number) => {
    if (!label || clientX === undefined || clientY === undefined) {
      setHoverTooltip(null);
      return;
    }
    setHoverTooltip({ label, x: clientX, y: clientY });
  }, []);

  const currentLighting = LIGHTING_PRESETS[lightingMode];

  return (
    <main className="relative h-dvh w-full overflow-hidden bg-[#eadaca] text-stone-800 select-none">
      <div className="absolute inset-0">
        <CatRoomScene
          furColor={playerAccount.linkedCat?.furColor ?? cat.furColor}
          catSpot={spot}
          onAnimState={setAnim}
          onUseObject={useObject}
          onCatTouch={touchCat}
          onHoverSpot={handleHoverSpot}
          cameraReset={cameraReset}
          foodBowlState={{ level: stats.hunger / 100, fill: foodFill }}
          waterBowlState={{ level: stats.thirst / 100, fill: waterFill }}
          bathing={bathing}
          litterDirty={litterDirty || stats.hygiene < 65}
          toyColor={toyColor}
          playingToy={anim === "main"}
          mood={deriveCatMood(stats, simulatedHour, moodOverride).mood}
          growthScale={growth.stageDef.scale3d}
          stage={growth.stage}
          lightingMode={lightingMode}
          vocalizing={vocalizing}
          qualityLevel={settings.graphicsQuality}
          shadowsEnabled={settings.shadowsEnabled}
          batterySaver={settings.batterySaver}
          frameRateLimit={settings.frameRateLimit}
          onQualityAutoAdjust={handleQualityAutoAdjust}
        />
      </div>

      {/* Tooltip Objek 3D saat Disorot Kursor */}
      {hoverTooltip && (
        <div
          className="pointer-events-none fixed z-30 -translate-x-1/2 -translate-y-full rounded-full bg-stone-900/80 px-3 py-1.5 text-xs font-semibold text-white shadow-lg backdrop-blur-md transition-opacity duration-150"
          style={{ left: hoverTooltip.x, top: hoverTooltip.y - 12 }}
        >
          {hoverTooltip.label}
        </div>
      )}

      {/* Balon Suara 3D Melayang di Atas Kepala Mochi */}
      <div
        id="cat-voice-bubble"
        className={`pointer-events-none fixed z-30 -translate-x-1/2 -translate-y-full transition-opacity duration-200 ${
          voiceBubble ? "opacity-100" : "opacity-0"
        }`}
        style={{ left: "50%", top: "38%" }}
      >
        <div className="flex items-center gap-1.5 whitespace-nowrap rounded-2xl border-2 border-amber-300 bg-white/95 px-3.5 py-1.5 text-xs font-extrabold text-stone-800 shadow-lg backdrop-blur-md">
          <span className="animate-bounce text-sm">{voiceBubble?.icon ?? "🔊"}</span>
          <span>{voiceBubble?.text ?? "Meong~ ♪"}</span>
        </div>
        <div className="mx-auto -mt-1.5 h-3 w-3 rotate-45 border-b-2 border-r-2 border-amber-300 bg-white" />
      </div>

      {/* Teks Reaksi Melayang (Floating 2D Feedback) */}
      {floatingReaction && (
        <div
          key={floatingReaction.id}
          className="pointer-events-none fixed left-1/2 top-[42%] z-30 -translate-x-1/2 -translate-y-6 animate-bounce rounded-full border border-amber-200 bg-white/95 px-3.5 py-1 text-xs font-extrabold text-amber-700 shadow-md sm:text-sm"
        >
          {floatingReaction.text}
        </div>
      )}

      {/* Header Info Kucing & Tombol Kontrol Kanan Atas */}
      <header className="pointer-events-none absolute inset-x-0 top-0 flex items-start justify-between p-3 pt-[max(0.75rem,env(safe-area-inset-top))] sm:p-5">
        <div className="pointer-events-auto w-[305px] rounded-2xl border border-white/85 bg-[#fffdf9]/90 px-4 py-3 shadow-lg backdrop-blur-md sm:w-[345px]">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5">
              <h1 className="text-lg font-extrabold tracking-tight text-stone-800">{cat.name}</h1>
              <span className="text-lg">{deriveCatMood(stats, simulatedHour, moodOverride).emoji}</span>
            </div>
            <button
              type="button"
              onClick={() => {
                playCatSound("pop", isKitten);
                setShowStatus(false);
                setShowMoodSheet((v) => !v);
              }}
              className={`rounded-full px-2.5 py-0.5 text-[11px] font-bold transition ${deriveCatMood(stats, simulatedHour, moodOverride).badgeColor}`}
            >
              {deriveCatMood(stats, simulatedHour, moodOverride).label} ›
            </button>
          </div>
          <CompactGrowthBadge
            experience={experience}
            closeness={closeness}
            stageOverride={stageOverride}
            onClick={() => {
              playCatSound("pop", isKitten);
              setShowStatus(false);
              setShowMoodSheet(false);
              setShowGrowthSheet((v) => !v);
            }}
          />
          <div className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs font-semibold">
            <span className="flex items-center gap-1.5 text-amber-700" aria-live="polite">
              <span className="h-2 w-2 animate-pulse rounded-full bg-amber-500" />
              {ANIM_LABELS[anim]}
            </span>
            <span className="text-stone-300">|</span>
            <button
              type="button"
              onClick={() => {
                playCatSound("pop", isKitten);
                setShowStatus(false);
                setShowMoodSheet(true);
              }}
              className="text-stone-600 hover:text-amber-700"
            >
              {getActiveRoutine(simulatedHour).icon} {getActiveRoutine(simulatedHour).title}
            </button>
          </div>
          <div className="mt-2 flex items-center justify-between border-t border-stone-100 pt-1.5 text-[11px]">
            <button
              type="button"
              onClick={() => {
                playCatSound("pop", isKitten);
                setShowAccountSheet(true);
              }}
              className={`inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 font-bold transition hover:scale-105 active:scale-95 ${
                playerAccount.isGuest
                  ? "border border-amber-300 bg-amber-50 text-amber-900"
                  : "border border-emerald-300 bg-emerald-50 text-emerald-900"
              }`}
              title="Klik untuk membuka profil akun pemain"
            >
              <span
                className={`h-1.5 w-1.5 rounded-full ${
                  playerAccount.isGuest ? "bg-amber-500" : "bg-emerald-500 animate-pulse"
                }`}
              />
              <span>
                {playerAccount.avatar} {playerAccount.name}
              </span>
              <span className="text-[9px] opacity-70">({playerAccount.isGuest ? "Tamu" : "Cloud"})</span>
            </button>
            <span className="text-[10px] text-stone-400">🛡️ Cloud Sync</span>
          </div>
        </div>

        <div className="pointer-events-auto flex flex-col items-end gap-1.5">
          <AutosaveStatusPill
            status={autosaveStatus}
            lastSavedLabel={lastSavedLabel}
            justSaved={justSaved}
            onClick={() => {
              playCatSound("pop", isKitten);
              setShowStatus(false);
              setShowMoodSheet(false);
              setShowGrowthSheet(false);
              setShowSaveSheet((v) => !v);
            }}
          />
          <button
            type="button"
            onClick={() => {
              playCatSound("pop", isKitten);
              setCameraReset((n) => n + 1);
            }}
            className="rounded-full border border-white/90 bg-white/90 px-3.5 py-1.5 text-xs font-bold text-stone-700 shadow backdrop-blur transition hover:-translate-y-0.5 hover:bg-white active:scale-95"
            aria-label="Kembalikan kamera"
          >
            🎥 Reset kamera
          </button>
          <button
            type="button"
            onClick={() => {
              playCatSound("pop", isKitten);
              setShowStatus(false);
              setShowGrowthSheet(false);
              setShowSaveSheet(false);
              setShowMoodSheet((v) => !v);
            }}
            className="rounded-full border border-white/90 bg-white/90 px-3.5 py-1.5 text-xs font-bold text-amber-800 shadow backdrop-blur transition hover:-translate-y-0.5 hover:bg-white active:scale-95"
          >
            🦊 Mood & Rutinitas
          </button>
          <button
            type="button"
            onClick={() => {
              playCatSound("pop", isKitten);
              setShowStatus(false);
              setShowMoodSheet(false);
              setShowSaveSheet(false);
              setShowGrowthSheet((v) => !v);
            }}
            className="rounded-full border border-emerald-200 bg-white/90 px-3.5 py-1.5 text-xs font-bold text-emerald-800 shadow backdrop-blur transition hover:-translate-y-0.5 hover:bg-white active:scale-95"
          >
            🌱 Tumbuh Besar
          </button>
          <button
            type="button"
            onClick={callMochiVoice}
            className="rounded-full border border-rose-200 bg-white/90 px-3.5 py-1.5 text-xs font-bold text-rose-700 shadow backdrop-blur transition hover:-translate-y-0.5 hover:bg-white active:scale-95"
          >
            🐾 Panggil Mochi
          </button>
          <button
            type="button"
            onClick={() => {
              playCatSound("pop", isKitten);
              setShowStatus(false);
              setShowMoodSheet(false);
              setShowGrowthSheet(false);
              setShowSaveSheet(false);
              setShowSettingsSheet(false);
              setShowAccountSheet((v) => !v);
            }}
            className={`rounded-full border px-3.5 py-1.5 text-xs font-bold shadow backdrop-blur transition hover:-translate-y-0.5 active:scale-95 ${
              playerAccount.isGuest
                ? "border-amber-300 bg-white/90 text-amber-900 hover:bg-white"
                : "border-sky-300 bg-white/90 text-sky-800 hover:bg-white"
            }`}
          >
            {playerAccount.isGuest ? "🐾 Akun Tamu" : `👤 ${playerAccount.name}`}
          </button>
          <div className="mt-0.5 flex items-center gap-1.5">
            <button
              type="button"
              onClick={cycleLightingMode}
              className="rounded-full border border-white/90 bg-white/90 px-3 py-1.5 text-xs font-bold text-amber-800 shadow backdrop-blur transition hover:-translate-y-0.5 hover:bg-white active:scale-95"
              title="Ganti Suasana Cahaya"
            >
              {currentLighting.icon} {currentLighting.label}
            </button>
            <button
              type="button"
              onClick={toggleSound}
              className="rounded-full border border-white/90 bg-white/90 px-3 py-1.5 text-xs font-bold text-stone-700 shadow backdrop-blur transition hover:-translate-y-0.5 hover:bg-white active:scale-95"
              title="Suara Kucing & Efek"
            >
              {settings.soundEnabled ? "🔊 Suara" : "🔇 Bisu"}
            </button>
            <button
              type="button"
              onClick={toggleMusic}
              className="rounded-full border border-white/90 bg-white/90 px-3 py-1.5 text-xs font-bold text-stone-700 shadow backdrop-blur transition hover:-translate-y-0.5 hover:bg-white active:scale-95"
              title="Musik Kamar Santai (BGM)"
            >
              {settings.musicEnabled ? "🎵 Musik" : "🔇 Musik"}
            </button>
            <button
              type="button"
              onClick={() => {
                playCatSound("pop", isKitten);
                setShowStatus(false);
                setShowMoodSheet(false);
                setShowGrowthSheet(false);
                setShowSaveSheet(false);
                setShowAccountSheet(false);
                setShowSettingsSheet((v) => !v);
              }}
              className="rounded-full border border-white/90 bg-white/90 px-3 py-1.5 text-xs font-bold text-stone-700 shadow backdrop-blur transition hover:-translate-y-0.5 hover:bg-white active:scale-95"
              title="Pengaturan & Suara"
            >
              ⚙️ Pengaturan
            </button>
          </div>
        </div>
      </header>

      {/* Tombol Kompas Kamera & Elus Cepat di Kiri Bawah */}
      <div className="pointer-events-auto fixed bottom-4 left-4 z-20 hidden items-center gap-2 sm:flex">
        <button
          type="button"
          onClick={() => {
            playCatSound("pop", isKitten);
            setCameraReset((n) => n + 1);
          }}
          className="flex h-10 w-10 items-center justify-center rounded-full border border-white/20 bg-stone-900/90 text-sm font-extrabold text-white shadow-lg transition hover:scale-105 hover:bg-stone-800"
          title="Kompas Kamera (Utara)"
        >
          N
        </button>
        <button
          type="button"
          onClick={() => touchCat({ kind: "elus", part: "kepala" })}
          className="flex h-10 w-10 items-center justify-center rounded-full border border-white/40 bg-amber-500/90 text-sm font-extrabold text-white shadow-lg transition hover:scale-105 hover:bg-amber-500"
          title="Elus Mochi Sekarang!"
        >
          🐾
        </button>
      </div>

      {/* Notifikasi Lencana & Pengingat Lembut di Tengah Atas */}
      <div className="pointer-events-none absolute inset-x-0 top-24 flex flex-col items-center gap-2 px-4 sm:top-5">
        {unlockedToastBadge && (
          <BadgeUnlockToast
            badge={unlockedToastBadge}
            onViewCollection={() => {
              setUnlockedToastBadge(null);
              setShowStatus(false);
              setShowMoodSheet(false);
              setShowGrowthSheet(true);
            }}
            onDismiss={() => setUnlockedToastBadge(null)}
          />
        )}
        {toast ? (
          <span className="rounded-full bg-amber-500/95 px-4 py-2 text-sm font-bold text-white shadow-lg">{toast}</span>
        ) : (
          !showMoodSheet &&
          !showGrowthSheet &&
          !showSaveSheet &&
          !showStatus &&
          !showAccountSheet &&
          !showSettingsSheet && (
            <FloatingGentleReminder
              reminders={buildGentleReminders(stats, cat.name, simulatedHour)}
              onQuickAction={doCare}
            />
          )
        )}
      </div>

      <footer className="pointer-events-none absolute inset-x-0 bottom-0 flex flex-col items-center gap-1.5 px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
        <p className="rounded-full bg-white/55 px-3 py-0.5 text-center text-[11px] font-semibold text-stone-600 shadow-sm backdrop-blur-sm">
          {input === "sentuh"
            ? "Ketuk benda untuk dipakai · geser 1 jari memutar kamera · cubit untuk zoom"
            : "Klik benda untuk dipakai · seret mouse memutar kamera · scroll untuk zoom"}
        </p>
        <div className="w-full">
          {showSaveSheet ? (
            <AutosaveBackupSheet
              catName={cat.name}
              stage={growth.stage}
              level={growth.level}
              experience={experience}
              closeness={closeness}
              mood={deriveCatMood(stats, simulatedHour, moodOverride).mood}
              stats={stats}
              autosaveStatus={autosaveStatus}
              lastSavedLabel={lastSavedLabel}
              onSaveNow={triggerManualSave}
              onRestoreSnapshot={(snap, label) => {
                if (typeof snap.experience === "number") setExperience(snap.experience);
                if (typeof snap.closeness === "number") setCloseness(snap.closeness);
                if (snap.stats) replaceStats(snap.stats);
                if (snap.stage) setStageOverride(snap.stage);
                if (snap.mood) setMoodOverride(snap.mood);
                setShowSaveSheet(false);
                setToast(`Progres ${cat.name} dipulihkan dari ${label} 💾`);
              }}
              onClose={() => setShowSaveSheet(false)}
            />
          ) : showGrowthSheet ? (
            <GrowthSheet
              name={cat.name}
              experience={experience}
              closeness={closeness}
              stats={stats}
              history={history}
              stageOverride={stageOverride}
              onSelectStage={(nextStage) => {
                setStageOverride(nextStage);
                playCatSound("meow", nextStage === "anak");
                triggerVoiceBubble(
                  nextStage === "anak"
                    ? "Miuw~ Aku mode anak kucing! 🍼"
                    : "Meong~ Aku kucing dewasa! 🐈",
                  "🔊",
                  2400,
                );
              }}
              onBoostGrowth={() => {
                playCatSound("chime", isKitten);
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
        </div>
      </footer>

      {showAccountSheet && (
        <AccountSheet
          initialAccount={playerAccount}
          onAccountChange={handleAccountChange}
          onClose={() => setShowAccountSheet(false)}
        />
      )}

      {showSettingsSheet && (
        <SettingsSheet onClose={() => setShowSettingsSheet(false)} />
      )}
    </main>
  );
}
