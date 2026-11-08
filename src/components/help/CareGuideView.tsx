"use client";

import { useState } from "react";
import Link from "next/link";
import {
  CARE_GUIDE_SECTIONS,
  type GuideCategory,
  type GuideSection,
} from "@/lib/care-guide-data";

interface CareGuideViewProps {
  onBackToGame?: () => void;
  isModal?: boolean;
}

export default function CareGuideView({
  onBackToGame,
  isModal = false,
}: CareGuideViewProps) {
  const [selectedCategory, setSelectedCategory] = useState<GuideCategory | "all">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedSectionId, setExpandedSectionId] = useState<string | null>("makan-dan-minum");

  const categories: { id: GuideCategory | "all"; label: string; icon: string }[] = [
    { id: "all", label: "Semua Topik", icon: "📚" },
    { id: "perawatan", label: "Perawatan Pokok", icon: "🍗" },
    { id: "mood", label: "Mood & Perilaku", icon: "💖" },
    { id: "pertumbuhan", label: "Tumbuh Kembang", icon: "🌱" },
    { id: "akun", label: "Akun & Simpan", icon: "🛡️" },
  ];

  const filteredSections = CARE_GUIDE_SECTIONS.filter((section) => {
    const matchesCategory = selectedCategory === "all" || section.category === selectedCategory;
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      !searchQuery ||
      section.title.toLowerCase().includes(q) ||
      section.subtitle.toLowerCase().includes(q) ||
      section.steps.some(
        (s) => s.title.toLowerCase().includes(q) || s.description.toLowerCase().includes(q)
      );
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="w-full max-w-4xl mx-auto bg-stone-50/95 dark:bg-stone-900/95 backdrop-blur-md rounded-3xl shadow-2xl border border-stone-200 dark:border-stone-800 overflow-hidden text-stone-800 dark:text-stone-100 transition-all">
      {/* Header */}
      <div className="px-6 py-6 bg-gradient-to-r from-amber-500/15 via-orange-500/10 to-amber-600/15 border-b border-stone-200 dark:border-stone-800 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center text-2xl shadow-inner">
            📖
          </div>
          <div>
            <h2 className="text-xl font-bold tracking-tight text-stone-900 dark:text-white">
              Buku Panduan Merawat Mochi
            </h2>
            <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">
              Kiat lengkap merawat kucing virtual 3D, membangun kedekatan, dan menjaga suasana hati
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
            <span>{isModal ? "Tutup" : "Kembali"}</span>
          </button>
        )}
      </div>

      {/* Search & Category Filter */}
      <div className="p-6 pb-2 space-y-4 bg-stone-100/50 dark:bg-stone-900/40 border-b border-stone-200 dark:border-stone-800">
        <div className="relative">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari panduan (contoh: makan, mandi, tidur, level, kode pemulihan)..."
            className="w-full px-4 py-3 pl-10 rounded-2xl bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-xs text-stone-800 dark:text-stone-100 placeholder-stone-400 focus:outline-hidden focus:ring-2 focus:ring-amber-500 shadow-xs"
          />
          <span className="absolute left-3.5 top-3.5 text-stone-400 text-sm">🔍</span>
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery("")}
              className="absolute right-3.5 top-3 text-stone-400 hover:text-stone-600 text-xs font-bold"
            >
              ✕
            </button>
          )}
        </div>

        {/* Category Filter Pills */}
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-2">
          {categories.map((cat) => {
            const isSelected = selectedCategory === cat.id;
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-3.5 py-2 rounded-xl text-xs font-medium transition flex items-center gap-1.5 whitespace-nowrap ${
                  isSelected
                    ? "bg-amber-500 text-white shadow-sm font-semibold"
                    : "bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-stone-600 dark:text-stone-300 hover:bg-stone-50"
                }`}
              >
                <span>{cat.icon}</span>
                <span>{cat.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Guide Content List */}
      <div className="p-6 space-y-4 overflow-y-auto max-h-[70vh]">
        {filteredSections.length === 0 ? (
          <div className="text-center py-12 text-stone-500 text-xs space-y-2">
            <span className="text-3xl block">🐾</span>
            <p className="font-semibold">Tidak ada topik panduan yang cocok dengan &ldquo;{searchQuery}&rdquo;</p>
            <p className="text-stone-400">Coba gunakan kata kunci lain seperti &lsquo;makan&rsquo; atau &lsquo;tidur&rsquo;.</p>
          </div>
        ) : (
          filteredSections.map((section: GuideSection) => {
            const isOpen = expandedSectionId === section.id;
            return (
              <div
                key={section.id}
                className="rounded-2xl border border-stone-200 dark:border-stone-700/60 bg-white dark:bg-stone-800/80 overflow-hidden shadow-xs transition"
              >
                {/* Accordion Header */}
                <button
                  type="button"
                  onClick={() => setExpandedSectionId(isOpen ? null : section.id)}
                  className="w-full p-4 sm:p-5 text-left flex items-start justify-between gap-4 hover:bg-stone-50 dark:hover:bg-stone-750 transition"
                >
                  <div className="flex items-start gap-3.5">
                    <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center text-xl shrink-0 mt-0.5">
                      {section.icon}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-bold text-sm sm:text-base text-stone-900 dark:text-white">
                          {section.title}
                        </h3>
                        <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-stone-100 dark:bg-stone-700 text-stone-500 dark:text-stone-300">
                          {section.readTime}
                        </span>
                      </div>
                      <p className="text-xs text-stone-500 dark:text-stone-400 mt-1 leading-relaxed">
                        {section.subtitle}
                      </p>
                    </div>
                  </div>

                  <span
                    className={`text-stone-400 text-xs shrink-0 transform transition-transform duration-200 mt-1.5 ${
                      isOpen ? "rotate-180" : ""
                    }`}
                  >
                    ▼
                  </span>
                </button>

                {/* Accordion Body */}
                {isOpen && (
                  <div className="px-5 pb-5 pt-2 border-t border-stone-100 dark:border-stone-700/50 bg-stone-50/50 dark:bg-stone-900/30 space-y-4">
                    {/* Steps */}
                    <div className="space-y-3 pt-2">
                      {section.steps.map((step, idx) => (
                        <div key={idx} className="flex items-start gap-3">
                          <div className="w-6 h-6 rounded-full bg-amber-500 text-white font-bold text-xs flex items-center justify-center shrink-0 mt-0.5 shadow-xs">
                            {idx + 1}
                          </div>
                          <div className="space-y-1">
                            <h4 className="text-xs font-bold text-stone-800 dark:text-stone-200">
                              {step.title}
                            </h4>
                            <p className="text-xs text-stone-600 dark:text-stone-300 leading-relaxed">
                              {step.description}
                            </p>
                            {step.proTip && (
                              <div className="mt-1.5 p-2 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/40 text-[11px] text-amber-800 dark:text-amber-200 font-medium flex items-center gap-1.5">
                                <span>💡</span>
                                <span>{step.proTip}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Key Takeaway Banner */}
                    <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/40 text-xs text-emerald-800 dark:text-emerald-300 font-medium flex items-center gap-2">
                      <span className="text-base">🐾</span>
                      <span>{section.keyTakeaway}</span>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Footer Navigation */}
      <div className="p-5 bg-stone-100/70 dark:bg-stone-900/60 border-t border-stone-200 dark:border-stone-800 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2 text-stone-500">
          <span>🐾</span>
          <span>Selalu rawat Mochi dengan penuh kasih sayang setiap hari</span>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/pengaturan"
            className="px-3.5 py-2 rounded-xl bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-stone-700 dark:text-stone-300 font-semibold hover:bg-stone-50 transition shadow-xs"
          >
            ⚙️ Buka Pengaturan
          </Link>
          <Link
            href="/"
            className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold transition shadow-xs flex items-center gap-1.5"
          >
            <span>🐱</span>
            <span>Kembali ke Kamar Mochi</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
