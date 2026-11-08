"use client";

import { useState } from "react";
import Link from "next/link";
import RegisterForm from "./RegisterForm";
import LoginForm from "./LoginForm";
import LogoutConfirmModal from "./LogoutConfirmModal";
import PasswordRecoveryFlow from "./PasswordRecoveryFlow";
import { mockDefaultAccount, mockGuestAccount, type PlayerAccount } from "@/lib/mock-account";

const AVATAR_OPTIONS = ["🐱", "🐾", "😸", "😻", "😽", "🦊", "🦁", "⭐", "🎀", "🍪"];

type AccountTab = "profil" | "masuk" | "daftar" | "pulihkan";

interface AccountViewProps {
  initialAccount?: PlayerAccount;
  onBackToGame?: () => void;
  onAccountChange?: (account: PlayerAccount) => void;
  isModal?: boolean;
}

export default function AccountView({
  initialAccount = mockDefaultAccount,
  onBackToGame,
  onAccountChange,
  isModal = false,
}: AccountViewProps) {
  const [account, setAccount] = useState<PlayerAccount>(initialAccount);
  const [activeTab, setActiveTab] = useState<AccountTab>("profil");
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [dismissFriendlyTip, setDismissFriendlyTip] = useState(false);

  const updateAccount = (updater: (prev: PlayerAccount) => PlayerAccount) => {
    setAccount((prev) => {
      const next = updater(prev);
      onAccountChange?.(next);
      return next;
    });
  };

  // Form states
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);
  const [editingName, setEditingName] = useState(false);
  const [tempName, setTempName] = useState(account.name);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleCopyRecoveryCode = () => {
    navigator.clipboard.writeText(account.recoveryCode);
    setCopiedCode(true);
    showToast("Kode pemulihan berhasil disalin! 📋");
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const handleSaveName = () => {
    if (!tempName.trim()) return;
    updateAccount((prev) => ({ ...prev, name: tempName.trim() }));
    setEditingName(false);
    showToast("Nama pemain berhasil diperbarui! ✨");
  };

  const handleSelectAvatar = (avatar: string) => {
    updateAccount((prev) => ({ ...prev, avatar }));
    showToast(`Avatar diubah menjadi ${avatar}! 🎨`);
  };

  const handleSwitchToGuest = () => {
    updateAccount(() => mockGuestAccount);
    setTempName(mockGuestAccount.name);
    showToast("Beralih ke sesi akun tamu 🐾");
  };

  return (
    <div className={`mx-auto w-full max-w-2xl ${isModal ? "p-1" : "p-4 sm:p-6"}`}>
      {/* Toast Notifikasi */}
      {toastMessage && (
        <div className="fixed top-5 left-1/2 z-50 -translate-x-1/2 rounded-full border border-amber-300 bg-stone-900/90 px-4 py-2 text-xs font-bold text-white shadow-xl backdrop-blur-md transition-all sm:text-sm">
          {toastMessage}
        </div>
      )}

      {/* Header Halaman */}
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          {onBackToGame ? (
            <button
              type="button"
              onClick={onBackToGame}
              className="flex items-center gap-1.5 rounded-full border border-amber-200 bg-white/90 px-3.5 py-1.5 text-xs font-bold text-amber-900 shadow-sm transition hover:bg-amber-50 active:scale-95"
            >
              ← Kembali ke Rumah
            </button>
          ) : (
            <Link
              href="/"
              className="flex items-center gap-1.5 rounded-full border border-amber-200 bg-white/90 px-3.5 py-1.5 text-xs font-bold text-amber-900 shadow-sm transition hover:bg-amber-50 active:scale-95"
            >
              ← Kembali ke Rumah
            </Link>
          )}
          <h1 className="text-xl font-extrabold tracking-tight text-stone-800 sm:text-2xl">
            Akun & Profil Pemain 🐾
          </h1>
        </div>

        {/* Status Mode Akun (Tamu / Terdaftar) */}
        <span
          className={`rounded-full px-3 py-1 text-xs font-bold ${
            account.isGuest
              ? "border border-amber-200 bg-amber-100 text-amber-800"
              : "border border-emerald-200 bg-emerald-100 text-emerald-800"
          }`}
        >
          {account.isGuest ? "Mode Tamu" : "Akun Terdaftar"}
        </span>
      </div>

      {/* Friendly Tip Banner */}
      {!dismissFriendlyTip && (
        <div className="mb-5 flex items-start justify-between gap-3 rounded-2xl border border-amber-200 bg-amber-50/90 p-3.5 text-xs text-amber-900 shadow-sm sm:text-sm">
          <div className="flex items-start gap-2.5">
            <span className="text-xl leading-none">💡</span>
            <div>
              <p className="font-extrabold text-stone-850">
                {account.isGuest
                  ? "Tips Bermain: Amankan Kucing Virtualmu!"
                  : `Hai ${account.name}! Progresmu Aman di Cloud`}
              </p>
              <p className="mt-0.5 text-xs text-stone-600 leading-relaxed">
                {account.isGuest
                  ? "Kamu sedang bermain dalam Mode Tamu. Progres tersimpan di peramban ini. Hubungkan email atau simpan Kode Pemulihan agar kamu bisa melanjutkan merawat Mochi kapan saja saat ganti HP."
                  : "Semua interaksi makan, tidur, dan kasih sayang dengan Mochi tersimpan otomatis. Kamu bisa membuka akun ini dari perangkat mana saja."}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setDismissFriendlyTip(true)}
            className="rounded-lg p-1 text-stone-400 hover:bg-amber-100 hover:text-stone-700"
            aria-label="Tutup tips"
          >
            ✕
          </button>
        </div>
      )}

      {/* Navigasi Tab */}
      <div className="mb-6 flex overflow-x-auto rounded-2xl border border-amber-200/80 bg-amber-50/70 p-1.5 shadow-sm">
        <button
          type="button"
          onClick={() => setActiveTab("profil")}
          className={`flex-1 min-h-[42px] whitespace-nowrap rounded-xl px-2 py-2 text-xs font-extrabold transition sm:text-sm ${
            activeTab === "profil"
              ? "bg-white text-stone-800 shadow-sm"
              : "text-stone-600 hover:text-stone-900"
          }`}
        >
          👤 Profil Saya
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("masuk")}
          className={`flex-1 min-h-[42px] whitespace-nowrap rounded-xl px-2 py-2 text-xs font-extrabold transition sm:text-sm ${
            activeTab === "masuk"
              ? "bg-white text-stone-800 shadow-sm"
              : "text-stone-600 hover:text-stone-900"
          }`}
        >
          🔑 Masuk
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("daftar")}
          className={`flex-1 min-h-[42px] whitespace-nowrap rounded-xl px-2 py-2 text-xs font-extrabold transition sm:text-sm ${
            activeTab === "daftar"
              ? "bg-white text-stone-800 shadow-sm"
              : "text-stone-600 hover:text-stone-900"
          }`}
        >
          ✨ Daftar Baru
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("pulihkan")}
          className={`flex-1 min-h-[42px] whitespace-nowrap rounded-xl px-2 py-2 text-xs font-extrabold transition sm:text-sm ${
            activeTab === "pulihkan"
              ? "bg-white text-stone-800 shadow-sm"
              : "text-stone-600 hover:text-stone-900"
          }`}
        >
          🔄 Pulihkan
        </button>
      </div>

      {/* Konten Tab 1: Profil Pemain */}
      {activeTab === "profil" && (
        <div className="space-y-5">
          {/* Kartu Profil Utama */}
          <div className="rounded-3xl border border-amber-100 bg-white/95 p-5 shadow-lg backdrop-blur-sm sm:p-6">
            <div className="flex flex-col items-center gap-4 text-center sm:flex-row sm:text-left">
              {/* Avatar Pemain */}
              <div className="relative group">
                <div className="flex h-20 w-20 items-center justify-center rounded-3xl border-4 border-amber-200 bg-amber-100 text-4xl shadow-inner">
                  {account.avatar}
                </div>
              </div>

              {/* Info Nama & Identitas */}
              <div className="flex-1 space-y-1">
                <div className="flex flex-wrap items-center justify-center gap-2 sm:justify-start">
                  {editingName ? (
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={tempName}
                        onChange={(e) => setTempName(e.target.value)}
                        className="rounded-xl border border-amber-300 px-3 py-1 text-sm font-bold text-stone-800 outline-none ring-2 ring-amber-300/40"
                        placeholder="Nama pemain..."
                      />
                      <button
                        type="button"
                        onClick={handleSaveName}
                        className="rounded-xl bg-amber-500 px-3 py-1 text-xs font-bold text-white shadow hover:bg-amber-600"
                      >
                        Simpan
                      </button>
                    </div>
                  ) : (
                    <>
                      <h2 className="text-xl font-extrabold text-stone-800 sm:text-2xl">{account.name}</h2>
                      <button
                        type="button"
                        onClick={() => {
                          setTempName(account.name);
                          setEditingName(true);
                        }}
                        className="rounded-full bg-stone-100 px-2 py-0.5 text-[11px] font-semibold text-stone-600 hover:bg-stone-200"
                      >
                        ✏️ Ubah
                      </button>
                    </>
                  )}
                </div>

                <p className="text-xs text-stone-500 sm:text-sm">
                  {account.email ?? "Belum ada email terhubung (Akun Tamu)"}
                </p>

                <div className="flex flex-wrap items-center justify-center gap-2 pt-1 text-[11px] font-semibold text-stone-500 sm:justify-start">
                  <span>🗓 Bergabung: {account.joinedAt}</span>
                  <span>•</span>
                  <span>📱 {account.deviceLabel}</span>
                </div>
              </div>
            </div>

            {/* Pilihan Avatar Emoji */}
            <div className="mt-5 border-t border-stone-100 pt-4">
              <label className="text-xs font-bold text-stone-600">Pilih Avatar Pemain:</label>
              <div className="mt-2 flex flex-wrap gap-2">
                {AVATAR_OPTIONS.map((av) => (
                  <button
                    key={av}
                    type="button"
                    onClick={() => handleSelectAvatar(av)}
                    className={`flex h-11 w-11 items-center justify-center rounded-xl text-xl transition hover:scale-110 active:scale-95 ${
                      account.avatar === av
                        ? "border-2 border-amber-500 bg-amber-100 shadow-sm"
                        : "border border-stone-200 bg-stone-50 hover:bg-amber-50"
                    }`}
                  >
                    {av}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Kartu Kucing Terhubung */}
          <div className="rounded-3xl border border-amber-100 bg-white/95 p-5 shadow-lg backdrop-blur-sm sm:p-6">
            <h3 className="mb-3 text-sm font-extrabold uppercase tracking-wider text-amber-800">
              🐾 Kucing Peliharaan yang Terhubung
            </h3>
            <div className="flex flex-col gap-4 rounded-2xl border border-amber-100 bg-[#fffdf9] p-4 sm:flex-row sm:items-center">
              <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-amber-200 text-3xl shadow-sm">
                🐱
              </div>
              <div className="flex-1 space-y-1">
                <div className="flex items-center justify-between">
                  <h4 className="text-base font-extrabold text-stone-800">{account.linkedCat.name}</h4>
                  <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-bold text-amber-800">
                    Level {account.linkedCat.level} · Tahap {account.linkedCat.stage === "anak" ? "Anak Kucing" : "Dewasa"}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2 pt-2 text-xs font-semibold text-stone-600">
                  <div>
                    <span className="text-stone-400">Pengalaman:</span> {account.linkedCat.experience} XP
                  </div>
                  <div>
                    <span className="text-stone-400">Kedekatan:</span> {account.linkedCat.closeness}%
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Kartu Kode Pemulihan Akun (Recovery Code) */}
          <div className="rounded-3xl border border-amber-200 bg-gradient-to-br from-amber-50 via-white to-orange-50 p-5 shadow-lg backdrop-blur-sm sm:p-6">
            <div className="flex items-start justify-between gap-2">
              <div>
                <h3 className="text-sm font-extrabold uppercase tracking-wider text-amber-900">
                  🛡️ Kode Pemulihan Akun (Recovery Code)
                </h3>
                <p className="mt-1 text-xs text-stone-600">
                  Simpan kode ini dengan aman! Jika kamu berganti HP atau browser, gunakan kode ini untuk mengembalikan Mochi dan seluruh progres bermainmu.
                </p>
              </div>
            </div>

            <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-center">
              <div className="flex-1 rounded-2xl border-2 border-dashed border-amber-300 bg-white px-4 py-3 font-mono text-sm font-extrabold tracking-wider text-amber-950 sm:text-base">
                {account.recoveryCode}
              </div>
              <button
                type="button"
                onClick={handleCopyRecoveryCode}
                className="rounded-2xl bg-amber-500 px-5 py-3 text-xs font-extrabold text-white shadow-md transition hover:bg-amber-600 active:scale-95 sm:text-sm"
              >
                {copiedCode ? "✓ Tersalin!" : "📋 Salin Kode"}
              </button>
            </div>
          </div>

          {/* Aksi Tambahan: Beralih Akun / Logout */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
            {account.isGuest ? (
              <button
                type="button"
                onClick={() => setActiveTab("daftar")}
                className="rounded-2xl border border-emerald-300 bg-emerald-50 px-4 py-2.5 text-xs font-bold text-emerald-800 shadow-sm transition hover:bg-emerald-100"
              >
                ✨ Tautkan ke Akun Permanen (Email)
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setShowLogoutModal(true)}
                className="rounded-2xl border border-stone-200 bg-stone-50 px-4 py-2.5 text-xs font-bold text-stone-700 shadow-sm transition hover:bg-stone-100"
              >
                🐾 Keluar & Main sebagai Tamu
              </button>
            )}

            <button
              type="button"
              onClick={() => setActiveTab("masuk")}
              className="rounded-2xl border border-amber-200 bg-white px-4 py-2.5 text-xs font-bold text-amber-800 shadow-sm transition hover:bg-amber-50"
            >
              🔄 Ganti Akun Lain
            </button>
          </div>
        </div>
      )}

      {/* Konten Tab 2: Masuk (Login) */}
      {activeTab === "masuk" && (
        <LoginForm
          onSuccess={(loggedIn) => {
            updateAccount(() => loggedIn);
            setActiveTab("profil");
            showToast(`Selamat datang kembali, ${loggedIn.name}! 🐾`);
          }}
          onSwitchToRegister={() => setActiveTab("daftar")}
          onSwitchToRecovery={() => setActiveTab("pulihkan")}
          onPlayAsGuest={handleSwitchToGuest}
        />
      )}

      {/* Konten Tab 3: Daftar Baru (Register) */}
      {activeTab === "daftar" && (
        <RegisterForm
          onSuccess={(newAccount) => {
            updateAccount(() => newAccount);
            setActiveTab("profil");
            showToast(`Selamat datang, ${newAccount.name}! Akun barumu berhasil didaftarkan 🎉`);
          }}
          onSwitchToLogin={() => setActiveTab("masuk")}
        />
      )}

      {/* Konten Tab 4: Pemulihan Kata Sandi / Akun */}
      {activeTab === "pulihkan" && (
        <PasswordRecoveryFlow
          onSuccess={() => {
            setActiveTab("masuk");
            showToast("Kata sandi berhasil diperbarui! Silakan masuk dengan sandi barumu 🔑");
          }}
          onBackToLogin={() => setActiveTab("masuk")}
        />
      )}
      {/* Modal Konfirmasi Logout */}
      <LogoutConfirmModal
        isOpen={showLogoutModal}
        playerName={account.name}
        isGuest={account.isGuest}
        onCancel={() => setShowLogoutModal(false)}
        onConfirmLogout={() => {
          setShowLogoutModal(false);
          handleSwitchToGuest();
        }}
      />
    </div>
  );
}
