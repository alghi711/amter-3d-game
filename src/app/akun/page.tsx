import { Metadata } from "next";
import AccountView from "@/components/account/AccountView";

export const metadata: Metadata = {
  title: "Akun & Profil Pemain — MOCHI Kucing Virtual",
  description: "Kelola profil pemain, masuk ke akun, simpan progres permanen, dan pulihkan akun Mochi Kucing Virtual.",
};

export default function AkunPage() {
  return (
    <main className="min-h-screen w-full bg-[#f8f3eb] py-8 px-4 sm:py-12">
      <AccountView />
    </main>
  );
}
