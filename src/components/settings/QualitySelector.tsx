"use client";

import { useMemo } from "react";
import { QUALITY_PROFILES, detectQuality, type QualityLevel } from "@/lib/quality";

export type QualityOption = QualityLevel | "auto";

interface QualitySelectorProps {
  value: QualityOption;
  onChange: (level: QualityOption) => void;
  shadowsEnabled?: boolean;
}

export default function QualitySelector({
  value,
  onChange,
  shadowsEnabled = true,
}: QualitySelectorProps) {
  const detected = useMemo(() => {
    if (typeof window === "undefined") return "sedang";
    return detectQuality();
  }, []);

  const activeLevel: QualityLevel = value === "auto" ? detected : value;
  const activeProfile = QUALITY_PROFILES[activeLevel];

  const deviceHardware = useMemo(() => {
    if (typeof window === "undefined") return { cores: 4, memory: 4, isMobile: false, dpr: 1 };
    const cores = navigator.hardwareConcurrency ?? 4;
    const memory = (navigator as Navigator & { deviceMemory?: number }).deviceMemory ?? 4;
    const isMobile = window.matchMedia("(pointer: coarse)").matches;
    const dpr = typeof window.devicePixelRatio === "number" ? Math.round(window.devicePixelRatio * 10) / 10 : 1;
    return { cores, memory, isMobile, dpr };
  }, []);

  const options: {
    id: QualityOption;
    title: string;
    badge: string;
    icon: string;
    targetFps: string;
    description: string;
    dprLabel: string;
  }[] = [
    {
      id: "auto",
      title: "Otomatis",
      badge: `Rekomendasi (${detected.toUpperCase()})`,
      icon: "🤖",
      targetFps: "Adaptif",
      description: "Menyesuaikan otomatis dengan spesifikasi hardware & stabilitas FPS layar.",
      dprLabel: "DPR Dinamis",
    },
    {
      id: "rendah",
      title: "Rendah",
      badge: "Hemat Daya",
      icon: "⚡",
      targetFps: "30-60 FPS",
      description: "Ringan dan hemat baterai, tanpa bayangan dinamis. Cocok untuk perangkat lama.",
      dprLabel: "0.75x - 1.0x",
    },
    {
      id: "sedang",
      title: "Sedang",
      badge: "Seimbang",
      icon: "⚖️",
      targetFps: "60 FPS",
      description: "Keseimbangan optimal antara kejernihan grafis, kontak bayangan, dan animasi.",
      dprLabel: "1.0x - 1.5x",
    },
    {
      id: "tinggi",
      title: "Tinggi",
      badge: "Ultra Tajam",
      icon: "✨",
      targetFps: "60 FPS",
      description: "Bayangan dinamis tajam 1024px, antialiasing penuh, dan detail bulu maksimal.",
      dprLabel: "1.0x - 2.0x",
    },
  ];

  return (
    <div className="space-y-4">
      {/* Device Hardware Spec Info */}
      <div className="flex flex-wrap items-center justify-between gap-2 p-3 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-xs">
        <div className="flex items-center gap-2 text-stone-700 dark:text-stone-300 font-medium">
          <span>📱</span>
          <span>
            Spesifikasi Perangkat: {deviceHardware.cores} CPU Cores • RAM ~{deviceHardware.memory}GB • Layar {deviceHardware.dpr}x DPR
          </span>
        </div>
        <div className="px-2.5 py-0.5 rounded-full bg-amber-500 text-white font-bold text-[10px]">
          Deteksi: Kualitas {detected.toUpperCase()}
        </div>
      </div>

      {/* Segmented Quality Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {options.map((opt) => {
          const isSelected = value === opt.id;
          return (
            <button
              key={opt.id}
              type="button"
              onClick={() => onChange(opt.id)}
              className={`p-4 rounded-2xl border text-left transition relative flex flex-col justify-between ${
                isSelected
                  ? "bg-amber-500 text-white border-amber-600 shadow-md ring-2 ring-amber-400/40"
                  : "bg-white dark:bg-stone-800/80 border-stone-200 dark:border-stone-700/60 text-stone-700 dark:text-stone-300 hover:bg-stone-50 dark:hover:bg-stone-750"
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xl">{opt.icon}</span>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      isSelected
                        ? "bg-white/20 text-white"
                        : "bg-stone-100 dark:bg-stone-700 text-stone-600 dark:text-stone-300"
                    }`}
                  >
                    {opt.badge}
                  </span>
                </div>
                <h4 className="font-bold text-sm tracking-tight">{opt.title}</h4>
                <p
                  className={`text-[11px] mt-1 leading-relaxed ${
                    isSelected ? "text-amber-100" : "text-stone-500 dark:text-stone-400"
                  }`}
                >
                  {opt.description}
                </p>
              </div>

              <div
                className={`mt-3 pt-2 border-t text-[10px] flex items-center justify-between font-semibold ${
                  isSelected ? "border-white/20 text-white" : "border-stone-100 dark:border-stone-700/60 text-stone-400"
                }`}
              >
                <span>DPR: {opt.dprLabel}</span>
                <span>{opt.targetFps}</span>
              </div>
            </button>
          );
        })}
      </div>

      {/* Active Profile Technical Breakdown */}
      <div className="p-4 rounded-2xl bg-stone-100/70 dark:bg-stone-800/60 border border-stone-200 dark:border-stone-700/60 space-y-2 text-xs">
        <h5 className="font-bold text-stone-800 dark:text-stone-200 flex items-center gap-2">
          <span>⚙️</span>
          <span>Parameter Render Aktif ({value === "auto" ? `Otomatis → ${activeLevel}` : activeLevel})</span>
        </h5>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 text-[11px]">
          <div className="p-2 rounded-xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800">
            <span className="text-stone-400 block text-[9px] uppercase font-bold">Resolusi Render (DPR)</span>
            <span className="font-semibold text-stone-800 dark:text-stone-200">
              {activeProfile.dpr[0]}x – {activeProfile.dpr[1]}x
            </span>
          </div>

          <div className="p-2 rounded-xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800">
            <span className="text-stone-400 block text-[9px] uppercase font-bold">Bayangan Dinamis</span>
            <span className="font-semibold text-stone-800 dark:text-stone-200">
              {shadowsEnabled && activeProfile.shadows ? `Aktif (${activeProfile.shadowMapSize}px)` : "Nonaktif"}
            </span>
          </div>

          <div className="p-2 rounded-xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800">
            <span className="text-stone-400 block text-[9px] uppercase font-bold">Antialiasing (MSAA)</span>
            <span className="font-semibold text-stone-800 dark:text-stone-200">
              {activeProfile.antialias ? "FXAA / Multisampling" : "Mati (Hemat Daya)"}
            </span>
          </div>

          <div className="p-2 rounded-xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800">
            <span className="text-stone-400 block text-[9px] uppercase font-bold">Segmen Geometri 3D</span>
            <span className="font-semibold text-stone-800 dark:text-stone-200">
              {activeProfile.anim.sphereSegments} segmen bola
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
