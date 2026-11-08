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

export const mockDefaultAccount: PlayerAccount = {
  id: "user-mochi-player-01",
  name: "Budi Petualang",
  email: "budi.catlover@example.com",
  avatar: "🐱",
  isGuest: false,
  recoveryCode: "MOCHI-7K9A-4M2P-9XQ3",
  joinedAt: "1 November 2026",
  lastActiveAt: "Baru saja",
  linkedCat: {
    id: "cat-mochi",
    name: "Mochi",
    stage: "anak",
    level: 3,
    experience: 145,
    closeness: 74,
    furColor: "#f4b673",
  },
  deviceLabel: "Laptop Safari · macOS",
};

export const mockGuestAccount: PlayerAccount = {
  id: "user-guest-mochi-882",
  name: "Tamu Petualang #882",
  email: null,
  avatar: "🐾",
  isGuest: true,
  recoveryCode: "MOCHI-GUEST-3819-XK72",
  joinedAt: "8 November 2026",
  lastActiveAt: "Baru saja",
  linkedCat: {
    id: "cat-mochi",
    name: "Mochi",
    stage: "anak",
    level: 3,
    experience: 145,
    closeness: 74,
    furColor: "#f4b673",
  },
  deviceLabel: "Perangkat ini (Tamu)",
};
