"use client";

interface LogoutConfirmModalProps {
  isOpen: boolean;
  playerName: string;
  isGuest: boolean;
  onCancel: () => void;
  onConfirmLogout: () => void;
}

export default function LogoutConfirmModal({
  isOpen,
  playerName,
  isGuest,
  onCancel,
  onConfirmLogout,
}: LogoutConfirmModalProps) {
  if (!isOpen) return null;

  return (
    <div
      role="alertdialog"
      aria-label="Konfirmasi Keluar Akun"
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
    >
      <div
        className="fixed inset-0 bg-stone-900/60 backdrop-blur-sm transition-opacity"
        onClick={onCancel}
        aria-hidden="true"
      />

      <div className="relative z-10 w-full max-w-sm rounded-3xl border border-amber-100 bg-white p-6 shadow-2xl">
        <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-100 text-3xl">
          👋
        </div>

        <h3 className="text-center text-lg font-extrabold text-stone-800">
          Keluar dari Akun {playerName}?
        </h3>

        <p className="mt-2 text-center text-xs text-stone-600">
          {isGuest
            ? "Kamu sedang dalam mode akun tamu. Pastikan kamu sudah menyalin kode pemulihan agar dapat melanjutkan progres kucingmu nanti."
            : "Progres perawatan Mochi sudah tersimpan otomatis di cloud. Kamu bisa masuk kembali kapan saja."}
        </p>

        <div className="mt-6 flex gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 rounded-2xl border border-stone-200 bg-stone-50 py-3 text-xs font-bold text-stone-700 transition hover:bg-stone-100"
          >
            Batal
          </button>
          <button
            type="button"
            onClick={onConfirmLogout}
            className="flex-1 rounded-2xl bg-rose-500 py-3 text-xs font-bold text-white shadow-md transition hover:bg-rose-600 active:scale-95"
          >
            Ya, Keluar
          </button>
        </div>
      </div>
    </div>
  );
}
