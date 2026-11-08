"use client";

import SettingsView from "./SettingsView";

interface SettingsSheetProps {
  onClose: () => void;
}

export default function SettingsSheet({ onClose }: SettingsSheetProps) {
  return (
    <div
      role="dialog"
      aria-label="Panel Pengaturan Permainan Mochi"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5"
    >
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-stone-900/60 backdrop-blur-sm transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal Container */}
      <div className="relative z-10 w-full max-w-2xl max-h-[92vh] overflow-y-auto rounded-3xl bg-[#fdfbf7] p-2 sm:p-4 shadow-2xl ring-1 ring-amber-900/10">
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 z-20 flex h-8 w-8 items-center justify-center rounded-full bg-stone-100 text-stone-500 transition hover:bg-stone-200 hover:text-stone-800"
          aria-label="Tutup panel pengaturan"
        >
          ✕
        </button>

        <SettingsView onBackToGame={onClose} isModal />
      </div>
    </div>
  );
}
