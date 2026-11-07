import { DEFAULT_CAT_ID } from "@/lib/care-repository";
import { asc, eq } from "drizzle-orm";
import { ensureCareSchema } from "@/db";
import { routines } from "@/db/schema";
import { MOCK_ROUTINES, type RoutineItem } from "@/lib/mock-mood";

export type PersistedRoutineItem = RoutineItem & {
  isActive: boolean;
  lastTriggeredAt: number | null;
  status: "aktif" | "selesai" | "berikutnya";
};

function isHourInWindow(hour: number, startHour: number, endHour: number): boolean {
  if (startHour < endHour) {
    return hour >= startHour && hour < endHour;
  }
  return hour >= startHour || hour < endHour;
}

/** Evaluasi jadwal rutinitas harian dari database berdasarkan jam waktu nyata atau simulasi. */
export async function evaluateDailyRoutines(catId = DEFAULT_CAT_ID, hour = new Date().getHours()) {
  const db = await ensureCareSchema();
  const rows = await db
    .select()
    .from(routines)
    .where(eq(routines.catId, catId))
    .orderBy(asc(routines.startHour));

  const rowMap = new Map(rows.map((r) => [r.id, r]));
  const normalizedHour = ((Math.floor(hour) % 24) + 24) % 24;

  const schedule: PersistedRoutineItem[] = MOCK_ROUTINES.map((template) => {
    const dbRow = rowMap.get(template.id);
    const startHour = dbRow?.startHour ?? template.startHour;
    const endHour = dbRow?.endHour ?? template.endHour;
    const isActive = dbRow ? Boolean(dbRow.isActive) : true;
    const inWindow = isActive && isHourInWindow(normalizedHour, startHour, endHour);

    const status: "aktif" | "selesai" | "berikutnya" = inWindow
      ? "aktif"
      : startHour < endHour && normalizedHour >= endHour
        ? "selesai"
        : "berikutnya";

    return {
      ...template,
      startHour,
      endHour,
      isActive,
      lastTriggeredAt: dbRow?.lastTriggeredAt ?? null,
      status,
    };
  });

  const activeRoutine = schedule.find((r) => r.status === "aktif") ?? schedule[0];
  const activeIdx = schedule.findIndex((r) => r.id === activeRoutine.id);
  const nextRoutine = schedule[(activeIdx + 1) % schedule.length];

  return {
    catId,
    hour: normalizedHour,
    activeRoutine,
    nextRoutine,
    schedule,
  };
}

/** Tandai sebuah rutinitas sebagai baru dijalankan pada waktu tertentu. */
export async function triggerRoutineNow(params: {
  catId?: string;
  routineId?: string;
  hour?: number;
}) {
  const catId = params.catId ?? DEFAULT_CAT_ID;
  const hour = typeof params.hour === "number" ? params.hour : new Date().getHours();
  const db = await ensureCareSchema();
  const current = await evaluateDailyRoutines(catId, hour);
  const target =
    (params.routineId ? current.schedule.find((r) => r.id === params.routineId) : null) ??
    current.activeRoutine;

  const now = Date.now();
  await db
    .update(routines)
    .set({ lastTriggeredAt: now })
    .where(eq(routines.id, target.id));

  const updated = await evaluateDailyRoutines(catId, hour);
  return {
    triggered: { ...target, lastTriggeredAt: now },
    ...updated,
  };
}
