import { NextRequest, NextResponse } from "next/server";
import { DEFAULT_CAT_ID, getCatCareSnapshot } from "@/lib/care-repository";
import { buildGentleReminders } from "@/lib/mock-mood";
import { evaluateDailyRoutines } from "@/lib/routine-service";

/** GET /api/cat/reminders — Ambil daftar pengingat lembut waktu rawat berdasarkan kondisi kucing & jadwal rutinitas aktif. */
export async function GET(req: NextRequest) {
  const catId = req.nextUrl.searchParams.get("catId") ?? DEFAULT_CAT_ID;
  const hourParam = req.nextUrl.searchParams.get("hour");
  const hour = hourParam !== null ? Number(hourParam) : new Date().getHours();
  const normalizedHour = Number.isFinite(hour) ? ((Math.floor(hour) % 24) + 24) % 24 : 9;

  const [snapshot, routineState] = await Promise.all([
    getCatCareSnapshot(catId),
    evaluateDailyRoutines(catId, normalizedHour),
  ]);

  const reminders = buildGentleReminders(snapshot.stats, snapshot.cat.name, normalizedHour);

  // Tambahkan pengingat bila sudah lama tidak diajak berinteraksi (> 2 jam)
  const idleMinutes = Math.floor((Date.now() - snapshot.cat.lastPlayedAt) / 60_000);
  if (idleMinutes >= 120) {
    reminders.unshift({
      id: "rem-missed-you",
      icon: "🐾",
      title: `${snapshot.cat.name} kangen kamu`,
      message: `Sudah sekitar ${Math.floor(idleMinutes / 60)} jam sejak terakhir disapa. Elus kepalanya sebentar, yuk!`,
      priority: "sedang",
    });
  }

  return NextResponse.json({
    cat: snapshot.cat,
    stats: snapshot.stats,
    hour: normalizedHour,
    activeRoutine: routineState.activeRoutine,
    nextRoutine: routineState.nextRoutine,
    reminders,
  });
}
