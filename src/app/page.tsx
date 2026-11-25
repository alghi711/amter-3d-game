"use client";

import dynamic from "next/dynamic";
import { useCallback, useEffect, useRef, useState } from "react";
import { INITIAL_CAT_STATS, mockCat } from "@/lib/mock-cat";
import { useInputKind } from "@/lib/use-input-kind";
import { pickReaction } from "@/lib/cat-reactions";
import type { CatTouch } from "@/components/room/CatRoomScene";
import { ANIM_LABELS, type CatAnimState } from "@/lib/cat-animation";
import { type HouseSpot } from "@/components/room/CatHouse";
import CarePanel from "@/components/care/CarePanel";
import CareStatusPanel from "@/components/care/CareStatusPanel";
import AutosaveBackupSheet, { AutosaveStatusPill } from "@/components/save/AutosaveBackupSheet";
import { clearLocalAutosave, type GameSaveSnapshot } from "@/lib/mock-saves";
import { useAutosave } from "@/lib/use-autosave";
import { FloatingGentleReminder } from "@/components/mood/GentleReminderBanner";
import { CompactGrowthBadge } from "@/components/growth/ExperienceStageIndicator";
import { evaluateAchievementBadges } from "@/components/growth/BadgeCollectionGallery";
import BadgeUnlockToast from "@/components/growth/BadgeUnlockToast";
import GrowthSheet from "@/components/growth/GrowthSheet";
import MoodRoutineSheet from "@/components/mood/MoodRoutineSheet";
import AccountSheet from "@/components/account/AccountSheet";
import SettingsSheet from "@/components/settings/SettingsSheet";
import CareGuideSheet from "@/components/help/CareGuideSheet";
import { useGameSettings } from "@/lib/use-game-settings";
import { usePlayerAccount } from "@/lib/use-player-account";
import type { PlayerAccount } from "@/lib/mock-account";
import { computeGrowthProgress, type GrowthStage, type MockAchievement } from "@/lib/mock-growth";
import { buildGentleReminders, deriveCatMood, evaluateMoodShift, getActiveRoutine, type CatMood, type MoodTransition } from "@/lib/mock-mood";
import { CARE_ACTIONS, getRefusalReason, MEAL_ITEMS, TOY_ITEMS, useCare, type CareAction, type MealItem, type ToyItem } from "@/lib/use-care";
import { applyTimeDecay } from "@/lib/care-rules";
import { playCatSound, playSoundForCareAction, startBackgroundMusic, stopBackgroundMusic, type SoundEffectType } from "@/lib/cat-audio";
import { LIGHTING_PRESETS, type LightingMode } from "@/lib/procedural-textures";
import type { QualityLevel } from "@/lib/quality";

const CatRoomScene = dynamic(() => import("@/components/room/CatRoomScene"), {
  ssr: false,
  loading: () => (
    <div className="flex h-full items-center justify-center text-amber-700 font-semibold">Menyiapkan kamar hangat Amter…</div>
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
  const [showHelpSheet, setShowHelpSheet] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showLoadingScreen, setShowLoadingScreen] = useState(true);
  const [loadingProgress, setLoadingProgress] = useState(15);
  const [showStartMenu, setShowStartMenu] = useState(true);
  const [cloudTransition, setCloudTransition] = useState<"idle" | "closing" | "opening">("idle");
  const [logoBounce, setLogoBounce] = useState(false);
  const [logoFallback, setLogoFallback] = useState(false);
  const [topCardMinimized, setTopCardMinimized] = useState(true);
  const [bottomBarMinimized, setBottomBarMinimized] = useState(false);
  const [hideHintBanner, setHideHintBanner] = useState(false);

  useEffect(() => {
    const t1 = setTimeout(() => setLoadingProgress(65), 250);
    const t2 = setTimeout(() => setLoadingProgress(100), 600);
    const t3 = setTimeout(() => setShowLoadingScreen(false), 950);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, []);
  const { account: playerAccount, saveAccount: setPlayerAccount, logoutToGuest } = usePlayerAccount();
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

  const resetProgressToFresh = useCallback(() => {
    clearLocalAutosave();
    const freshGuest = logoutToGuest();
    setExperience(0);
    setCloseness(10);
    setStageOverride(null);
    setMoodOverride(null);
    replaceStats({ ...INITIAL_CAT_STATS });
    playCatSound("meow", true);
    triggerVoiceBubble("Miuw~ Mulai dari awal (Lv.1)! 🐾", "🐱", 2500);
    setToast(`Progres direset ke awal (Lv.1 · 0 XP) sebagai ${freshGuest.name} ✨`);
  }, [logoutToGuest, replaceStats, triggerVoiceBubble]);

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
        setShowHelpSheet(false);
        setMobileMenuOpen(false);
      }
    };
    window.addEventListener("keydown", handleGlobalKeyDown);
    return () => window.removeEventListener("keydown", handleGlobalKeyDown);
  }, []);

  const [foodFill, setFoodFill] = useState(MEAL_ITEMS.makan[0].fillColor);
  const [waterFill, setWaterFill] = useState(MEAL_ITEMS.minum[0].fillColor);
  const [bathing, setBathing] = useState(false);
  const [superHappy, setSuperHappy] = useState(false);
  const [amterFoodCooldownUntil, setAmterFoodCooldownUntil] = useState<number>(0);
  const [litterDirty, setLitterDirty] = useState(true);
  const [toyColor, setToyColor] = useState(TOY_ITEMS[0].color);

  const handleHydrateSave = useCallback(
    (saved: GameSaveSnapshot) => {
      setExperience(saved.experience);
      setCloseness(saved.closeness);
      if (saved.stats) {
        const lastMs = saved.savedAtMs || Date.now();
        const elapsedMinutes = Math.max(0, (Date.now() - lastMs) / 60_000);
        const decayed = applyTimeDecay(saved.stats, lastMs, Date.now());
        replaceStats(decayed);
        if (elapsedMinutes >= 2) {
          const minsLabel =
            elapsedMinutes >= 60
              ? `${Math.round(elapsedMinutes / 60)} jam`
              : `${Math.round(elapsedMinutes)} menit`;
          if (decayed.hygiene < 45 || decayed.hunger < 45 || decayed.happiness < 40) {
            setLitterDirty(true);
            setToast(`😾 Ditinggal ${minsLabel}: ${saved.catName} lapar, kotor, dan badmood!`);
          } else {
            setToast(`Selamat datang kembali setelah ${minsLabel}! Kondisi ${saved.catName} diperbarui 🐾`);
          }
        } else {
          setToast(`Selamat datang kembali! Kondisi ${saved.catName} dilanjutkan dari sesi terakhir 🐾`);
        }
      }
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

  // Penurunan alami (Live Decay) saat aplikasi dibiarkan terbuka tanpa dirawat
  useEffect(() => {
    const intervalId = setInterval(() => {
      perform({
        effect: {
          hunger: -1.8,
          thirst: -2.0,
          hygiene: -1.5,
          happiness: -1.8,
          energy: -1.0,
        },
        label: "Waktu berlalu",
        icon: "⏳",
      });
    }, 18_000);
    return () => clearInterval(intervalId);
  }, [perform]);

  // Saat kebersihan turun drastis karena lama ditinggal, kucing mengeluh badmood
  const prevMoodRef = useRef<CatMood>("senang");
  useEffect(() => {
    const currentMood = deriveCatMood(stats, simulatedHour, moodOverride).mood;
    if (currentMood === "badmood" && prevMoodRef.current !== "badmood" && !showStartMenu) {
      playCatSound("meow", growth.stage === "anak");
      const t = setTimeout(() => {
        setLitterDirty(true);
        triggerVoiceBubble("Hmph! Aku lapar, kotor & badmood karena lama ditinggal! 😾💢", "😾", 4200);
        spawnFloatingReaction("😾 Amter Badmood & Kotor! Yuk beri makan & mandikan!");
      }, 20);
      prevMoodRef.current = currentMood;
      return () => clearTimeout(t);
    }
    prevMoodRef.current = currentMood;
  }, [stats, simulatedHour, moodOverride, showStartMenu, growth.stage, triggerVoiceBubble, spawnFloatingReaction]);

  const simulateLeftAlone = useCallback(() => {
    setLitterDirty(true);
    setMoodOverride(null);
    replaceStats({
      hunger: 22,
      thirst: 25,
      hygiene: 24,
      happiness: 20,
      energy: 38,
    });
    playCatSound("meow", growth.stage === "anak");
    triggerVoiceBubble("Meooong!! Lama banget ditinggal, aku laper & kotor! 😾💢", "😾", 4500);
    spawnFloatingReaction("😾 Ditinggal Lama: Amter Lapar, Kotor & Badmood!");
    setToast(`Simulasi ditinggal lama: ${cat.name} kini kelaparan, kotor, dan badmood! 😾`);
  }, [cat.name, growth.stage, replaceStats, triggerVoiceBubble, spawnFloatingReaction]);

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

  const toggleGrowthStage = () => {
    const nextStage: GrowthStage = growth.stage === "anak" ? "dewasa" : "anak";
    const nextIsKitten = nextStage === "anak";
    setStageOverride(nextStage);
    playCatSound("chime", nextIsKitten);
    setTimeout(() => playCatSound("happy_meow", nextIsKitten), 220);
    triggerVoiceBubble(
      nextIsKitten ? "Miuw~ Amter jadi mungil banget! 🍼" : "Meong~ Amter tumbuh dewasa! 🐈",
      "🌱",
      2600,
    );
    spawnFloatingReaction(nextIsKitten ? "🍼 Mode Anak Kucing Mungil!" : "🐈 Mode Kucing Dewasa!");
    setToast(nextIsKitten ? "Amter berganti ke Anak Kucing (0.46x) 🍼" : "Amter berganti ke Kucing Dewasa (0.68x) 🐈");
  };

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
    const isAmterFood = item.id === "amter_food";
    if (isAmterFood) {
      const now = Date.now();
      if (amterFoodCooldownUntil > now) {
        const secLeft = Math.ceil((amterFoodCooldownUntil - now) / 1000);
        const mins = Math.floor(secLeft / 60);
        const secs = secLeft % 60;
        playCatSound("meow", isKitten);
        triggerVoiceBubble(`Tunggu ${mins}:${String(secs).padStart(2, "0")} lagi ya~ ⏳`, "👑", 2400);
        setToast(`Amter Food masih cooldown (${mins}m ${secs}d) ⏳`);
        return;
      }
      setAmterFoodCooldownUntil(now + (item.cooldownMs ?? 120_000));
      perform({ effect: item.effect, label: item.label, icon: item.icon, action: item.action, itemType: item.id });
      playCatSound("chime", isKitten);
      setTimeout(() => playCatSound("purr_meow", isKitten), 280);
      setFoodFill(item.fillColor);
      setSpot(null);
      setSuperHappy(true);
      setTimeout(() => setSuperHappy(false), 6000);
      setExperience((xp) => xp + 17);
      setCloseness((c) => Math.min(100, c + 4));
      triggerVoiceBubble("Yaaay!! Amter Food terenak di dunia!! 😻👑✨", "👑", 4800);
      spawnFloatingReaction("👑 AMTER FOOD! Semua Stat Penuh · +25 XP · Happy Dance! ✨");
      recordMoodFromEffect(item.effect, item.label, `${cat.name} ${item.message}`);
      return;
    }

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
      playCatSound("purr", isKitten);
      triggerVoiceBubble("Prrrrr~ Amter mendengur manja! 💕", "🔊", 2500);
      spawnFloatingReaction("💞 Purrr~ +8 Ceria · +8 XP");
      const eff = { happiness: 8 };
      perform({ effect: eff, label: `Elus ${t.part}`, icon: "💕", action: "main", itemType: "elus" });
      recordMoodFromEffect(eff, `Elus ${t.part}`, reactionText);
    } else {
      playCatSound("purr_meow", isKitten);
      triggerVoiceBubble("Prrrrr~ Meong! 💕", "🔊", 2400);
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
    spawnFloatingReaction("🐾 Amter menoleh & mengeong kencang~");
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
      triggerVoiceBubble("Meong~ Suara aktif kencang! ♪", "🔊", 2000);
      setToast("Efek suara kucing diaktifkan (100%) 🔊");
    } else {
      setToast("Efek suara kucing dibisukan 🔇");
    }
  };

  const toggleMusic = () => {
    const next = !settings.musicEnabled;
    updateSettings({ musicEnabled: next });
    playCatSound("pop", isKitten);
    if (next) {
      startBackgroundMusic();
      triggerVoiceBubble("Melodi kamar santai aktif! 🎵", "🎶", 2200);
      spawnFloatingReaction("🎵 BGM Kamar Santai Aktif (Kencang & Hangat)");
      setToast("Musik Latar (BGM) diputar kencang 🎵");
    } else {
      stopBackgroundMusic();
      triggerVoiceBubble("Musik kamar santai dijeda ⏸️", "🔇", 2000);
      spawnFloatingReaction("⏸️ BGM Dijeda");
      setToast("Musik Latar (BGM) dijeda ⏸️");
    }
  };

  const useObject = (s: HouseSpot) => {
    if (s === "foodBowl") {
      serveMeal(MEAL_ITEMS.makan[1] ?? MEAL_ITEMS.makan[0]);
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
          superHappy={superHappy}
          dirty={stats.hygiene < 45}
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

      {/* ================= 1. LOADING SCREEN OVERLAY ================= */}
      {showLoadingScreen && (
        <div
          id="loading-screen"
          className={`fixed inset-0 z-[70] flex flex-col items-center justify-center bg-[#fdf3de] p-6 transition-all duration-500 ${
            loadingProgress >= 100 ? "scale-105 opacity-0 pointer-events-none" : "opacity-100"
          }`}
        >
          <div className="mb-4 flex h-40 w-40 animate-bounce items-center justify-center">
            {/* Ilustrasi SVG Kucing Amter saat Loading */}
            <svg className="h-full w-full drop-shadow-md" viewBox="0 0 240 240" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="120" cy="120" r="105" fill="#FCE7C2" stroke="#F59E0B" strokeWidth="4" />
              {/* Ears */}
              <polygon points="74,98 64,54 102,76" fill="#D95F25" />
              <polygon points="77,94 70,63 97,78" fill="#F47C7C" />
              <polygon points="166,98 176,54 138,76" fill="#D95F25" />
              <polygon points="163,94 170,63 143,78" fill="#F47C7C" />
              {/* Body */}
              <ellipse cx="120" cy="162" rx="46" ry="42" fill="#D95F25" />
              <ellipse cx="120" cy="166" rx="33" ry="30" fill="#FFF3DC" />
              {/* Tulisan Amter di tengah perut */}
              <text x="120" y="168" textAnchor="middle" fontWeight="700" fontSize="18" fill="#632B12">Amter</text>
              {/* Head */}
              <ellipse cx="120" cy="108" rx="50" ry="39" fill="#D95F25" />
              <rect x="112" y="72" width="16" height="5" rx="2.5" fill="#7C2D12" />
              <rect x="110" y="80" width="20" height="5" rx="2.5" fill="#7C2D12" />
              {/* Eyes */}
              <circle cx="99" cy="106" r="7" fill="#1F1209" />
              <circle cx="97" cy="103" r="2.5" fill="#FFFFFF" />
              <circle cx="141" cy="106" r="7" fill="#1F1209" />
              <circle cx="139" cy="103" r="2.5" fill="#FFFFFF" />
              {/* Cheeks & Muzzle */}
              <ellipse cx="84" cy="114" rx="7.5" ry="4.5" fill="#F47C7C" />
              <ellipse cx="156" cy="114" rx="7.5" ry="4.5" fill="#F47C7C" />
              <ellipse cx="114" cy="115" rx="7.5" ry="5" fill="#FFF3DC" />
              <ellipse cx="126" cy="115" rx="7.5" ry="5" fill="#FFF3DC" />
              <ellipse cx="120" cy="111" rx="4.5" ry="3" fill="#F47C7C" />
              {/* Collar & Gold Bell */}
              <path d="M82 135Q120 147 158 135" stroke="#DC2626" strokeWidth="8" strokeLinecap="round" />
              <circle cx="120" cy="143" r="8.5" fill="#FBBF24" stroke="#B45309" strokeWidth="1.5" />
            </svg>
          </div>

          <h1 className="mb-1 text-3xl font-extrabold tracking-wide text-amber-900">
            AMTER
          </h1>
          <p id="loading-status-text" className="mb-4 text-xs font-bold text-amber-700">
            {loadingProgress < 60
              ? "Menyiapkan kamar hangat Amter..."
              : loadingProgress < 100
                ? "Merapikan kasur & mainan bola benang..."
                : "Siap bermain bersama Amter! 🐾"}
          </p>

          <div className="h-3 w-64 overflow-hidden rounded-full border border-amber-300 bg-amber-200/80 shadow-inner">
            <div
              id="loading-bar-fill"
              className="h-full rounded-full bg-gradient-to-r from-amber-500 to-orange-500 transition-all duration-300"
              style={{ width: `${loadingProgress}%` }}
            />
          </div>
        </div>
      )}

      {/* ================= ANIMASI TRANSISI TIRAI AWAN (CLOUD CURTAIN) ================= */}
      {cloudTransition !== "idle" && (
        <div
          aria-hidden="true"
          className="pointer-events-none fixed inset-0 z-50 overflow-hidden"
        >
          {/* Lapisan Awan Kiri */}
          <div
            className={`absolute inset-y-0 left-0 flex w-[62%] items-center justify-end transition-transform duration-500 ease-in-out ${
              cloudTransition === "closing" ? "translate-x-0" : "-translate-x-full"
            }`}
          >
            <div className="relative h-[130%] w-full rounded-r-[120px] bg-gradient-to-r from-[#fff8ec] via-[#fffdf9] to-[#fef3dc] shadow-2xl">
              <div className="absolute -right-14 top-[8%] h-44 w-44 rounded-full bg-[#fffdf9] shadow-lg" />
              <div className="absolute -right-20 top-[32%] h-56 w-56 rounded-full bg-[#fffaf0] shadow-lg" />
              <div className="absolute -right-16 top-[58%] h-52 w-52 rounded-full bg-[#fffdf9] shadow-lg" />
              <div className="absolute -right-12 bottom-[6%] h-44 w-44 rounded-full bg-[#fef5e4] shadow-lg" />
              <span className="absolute right-12 top-[22%] text-4xl opacity-80">☁️</span>
              <span className="absolute right-20 bottom-[25%] text-3xl opacity-75">✨</span>
            </div>
          </div>

          {/* Lapisan Awan Kanan */}
          <div
            className={`absolute inset-y-0 right-0 flex w-[62%] items-center justify-start transition-transform duration-500 ease-in-out ${
              cloudTransition === "closing" ? "translate-x-0" : "translate-x-full"
            }`}
          >
            <div className="relative h-[130%] w-full rounded-l-[120px] bg-gradient-to-l from-[#fff8ec] via-[#fffdf9] to-[#fef3dc] shadow-2xl">
              <div className="absolute -left-14 top-[10%] h-44 w-44 rounded-full bg-[#fffdf9] shadow-lg" />
              <div className="absolute -left-20 top-[35%] h-56 w-56 rounded-full bg-[#fffaf0] shadow-lg" />
              <div className="absolute -left-16 top-[60%] h-52 w-52 rounded-full bg-[#fffdf9] shadow-lg" />
              <div className="absolute -left-12 bottom-[8%] h-44 w-44 rounded-full bg-[#fef5e4] shadow-lg" />
              <span className="absolute left-12 top-[26%] text-4xl opacity-80">☁️</span>
              <span className="absolute left-20 bottom-[22%] text-3xl opacity-75">🐾</span>
            </div>
          </div>

          {/* Emblem Tengah Saat Awan Menutup */}
          <div
            className={`absolute inset-0 flex flex-col items-center justify-center transition-all duration-300 ${
              cloudTransition === "closing" ? "scale-100 opacity-100" : "scale-75 opacity-0"
            }`}
          >
            <div className="flex flex-col items-center gap-2 rounded-3xl border-2 border-amber-300 bg-white/95 px-6 py-4 shadow-2xl">
              <div className="flex items-center gap-2 text-3xl animate-bounce">
                <span>☁️</span>
                <span>🐱</span>
                <span>☁️</span>
              </div>
              <span className="text-xs font-extrabold tracking-wide text-amber-800 uppercase">
                Membuka Kamar Amter…
              </span>
            </div>
          </div>
        </div>
      )}

      {/* ================= 2. HOMEPAGE START MENU OVERLAY ================= */}
      {showStartMenu && (
        <div
          id="start-menu-overlay"
          className={`fixed inset-0 z-40 flex flex-col items-center justify-center overflow-hidden bg-stone-950/60 p-4 backdrop-blur-md transition-all duration-500 ${
            cloudTransition === "closing" ? "scale-95 opacity-0" : "scale-100 opacity-100"
          }`}
        >
          {/* Dekorasi Awan & Bintang Melayang di Latar Menu */}
          <div className="pointer-events-none absolute inset-0 overflow-hidden">
            <div className="animate-cloud-slow absolute top-[8%] left-[6%] text-5xl sm:text-6xl opacity-45 select-none">☁️</div>
            <div className="animate-cloud-reverse absolute top-[14%] right-[8%] text-4xl sm:text-5xl opacity-40 select-none">☁️</div>
            <div className="animate-cloud-slow absolute bottom-[12%] left-[10%] text-4xl sm:text-5xl opacity-35 select-none">☁️</div>
            <div className="animate-cloud-reverse absolute bottom-[16%] right-[7%] text-5xl sm:text-6xl opacity-40 select-none">☁️</div>
            <div className="animate-sparkle absolute top-[22%] left-[18%] text-2xl opacity-75 select-none">✨</div>
            <div className="animate-sparkle absolute top-[26%] right-[16%] text-xl opacity-70 select-none">🐾</div>
            <div className="animate-sparkle absolute bottom-[26%] left-[16%] text-xl opacity-70 select-none">🧶</div>
            <div className="animate-sparkle absolute bottom-[22%] right-[18%] text-2xl opacity-75 select-none">⭐</div>
          </div>

          <div className="animate-mochi-card relative flex w-full max-w-[380px] flex-col items-center rounded-[32px] border-2 border-amber-200/90 bg-[#fffcf6]/95 p-6 sm:p-7 text-center shadow-[0_24px_60px_-12px_rgba(45,28,16,0.45)] backdrop-blur-xl">
            {/* Logo Container: Chibi AMTER Logo SVG (Dengan tulisan Amter di perut) */}
            <button
              type="button"
              onClick={() => {
                playCatSound("meow", isKitten);
                setLogoBounce(true);
                setTimeout(() => setLogoBounce(false), 600);
              }}
              title="Ketuk untuk menyapa Amter!"
              className={`animate-mochi-logo group relative mb-3 flex h-52 w-52 cursor-pointer items-center justify-center overflow-hidden rounded-3xl border-2 border-amber-300/80 bg-[#fdf3de] p-1.5 shadow-inner transition-transform ${
                logoBounce ? "scale-105" : "hover:scale-[1.03]"
              }`}
            >
              {/* Embedded Chibi AMTER Logo SVG (Dengan tulisan Amter di perut) */}
              <svg id="fallback-svg-logo" className="h-full w-full" viewBox="0 0 260 260" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect width="260" height="260" rx="28" fill="#FDF3DE" />
                {/* Sparkles & Paws */}
                <path d="M38 78L41 86L49 89L41 92L38 100L35 92L27 89L35 86L38 78Z" fill="#F59E0B" opacity="0.75" />
                <path d="M218 68L221 75L228 78L221 81L218 88L215 81L208 78L215 75L218 68Z" fill="#F59E0B" opacity="0.75" />
                {/* 3D Title Text AMTER */}
                <text x="130" y="54" textAnchor="middle" fontWeight="700" fontSize="44" fill="#632B12" stroke="#632B12" strokeWidth="6" letterSpacing="1">AMTER</text>
                <text x="130" y="50" textAnchor="middle" fontWeight="700" fontSize="44" fill="#F97316" stroke="#7C2D12" strokeWidth="2" letterSpacing="1">AMTER</text>
                <text x="130" y="74" textAnchor="middle" fontWeight="600" fontSize="14.5" fill="#5C2810" letterSpacing="0.6">🐾 Kucing Virtual 3D 🐾</text>
                {/* Floor Shadow */}
                <ellipse cx="130" cy="232" rx="68" ry="11" fill="#E6CFA8" />
                {/* Tail */}
                <path d="M90 212C68 210 64 188 76 178C84 172 92 182 90 192" stroke="#B84318" strokeWidth="16" strokeLinecap="round" />
                {/* Body */}
                <ellipse cx="126" cy="184" rx="48" ry="44" fill="#D95F25" />
                {/* Cream Belly Patch */}
                <ellipse cx="126" cy="188" rx="34" ry="31" fill="#FFF3DC" />
                {/* Cute "Amter" Text on Belly (Di atas kaki agar tidak tertutup) */}
                <text x="126" y="186" textAnchor="middle" fontWeight="700" fontSize="20" fill="#5A2711">Amter</text>
                {/* Paws */}
                <ellipse cx="98" cy="219" rx="11" ry="12" fill="#FFF3DC" />
                <ellipse cx="154" cy="219" rx="11" ry="12" fill="#FFF3DC" />
                {/* Ears */}
                <polygon points="82,120 72,80 108,100" fill="#D95F25" />
                <polygon points="85,116 78,88 103,102" fill="#F47C7C" />
                <polygon points="170,120 180,80 144,100" fill="#D95F25" />
                <polygon points="167,116 174,88 149,102" fill="#F47C7C" />
                {/* Head */}
                <ellipse cx="126" cy="128" rx="52" ry="40" fill="#D95F25" />
                {/* Forehead Stripes */}
                <rect x="118" y="92" width="16" height="5" rx="2.5" fill="#7C2D12" />
                <rect x="115" y="100" width="22" height="5.5" rx="2.5" fill="#7C2D12" />
                {/* Glossy Eyes */}
                <circle cx="104" cy="126" r="7.5" fill="#180E09" />
                <circle cx="101.5" cy="123.5" r="2.6" fill="#FFFFFF" />
                <circle cx="106" cy="128.5" r="1.3" fill="#FFFFFF" />
                <circle cx="148" cy="126" r="7.5" fill="#180E09" />
                <circle cx="145.5" cy="123.5" r="2.6" fill="#FFFFFF" />
                <circle cx="150" cy="128.5" r="1.3" fill="#FFFFFF" />
                {/* Rosy Cheeks */}
                <ellipse cx="88" cy="134" rx="8" ry="4.5" fill="#F47C7C" />
                <ellipse cx="164" cy="134" rx="8" ry="4.5" fill="#F47C7C" />
                {/* Whiskers */}
                <line x1="70" y1="130" x2="80" y2="132" stroke="#FFF8EE" strokeWidth="2.5" strokeLinecap="round" />
                <line x1="70" y1="138" x2="80" y2="136" stroke="#FFF8EE" strokeWidth="2.5" strokeLinecap="round" />
                <line x1="182" y1="130" x2="172" y2="132" stroke="#FFF8EE" strokeWidth="2.5" strokeLinecap="round" />
                <line x1="182" y1="138" x2="172" y2="136" stroke="#FFF8EE" strokeWidth="2.5" strokeLinecap="round" />
                {/* Muzzle & Pink Nose */}
                <ellipse cx="119" cy="135" rx="8.5" ry="5.5" fill="#FFF3DC" />
                <ellipse cx="133" cy="135" rx="8.5" ry="5.5" fill="#FFF3DC" />
                <ellipse cx="126" cy="130" rx="5" ry="3.5" fill="#F47C7C" />
                {/* Red Collar & Gold Bell */}
                <path d="M86 154Q126 166 166 154" stroke="#DC2626" strokeWidth="9" strokeLinecap="round" />
                <circle cx="126" cy="162" r="9.5" fill="#FBBF24" stroke="#B45309" strokeWidth="1.5" />
                <circle cx="126" cy="164" r="2.2" fill="#451A03" />
                {/* Yarn Ball */}
                <circle cx="186" cy="210" r="19" fill="#EAB308" stroke="#A16207" strokeWidth="2" />
                <path d="M172 204C182 198 194 202 200 212" stroke="#A16207" strokeWidth="2.5" strokeLinecap="round" />
                <path d="M174 218C184 210 192 214 198 200" stroke="#A16207" strokeWidth="2.5" strokeLinecap="round" />
              </svg>
            </button>

            <span className="mb-2 rounded-full border border-amber-200 bg-amber-100 px-3 py-1 text-[11px] font-extrabold tracking-wide text-amber-800 uppercase">
              ✨ Virtual Pet Simulator 3D
            </span>

            <p className="mb-5 px-2 text-xs leading-relaxed font-semibold text-stone-600">
              Rawat, beri makan, dan mandikan <strong className="text-amber-800">Amter</strong>! Kalau lama ditinggal, Amter bisa kelaparan, kotor, dan <em>badmood</em>.
            </p>

            {/* Menu Buttons */}
            <div className="w-full space-y-2.5">
              <button
                type="button"
                disabled={cloudTransition !== "idle"}
                onClick={() => {
                  playCatSound("chime", isKitten);
                  if (settings.musicEnabled) {
                    startBackgroundMusic();
                  }
                  setCloudTransition("closing");
                  setTimeout(() => {
                    setShowStartMenu(false);
                    setCloudTransition("opening");
                    playCatSound("purr_meow", isKitten);
                    const curMood = deriveCatMood(stats, simulatedHour, moodOverride).mood;
                    if (curMood === "badmood") {
                      triggerVoiceBubble("Hmph! Kamu baru balik, aku laper & kotor tau! 😾💢", "😾", 3800);
                      spawnFloatingReaction("😾 Amter Badmood karena lama ditinggal!");
                    } else {
                      triggerVoiceBubble("Meong~ Aku Amter! ♪", "🐱", 2800);
                      spawnFloatingReaction("☁️ Selamat datang di Kamar Amter! ✨");
                    }
                  }, 480);
                  setTimeout(() => {
                    setCloudTransition("idle");
                  }, 1050);
                }}
                className="group relative flex w-full transform items-center justify-center gap-2 overflow-hidden rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 py-3.5 text-base font-extrabold text-white shadow-lg shadow-amber-500/30 transition hover:scale-[1.02] hover:from-amber-600 hover:to-orange-600 active:scale-95"
              >
                <span className="animate-shimmer pointer-events-none absolute inset-y-0 left-0 w-1/3 bg-gradient-to-r from-transparent via-white/35 to-transparent" />
                <span>▶️</span>
                <span>PLAY GAME</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  playCatSound("pop", isKitten);
                  setShowSettingsSheet(true);
                }}
                className="flex w-full transform items-center justify-center gap-2 rounded-2xl border border-stone-200/90 bg-stone-100 py-3 text-sm font-extrabold text-stone-700 transition hover:scale-[1.01] hover:bg-stone-200/80 active:scale-95"
              >
                <span>⚙️</span>
                <span>SETTINGS</span>
              </button>
            </div>

            <div id="offline-welcome-banner" className="mt-4 text-[11px] font-semibold text-stone-400">
              Progres & waktu ditinggal tersimpan otomatis
            </div>
          </div>
        </div>
      )}

      {/* ================= 3. TOP NAVIGATION BAR (MUAT PAS DI LAYAR HP TANPA TERPOTONG) ================= */}
      <header
        className={`pointer-events-none fixed top-3 left-2.5 right-2.5 z-20 flex flex-col items-start gap-2 transition-all duration-500 ${
          showStartMenu ? "pointer-events-none translate-y-3 scale-95 opacity-0" : "opacity-100"
        }`}
      >
        <div className="pointer-events-auto flex w-full items-center justify-between gap-1">
          {/* Pill Profil Kiri Atas: 🐱 Amter Lv.X · ▼ Info */}
          <button
            type="button"
            onClick={() => {
              playCatSound("pop", isKitten);
              setTopCardMinimized((v) => !v);
            }}
            className="flex shrink-0 items-center gap-1.5 rounded-full border border-white/90 bg-[#fffcf7]/95 px-3 py-1.5 shadow-md backdrop-blur-md transition hover:-translate-y-0.5 active:scale-95"
          >
            <span className="text-sm sm:text-base">{deriveCatMood(stats, simulatedHour, moodOverride).emoji}</span>
            <span className="text-xs sm:text-sm font-extrabold text-stone-800">{cat.name}</span>
            <span className="rounded-full bg-amber-100 px-1.5 py-0.5 text-[11px] font-extrabold text-amber-800">
              Lv.{growth.level}
            </span>
            <span className="ml-0.5 flex flex-col items-center text-[9px] leading-none font-bold text-stone-500">
              <span>{topCardMinimized ? "▼" : "▲"}</span>
              <span>Info</span>
            </span>
          </button>

          {/* Deretan Tombol Bulat & Menu Kanan Atas */}
          <div className="flex shrink-0 items-center gap-1 sm:gap-1.5">
            <button
              type="button"
              onClick={() => {
                playCatSound("pop", isKitten);
                setCloudTransition("closing");
                setTimeout(() => {
                  setShowStartMenu(true);
                  setCloudTransition("opening");
                }, 420);
                setTimeout(() => {
                  setCloudTransition("idle");
                }, 900);
              }}
              className="flex h-8 w-8 sm:h-10 sm:w-10 items-center justify-center rounded-full border border-white/90 bg-[#fffcf7]/95 text-xs sm:text-base shadow-md backdrop-blur-md transition hover:-translate-y-0.5 active:scale-95"
              title="Homepage Menu"
            >
              🏠
            </button>
            <button
              type="button"
              onClick={cycleLightingMode}
              className="flex h-8 w-8 sm:h-10 sm:w-10 items-center justify-center rounded-full border border-white/90 bg-[#fffcf7]/95 text-xs sm:text-base shadow-md backdrop-blur-md transition hover:-translate-y-0.5 active:scale-95"
              title="Ganti Suasana Cahaya"
            >
              <span>{currentLighting.icon}</span>
            </button>
            <button
              type="button"
              onClick={toggleSound}
              className="flex h-8 w-8 sm:h-10 sm:w-10 items-center justify-center rounded-full border border-white/90 bg-[#fffcf7]/95 text-xs sm:text-base shadow-md backdrop-blur-md transition hover:-translate-y-0.5 active:scale-95"
              title="Suara Kucing"
            >
              {settings.soundEnabled ? "🔊" : "🔇"}
            </button>
            <button
              type="button"
              onClick={toggleMusic}
              className={`flex h-8 w-8 sm:h-10 sm:w-10 items-center justify-center rounded-full border text-xs sm:text-base shadow-md backdrop-blur-md transition hover:-translate-y-0.5 active:scale-95 ${
                settings.musicEnabled
                  ? "border-amber-400 bg-amber-100/90 text-amber-800 ring-2 ring-amber-300"
                  : "border-white/90 bg-[#fffcf7]/95 opacity-60 text-stone-400"
              }`}
              title={settings.musicEnabled ? "Musik Latar: Aktif (Klik untuk Jeda)" : "Musik Latar: Dijeda (Klik untuk Putar)"}
            >
              {settings.musicEnabled ? "🎵" : "🎶"}
            </button>
            <button
              type="button"
              onClick={() => {
                playCatSound("pop", isKitten);
                setMobileMenuOpen((v) => !v);
              }}
              className="flex h-8 sm:h-10 items-center gap-1 rounded-full bg-gradient-to-r from-amber-500 to-orange-500 px-2.5 sm:px-3.5 text-[11px] sm:text-xs font-extrabold text-white shadow-md transition hover:from-amber-600 hover:to-orange-600 active:scale-95"
              title="Buka Menu Fitur"
            >
              <span>☰</span>
              <span>Menu</span>
            </button>
          </div>
        </div>

        {/* Expandable Info Card (Muncul saat tombol "Amter Lv.X ▼ Info" diklik) */}
        {!topCardMinimized && (
          <div
            id="profile-detail-card"
            className="pointer-events-auto w-[300px] sm:w-[350px] rounded-2xl border border-white/90 bg-[#fffcf6]/95 p-3.5 shadow-xl backdrop-blur-md transition-all"
          >
            <div className="mb-2 flex items-center justify-between gap-2">
              <span className="flex items-center gap-1.5 text-xs font-extrabold text-stone-700">
                <span>✨ Status {cat.name}</span>
              </span>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => {
                    playCatSound("pop", isKitten);
                    setShowStatus(false);
                    setShowMoodSheet((v) => !v);
                  }}
                  className={`flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-bold transition ${deriveCatMood(stats, simulatedHour, moodOverride).badgeColor}`}
                >
                  <span>{deriveCatMood(stats, simulatedHour, moodOverride).label}</span>
                  <span>›</span>
                </button>
                <button
                  type="button"
                  onClick={() => setTopCardMinimized(true)}
                  className="flex h-5 w-5 items-center justify-center rounded-full bg-stone-100 text-[10px] font-bold text-stone-500 hover:bg-stone-200"
                  title="Tutup Info"
                >
                  ✕
                </button>
              </div>
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

            {/* Quick Toggle Stage: Anak Kucing (0.46x) <-> Dewasa (0.68x) */}
            <div className="mt-2 flex items-center justify-between gap-1.5 rounded-xl bg-amber-50/80 px-2.5 py-1.5 border border-amber-200/60">
              <div className="flex items-center gap-1.5 text-[11px] font-bold text-stone-700">
                <span>{growth.stage === "anak" ? "🍼" : "🐈"}</span>
                <span id="stage-label">{growth.stage === "anak" ? "Anak kucing (0.46x)" : "Tahap dewasa (0.68x)"}</span>
              </div>
              <button
                type="button"
                onClick={toggleGrowthStage}
                className="flex items-center gap-1 rounded-lg bg-amber-500 hover:bg-amber-600 px-2 py-0.5 text-[10px] font-extrabold text-white shadow-xs transition active:scale-95"
              >
                <span>🔄</span>
                <span>{growth.stage === "anak" ? "Jadikan Dewasa" : "Jadikan Mungil"}</span>
              </button>
            </div>

            <div className="mt-2 flex items-center justify-between text-[11px] font-semibold text-stone-600">
              <span className="flex items-center gap-1.5 text-amber-700">
                <span className="h-2 w-2 animate-pulse rounded-full bg-amber-500" />
                <span>{ANIM_LABELS[anim]}</span>
                <span>·</span>
                <button
                  type="button"
                  onClick={() => {
                    playCatSound("pop", isKitten);
                    setShowStatus(false);
                    setShowMoodSheet(true);
                  }}
                  className="hover:text-amber-800"
                >
                  {getActiveRoutine(simulatedHour).icon} {getActiveRoutine(simulatedHour).title}
                </button>
              </span>
              <span className="flex items-center gap-1 text-emerald-700">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                <span>Tersimpan</span>
              </span>
            </div>

            <div className="mt-2 flex items-center justify-between border-t border-stone-100 pt-1.5 text-[10px]">
              <button
                type="button"
                onClick={() => {
                  playCatSound("pop", isKitten);
                  setShowAccountSheet(true);
                }}
                className="inline-flex items-center gap-1 rounded-full border border-amber-300 bg-amber-50 px-2 py-0.5 font-bold text-amber-900"
              >
                <span>{playerAccount.avatar} {playerAccount.name}</span>
              </button>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={simulateLeftAlone}
                  className="font-bold text-amber-700 hover:text-rose-600"
                  title="Simulasikan ditinggal lama (Lapar, Kotor & Badmood)"
                >
                  ⏳ Tes Ditinggal
                </button>
                <button
                  type="button"
                  onClick={resetProgressToFresh}
                  className="font-semibold text-stone-400 hover:text-rose-600"
                >
                  🔄 Reset Lv.1
                </button>
              </div>
            </div>
          </div>
        )}
      </header>

      {/* Tombol Kompas Kamera & Elus Cepat di Kiri Bawah */}
      <div
        className={`pointer-events-auto fixed bottom-4 left-4 z-20 hidden items-center gap-2 transition-all duration-500 sm:flex ${
          showStartMenu ? "pointer-events-none translate-y-3 scale-95 opacity-0" : "opacity-100"
        }`}
      >
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
          title="Elus Amter Sekarang!"
        >
          🐾
        </button>
      </div>

      {/* Notifikasi Lencana & Pengingat Lembut di Tengah Atas */}
      <div
        className={`pointer-events-none absolute inset-x-0 top-24 flex flex-col items-center gap-2 px-4 transition-all duration-500 sm:top-5 ${
          showStartMenu ? "pointer-events-none translate-y-3 scale-95 opacity-0" : "opacity-100"
        }`}
      >
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
          !showSettingsSheet &&
          !showHelpSheet && (
            <FloatingGentleReminder
              reminders={buildGentleReminders(stats, cat.name, simulatedHour)}
              onQuickAction={doCare}
            />
          )
        )}
      </div>

      <footer
        className={`pointer-events-none absolute inset-x-0 bottom-0 flex flex-col items-center gap-1 px-2.5 pb-[max(0.5rem,env(safe-area-inset-bottom))] transition-all duration-500 sm:gap-1.5 sm:px-3 sm:pb-[max(0.75rem,env(safe-area-inset-bottom))] ${
          showStartMenu ? "pointer-events-none translate-y-3 scale-95 opacity-0" : "opacity-100"
        }`}
      >
        {!hideHintBanner && !bottomBarMinimized && (
          <div
            id="gesture-hint-pill"
            className="pointer-events-auto mb-1 flex w-full max-w-[460px] items-center justify-between gap-2 rounded-2xl border border-white/90 bg-[#fffcf6]/95 px-3.5 py-2 text-[11px] font-bold text-stone-600 shadow-md backdrop-blur-md"
          >
            <span className="flex-1 text-center leading-snug">
              {input === "sentuh"
                ? "Ketuk benda untuk dipakai · geser 1 jari putar kamera · cubit zoom"
                : "Klik benda untuk dipakai · seret mouse memutar kamera · scroll untuk zoom"}
            </span>
            <button
              type="button"
              onClick={() => setHideHintBanner(true)}
              className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-stone-200/80 text-xs font-extrabold text-stone-600 hover:bg-stone-300"
              title="Tutup petunjuk"
              aria-label="Tutup petunjuk"
            >
              ×
            </button>
          </div>
        )}
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
                const target = nextStage || (growth.stage === "anak" ? "dewasa" : "anak");
                const targetIsKitten = target === "anak";
                setStageOverride(target);
                playCatSound("chime", targetIsKitten);
                setTimeout(() => playCatSound("happy_meow", targetIsKitten), 220);
                triggerVoiceBubble(
                  targetIsKitten
                    ? "Miuw~ Amter jadi mungil banget! 🍼"
                    : "Meong~ Amter tumbuh dewasa! 🐈",
                  "🌱",
                  2600,
                );
                spawnFloatingReaction(
                  targetIsKitten ? "🍼 Mode Anak Kucing Mungil!" : "🐈 Mode Kucing Dewasa!"
                );
                setToast(
                  targetIsKitten
                    ? "Amter berganti ke Anak Kucing (0.46x) 🍼"
                    : "Amter berganti ke Kucing Dewasa (0.68x) 🐈"
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
              minimized={bottomBarMinimized}
              onToggleMinimize={() => setBottomBarMinimized((v) => !v)}
              amterFoodCooldownUntil={amterFoodCooldownUntil}
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

      {showHelpSheet && (
        <CareGuideSheet onClose={() => setShowHelpSheet(false)} />
      )}

      {/* Drawer / Sheet Menu Navigasi Mobile */}
      {mobileMenuOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Menu Navigasi Permainan Amter"
          className="fixed inset-0 z-50 flex items-end justify-center p-3 animate-in fade-in duration-200"
        >
          <div
            className="fixed inset-0 bg-stone-950/70 backdrop-blur-xs"
            onClick={() => setMobileMenuOpen(false)}
            aria-hidden="true"
          />
          <div className="relative z-10 w-full max-w-md rounded-3xl bg-[#fdfbf7] dark:bg-stone-900 p-5 shadow-2xl ring-1 ring-amber-900/10 space-y-4 animate-in slide-in-from-bottom duration-200">
            <div className="flex items-center justify-between border-b border-stone-200/80 dark:border-stone-800 pb-3">
              <div className="flex items-center gap-2">
                <span className="text-xl">🐱</span>
                <div>
                  <h3 className="font-bold text-sm text-stone-900 dark:text-white">Menu Navigasi Permainan</h3>
                  <p className="text-[10px] text-stone-500">{cat.name} Lv.{growth.level} ({experience} XP) • {playerAccount.name}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setMobileMenuOpen(false)}
                className="w-7 h-7 rounded-full bg-stone-100 dark:bg-stone-800 text-stone-500 flex items-center justify-center text-xs font-bold"
              >
                ✕
              </button>
            </div>

            {/* Quick Toggle Stage in Menu */}
            <button
              type="button"
              onClick={() => {
                setMobileMenuOpen(false);
                toggleGrowthStage();
              }}
              className="w-full p-3 rounded-2xl bg-amber-500/10 hover:bg-amber-500/20 dark:bg-amber-400/10 border border-amber-500/30 text-left flex items-center justify-between active:scale-95 transition"
            >
              <div className="flex items-center gap-2.5">
                <span className="text-2xl">{growth.stage === "anak" ? "🍼" : "🐈"}</span>
                <div>
                  <div className="text-xs font-bold text-amber-950 dark:text-amber-200">
                    Ukuran Amter: {growth.stage === "anak" ? "Anak Kucing (0.46x)" : "Dewasa (0.68x)"}
                  </div>
                  <div className="text-[10px] text-amber-700/80 dark:text-amber-400">
                    Ketuk untuk beralih ke {growth.stage === "anak" ? "Dewasa (0.68x)" : "Anak Mungil (0.46x)"}
                  </div>
                </div>
              </div>
              <span className="text-xs font-bold px-2.5 py-1 rounded-xl bg-amber-500 text-white shadow-xs">
                Ganti 🔄
              </span>
            </button>

            <div className="grid grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={() => {
                  setMobileMenuOpen(false);
                  setShowMoodSheet(true);
                }}
                className="p-3 rounded-2xl bg-amber-50 dark:bg-stone-800 border border-amber-200/70 dark:border-stone-700 text-left flex items-center gap-2.5 active:scale-95 transition"
              >
                <span className="text-xl">🦊</span>
                <div>
                  <div className="text-xs font-bold text-stone-800 dark:text-stone-200">Mood & Rutin</div>
                  <div className="text-[10px] text-stone-400">Emosi & Jam</div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => {
                  setMobileMenuOpen(false);
                  setShowGrowthSheet(true);
                }}
                className="p-3 rounded-2xl bg-emerald-50 dark:bg-stone-800 border border-emerald-200/70 dark:border-stone-700 text-left flex items-center gap-2.5 active:scale-95 transition"
              >
                <span className="text-xl">🌱</span>
                <div>
                  <div className="text-xs font-bold text-stone-800 dark:text-stone-200">Tumbuh Besar</div>
                  <div className="text-[10px] text-stone-400">XP & Lencana</div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => {
                  setMobileMenuOpen(false);
                  setShowAccountSheet(true);
                }}
                className="p-3 rounded-2xl bg-sky-50 dark:bg-stone-800 border border-sky-200/70 dark:border-stone-700 text-left flex items-center gap-2.5 active:scale-95 transition"
              >
                <span className="text-xl">👤</span>
                <div>
                  <div className="text-xs font-bold text-stone-800 dark:text-stone-200">Akun & Profil</div>
                  <div className="text-[10px] text-stone-400">Kode Pemulihan</div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => {
                  setMobileMenuOpen(false);
                  setShowSaveSheet(true);
                }}
                className="p-3 rounded-2xl bg-indigo-50 dark:bg-stone-800 border border-indigo-200/70 dark:border-stone-700 text-left flex items-center gap-2.5 active:scale-95 transition"
              >
                <span className="text-xl">☁️</span>
                <div>
                  <div className="text-xs font-bold text-stone-800 dark:text-stone-200">Autosave</div>
                  <div className="text-[10px] text-stone-400">Cadangan Cloud</div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => {
                  setMobileMenuOpen(false);
                  setShowSettingsSheet(true);
                }}
                className="p-3 rounded-2xl bg-stone-100 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-left flex items-center gap-2.5 active:scale-95 transition"
              >
                <span className="text-xl">⚙️</span>
                <div>
                  <div className="text-xs font-bold text-stone-800 dark:text-stone-200">Pengaturan</div>
                  <div className="text-[10px] text-stone-400">Grafis & Audio</div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => {
                  setMobileMenuOpen(false);
                  setShowHelpSheet(true);
                }}
                className="p-3 rounded-2xl bg-amber-50/60 dark:bg-stone-800 border border-amber-200/60 dark:border-stone-700 text-left flex items-center gap-2.5 active:scale-95 transition"
              >
                <span className="text-xl">📖</span>
                <div>
                  <div className="text-xs font-bold text-stone-800 dark:text-stone-200">Buku Panduan</div>
                  <div className="text-[10px] text-stone-400">Kiat Rawat Kucing</div>
                </div>
              </button>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-2 border-t border-stone-100 dark:border-stone-800 pt-2.5 text-xs">
              <button
                type="button"
                onClick={() => {
                  const nextMin = !(topCardMinimized && bottomBarMinimized);
                  setTopCardMinimized(nextMin);
                  setBottomBarMinimized(nextMin);
                  setMobileMenuOpen(false);
                }}
                className="text-stone-600 dark:text-stone-300 font-semibold flex items-center gap-1"
              >
                <span>👁️</span>
                <span>{topCardMinimized && bottomBarMinimized ? "Buka Semua Bar" : "Kecilkan Semua Bar"}</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  simulateLeftAlone();
                  setMobileMenuOpen(false);
                }}
                className="text-amber-700 dark:text-amber-400 font-bold flex items-center gap-1"
              >
                <span>😾</span>
                <span>Tes Ditinggal Lama</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  resetProgressToFresh();
                  setMobileMenuOpen(false);
                }}
                className="text-rose-600 dark:text-rose-400 font-bold flex items-center gap-1"
              >
                <span>🔄</span>
                <span>Reset ke Lv.1</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  callMochiVoice();
                  setMobileMenuOpen(false);
                }}
                className="text-amber-600 dark:text-amber-400 font-bold flex items-center gap-1"
              >
                <span>🐾</span>
                <span>Panggil</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
