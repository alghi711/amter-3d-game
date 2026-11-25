export type PlayerAccount = {
  id: string;
  name: string;
  email: string | null;
  avatar: string;
  isGuest: boolean;
  recoveryCode: string;
  joinedAt: string;
  lastActiveAt: string;
  linkedCat: {
    id: string;
    name: string;
    stage: "anak" | "dewasa";
    level: number;
    experience: number;
    closeness: number;
    furColor: string;
  };
  deviceLabel: string;
};

/** Buat akun tamu baru yang dimulai bersih dari Level 1 (0 XP). */
export function createFreshGuestAccount(customId?: number): PlayerAccount {
  const num = customId ?? Math.floor(1000 + Math.random() * 9000);
  const codePart1 = Math.random().toString(36).substring(2, 6).toUpperCase() || "NEW1";
  const codePart2 = Math.random().toString(36).substring(2, 6).toUpperCase() || "CAT1";
  return {
    id: `user-guest-${num}`,
    name: `Tamu #${num}`,
    email: null,
    avatar: "🐾",
    isGuest: true,
    recoveryCode: `AMTER-${codePart1}-${codePart2}`,
    joinedAt: "Hari ini",
    lastActiveAt: "Baru saja",
    linkedCat: {
      id: "cat-amter",
      name: "Amter",
      stage: "anak",
      level: 1,
      experience: 0,
      closeness: 10,
      furColor: "#f4b673",
    },
    deviceLabel: "Perangkat ini (Tamu Baru)",
  };
}

export const mockGuestAccount: PlayerAccount = {
  id: "user-guest-baru",
  name: "Pemain Tamu",
  email: null,
  avatar: "🐾",
  isGuest: true,
  recoveryCode: "AMTER-TAMU-BARU-0001",
  joinedAt: "Hari ini",
  lastActiveAt: "Baru saja",
  linkedCat: {
    id: "cat-amter",
    name: "Amter",
    stage: "anak",
    level: 1,
    experience: 0,
    closeness: 10,
    furColor: "#f4b673",
  },
  deviceLabel: "Perangkat ini (Tamu)",
};

export const mockDefaultAccount: PlayerAccount = {
  ...mockGuestAccount,
};
