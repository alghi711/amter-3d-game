import { NextRequest, NextResponse } from "next/server";
import { getRoomAssetManifest } from "@/lib/room-manifest";
import type { QualityLevel } from "@/lib/quality";

const VALID_QUALITIES: QualityLevel[] = ["rendah", "sedang", "tinggi"];

/** GET /api/room/manifest — Mengembalikan manifest aset 3D, objek ruangan, klip animasi, dan profil kualitas. */
export async function GET(req: NextRequest) {
  const qParam = req.nextUrl.searchParams.get("quality") as QualityLevel | null;
  const quality = qParam && VALID_QUALITIES.includes(qParam) ? qParam : undefined;
  const manifest = getRoomAssetManifest(quality);
  return NextResponse.json(manifest, {
    headers: {
      "Cache-Control": "public, max-age=60, stale-while-revalidate=300",
    },
  });
}
