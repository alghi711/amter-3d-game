"use client";

import { useState } from "react";
import Link from "next/link";
import { mockDefaultAccount, mockGuestAccount, type PlayerAccount } from "@/lib/mock-account";

const AVATAR_OPTIONS = ["🐱", "🐾", "😸", "😻", "😽", "🦊", "🦁", "⭐", "🎀", "🍪"];

type AccountTab = "profil" | "masuk" | "daftar" | "pulihkan";

interface AccountViewProps {
  initialAccount?: PlayerAccount;
  onBackToGame?: () => void;
  isModal?: boolean;
}

export default function AccountView({
  initialAccount = mockDefaultAccount,
  onBackToGame,
  isModal = false,
}: AccountViewProps) {
  const [account, setAccount] = useState<PlayerAccount>(initialAccount);
  const [activeTab, setActiveTab] = useState<AccountTab>("profil");
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Form states
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [registerName, setRegisterName] = useState("");
  const [registerEmail, setRegisterEmail] = useState("");
  const [registerPassword, setRegisterPassword] = useState("");
  const [recoveryInput, setRecoveryInput] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [copiedCode, setCopiedCode] = useState(false);
  const [editingName, setEditingName] = useState(false);
  const [tempName, setTempName] = useState(account.name);
  const [isSubmitting, setIsSubmitting] = useState(false);

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
    setAccount((prev) => ({ ...prev, name: tempName.trim() }));
    setEditingName(false);
    showToast("Nama pemain berhasil diperbarui! ✨");
  };

  const handleSelectAvatar = (avatar: string) => {
    setAccount((prev) => ({ ...prev, avatar }));
    showToast(`Avatar diubah menjadi ${avatar}! 🎨`);
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginEmail || !loginPassword) {
      showToast("Harap isi email dan kata sandi dengan lengkap! ⚠️");
      return;
    }
    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      setAccount({
        ...mockDefaultAccount,
        email: loginEmail,
        name: loginEmail.split("@")[0].toUpperCase() || "Pemain Mochi",
        isGuest: false,
      });
      setActiveTab("profil");
      showToast("Selamat datang kembali! Akun berhasil masuk 🐾");
    }, 600);
  };

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    if (!registerName || !registerEmail || !registerPassword) {
      showToast("Harap lengkapi semua data pendaftaran! ⚠️");
      return;
    }
    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      setAccount({
        ...mockDefaultAccount,
        id: `user-${Date.now()}`,
        name: registerName,
        email: registerEmail,
        isGuest: false,
        joinedAt: "Hari ini",
      });
      setActiveTab("profil");
      showToast("Hore! Akun barumu berhasil didaftarkan 🎉");
    }, 700);
  };

  const handleRecovery = (e: React.FormEvent) => {
    e.preventDefault();
    if (!recoveryInput || !newPassword) {
      showToast("Masukkan kode pemulihan dan kata sandi baru! ⚠️");
      return;
    }
    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      showToast("Kata sandi berhasil diatur ulang! Silakan masuk kembali 🔑");
      setActiveTab("masuk");
      setRecoveryInput("");
      setNewPassword("");
    }, 700);
  };

  const handleSwitchToGuest = () => {
    setAccount(mockGuestAccount);
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

      {/* Navigasi Tab */}
      <div className="mb-6 flex rounded-2xl border border-amber-200/80 bg-amber-50/70 p-1.5 shadow-sm">
        <button
          type="button"
          onClick={() => setActiveTab("profil")}
          className={`flex-1 rounded-xl py-2 text-xs font-extrabold transition sm:text-sm ${
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
          className={`flex-1 rounded-xl py-2 text-xs font-extrabold transition sm:text-sm ${
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
          className={`flex-1 rounded-xl py-2 text-xs font-extrabold transition sm:text-sm ${
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
          className={`flex-1 rounded-xl py-2 text-xs font-extrabold transition sm:text-sm ${
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
                    className={`flex h-9 w-9 items-center justify-center rounded-xl text-lg transition hover:scale-110 ${
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
                onClick={handleSwitchToGuest}
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
        <div className="rounded-3xl border border-amber-100 bg-white/95 p-6 shadow-lg backdrop-blur-sm sm:p-8">
          <div className="mb-6 text-center">
            <div className="mx-auto mb-2 flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-100 text-3xl">
              🐱
            </div>
            <h2 className="text-xl font-extrabold text-stone-800">Masuk ke Akun Mochi</h2>
            <p className="mt-1 text-xs text-stone-500">
              Lanjutkan petualangan merawat Mochi dari perangkat mana saja.
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-stone-700">Alamat Email</label>
              <input
                type="email"
                required
                value={loginEmail}
                onChange={(e) => setLoginEmail(e.target.value)}
                placeholder="nama@email.com"
                className="mt-1 w-full rounded-2xl border border-stone-200 bg-stone-50 px-4 py-3 text-sm font-semibold text-stone-800 outline-none transition focus:border-amber-400 focus:bg-white focus:ring-2 focus:ring-amber-200"
              />
            </div>

            <div>
              <div className="flex items-center justify-between">
                <label className="block text-xs font-bold text-stone-700">Kata Sandi</label>
                <button
                  type="button"
                  onClick={() => setActiveTab("pulihkan")}
                  className="text-xs font-bold text-amber-700 hover:underline"
                >
                  Lupa kata sandi?
                </button>
              </div>
              <input
                type="password"
                required
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
                placeholder="••••••••"
                className="mt-1 w-full rounded-2xl border border-stone-200 bg-stone-50 px-4 py-3 text-sm font-semibold text-stone-800 outline-none transition focus:border-amber-400 focus:bg-white focus:ring-2 focus:ring-amber-200"
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full rounded-2xl bg-amber-500 py-3.5 text-sm font-extrabold text-white shadow-md transition hover:bg-amber-600 active:scale-95 disabled:opacity-50"
            >
              {isSubmitting ? "Memproses Masuk…" : "Masuk Sekarang 🐾"}
            </button>
          </form>

          <div className="mt-6 border-t border-stone-100 pt-5 text-center">
            <p className="text-xs text-stone-600">
              Belum punya akun?{" "}
              <button
                type="button"
                onClick={() => setActiveTab("daftar")}
                className="font-extrabold text-amber-700 hover:underline"
              >
                Daftar akun baru gratis
              </button>
            </p>
          </div>
        </div>
      )}

      {/* Konten Tab 3: Daftar Baru (Register) */}
      {activeTab === "daftar" && (
        <div className="rounded-3xl border border-amber-100 bg-white/95 p-6 shadow-lg backdrop-blur-sm sm:p-8">
          <div className="mb-6 text-center">
            <div className="mx-auto mb-2 flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-100 text-3xl">
              ✨
            </div>
            <h2 className="text-xl font-extrabold text-stone-800">Daftar Akun Baru</h2>
            <p className="mt-1 text-xs text-stone-500">
              Simpan selamanya data kucing Mochi dan progres bermainmu di cloud.
            </p>
          </div>

          <form onSubmit={handleRegister} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-stone-700">Nama Pemain</label>
              <input
                type="text"
                required
                value={registerName}
                onChange={(e) => setRegisterName(e.target.value)}
                placeholder="Contoh: Budi Kucing"
                className="mt-1 w-full rounded-2xl border border-stone-200 bg-stone-50 px-4 py-3 text-sm font-semibold text-stone-800 outline-none transition focus:border-amber-400 focus:bg-white focus:ring-2 focus:ring-amber-200"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-stone-700">Alamat Email</label>
              <input
                type="email"
                required
                value={registerEmail}
                onChange={(e) => setRegisterEmail(e.target.value)}
                placeholder="nama@email.com"
                className="mt-1 w-full rounded-2xl border border-stone-200 bg-stone-50 px-4 py-3 text-sm font-semibold text-stone-800 outline-none transition focus:border-amber-400 focus:bg-white focus:ring-2 focus:ring-amber-200"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-stone-700">Kata Sandi</label>
              <input
                type="password"
                required
                value={registerPassword}
                onChange={(e) => setRegisterPassword(e.target.value)}
                placeholder="Minimal 6 karakter"
                className="mt-1 w-full rounded-2xl border border-stone-200 bg-stone-50 px-4 py-3 text-sm font-semibold text-stone-800 outline-none transition focus:border-amber-400 focus:bg-white focus:ring-2 focus:ring-amber-200"
              />
            </div>

            <div className="flex items-start gap-2 pt-1 text-xs text-stone-600">
              <input
                type="checkbox"
                defaultChecked
                id="cloud-agree"
                className="mt-0.5 rounded border-stone-300 text-amber-500 focus:ring-amber-400"
              />
              <label htmlFor="cloud-agree">
                Saya ingin progres kucing virtual tersimpan secara aman dan otomatis di cloud.
              </label>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full rounded-2xl bg-emerald-600 py-3.5 text-sm font-extrabold text-white shadow-md transition hover:bg-emerald-700 active:scale-95 disabled:opacity-50"
            >
              {isSubmitting ? "Mendaftarkan…" : "Daftar & Hubungkan Kucing 🎉"}
            </button>
          </form>

          <div className="mt-6 border-t border-stone-100 pt-5 text-center">
            <p className="text-xs text-stone-600">
              Sudah punya akun?{" "}
              <button
                type="button"
                onClick={() => setActiveTab("masuk")}
                className="font-extrabold text-amber-700 hover:underline"
              >
                Masuk ke akunmu di sini
              </button>
            </p>
          </div>
        </div>
      )}

      {/* Konten Tab 4: Pemulihan Kata Sandi / Akun */}
      {activeTab === "pulihkan" && (
        <div className="rounded-3xl border border-amber-100 bg-white/95 p-6 shadow-lg backdrop-blur-sm sm:p-8">
          <div className="mb-6 text-center">
            <div className="mx-auto mb-2 flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-100 text-3xl">
              🔑
            </div>
            <h2 className="text-xl font-extrabold text-stone-800">Pulihkan Akun & Sandi</h2>
            <p className="mt-1 text-xs text-stone-500">
              Gunakan email atau Kode Pemulihan Akun (Recovery Code) untuk membuat sandi baru.
            </p>
          </div>

          <form onSubmit={handleRecovery} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-stone-700">
                Email atau Kode Pemulihan Akun
              </label>
              <input
                type="text"
                required
                value={recoveryInput}
                onChange={(e) => setRecoveryInput(e.target.value)}
                placeholder="nama@email.com atau MOCHI-XXXX-XXXX-XXXX"
                className="mt-1 w-full rounded-2xl border border-stone-200 bg-stone-50 px-4 py-3 text-sm font-mono font-semibold text-stone-800 outline-none transition focus:border-amber-400 focus:bg-white focus:ring-2 focus:ring-amber-200"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-stone-700">Kata Sandi Baru</label>
              <input
                type="password"
                required
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Buat sandi baru minimal 6 karakter"
                className="mt-1 w-full rounded-2xl border border-stone-200 bg-stone-50 px-4 py-3 text-sm font-semibold text-stone-800 outline-none transition focus:border-amber-400 focus:bg-white focus:ring-2 focus:ring-amber-200"
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full rounded-2xl bg-amber-500 py-3.5 text-sm font-extrabold text-white shadow-md transition hover:bg-amber-600 active:scale-95 disabled:opacity-50"
            >
              {isSubmitting ? "Mengatur Ulang…" : "Atur Ulang Kata Sandi 🔑"}
            </button>
          </form>

          <div className="mt-6 border-t border-stone-100 pt-5 text-center">
            <button
              type="button"
              onClick={() => setActiveTab("masuk")}
              className="text-xs font-extrabold text-stone-600 hover:text-amber-700"
            >
              ← Kembali ke Form Masuk
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
