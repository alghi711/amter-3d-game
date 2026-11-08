"use client";

import { useId, useState } from "react";
import { computePasswordStrength } from "./RegisterForm";

export interface PasswordRecoveryFlowProps {
  onSuccess: (emailOrCode: string) => void;
  onBackToLogin: () => void;
}

type RecoveryMethod = "email" | "code";
type Step = "input" | "verify" | "reset" | "completed";

export default function PasswordRecoveryFlow({
  onSuccess,
  onBackToLogin,
}: PasswordRecoveryFlowProps) {
  const emailInputId = useId();
  const recoveryCodeInputId = useId();
  const otpInputId = useId();
  const newPasswordId = useId();
  const confirmPasswordId = useId();

  const [method, setMethod] = useState<RecoveryMethod>("email");
  const [step, setStep] = useState<Step>("input");

  // Form states
  const [email, setEmail] = useState("");
  const [recoveryCode, setRecoveryCode] = useState("");
  const [otp, setOtp] = useState("");
  const [simulatedOtp, setSimulatedOtp] = useState("842-109");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [resendCooldown, setResendCooldown] = useState(0);

  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const startResendTimer = () => {
    setResendCooldown(30);
    const interval = setInterval(() => {
      setResendCooldown((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const handleStep1Submit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (method === "email") {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!email.trim() || !emailRegex.test(email.trim())) {
        setErrorMessage("Harap masukkan format email yang valid (contoh: kamu@domain.com).");
        return;
      }

      setIsSubmitting(true);
      setTimeout(() => {
        setIsSubmitting(false);
        const code = `${Math.floor(100 + Math.random() * 900)}-${Math.floor(100 + Math.random() * 900)}`;
        setSimulatedOtp(code);
        setStep("verify");
        startResendTimer();
      }, 600);
    } else {
      if (!recoveryCode.trim() || recoveryCode.trim().length < 8) {
        setErrorMessage("Harap masukkan Kode Pemulihan Akun yang lengkap (contoh: MOCHI-XXXX-XXXX-XXXX).");
        return;
      }
      setIsSubmitting(true);
      setTimeout(() => {
        setIsSubmitting(false);
        setStep("reset");
      }, 500);
    }
  };

  const handleStep2Verify = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const cleanInput = otp.replace(/[^0-9]/g, "");
    const cleanSimulated = simulatedOtp.replace(/[^0-9]/g, "");

    if (cleanInput.length < 6) {
      setErrorMessage("Kode verifikasi OTP harus terdiri dari 6 angka.");
      return;
    }

    if (cleanInput !== cleanSimulated && cleanInput !== "123456") {
      setErrorMessage("Kode verifikasi salah! Coba periksa kembali kode simulasi di atas.");
      return;
    }

    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      setStep("reset");
    }, 500);
  };

  const handleStep3Reset = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!newPassword || newPassword.length < 6) {
      setErrorMessage("Kata sandi baru minimal 6 karakter.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setErrorMessage("Konfirmasi kata sandi tidak cocok.");
      return;
    }

    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      setStep("completed");
    }, 700);
  };

  const strength = computePasswordStrength(newPassword);

  return (
    <div className="rounded-3xl border border-amber-100 bg-white/95 p-6 shadow-lg backdrop-blur-sm sm:p-8">
      {/* Header Alur Pemulihan */}
      <div className="mb-6 text-center">
        <div className="mx-auto mb-2 flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-100 text-3xl">
          🔑
        </div>
        <h2 className="text-xl font-extrabold text-stone-800">Pulihkan Akun & Kata Sandi</h2>
        <p className="mt-1 text-xs text-stone-500">
          Kembalikan akses ke kucing Mochi kesayanganmu dengan mudah dan aman.
        </p>
      </div>

      {/* Indikator Langkah (Stepper) */}
      <div className="mb-6 flex items-center justify-between px-2">
        {[
          { key: "input", label: "Identitas", num: 1 },
          { key: "verify", label: "Verifikasi", num: 2 },
          { key: "reset", label: "Sandi Baru", num: 3 },
          { key: "completed", label: "Selesai", num: 4 },
        ].map((s, idx, arr) => {
          const isDone =
            (step === "verify" && idx === 0) ||
            (step === "reset" && idx <= 1) ||
            step === "completed";
          const isCurrent = step === s.key;

          return (
            <div key={s.key} className="flex flex-1 items-center">
              <div className="flex flex-col items-center">
                <div
                  className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-extrabold transition-all ${
                    isDone
                      ? "bg-emerald-500 text-white shadow-sm"
                      : isCurrent
                      ? "bg-amber-500 text-white shadow-md ring-4 ring-amber-100"
                      : "bg-stone-100 text-stone-400"
                  }`}
                >
                  {isDone ? "✓" : s.num}
                </div>
                <span
                  className={`mt-1 text-[10px] font-bold ${
                    isCurrent ? "text-stone-800" : "text-stone-400"
                  }`}
                >
                  {s.label}
                </span>
              </div>
              {idx < arr.length - 1 && (
                <div
                  className={`mx-2 h-1 flex-1 rounded-full transition-colors ${
                    isDone ? "bg-emerald-400" : "bg-stone-200"
                  }`}
                />
              )}
            </div>
          );
        })}
      </div>

      {errorMessage && (
        <div className="mb-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-2.5 text-xs font-bold text-rose-700">
          ⚠️ {errorMessage}
        </div>
      )}

      {/* LANGKAH 1: Masukkan Email atau Kode Pemulihan */}
      {step === "input" && (
        <form onSubmit={handleStep1Submit} className="space-y-4">
          <div className="flex rounded-xl border border-stone-200 bg-stone-50 p-1 text-xs font-bold">
            <button
              type="button"
              onClick={() => {
                setMethod("email");
                setErrorMessage(null);
              }}
              className={`flex-1 rounded-lg py-1.5 transition ${
                method === "email"
                  ? "bg-white text-stone-800 shadow-sm"
                  : "text-stone-500 hover:text-stone-800"
              }`}
            >
              ✉️ Kirim ke Email
            </button>
            <button
              type="button"
              onClick={() => {
                setMethod("code");
                setErrorMessage(null);
              }}
              className={`flex-1 rounded-lg py-1.5 transition ${
                method === "code"
                  ? "bg-white text-stone-800 shadow-sm"
                  : "text-stone-500 hover:text-stone-800"
              }`}
            >
              🛡️ Pakai Kode Pemulihan
            </button>
          </div>

          {method === "email" ? (
            <div>
              <label htmlFor={emailInputId} className="block text-xs font-bold text-stone-700">
                Alamat Email Terdaftar
              </label>
              <input
                id={emailInputId}
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="nama@email.com"
                className="mt-1 w-full rounded-2xl border border-stone-200 bg-stone-50 px-4 py-3 text-base sm:text-sm font-semibold text-stone-800 outline-none transition focus:border-amber-400 focus:bg-white focus:ring-2 focus:ring-amber-200"
              />
              <p className="mt-1 text-[11px] text-stone-500">
                Kami akan mengirimkan 6-digit kode verifikasi ke email kamu.
              </p>
            </div>
          ) : (
            <div>
              <label htmlFor={recoveryCodeInputId} className="block text-xs font-bold text-stone-700">
                Kode Pemulihan Akun (Recovery Code)
              </label>
              <input
                id={recoveryCodeInputId}
                type="text"
                value={recoveryCode}
                onChange={(e) => setRecoveryCode(e.target.value.toUpperCase())}
                placeholder="MOCHI-XXXX-XXXX-XXXX"
                className="mt-1 w-full rounded-2xl border border-stone-200 bg-stone-50 px-4 py-3 font-mono text-base sm:text-sm font-semibold text-stone-800 outline-none transition focus:border-amber-400 focus:bg-white focus:ring-2 focus:ring-amber-200"
              />
              <p className="mt-1 text-[11px] text-stone-500">
                Gunakan kode 12 digit yang pernah kamu simpan dari halaman profil.
              </p>
            </div>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full rounded-2xl bg-amber-500 py-3.5 text-sm font-extrabold text-white shadow-md transition hover:bg-amber-600 active:scale-95 disabled:opacity-50"
          >
            {isSubmitting ? "Memverifikasi…" : "Lanjutkan Verifikasi 🐾"}
          </button>
        </form>
      )}

      {/* LANGKAH 2: Masukkan Kode OTP (Khusus Email) */}
      {step === "verify" && (
        <form onSubmit={handleStep2Verify} className="space-y-4">
          <div className="rounded-2xl border border-amber-200 bg-amber-50/80 p-3.5 text-xs text-amber-900">
            <span className="font-bold">📨 Kode Simulasi Terkirim ke:</span> {email}
            <div className="mt-1.5 flex items-center justify-between rounded-xl bg-white px-3 py-1.5">
              <span className="font-mono text-sm font-extrabold text-stone-800">{simulatedOtp}</span>
              <button
                type="button"
                onClick={() => setOtp(simulatedOtp)}
                className="rounded-lg bg-amber-100 px-2.5 py-1 text-[11px] font-bold text-amber-800 hover:bg-amber-200"
              >
                Isi Otomatis
              </button>
            </div>
          </div>

          <div>
            <label htmlFor={otpInputId} className="block text-xs font-bold text-stone-700">
              Masukkan 6 Digit Kode Verifikasi
            </label>
            <input
              id={otpInputId}
              type="text"
              maxLength={7}
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              placeholder="123-456"
              className="mt-1 w-full rounded-2xl border border-stone-200 bg-stone-50 px-4 py-3 text-center font-mono text-lg font-extrabold tracking-widest text-stone-800 outline-none transition focus:border-amber-400 focus:bg-white focus:ring-2 focus:ring-amber-200"
            />
          </div>

          <div className="flex items-center justify-between text-xs">
            <button
              type="button"
              disabled={resendCooldown > 0}
              onClick={() => {
                const code = `${Math.floor(100 + Math.random() * 900)}-${Math.floor(100 + Math.random() * 900)}`;
                setSimulatedOtp(code);
                startResendTimer();
              }}
              className="font-bold text-amber-700 hover:underline disabled:text-stone-400"
            >
              {resendCooldown > 0 ? `Kirim ulang (${resendCooldown}s)` : "Kirim ulang kode"}
            </button>

            <button
              type="button"
              onClick={() => setStep("input")}
              className="text-stone-500 hover:text-stone-800"
            >
              Ubah email
            </button>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full rounded-2xl bg-amber-500 py-3.5 text-sm font-extrabold text-white shadow-md transition hover:bg-amber-600 active:scale-95 disabled:opacity-50"
          >
            {isSubmitting ? "Memeriksa Kode…" : "Verifikasi Kode ✨"}
          </button>
        </form>
      )}

      {/* LANGKAH 3: Buat Kata Sandi Baru */}
      {step === "reset" && (
        <form onSubmit={handleStep3Reset} className="space-y-4">
          <div>
            <label htmlFor={newPasswordId} className="block text-xs font-bold text-stone-700">
              Kata Sandi Baru
            </label>
            <input
              id={newPasswordId}
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Minimal 6 karakter"
              className="mt-1 w-full rounded-2xl border border-stone-200 bg-stone-50 px-4 py-3 text-base sm:text-sm font-semibold text-stone-800 outline-none transition focus:border-amber-400 focus:bg-white focus:ring-2 focus:ring-amber-200"
            />
            {newPassword && (
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
          </div>

          <div>
            <label htmlFor={confirmPasswordId} className="block text-xs font-bold text-stone-700">
              Konfirmasi Kata Sandi Baru
            </label>
            <input
              id={confirmPasswordId}
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Ulangi kata sandi baru"
              className="mt-1 w-full rounded-2xl border border-stone-200 bg-stone-50 px-4 py-3 text-base sm:text-sm font-semibold text-stone-800 outline-none transition focus:border-amber-400 focus:bg-white focus:ring-2 focus:ring-amber-200"
            />
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full rounded-2xl bg-emerald-600 py-3.5 text-sm font-extrabold text-white shadow-md transition hover:bg-emerald-700 active:scale-95 disabled:opacity-50"
          >
            {isSubmitting ? "Menyimpan Sandi…" : "Simpan Kata Sandi Baru 🔒"}
          </button>
        </form>
      )}

      {/* LANGKAH 4: Selesai */}
      {step === "completed" && (
        <div className="py-4 text-center space-y-4">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-emerald-100 text-3xl">
            🎉
          </div>
          <h3 className="text-lg font-extrabold text-stone-800">
            Kata Sandi Berhasil Diperbarui!
          </h3>
          <p className="text-xs text-stone-600">
            Akunmu kini sudah aman kembali dengan kata sandi baru. Silakan masuk untuk melanjutkan petualangan bersama Mochi.
          </p>

          <button
            type="button"
            onClick={() => {
              onSuccess(method === "email" ? email : recoveryCode);
            }}
            className="w-full rounded-2xl bg-amber-500 py-3.5 text-sm font-extrabold text-white shadow-md transition hover:bg-amber-600 active:scale-95"
          >
            Masuk dengan Sandi Baru 🐾
          </button>
        </div>
      )}

      {/* Navigasi Balik ke Login */}
      {step !== "completed" && (
        <div className="mt-6 border-t border-stone-100 pt-5 text-center">
          <button
            type="button"
            onClick={onBackToLogin}
            className="text-xs font-extrabold text-stone-600 hover:text-amber-700"
          >
            ← Kembali ke Halaman Masuk
          </button>
        </div>
      )}
    </div>
  );
}
