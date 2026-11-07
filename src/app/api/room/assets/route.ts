import { NextRequest, NextResponse } from "next/server";
import { buildSceneBundlePayload, getOrBuildCompressedAsset, negotiateAssetEncoding } from "@/lib/asset-cache";
import type { QualityLevel } from "@/lib/quality";

const VALID_QUALITIES: QualityLevel[] = ["rendah", "sedang", "tinggi"];

/**
 * GET /api/room/assets — Menyajikan bundel aset 3D dari cache memori terkompresi (Brotli / Gzip)
 * lengkap dengan validasi ETag (304 Not Modified) dan Cache-Control immutable.
 */
export async function GET(req: NextRequest) {
  const qParam = req.nextUrl.searchParams.get("quality") as QualityLevel | null;
  const quality: QualityLevel = qParam && VALID_QUALITIES.includes(qParam) ? qParam : "sedang";

  const entry = getOrBuildCompressedAsset(`scene-bundle:${quality}`, () => buildSceneBundlePayload(quality));

  const ifNoneMatch = req.headers.get("if-none-match");
  if (ifNoneMatch && ifNoneMatch === entry.etag) {
    return new NextResponse(null, {
      status: 304,
      headers: {
        ETag: entry.etag,
        "Cache-Control": "public, max-age=31536000, immutable",
        Vary: "Accept-Encoding",
      },
    });
  }

  const { body, encoding } = negotiateAssetEncoding(entry, req.headers.get("accept-encoding"));
  const headers: Record<string, string> = {
    "Content-Type": entry.contentType,
    ETag: entry.etag,
    "Cache-Control": "public, max-age=31536000, immutable",
    Vary: "Accept-Encoding",
    "X-Original-Size": String(entry.raw.byteLength),
    "X-Compressed-Size": String(body.byteLength),
  };

  if (encoding) {
    headers["Content-Encoding"] = encoding;
  }

  return new NextResponse(new Uint8Array(body), { status: 200, headers });
}
