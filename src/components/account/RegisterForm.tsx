"use client";

import { useId, useState } from "react";
import type { PlayerAccount } from "@/lib/mock-account";

const EXISTING_EMAILS = ["budi.catlover@example.com", "admin@mochi.pet", "kucing@mochi.pet"];

const FUR_PRESETS = [
  { id: "orange", name: "Kuning Belang (Tabby)", hex: "#f4b673" },
  { id: "calico", name: "Tiga Warna (Calico)", hex: "#e07a5f" },
  { id: "snow", name: "Putih Salju", hex: "#f8f9fa" },
  { id: "charcoal", name: "Abu Berbulu", hex: "#6c757d" },
];

export interface RegisterFormProps {
  onSuccess: (newAccount: PlayerAccount) => void;
  onSwitchToLogin: () => void;
}

export function computePasswordStrength(pw: string): {
  score: number; // 0 - 3
  label: string;
  color: string;
} {
  if (!pw) return { score: 0, label: "Belum diisi", color: "bg-stone-200" };
  let s = 0;
  if (pw.length >= 6) s += 1;
  if (pw.length >= 10 || (/[A-Z]/.test(pw) && /[0-9]/.test(pw))) s += 1;
  if (/[^A-Za-z0-9]/.test(pw) && pw.length >= 8) s += 1;

  if (s === 1) return { score: 1, label: "Cukup Lemah", color: "bg-rose-500" };
  if (s === 2) return { score: 2, label: "Sedang", color: "bg-amber-500" };
  return { score: 3, label: "Kuat & Aman", color: "bg-emerald-500" };
}

export default function RegisterForm({ onSuccess, onSwitchToLogin }: RegisterFormProps) {
  const nameId = useId();
  const emailId = useId();
  const passwordId = useId();
  const confirmPasswordId = useId();
  const catNameId = useId();
  const cloudAgreeId = useId();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [catName, setCatName] = useState("Mochi");
  const [selectedFur, setSelectedFur] = useState(FUR_PRESETS[0]);
  const [agreeCloud, setAgreeCloud] = useState(true);

  // Validation errors
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [generalError, setGeneralError] = useState<string | null>(null);

  const errors: Record<string, string | null> = {};

  if (name.trim().length === 0) {
    errors.name = "Nama pemain tidak boleh kosong.";
  } else if (name.trim().length < 2) {
    errors.name = "Nama pemain minimal 2 karakter.";
  } else if (name.trim().length > 30) {
    errors.name = "Nama pemain maksimal 30 karakter.";
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!email.trim()) {
    errors.email = "Alamat email wajib diisi.";
  } else if (!emailRegex.test(email.trim())) {
    errors.email = "Format email tidak valid (contoh: kamu@domain.com).";
  } else if (EXISTING_EMAILS.includes(email.trim().toLowerCase())) {
    errors.email = "Email ini sudah terdaftar! Gunakan email lain atau masuk.";
  }

  if (!password) {
    errors.password = "Kata sandi wajib diisi.";
  } else if (password.length < 6) {
    errors.password = "Kata sandi minimal 6 karakter.";
  }

  if (!confirmPassword) {
    errors.confirmPassword = "Harap ulangi kata sandi.";
  } else if (confirmPassword !== password) {
    errors.confirmPassword = "Konfirmasi kata sandi tidak cocok.";
  }

  if (catName.trim().length === 0) {
    errors.catName = "Nama kucing tidak boleh kosong.";
  }

  const markTouched = (field: string) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
  };

  const strength = computePasswordStrength(password);
  const hasErrors = Object.keys(errors).length > 0;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setTouched({
      name: true,
      email: true,
      password: true,
      confirmPassword: true,
      catName: true,
    });
    setGeneralError(null);

    if (hasErrors) {
      setGeneralError("Harap perbaiki kolom yang belum sesuai sebelum mendaftar.");
      return;
    }

    if (!agreeCloud) {
      setGeneralError("Harap setujui penyimpanan progres di cloud.");
      return;
    }

    setIsSubmitting(true);

    setTimeout(() => {
      setIsSubmitting(false);
      const randomCode = `MOCHI-${Math.random().toString(36).substring(2, 6).toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;

      const newAccount: PlayerAccount = {
        id: `user-${Date.now()}`,
        name: name.trim(),
        email: email.trim(),
        avatar: "🐱",
        isGuest: false,
        recoveryCode: randomCode,
        joinedAt: "Hari ini",
        lastActiveAt: "Baru saja",
        linkedCat: {
          id: `cat-${Date.now()}`,
          name: catName.trim() || "Mochi",
          stage: "anak",
          level: 1,
          experience: 0,
          closeness: 50,
          furColor: selectedFur.hex,
        },
        deviceLabel: "Perangkat ini (Akun Baru)",
      };

      onSuccess(newAccount);
    }, 800);
  };

  return (
    <div className="rounded-3xl border border-amber-100 bg-white/95 p-6 shadow-lg backdrop-blur-sm sm:p-8">
      <div className="mb-6 text-center">
        <div className="mx-auto mb-2 flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-100 text-3xl">
          ✨
        </div>
        <h2 className="text-xl font-extrabold text-stone-800">Daftar Akun Baru</h2>
        <p className="mt-1 text-xs text-stone-500">
          Simpan seluruh data kucing Mochi dan progres bermainmu selamanya di cloud.
        </p>
      </div>

      {generalError && (
        <div className="mb-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-2.5 text-xs font-bold text-rose-700">
          ⚠️ {generalError}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        {/* Nama Pemain */}
        <div>
          <label htmlFor={nameId} className="block text-xs font-bold text-stone-700">
            Nama Pemain / Panggilan
          </label>
          <input
            id={nameId}
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onBlur={() => markTouched("name")}
            placeholder="Contoh: Budi Kucing"
            className={`mt-1 w-full rounded-2xl border bg-stone-50 px-4 py-3 text-base sm:text-sm font-semibold text-stone-800 outline-none transition focus:bg-white focus:ring-2 ${
              touched.name && errors.name
                ? "border-rose-400 focus:border-rose-500 focus:ring-rose-200"
                : "border-stone-200 focus:border-amber-400 focus:ring-amber-200"
            }`}
          />
          {touched.name && errors.name && (
            <p className="mt-1 text-xs font-semibold text-rose-600">⚠️ {errors.name}</p>
          )}
        </div>

        {/* Alamat Email */}
        <div>
          <label htmlFor={emailId} className="block text-xs font-bold text-stone-700">
            Alamat Email
          </label>
          <input
            id={emailId}
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onBlur={() => markTouched("email")}
            placeholder="nama@email.com"
            className={`mt-1 w-full rounded-2xl border bg-stone-50 px-4 py-3 text-base sm:text-sm font-semibold text-stone-800 outline-none transition focus:bg-white focus:ring-2 ${
              touched.email && errors.email
                ? "border-rose-400 focus:border-rose-500 focus:ring-rose-200"
                : "border-stone-200 focus:border-amber-400 focus:ring-amber-200"
            }`}
          />
          {touched.email && errors.email && (
            <p className="mt-1 text-xs font-semibold text-rose-600">⚠️ {errors.email}</p>
          )}
        </div>

        {/* Kata Sandi */}
        <div>
          <label htmlFor={passwordId} className="block text-xs font-bold text-stone-700">
            Kata Sandi
          </label>
          <input
            id={passwordId}
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onBlur={() => markTouched("password")}
            placeholder="Minimal 6 karakter"
            className={`mt-1 w-full rounded-2xl border bg-stone-50 px-4 py-3 text-base sm:text-sm font-semibold text-stone-800 outline-none transition focus:bg-white focus:ring-2 ${
              touched.password && errors.password
                ? "border-rose-400 focus:border-rose-500 focus:ring-rose-200"
                : "border-stone-200 focus:border-amber-400 focus:ring-amber-200"
            }`}
          />
          {/* Bar Kekuatan Sandi */}
          {password && (
            <div className="mt-2 space-y-1">
              <div className="flex h-1.5 w-full overflow-hidden rounded-full bg-stone-100">
                <div
                  className={`transition-all duration-300 ${strength.color}`}
                  style={{ width: `${(strength.score / 3) * 100}%` }}
                />
              </div>
              <p className="text-[11px] font-semibold text-stone-500">
                Kekuatan sandi: <span className="font-bold text-stone-700">{strength.label}</span>
              </p>
            </div>
          )}
          {touched.password && errors.password && (
            <p className="mt-1 text-xs font-semibold text-rose-600">⚠️ {errors.password}</p>
          )}
        </div>

        {/* Ulangi Kata Sandi */}
        <div>
          <label htmlFor={confirmPasswordId} className="block text-xs font-bold text-stone-700">
            Ulangi Kata Sandi
          </label>
          <input
            id={confirmPasswordId}
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            onBlur={() => markTouched("confirmPassword")}
            placeholder="Masukkan kembali kata sandi"
            className={`mt-1 w-full rounded-2xl border bg-stone-50 px-4 py-3 text-base sm:text-sm font-semibold text-stone-800 outline-none transition focus:bg-white focus:ring-2 ${
              touched.confirmPassword && errors.confirmPassword
                ? "border-rose-400 focus:border-rose-500 focus:ring-rose-200"
                : "border-stone-200 focus:border-amber-400 focus:ring-amber-200"
            }`}
          />
          {touched.confirmPassword && errors.confirmPassword && (
            <p className="mt-1 text-xs font-semibold text-rose-600">⚠️ {errors.confirmPassword}</p>
          )}
        </div>

        {/* Nama Kucing Pertama & Warna Bulu */}
        <div className="rounded-2xl border border-amber-100 bg-[#fffdf9] p-4 space-y-3">
          <div>
            <label htmlFor={catNameId} className="block text-xs font-bold text-amber-900">
              🐾 Nama Kucing Virtual Pertamamu
            </label>
            <input
              id={catNameId}
              type="text"
              value={catName}
              onChange={(e) => setCatName(e.target.value)}
              placeholder="Mochi"
              className="mt-1 w-full rounded-xl border border-amber-200 bg-white px-3 py-2 text-sm font-bold text-stone-800 outline-none ring-1 ring-amber-200/50 focus:ring-2 focus:ring-amber-400"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-amber-900">Pilihan Warna Bulu:</label>
            <div className="mt-1.5 grid grid-cols-2 gap-2 sm:grid-cols-4">
              {FUR_PRESETS.map((fur) => (
                <button
                  key={fur.id}
                  type="button"
                  onClick={() => setSelectedFur(fur)}
                  className={`flex items-center gap-2 rounded-xl border p-2 text-xs font-bold transition ${
                    selectedFur.id === fur.id
                      ? "border-amber-500 bg-amber-100 text-amber-900 shadow-sm"
                      : "border-stone-200 bg-white text-stone-600 hover:bg-stone-50"
                  }`}
                >
                  <span
                    className="h-3.5 w-3.5 rounded-full border border-stone-300"
                    style={{ backgroundColor: fur.hex }}
                  />
                  <span className="truncate">{fur.name}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Persetujuan Cloud Autosave */}
        <div className="flex items-start gap-2 pt-1 text-xs text-stone-600">
          <input
            type="checkbox"
            id={cloudAgreeId}
            checked={agreeCloud}
            onChange={(e) => setAgreeCloud(e.target.checked)}
            className="mt-0.5 rounded border-stone-300 text-amber-500 focus:ring-amber-400"
          />
          <label htmlFor={cloudAgreeId} className="cursor-pointer select-none">
            Saya menyetujui penyimpanan progres dan pemulihan otomatis di cloud agar Mochi selalu aman.
          </label>
        </div>

        {/* Tombol Submit */}
        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full rounded-2xl bg-emerald-600 py-3.5 text-sm font-extrabold text-white shadow-md transition hover:bg-emerald-700 active:scale-95 disabled:opacity-50"
        >
          {isSubmitting ? "Mendaftarkan Akun…" : "Daftar & Hubungkan Mochi 🎉"}
        </button>
      </form>

      <div className="mt-6 border-t border-stone-100 pt-5 text-center">
        <p className="text-xs text-stone-600">
          Sudah punya akun?{" "}
          <button
            type="button"
            onClick={onSwitchToLogin}
            className="font-extrabold text-amber-700 hover:underline"
          >
            Masuk ke akunmu di sini
          </button>
        </p>
      </div>
    </div>
  );
}
