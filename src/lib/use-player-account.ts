"use client";

import { useCallback, useSyncExternalStore } from "react";
import { mockDefaultAccount, mockGuestAccount, type PlayerAccount } from "@/lib/mock-account";

const STORAGE_KEY = "mochi_active_account";

let cachedRaw: string | null = null;
let cachedAccount: PlayerAccount = mockDefaultAccount;

function getSnapshot(): PlayerAccount {
  if (typeof window === "undefined") return mockGuestAccount;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw !== cachedRaw) {
      cachedRaw = raw;
      cachedAccount = raw ? (JSON.parse(raw) as PlayerAccount) : mockDefaultAccount;
    }
  } catch {
    cachedAccount = mockDefaultAccount;
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
    const freshGuest: PlayerAccount = {
      ...mockGuestAccount,
      id: `user-guest-${Date.now()}`,
      joinedAt: "Hari ini",
      lastActiveAt: "Baru saja",
    };
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
