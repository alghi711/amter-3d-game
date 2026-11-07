import { NextRequest, NextResponse } from "next/server";
import { careScore, careStatus } from "@/components/care/CareStatusPanel";
import { DEFAULT_CAT_ID, getCatCareSnapshot } from "@/lib/care-repository";
import type { CatStats } from "@/lib/mock-cat";
import { STAT_LABELS } from "@/lib/use-care";

const SUMMARY_TIPS: Record<keyof CatStats, string> = {
  hunger: "Mangkuk makannya hampir kosong — beri makan, yuk.",
  thirst: "Sepertinya haus. Isi mangkuk minumnya.",
  hygiene: "Bulunya mulai kusam. Mandikan atau bersihkan kandang.",
  happiness: "Ia tampak bosan. Ajak main bola!",
  energy: "Mulai lelah. Biarkan tidur sebentar di kasur.",
};

/** GET /api/care/summary — Mengembalikan ringkasan lengkap kondisi perawatan kucing, skor, status, saran, dan riwayat interaksi. */
export async function GET(req: NextRequest) {
  const catId = req.nextUrl.searchParams.get("catId") ?? DEFAULT_CAT_ID;
  const snapshot = await getCatCareSnapshot(catId);
  const score = careScore(snapshot.stats);
  const status = careStatus(score);

  const keys = Object.keys(STAT_LABELS) as (keyof CatStats)[];
  const lowKeys = keys.filter((k) => snapshot.stats[k] < 50).sort((a, b) => snapshot.stats[a] - snapshot.stats[b]);
  const tips = lowKeys.map((k) => ({ stat: k, label: STAT_LABELS[k].label, tip: SUMMARY_TIPS[k] }));

  return NextResponse.json({
    cat: snapshot.cat,
    stats: snapshot.stats,
    score,
    status,
    tips,
    updatedAt: snapshot.updatedAt,
    recentInteractions: snapshot.recentInteractions,
  });
}
