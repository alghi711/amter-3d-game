"use client";

import { useState } from "react";
import Link from "next/link";
import { useGameSettings } from "@/lib/use-game-settings";
import { useAudioPlayer } from "@/lib/mock-audio-player";
import { GAME_FAQS, APP_INFO } from "@/lib/mock-settings";
import { playCatSound, type SoundEffectType } from "@/lib/cat-audio";
import QualitySelector from "./QualitySelector";

export type SettingsTab = "suara" | "grafis" | "preferensi" | "bantuan" | "tentang";

interface SettingsViewProps {
  onBackToGame?: () => void;
  isModal?: boolean;
}

export default function SettingsView({
  onBackToGame,
  isModal = false,
}: SettingsViewProps) {
  const { settings, updateSettings, resetSettings } = useGameSettings();
  const audioPlayer = useAudioPlayer();
  const [activeTab, setActiveTab] = useState<SettingsTab>("suara");
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [expandedFaq, setExpandedFaq] = useState<number | null>(0);
  const [faqSearch, setFaqSearch] = useState("");
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [showAudioLogs, setShowAudioLogs] = useState(false);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleTestSound = (type: SoundEffectType = "meow") => {
    audioPlayer.playSfx(type, settings.vocalPitch === "anak");
    showToast(`Memutar sampel suara '${type}'! 🐾`);
  };

  const filteredFaqs = GAME_FAQS.filter(
    (item) =>
      item.question.toLowerCase().includes(faqSearch.toLowerCase()) ||
      item.answer.toLowerCase().includes(faqSearch.toLowerCase())
  );

  const handleReset = () => {
    resetSettings();
    setShowResetConfirm(false);
    showToast("Semua pengaturan dikembalikan ke bawaan pabrik! 🔄");
  };

  return (
    <div className="relative flex flex-col w-full max-w-4xl mx-auto bg-stone-50/95 dark:bg-stone-900/95 backdrop-blur-md rounded-3xl shadow-2xl border border-stone-200 dark:border-stone-800 overflow-hidden text-stone-800 dark:text-stone-100 transition-all">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="absolute top-4 right-4 z-50 bg-stone-900/90 text-amber-300 border border-amber-500/40 px-4 py-2.5 rounded-2xl shadow-xl text-sm font-medium animate-in fade-in slide-in-from-top duration-200 flex items-center gap-2">
          <span>🐾</span>
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header */}
      <div className="px-6 py-5 bg-gradient-to-r from-amber-500/10 via-orange-500/10 to-amber-600/10 border-b border-stone-200 dark:border-stone-800 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center text-2xl shadow-inner">
            ⚙️
          </div>
          <div>
            <h2 className="text-xl font-bold tracking-tight text-stone-900 dark:text-white">
              Pengaturan Permainan
            </h2>
            <p className="text-xs text-stone-500 dark:text-stone-400">
              Sesuaikan audio, grafis 3D, dan preferensi kucing Mochi
            </p>
          </div>
        </div>

        {onBackToGame && (
          <button
            onClick={onBackToGame}
            type="button"
            className="px-3.5 py-1.5 rounded-xl bg-stone-200/70 hover:bg-stone-300 dark:bg-stone-800 dark:hover:bg-stone-700 text-stone-700 dark:text-stone-200 text-xs font-semibold transition flex items-center gap-1.5"
          >
            <span>✕</span>
            <span>{isModal ? "Tutup" : "Kembali ke Ruang"}</span>
          </button>
        )}
      </div>

      {/* Tab Navigation */}
      <div className="flex border-b border-stone-200 dark:border-stone-800 px-6 bg-stone-100/60 dark:bg-stone-900/40 overflow-x-auto no-scrollbar gap-2 py-2">
        {(
          [
            { id: "suara", label: "Suara & Musik", icon: "🔊" },
            { id: "grafis", label: "Grafis & Tampilan", icon: "🎨" },
            { id: "preferensi", label: "Preferensi", icon: "🎮" },
            { id: "bantuan", label: "Bantuan & FAQ", icon: "❓" },
            { id: "tentang", label: "Tentang Mochi", icon: "ℹ️" },
          ] as const
        ).map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              type="button"
              className={`px-3.5 py-2 rounded-xl text-xs font-medium transition flex items-center gap-2 whitespace-nowrap ${
                isActive
                  ? "bg-amber-500 text-white shadow-sm font-semibold"
                  : "text-stone-600 dark:text-stone-400 hover:bg-stone-200/60 dark:hover:bg-stone-800/60"
              }`}
            >
              <span>{tab.icon}</span>
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Body Content */}
      <div className="p-6 overflow-y-auto max-h-[72vh] space-y-6">
        {/* TAB 1: SUARA & MUSIK */}
        {activeTab === "suara" && (
          <div className="space-y-6 animate-in fade-in duration-200">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Master Sound Card */}
              <div className="p-4 rounded-2xl bg-white dark:bg-stone-800/80 border border-stone-200 dark:border-stone-700/60 shadow-sm flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-bold text-stone-900 dark:text-white">
                    Efek Suara (SFX)
                  </h4>
                  <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">
                    Suara meong, makan, langkah kaki, dan air
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    const next = !settings.soundEnabled;
                    updateSettings({ soundEnabled: next });
                    showToast(next ? "Suara diaktifkan! 🔊" : "Suara dinonaktifkan! 🔇");
                  }}
                  className={`w-14 h-7 flex items-center rounded-full p-1 cursor-pointer transition-colors duration-200 ${
                    settings.soundEnabled ? "bg-amber-500" : "bg-stone-300 dark:bg-stone-700"
                  }`}
                  aria-label="Toggle SFX"
                >
                  <div
                    className={`bg-white w-5 h-5 rounded-full shadow-md transform transition-transform duration-200 ${
                      settings.soundEnabled ? "translate-x-7" : "translate-x-0"
                    }`}
                  />
                </button>
              </div>

              {/* BGM Card */}
              <div className="p-4 rounded-2xl bg-white dark:bg-stone-800/80 border border-stone-200 dark:border-stone-700/60 shadow-sm flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-bold text-stone-900 dark:text-white">
                    Musik Latar (BGM)
                  </h4>
                  <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">
                    Melodi santai di dalam kamar kucing
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    const next = !settings.musicEnabled;
                    updateSettings({ musicEnabled: next });
                    showToast(next ? "Musik diaktifkan! 🎵" : "Musik dinonaktifkan! 🔇");
                  }}
                  className={`w-14 h-7 flex items-center rounded-full p-1 cursor-pointer transition-colors duration-200 ${
                    settings.musicEnabled ? "bg-amber-500" : "bg-stone-300 dark:bg-stone-700"
                  }`}
                  aria-label="Toggle Music"
                >
                  <div
                    className={`bg-white w-5 h-5 rounded-full shadow-md transform transition-transform duration-200 ${
                      settings.musicEnabled ? "translate-x-7" : "translate-x-0"
                    }`}
                  />
                </button>
              </div>
            </div>

            {/* Volume Sliders */}
            <div className="p-5 rounded-2xl bg-white dark:bg-stone-800/80 border border-stone-200 dark:border-stone-700/60 shadow-sm space-y-5">
              <div>
                <div className="flex justify-between items-center mb-2">
                  <label htmlFor="sfx-vol" className="text-xs font-semibold text-stone-700 dark:text-stone-300 flex items-center gap-1.5">
                    <span>📢</span>
                    <span>Volume Efek Suara: {settings.sfxVolume}%</span>
                  </label>
                  <span className="text-xs text-stone-400">
                    {settings.sfxVolume === 0 ? "Mute" : settings.sfxVolume > 70 ? "Keras" : "Sedang"}
                  </span>
                </div>
                <input
                  id="sfx-vol"
                  type="range"
                  min="0"
                  max="100"
                  step="5"
                  value={settings.sfxVolume}
                  disabled={!settings.soundEnabled}
                  onChange={(e) => updateSettings({ sfxVolume: Number(e.target.value) })}
                  className="w-full accent-amber-500 cursor-pointer disabled:opacity-40"
                />
              </div>

              <div>
                <div className="flex justify-between items-center mb-2">
                  <label htmlFor="bgm-vol" className="text-xs font-semibold text-stone-700 dark:text-stone-300 flex items-center gap-1.5">
                    <span>🎵</span>
                    <span>Volume Musik Latar: {settings.musicVolume}%</span>
                  </label>
                  <span className="text-xs text-stone-400">
                    {settings.musicVolume === 0 ? "Mute" : settings.musicVolume > 70 ? "Keras" : "Sedang"}
                  </span>
                </div>
                <input
                  id="bgm-vol"
                  type="range"
                  min="0"
                  max="100"
                  step="5"
                  value={settings.musicVolume}
                  disabled={!settings.musicEnabled}
                  onChange={(e) => updateSettings({ musicVolume: Number(e.target.value) })}
                  className="w-full accent-amber-500 cursor-pointer disabled:opacity-40"
                />
              </div>
            </div>

            {/* Vocal Tone & Test Sound */}
            <div className="p-5 rounded-2xl bg-amber-50/60 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800/40 space-y-4">
              <h4 className="text-sm font-bold text-amber-900 dark:text-amber-200 flex items-center gap-2">
                <span>🐱</span>
                <span>Karakter Nada Meong (Formant Synthesis)</span>
              </h4>
              <p className="text-xs text-amber-800/80 dark:text-amber-300/80">
                Pilih frekuensi nada vokal Mochi sesuai preferensi pendengaranmu.
              </p>

              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => {
                    updateSettings({ vocalPitch: "anak" });
                    playCatSound("meow", true);
                    showToast("Nada meong: Anak Kucing (Tinggi & Menggemaskan) 🐾");
                  }}
                  className={`p-3 rounded-xl border text-left transition ${
                    settings.vocalPitch === "anak"
                      ? "bg-amber-500 text-white border-amber-600 shadow-sm"
                      : "bg-white dark:bg-stone-800 border-stone-200 dark:border-stone-700 text-stone-700 dark:text-stone-300"
                  }`}
                >
                  <div className="font-bold text-xs">🐣 Anak Kucing</div>
                  <div className={`text-[10px] mt-0.5 ${settings.vocalPitch === "anak" ? "text-amber-100" : "text-stone-400"}`}>
                    Pitch tinggi, imut, ceria
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    updateSettings({ vocalPitch: "dewasa" });
                    playCatSound("meow", false);
                    showToast("Nada meong: Kucing Dewasa (Hangat & Lembut) 🐾");
                  }}
                  className={`p-3 rounded-xl border text-left transition ${
                    settings.vocalPitch === "dewasa"
                      ? "bg-amber-500 text-white border-amber-600 shadow-sm"
                      : "bg-white dark:bg-stone-800 border-stone-200 dark:border-stone-700 text-stone-700 dark:text-stone-300"
                  }`}
                >
                  <div className="font-bold text-xs">🐈 Kucing Dewasa</div>
                  <div className={`text-[10px] mt-0.5 ${settings.vocalPitch === "dewasa" ? "text-amber-100" : "text-stone-400"}`}>
                    Pitch hangat, tenang, berwibawa
                  </div>
                </button>
              </div>

              {/* Sound Test Buttons */}
              <div className="pt-2 flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleTestSound("meow")}
                  className="px-3.5 py-1.5 rounded-xl bg-white dark:bg-stone-800 border border-amber-300 dark:border-amber-700/60 text-amber-700 dark:text-amber-300 text-xs font-semibold hover:bg-amber-50 transition shadow-xs flex items-center gap-1.5"
                >
                  <span>🔊</span>
                  <span>Uji Suara Meong</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleTestSound("purr_meow")}
                  className="px-3.5 py-1.5 rounded-xl bg-white dark:bg-stone-800 border border-amber-300 dark:border-amber-700/60 text-amber-700 dark:text-amber-300 text-xs font-semibold hover:bg-amber-50 transition shadow-xs flex items-center gap-1.5"
                >
                  <span>💞</span>
                  <span>Uji Dengkuran (Purr)</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleTestSound("chirp")}
                  className="px-3.5 py-1.5 rounded-xl bg-white dark:bg-stone-800 border border-amber-300 dark:border-amber-700/60 text-amber-700 dark:text-amber-300 text-xs font-semibold hover:bg-amber-50 transition shadow-xs flex items-center gap-1.5"
                >
                  <span>🎶</span>
                  <span>Uji Chirp Ceria</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const next = !settings.musicEnabled;
                    updateSettings({ musicEnabled: next });
                    showToast(next ? "Melodi kamar santai dimainkan! 🎵" : "Melodi musik dihentikan 🔇");
                  }}
                  className={`px-3.5 py-1.5 rounded-xl border text-xs font-semibold transition shadow-xs flex items-center gap-1.5 ${
                    settings.musicEnabled
                      ? "bg-amber-500 text-white border-amber-600"
                      : "bg-white dark:bg-stone-800 border-amber-300 dark:border-amber-700/60 text-amber-700 dark:text-amber-300 hover:bg-amber-50"
                  }`}
                >
                  <span>{settings.musicEnabled ? "⏸️" : "▶️"}</span>
                  <span>{settings.musicEnabled ? "Jeda Musik Latar" : "Putar Musik Latar (BGM)"}</span>
                </button>
              </div>
            </div>

            {/* Playlist Trek Musik Latar (BGM) */}
            <div className="p-5 rounded-2xl bg-white dark:bg-stone-800/80 border border-stone-200 dark:border-stone-700/60 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-bold text-stone-900 dark:text-white flex items-center gap-2">
                    <span>🎶</span>
                    <span>Pilihan Musik Latar Kamar</span>
                  </h4>
                  <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">
                    Pilih suasana melodi yang mengalun saat bermain bersama Mochi
                  </p>
                </div>
                {settings.musicEnabled && (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[10px] font-bold animate-pulse">
                    <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                    <span>Memutar</span>
                  </span>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {audioPlayer.tracks.map((track) => {
                  const isCurrent = audioPlayer.currentTrackId === track.id;
                  return (
                    <button
                      key={track.id}
                      type="button"
                      onClick={() => {
                        audioPlayer.selectTrack(track.id);
                        showToast(`Musik diubah ke: ${track.title} 🎵`);
                      }}
                      className={`p-3.5 rounded-xl border text-left transition flex flex-col justify-between ${
                        isCurrent
                          ? "bg-amber-500/10 border-amber-500 dark:border-amber-400 ring-2 ring-amber-500/20 shadow-xs"
                          : "bg-stone-50 dark:bg-stone-800/60 border-stone-200 dark:border-stone-700/60 hover:bg-stone-100"
                      }`}
                    >
                      <div>
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-xs text-stone-900 dark:text-white">
                            {track.title}
                          </span>
                          {isCurrent && <span className="text-xs text-amber-500">✓</span>}
                        </div>
                        <div className="text-[10px] text-amber-600 dark:text-amber-400 font-medium mt-0.5">
                          {track.genre} • {track.bpm} BPM
                        </div>
                      </div>
                      <p className="text-[10px] text-stone-500 dark:text-stone-400 mt-2 line-clamp-2">
                        {track.description}
                      </p>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Status Pemutar Audio & Diagnostic Log */}
            <div className="p-4 rounded-2xl bg-stone-100/70 dark:bg-stone-800/50 border border-stone-200 dark:border-stone-700/50 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2 text-stone-600 dark:text-stone-300">
                  <span>📻</span>
                  <span className="font-semibold">Status Audio:</span>
                  <span className="text-[11px] text-stone-500">
                    SFX: {settings.soundEnabled ? `Aktif (${settings.sfxVolume}%)` : "Mati"} • BGM: {settings.musicEnabled ? `Aktif (${settings.musicVolume}%)` : "Mati"}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setShowAudioLogs(!showAudioLogs)}
                  className="text-[11px] font-semibold text-amber-600 dark:text-amber-400 hover:underline"
                >
                  {showAudioLogs ? "Sembunyikan Log ▲" : "Lihat Log Audio ▼"}
                </button>
              </div>

              {showAudioLogs && (
                <div className="mt-2 p-2.5 rounded-xl bg-stone-900 text-stone-200 font-mono text-[10px] max-h-36 overflow-y-auto space-y-1">
                  {audioPlayer.audioLogs.map((log, idx) => (
                    <div key={idx} className="leading-tight text-amber-300/90">
                      {log}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 2: GRAFIS & TAMPILAN */}
        {activeTab === "grafis" && (
          <div className="space-y-6 animate-in fade-in duration-200">
            {/* Pemilih Kualitas Render 3D */}
            <QualitySelector
              value={settings.graphicsQuality}
              onChange={(lvl) => {
                updateSettings({ graphicsQuality: lvl });
                showToast(`Kualitas tampilan diubah ke: ${lvl.toUpperCase()} 🖥️`);
              }}
              shadowsEnabled={settings.shadowsEnabled}
            />

            {/* Performance Toggles */}
            <div className="space-y-3">
              {/* Shadows */}
              <div className="p-4 rounded-2xl bg-white dark:bg-stone-800/80 border border-stone-200 dark:border-stone-700/60 shadow-sm flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-bold text-stone-900 dark:text-white">
                    Bayangan Realistis (Dynamic Shadow)
                  </h4>
                  <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">
                    Menampilkan bayangan jatuh di bawah kaki dan furnitur
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    const next = !settings.shadowsEnabled;
                    updateSettings({ shadowsEnabled: next });
                    showToast(next ? "Bayangan diaktifkan!" : "Bayangan dinonaktifkan!");
                  }}
                  className={`w-14 h-7 flex items-center rounded-full p-1 cursor-pointer transition-colors duration-200 ${
                    settings.shadowsEnabled ? "bg-amber-500" : "bg-stone-300 dark:bg-stone-700"
                  }`}
                  aria-label="Toggle Shadows"
                >
                  <div
                    className={`bg-white w-5 h-5 rounded-full shadow-md transform transition-transform duration-200 ${
                      settings.shadowsEnabled ? "translate-x-7" : "translate-x-0"
                    }`}
                  />
                </button>
              </div>

              {/* Battery Saver */}
              <div className="p-4 rounded-2xl bg-white dark:bg-stone-800/80 border border-stone-200 dark:border-stone-700/60 shadow-sm flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-bold text-stone-900 dark:text-white">
                    Mode Hemat Baterai
                  </h4>
                  <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">
                    Mengurangi intensitas render saat baterai ponsel melemah
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    const next = !settings.batterySaver;
                    updateSettings({ batterySaver: next });
                    showToast(next ? "Mode hemat baterai aktif! 🔋" : "Mode hemat baterai nonaktif!");
                  }}
                  className={`w-14 h-7 flex items-center rounded-full p-1 cursor-pointer transition-colors duration-200 ${
                    settings.batterySaver ? "bg-amber-500" : "bg-stone-300 dark:bg-stone-700"
                  }`}
                  aria-label="Toggle Battery Saver"
                >
                  <div
                    className={`bg-white w-5 h-5 rounded-full shadow-md transform transition-transform duration-200 ${
                      settings.batterySaver ? "translate-x-7" : "translate-x-0"
                    }`}
                  />
                </button>
              </div>

              {/* Frame rate limit */}
              <div className="p-4 rounded-2xl bg-white dark:bg-stone-800/80 border border-stone-200 dark:border-stone-700/60 shadow-sm flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-bold text-stone-900 dark:text-white">
                    Batas Frame Rate (FPS)
                  </h4>
                  <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">
                    Pilih 60 FPS untuk animasi paling mulus atau 30 FPS untuk hemat baterai
                  </p>
                </div>
                <div className="flex items-center gap-1.5 bg-stone-100 dark:bg-stone-700 p-1 rounded-xl">
                  <button
                    type="button"
                    onClick={() => {
                      updateSettings({ frameRateLimit: 30 });
                      showToast("FPS diatur ke 30 FPS");
                    }}
                    className={`px-3 py-1 rounded-lg text-xs font-semibold transition ${
                      settings.frameRateLimit === 30
                        ? "bg-amber-500 text-white shadow-xs"
                        : "text-stone-600 dark:text-stone-300 hover:text-stone-900"
                    }`}
                  >
                    30 FPS
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      updateSettings({ frameRateLimit: 60 });
                      showToast("FPS diatur ke 60 FPS (Ultra Mulus)");
                    }}
                    className={`px-3 py-1 rounded-lg text-xs font-semibold transition ${
                      settings.frameRateLimit === 60
                        ? "bg-amber-500 text-white shadow-xs"
                        : "text-stone-600 dark:text-stone-300 hover:text-stone-900"
                    }`}
                  >
                    60 FPS
                  </button>
                </div>
              </div>

              {/* Camera Speed */}
              <div className="p-4 rounded-2xl bg-white dark:bg-stone-800/80 border border-stone-200 dark:border-stone-700/60 shadow-sm flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-bold text-stone-900 dark:text-white">
                    Kecepatan Orbit Kamera
                  </h4>
                  <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">
                    Sensitivitas geser layar untuk memutar sudut pandang ruangan
                  </p>
                </div>
                <div className="flex items-center gap-1.5 bg-stone-100 dark:bg-stone-700 p-1 rounded-xl">
                  {(["lambat", "normal", "cepat"] as const).map((spd) => (
                    <button
                      key={spd}
                      type="button"
                      onClick={() => {
                        updateSettings({ cameraSpeed: spd });
                        showToast(`Kecepatan kamera: ${spd}`);
                      }}
                      className={`px-2.5 py-1 rounded-lg text-xs font-semibold capitalize transition ${
                        settings.cameraSpeed === spd
                          ? "bg-amber-500 text-white shadow-xs"
                          : "text-stone-600 dark:text-stone-300 hover:text-stone-900"
                      }`}
                    >
                      {spd}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: PREFERENSI PERMAINAN */}
        {activeTab === "preferensi" && (
          <div className="space-y-6 animate-in fade-in duration-200">
            <div className="space-y-3">
              {/* Gentle Reminders */}
              <div className="p-4 rounded-2xl bg-white dark:bg-stone-800/80 border border-stone-200 dark:border-stone-700/60 shadow-sm flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-bold text-stone-900 dark:text-white flex items-center gap-1.5">
                    <span>💌</span>
                    <span>Pengingat Perhatian & Kasih Sayang</span>
                  </h4>
                  <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">
                    Tampilkan balon ucapan lembut saat Mochi rindu atau lapar
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    const next = !settings.gentleReminders;
                    updateSettings({ gentleReminders: next });
                    showToast(next ? "Pengingat kasih sayang diaktifkan! 💌" : "Pengingat dinonaktifkan");
                  }}
                  className={`w-14 h-7 flex items-center rounded-full p-1 cursor-pointer transition-colors duration-200 ${
                    settings.gentleReminders ? "bg-amber-500" : "bg-stone-300 dark:bg-stone-700"
                  }`}
                  aria-label="Toggle Reminders"
                >
                  <div
                    className={`bg-white w-5 h-5 rounded-full shadow-md transform transition-transform duration-200 ${
                      settings.gentleReminders ? "translate-x-7" : "translate-x-0"
                    }`}
                  />
                </button>
              </div>

              {/* Cloud Autosave */}
              <div className="p-4 rounded-2xl bg-white dark:bg-stone-800/80 border border-stone-200 dark:border-stone-700/60 shadow-sm flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-bold text-stone-900 dark:text-white flex items-center gap-1.5">
                    <span>☁️</span>
                    <span>Penyimpanan Otomatis (Autosave)</span>
                  </h4>
                  <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">
                    Simpan progres status dan pertumbuhan secara berkala ke database lokal
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    const next = !settings.cloudAutosave;
                    updateSettings({ cloudAutosave: next });
                    showToast(next ? "Autosave aktif! ☁️" : "Autosave dinonaktifkan");
                  }}
                  className={`w-14 h-7 flex items-center rounded-full p-1 cursor-pointer transition-colors duration-200 ${
                    settings.cloudAutosave ? "bg-amber-500" : "bg-stone-300 dark:bg-stone-700"
                  }`}
                  aria-label="Toggle Autosave"
                >
                  <div
                    className={`bg-white w-5 h-5 rounded-full shadow-md transform transition-transform duration-200 ${
                      settings.cloudAutosave ? "translate-x-7" : "translate-x-0"
                    }`}
                  />
                </button>
              </div>

              {/* Haptic Feedback */}
              <div className="p-4 rounded-2xl bg-white dark:bg-stone-800/80 border border-stone-200 dark:border-stone-700/60 shadow-sm flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-bold text-stone-900 dark:text-white flex items-center gap-1.5">
                    <span>📳</span>
                    <span>Getaran Sentuhan (Haptic Feedback)</span>
                  </h4>
                  <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">
                    Getaran halus saat mengelus Mochi atau menekan tombol aksi (di perangkat yang mendukung)
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    const next = !settings.hapticFeedback;
                    updateSettings({ hapticFeedback: next });
                    showToast(next ? "Umpan balik sentuhan aktif! 📳" : "Umpan balik nonaktif");
                  }}
                  className={`w-14 h-7 flex items-center rounded-full p-1 cursor-pointer transition-colors duration-200 ${
                    settings.hapticFeedback ? "bg-amber-500" : "bg-stone-300 dark:bg-stone-700"
                  }`}
                  aria-label="Toggle Haptic"
                >
                  <div
                    className={`bg-white w-5 h-5 rounded-full shadow-md transform transition-transform duration-200 ${
                      settings.hapticFeedback ? "translate-x-7" : "translate-x-0"
                    }`}
                  />
                </button>
              </div>
            </div>

            {/* Reset Factory Settings Card */}
            <div className="p-5 rounded-2xl bg-red-50/60 dark:bg-red-950/20 border border-red-200 dark:border-red-900/40 space-y-3">
              <h4 className="text-sm font-bold text-red-900 dark:text-red-300 flex items-center gap-2">
                <span>⚠️</span>
                <span>Reset Pengaturan Bawaan</span>
              </h4>
              <p className="text-xs text-red-800/80 dark:text-red-300/80 leading-relaxed">
                Kembalikan semua preferensi suara, grafis, dan kontrol ke kondisi awal pabrik. Data kucing dan akun tidak akan terhapus.
              </p>

              {!showResetConfirm ? (
                <button
                  type="button"
                  onClick={() => setShowResetConfirm(true)}
                  className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-semibold transition shadow-xs flex items-center gap-1.5"
                >
                  <span>🔄</span>
                  <span>Kembalikan ke Pengaturan Default</span>
                </button>
              ) : (
                <div className="p-3 bg-white dark:bg-stone-900 rounded-xl border border-red-300 dark:border-red-800 space-y-2">
                  <p className="text-xs font-semibold text-red-700 dark:text-red-400">
                    Apakah kamu yakin ingin mereset seluruh pengaturan?
                  </p>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={handleReset}
                      className="px-3.5 py-1.5 rounded-lg bg-red-600 hover:bg-red-700 text-white text-xs font-bold transition"
                    >
                      Ya, Reset Sekarang
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowResetConfirm(false)}
                      className="px-3 py-1.5 rounded-lg bg-stone-200 hover:bg-stone-300 dark:bg-stone-800 text-stone-700 dark:text-stone-300 text-xs font-medium transition"
                    >
                      Batal
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 4: BANTUAN & FAQ */}
        {activeTab === "bantuan" && (
          <div className="space-y-6 animate-in fade-in duration-200">
            {/* Search FAQ */}
            <div className="relative">
              <input
                type="text"
                value={faqSearch}
                onChange={(e) => setFaqSearch(e.target.value)}
                placeholder="Cari pertanyaan panduan bermain..."
                className="w-full px-4 py-3 pl-10 rounded-2xl bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-xs text-stone-800 dark:text-stone-100 placeholder-stone-400 focus:outline-hidden focus:ring-2 focus:ring-amber-500 shadow-xs"
              />
              <span className="absolute left-3.5 top-3.5 text-stone-400 text-sm">🔍</span>
              {faqSearch && (
                <button
                  type="button"
                  onClick={() => setFaqSearch("")}
                  className="absolute right-3.5 top-3 text-stone-400 hover:text-stone-600 text-xs font-bold"
                >
                  ✕
                </button>
              )}
            </div>

            {/* Accordion List */}
            <div className="space-y-3">
              {filteredFaqs.length === 0 ? (
                <div className="text-center py-8 text-stone-500 text-xs">
                  Tidak ditemukan panduan yang sesuai dengan kata kunci &ldquo;{faqSearch}&rdquo;.
                </div>
              ) : (
                filteredFaqs.map((faq, idx) => {
                  const isOpen = expandedFaq === idx;
                  return (
                    <div
                      key={faq.question}
                      className="rounded-2xl border border-stone-200 dark:border-stone-700/60 bg-white dark:bg-stone-800/80 overflow-hidden shadow-xs transition"
                    >
                      <button
                        type="button"
                        onClick={() => setExpandedFaq(isOpen ? null : idx)}
                        className="w-full p-4 text-left flex items-center justify-between gap-3 hover:bg-stone-50 dark:hover:bg-stone-700/40 transition"
                      >
                        <div className="flex items-center gap-3">
                          <span className="text-lg">{faq.icon}</span>
                          <span className="text-xs sm:text-sm font-bold text-stone-800 dark:text-stone-200">
                            {faq.question}
                          </span>
                        </div>
                        <span className={`text-stone-400 text-xs transform transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}>
                          ▼
                        </span>
                      </button>

                      {isOpen && (
                        <div className="px-4 pb-4 pt-1 text-xs text-stone-600 dark:text-stone-300 leading-relaxed border-t border-stone-100 dark:border-stone-700/50 bg-stone-50/50 dark:bg-stone-900/30">
                          {faq.answer}
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>

            {/* Quick Links Card */}
            <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-300/40 dark:border-amber-700/40 flex items-center justify-between">
              <div>
                <h5 className="text-xs font-bold text-amber-900 dark:text-amber-200">
                  Butuh bantuan akun atau cadangan kode?
                </h5>
                <p className="text-[11px] text-amber-800/80 dark:text-amber-300/80">
                  Lihat kode pemulihan dan kelola kredensial di Menu Akun
                </p>
              </div>
              <Link
                href="/akun"
                className="px-3.5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold transition shadow-xs flex items-center gap-1"
              >
                <span>Buka Akun</span>
                <span>➔</span>
              </Link>
            </div>
          </div>
        )}

        {/* TAB 5: TENTANG MOCHI */}
        {activeTab === "tentang" && (
          <div className="space-y-6 animate-in fade-in duration-200">
            <div className="p-6 rounded-2xl bg-gradient-to-br from-amber-500/10 via-orange-500/5 to-amber-600/10 border border-amber-200/60 dark:border-amber-800/40 text-center space-y-3">
              <div className="w-16 h-16 mx-auto rounded-3xl bg-gradient-to-tr from-amber-400 to-orange-500 text-white flex items-center justify-center text-3xl shadow-lg shadow-amber-500/20">
                🐱
              </div>
              <h3 className="text-lg font-black tracking-tight text-stone-900 dark:text-white">
                {APP_INFO.name}
              </h3>
              <p className="text-xs text-stone-600 dark:text-stone-300 max-w-md mx-auto leading-relaxed">
                {APP_INFO.credits}
              </p>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 text-[11px] font-semibold">
                <span>Versi {APP_INFO.version}</span>
                <span>•</span>
                <span>Build {APP_INFO.build}</span>
              </div>
            </div>

            {/* Spec details */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="p-4 rounded-xl bg-white dark:bg-stone-800/80 border border-stone-200 dark:border-stone-700/60 space-y-1">
                <span className="text-stone-400 text-[10px] uppercase font-bold tracking-wider">Teknologi</span>
                <p className="font-semibold text-stone-800 dark:text-stone-200">{APP_INFO.engine}</p>
              </div>

              <div className="p-4 rounded-xl bg-white dark:bg-stone-800/80 border border-stone-200 dark:border-stone-700/60 space-y-1">
                <span className="text-stone-400 text-[10px] uppercase font-bold tracking-wider">Lisensi</span>
                <p className="font-semibold text-stone-800 dark:text-stone-200">{APP_INFO.license}</p>
              </div>
            </div>

            {/* Footer Action Buttons */}
            <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
              <Link
                href="/riwayat"
                className="px-4 py-2 rounded-xl bg-stone-100 hover:bg-stone-200 dark:bg-stone-800 dark:hover:bg-stone-700 text-stone-700 dark:text-stone-200 text-xs font-semibold transition flex items-center gap-1.5"
              >
                <span>📜</span>
                <span>Riwayat Aktivitas</span>
              </Link>
              <Link
                href="/akun"
                className="px-4 py-2 rounded-xl bg-stone-100 hover:bg-stone-200 dark:bg-stone-800 dark:hover:bg-stone-700 text-stone-700 dark:text-stone-200 text-xs font-semibold transition flex items-center gap-1.5"
              >
                <span>👤</span>
                <span>Profil & Akun</span>
              </Link>
              {onBackToGame && (
                <button
                  type="button"
                  onClick={onBackToGame}
                  className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold transition shadow-sm flex items-center gap-1.5"
                >
                  <span>🐾</span>
                  <span>Kembali ke Kamar Mochi</span>
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
