"use client";

import { useCallback, useSyncExternalStore } from "react";
import { createFreshGuestAccount, mockGuestAccount, type PlayerAccount } from "@/lib/mock-account";

const STORAGE_KEY = "mochi_active_account_v2";
const LEGACY_KEYS = ["mochi_active_account", "mochi:autosave:v1"];

let cachedRaw: string | null = null;
let cachedAccount: PlayerAccount = mockGuestAccount;

function getSnapshot(): PlayerAccount {
  if (typeof window === "undefined") return mockGuestAccount;
  try {
    // Bersihkan kunci sesi lama agar pengunjung baru tidak mewarisi akun demo Lv.3
    for (const oldKey of LEGACY_KEYS) {
      if (localStorage.getItem(oldKey) !== null) {
        localStorage.removeItem(oldKey);
      }
    }

    let raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      const fresh = createFreshGuestAccount();
      raw = JSON.stringify(fresh);
      localStorage.setItem(STORAGE_KEY, raw);
    }
    if (raw !== cachedRaw) {
      cachedRaw = raw;
      cachedAccount = JSON.parse(raw) as PlayerAccount;
    }
  } catch {
    cachedAccount = mockGuestAccount;
  }
  return cachedAccount;
}

function getServerSnapshot(): PlayerAccount {
  return mockGuestAccount;
}

const listeners = new Set<() => void>();

function subscribe(listener: () => void) {
  listeners.add(listener);
  const handleStorage = (e: StorageEvent) => {
    if (e.key === STORAGE_KEY) listener();
  };
  window.addEventListener("storage", handleStorage);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", handleStorage);
  };
}

function notify() {
  for (const l of listeners) l();
}

export function usePlayerAccount() {
  const account = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  const saveAccount = useCallback((newAcc: PlayerAccount) => {
    try {
      const serialized = JSON.stringify(newAcc);
      localStorage.setItem(STORAGE_KEY, serialized);
      cachedRaw = serialized;
      cachedAccount = newAcc;
      notify();
    } catch {
      // Abaikan jika storage dinonaktifkan
    }
  }, []);

  const loginAs = useCallback(
    (newAcc: PlayerAccount) => {
      saveAccount({
        ...newAcc,
        lastActiveAt: "Baru saja",
      });
    },
    [saveAccount],
  );

  const logoutToGuest = useCallback(() => {
    const freshGuest = createFreshGuestAccount();
    saveAccount(freshGuest);
    return freshGuest;
  }, [saveAccount]);

  return {
    account,
    loginAs,
    logoutToGuest,
    saveAccount,
  };
}
