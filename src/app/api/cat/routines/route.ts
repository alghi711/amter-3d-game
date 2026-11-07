import { NextRequest, NextResponse } from "next/server";
import { DEFAULT_CAT_ID, getCatCareSnapshot } from "@/lib/care-repository";
import { evaluateDailyRoutines, triggerRoutineNow } from "@/lib/routine-service";

/** GET /api/cat/routines — Ambil jadwal rutinitas harian berbasis waktu beserta rutinitas aktif & berikutnya. */
export async function GET(req: NextRequest) {
  const catId = req.nextUrl.searchParams.get("catId") ?? DEFAULT_CAT_ID;
  const hourParam = req.nextUrl.searchParams.get("hour");
  const hour = hourParam !== null ? Number(hourParam) : new Date().getHours();

  const [snapshot, routineState] = await Promise.all([
    getCatCareSnapshot(catId),
    evaluateDailyRoutines(catId, Number.isFinite(hour) ? hour : 9),
  ]);

  return NextResponse.json({
    cat: snapshot.cat,
    ...routineState,
  });
}

/** POST /api/cat/routines — Picu pelaksanaan rutinitas harian & catat last_triggered_at di database. */
export async function POST(req: NextRequest) {
  let body: { catId?: string; routineId?: string; hour?: number } = {};
  try {
    body = (await req.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "Payload JSON tidak valid" }, { status: 400 });
  }

  const result = await triggerRoutineNow({
    catId: body.catId,
    routineId: body.routineId,
    hour: body.hour,
  });

  return NextResponse.json(result);
}
