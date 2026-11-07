import { createHash } from "node:crypto";
import { brotliCompressSync, gzipSync, constants as zlibConstants } from "node:zlib";
import { getRoomAssetManifest } from "@/lib/room-manifest";
import type { QualityLevel } from "@/lib/quality";

export type CachedAssetEntry = {
  etag: string;
  contentType: string;
  raw: Buffer;
  gzip: Buffer;
  br: Buffer;
  createdAt: number;
};

const assetCache = new Map<string, CachedAssetEntry>();

/** Bangun & simpan payload aset 3D ke dalam cache memori dengan varian gzip & brotli. */
export function getOrBuildCompressedAsset(key: string, builder: () => string | Buffer, contentType = "application/json; charset=utf-8"): CachedAssetEntry {
  const existing = assetCache.get(key);
  if (existing) return existing;

  const source = builder();
  const raw = typeof source === "string" ? Buffer.from(source, "utf-8") : source;
  const hash = createHash("sha256").update(raw).digest("hex").slice(0, 16);
  const etag = `"mochi-3d-${hash}"`;

  const gzip = gzipSync(raw, { level: 9 });
  const br = brotliCompressSync(raw, {
    params: {
      [zlibConstants.BROTLI_PARAM_QUALITY]: 6,
    },
  });

  const entry: CachedAssetEntry = {
    etag,
    contentType,
    raw,
    gzip,
    br,
    createdAt: Date.now(),
  };

  assetCache.set(key, entry);
  return entry;
}

/** Hasilkan bundel geometri & konfigurasi scene 3D untuk tingkat kualitas tertentu. */
export function buildSceneBundlePayload(quality: QualityLevel = "sedang"): string {
  const manifest = getRoomAssetManifest(quality);
  const { updatedAt: _omit, ...deterministic } = manifest;
  void _omit;
  return JSON.stringify({
    schema: "mochi.scene.bundle/v1",
    quality,
    ...deterministic,
  });
}

/** Pilih encoding terbaik berdasarkan header Accept-Encoding klien. */
export function negotiateAssetEncoding(
  entry: CachedAssetEntry,
  acceptEncoding: string | null,
): { body: Buffer; encoding?: "br" | "gzip" } {
  const ae = (acceptEncoding ?? "").toLowerCase();
  if (ae.includes("br")) return { body: entry.br, encoding: "br" };
  if (ae.includes("gzip")) return { body: entry.gzip, encoding: "gzip" };
  return { body: entry.raw };
}
