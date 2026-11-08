"use client";

import { useId, useState } from "react";
import { mockDefaultAccount, mockGuestAccount, type PlayerAccount } from "@/lib/mock-account";

export interface LoginFormProps {
  onSuccess: (account: PlayerAccount) => void;
  onSwitchToRegister: () => void;
  onSwitchToRecovery: () => void;
  onPlayAsGuest: () => void;
}

export default function LoginForm({
  onSuccess,
  onSwitchToRegister,
  onSwitchToRecovery,
  onPlayAsGuest,
}: LoginFormProps) {
  const emailId = useId();
  const passwordId = useId();
  const recoveryCodeId = useId();
  const rememberMeId = useId();

  const [loginMethod, setLoginMethod] = useState<"email" | "recoveryCode">("email");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [recoveryCode, setRecoveryCode] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);

  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [generalError, setGeneralError] = useState<string | null>(null);

  const errors: Record<string, string | null> = {};

  if (loginMethod === "email") {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email.trim()) {
      errors.email = "Alamat email wajib diisi.";
    } else if (!emailRegex.test(email.trim())) {
      errors.email = "Format email tidak valid.";
    }

    if (!password) {
      errors.password = "Kata sandi wajib diisi.";
    } else if (password.length < 6) {
      errors.password = "Kata sandi minimal 6 karakter.";
    }
  } else {
    if (!recoveryCode.trim()) {
      errors.recoveryCode = "Kode pemulihan akun wajib diisi.";
    } else if (recoveryCode.trim().length < 8) {
      errors.recoveryCode = "Format kode pemulihan tidak lengkap (contoh: MOCHI-XXXX-XXXX-XXXX).";
    }
  }

  const markTouched = (field: string) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
  };

  const handleFillDemo = (type: "budi" | "guest") => {
    if (type === "budi") {
      setLoginMethod("email");
      setEmail("budi.catlover@example.com");
      setPassword("mochi123");
      setGeneralError(null);
    } else {
      setLoginMethod("recoveryCode");
      setRecoveryCode("MOCHI-GUEST-3819-XK72");
      setGeneralError(null);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setGeneralError(null);

    if (loginMethod === "email") {
      setTouched({ email: true, password: true });
      if (errors.email || errors.password) {
        setGeneralError("Harap lengkapi email dan kata sandi dengan benar.");
        return;
      }
    } else {
      setTouched({ recoveryCode: true });
      if (errors.recoveryCode) {
        setGeneralError("Harap masukkan kode pemulihan yang valid.");
        return;
      }
    }

    setIsSubmitting(true);

    setTimeout(() => {
      setIsSubmitting(false);

      if (loginMethod === "email") {
        const trimmedEmail = email.trim().toLowerCase();
        // Mock error test
        if (password === "wrong123") {
          setGeneralError("Kata sandi salah. Coba lagi atau gunakan opsi lupa sandi.");
          return;
        }

        const loggedInAccount: PlayerAccount = {
          ...mockDefaultAccount,
          email: trimmedEmail,
          name: trimmedEmail === "budi.catlover@example.com" ? "Budi Petualang" : trimmedEmail.split("@")[0],
          isGuest: false,
          lastActiveAt: "Baru saja",
        };
        onSuccess(loggedInAccount);
      } else {
        const loggedInAccount: PlayerAccount = {
          ...mockGuestAccount,
          recoveryCode: recoveryCode.trim().toUpperCase(),
          lastActiveAt: "Baru saja",
        };
        onSuccess(loggedInAccount);
      }
    }, 700);
  };

  return (
    <div className="rounded-3xl border border-amber-100 bg-white/95 p-6 shadow-lg backdrop-blur-sm sm:p-8">
      <div className="mb-6 text-center">
        <div className="mx-auto mb-2 flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-100 text-3xl">
          🐱
        </div>
        <h2 className="text-xl font-extrabold text-stone-800">Masuk ke Akun Mochi</h2>
        <p className="mt-1 text-xs text-stone-500">
          Lanjutkan perjalanan merawat Mochi dari mana saja tanpa kehilangan progres.
        </p>
      </div>

      {/* Pilihan Metode Masuk: Email vs Kode Pemulihan */}
      <div className="mb-5 flex rounded-xl border border-stone-200 bg-stone-50 p-1 text-xs font-bold">
        <button
          type="button"
          onClick={() => {
            setLoginMethod("email");
            setGeneralError(null);
          }}
          className={`flex-1 rounded-lg py-1.5 transition ${
            loginMethod === "email" ? "bg-white text-stone-800 shadow-sm" : "text-stone-500 hover:text-stone-800"
          }`}
        >
          ✉️ Email & Sandi
        </button>
        <button
          type="button"
          onClick={() => {
            setLoginMethod("recoveryCode");
            setGeneralError(null);
          }}
          className={`flex-1 rounded-lg py-1.5 transition ${
            loginMethod === "recoveryCode" ? "bg-white text-stone-800 shadow-sm" : "text-stone-500 hover:text-stone-800"
          }`}
        >
          🛡️ Kode Pemulihan
        </button>
      </div>

      {/* Preset Cepat Demo */}
      <div className="mb-4 flex flex-wrap items-center justify-between gap-1 rounded-2xl bg-amber-50/80 px-3 py-2 text-[11px] font-semibold text-amber-900">
        <span>⚡ Isi data akun demo:</span>
        <div className="flex gap-1.5">
          <button
            type="button"
            onClick={() => handleFillDemo("budi")}
            className="rounded-lg bg-white px-2 py-0.5 font-bold shadow-xs transition hover:bg-amber-100 active:scale-95"
          >
            Akun Budi
          </button>
          <button
            type="button"
            onClick={() => handleFillDemo("guest")}
            className="rounded-lg bg-white px-2 py-0.5 font-bold shadow-xs transition hover:bg-amber-100 active:scale-95"
          >
            Kode Tamu
          </button>
        </div>
      </div>

      {generalError && (
        <div className="mb-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-2.5 text-xs font-bold text-rose-700">
          ⚠️ {generalError}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        {loginMethod === "email" ? (
          <>
            {/* Field Email */}
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

            {/* Field Password */}
            <div>
              <div className="flex items-center justify-between">
                <label htmlFor={passwordId} className="block text-xs font-bold text-stone-700">
                  Kata Sandi
                </label>
                <button
                  type="button"
                  onClick={onSwitchToRecovery}
                  className="text-xs font-bold text-amber-700 hover:underline"
                >
                  Lupa kata sandi?
                </button>
              </div>
              <div className="relative mt-1">
                <input
                  id={passwordId}
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onBlur={() => markTouched("password")}
                  placeholder="••••••••"
                  className={`w-full rounded-2xl border bg-stone-50 px-4 py-3 pr-11 text-base sm:text-sm font-semibold text-stone-800 outline-none transition focus:bg-white focus:ring-2 ${
                    touched.password && errors.password
                      ? "border-rose-400 focus:border-rose-500 focus:ring-rose-200"
                      : "border-stone-200 focus:border-amber-400 focus:ring-amber-200"
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600"
                  aria-label={showPassword ? "Sembunyikan sandi" : "Lihat sandi"}
                >
                  {showPassword ? "🙈" : "👁️"}
                </button>
              </div>
              {touched.password && errors.password && (
                <p className="mt-1 text-xs font-semibold text-rose-600">⚠️ {errors.password}</p>
              )}
            </div>
          </>
        ) : (
          /* Field Recovery Code */
          <div>
            <label htmlFor={recoveryCodeId} className="block text-xs font-bold text-stone-700">
              Kode Pemulihan Akun (Recovery Code)
            </label>
            <input
              id={recoveryCodeId}
              type="text"
              value={recoveryCode}
              onChange={(e) => setRecoveryCode(e.target.value.toUpperCase())}
              onBlur={() => markTouched("recoveryCode")}
              placeholder="MOCHI-XXXX-XXXX-XXXX"
              className={`mt-1 w-full rounded-2xl border bg-stone-50 px-4 py-3 font-mono text-base sm:text-sm font-semibold text-stone-800 outline-none transition focus:bg-white focus:ring-2 ${
                touched.recoveryCode && errors.recoveryCode
                  ? "border-rose-400 focus:border-rose-500 focus:ring-rose-200"
                  : "border-stone-200 focus:border-amber-400 focus:ring-amber-200"
              }`}
            />
            <p className="mt-1 text-[11px] text-stone-500">
              Gunakan kode 12 karakter yang kamu dapatkan saat bermain untuk memulihkan sesi.
            </p>
            {touched.recoveryCode && errors.recoveryCode && (
              <p className="mt-1 text-xs font-semibold text-rose-600">⚠️ {errors.recoveryCode}</p>
            )}
          </div>
        )}

        {/* Ingat Saya Checkbox */}
        <div className="flex items-center gap-2 pt-1 text-xs text-stone-600">
          <input
            type="checkbox"
            id={rememberMeId}
            checked={rememberMe}
            onChange={(e) => setRememberMe(e.target.checked)}
            className="rounded border-stone-300 text-amber-500 focus:ring-amber-400"
          />
          <label htmlFor={rememberMeId} className="cursor-pointer select-none">
            Ingat saya di perangkat ini
          </label>
        </div>

        {/* Tombol Masuk */}
        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full rounded-2xl bg-amber-500 py-3.5 text-sm font-extrabold text-white shadow-md transition hover:bg-amber-600 active:scale-95 disabled:opacity-50"
        >
          {isSubmitting ? "Memverifikasi Akun…" : "Masuk Sekarang 🐾"}
        </button>
      </form>

      {/* Main sebagai Tamu & Link Daftar */}
      <div className="mt-6 space-y-3 border-t border-stone-100 pt-5 text-center">
        <button
          type="button"
          onClick={onPlayAsGuest}
          className="w-full rounded-2xl border border-stone-200 bg-stone-50 py-2.5 text-xs font-bold text-stone-700 shadow-xs transition hover:bg-stone-100"
        >
          🐾 Lanjut Bermain sebagai Tamu
        </button>

        <p className="text-xs text-stone-600">
          Belum punya akun?{" "}
          <button
            type="button"
            onClick={onSwitchToRegister}
            className="font-extrabold text-amber-700 hover:underline"
          >
            Daftar akun baru gratis
          </button>
        </p>
      </div>
    </div>
  );
}
