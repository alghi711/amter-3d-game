"use client";

import { useEffect } from "react";
import SettingsView from "./SettingsView";

interface SettingsSheetProps {
  onClose: () => void;
}

export default function SettingsSheet({ onClose }: SettingsSheetProps) {
  // Handle ESC key to close modal seamlessly
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Panel Pengaturan Permainan Mochi"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 animate-in fade-in duration-200"
    >
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-stone-950/70 backdrop-blur-sm transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal Container */}
      <div className="relative z-10 w-full max-w-3xl max-h-[92vh] overflow-y-auto rounded-3xl bg-[#fdfbf7] dark:bg-stone-900 p-2 sm:p-4 shadow-2xl ring-1 ring-amber-900/10 animate-in zoom-in-95 duration-200">
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 z-20 flex h-8 w-8 items-center justify-center rounded-full bg-stone-100 hover:bg-stone-200 dark:bg-stone-800 dark:hover:bg-stone-700 text-stone-500 hover:text-stone-800 dark:text-stone-300 transition shadow-xs"
          aria-label="Tutup panel pengaturan"
          title="Tutup (ESC)"
        >
          ✕
        </button>

        <SettingsView onBackToGame={onClose} isModal />
      </div>
    </div>
  );
}
