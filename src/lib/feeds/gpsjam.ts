// GPS jamming / spoofing — gpsjam.org daily snapshot.
// Format: https://gpsjam.org/data/{YYYY-MM-DD}.json (hex-grid GeoJSON).
// We downsample to ~150 cells globally for map overlay.

import { safeFetchJson } from "./types";

type GpsFeature = {
  type: "Feature";
  geometry: { type: "Point"; coordinates: [number, number] };
  properties: { intensity: number; regionKey: string; snapshotDate: string };
};

export type GpsHotspot = {
  externalKey: string;
  snapshotDate: string;
  regionKey: string;
  intensity: number;     // 0..1
  lat: number;
  lng: number;
  raw: string | null;
};

type Cell = {
  type?: "Feature";
  properties?: { numpos?: number; bad_pos?: number };
  geometry?: { type?: "Point" | "Polygon"; coordinates?: number[] | number[][][] };
};
type FC = { type?: "FeatureCollection"; features?: Cell[] };

function centroid(coords: number[] | number[][][] | undefined, geomType: string | undefined): [number, number] | null {
  if (!coords) return null;
  if (geomType === "Point") return coords as [number, number];
  if (geomType === "Polygon") {
    const ring = (coords as number[][][])[0];
    if (!ring?.length) return null;
    let x = 0, y = 0;
    for (const p of ring) { x += p[0]; y += p[1]; }
    return [x / ring.length, y / ring.length];
  }
  return null;
}

function bucketKey(lat: number, lng: number): string {
  const lt = Math.round(lat / 10) * 10;
  const lg = Math.round(lng / 10) * 10;
  return `lat${lt}_lng${lg}`;
}

export async function fetchGpsJamming(date?: string): Promise<GpsHotspot[]> {
  const d = date ?? new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
  const url = `https://gpsjam.org/data/${d}.json`;
  const j = (await safeFetchJson(url, { timeoutMs: 25_000 })) as FC | null;
  if (!j?.features?.length) return [];

  const out: GpsHotspot[] = [];
  for (let i = 0; i < j.features.length; i++) {
    const f = j.features[i];
    const numpos = Number(f.properties?.numpos ?? 0);
    const badpos = Number(f.properties?.bad_pos ?? 0);
    if (numpos < 20) continue;
    const ratio = badpos / numpos;
    if (ratio < 0.05) continue;
    const c = centroid(f.geometry?.coordinates as number[] | number[][][] | undefined, f.geometry?.type);
    if (!c) continue;
    const [lng, lat] = c;
    out.push({
      externalKey: `gpsjam:${d}:${lat.toFixed(2)}:${lng.toFixed(2)}`,
      snapshotDate: d,
      regionKey: bucketKey(lat, lng),
      intensity: Math.min(1, ratio),
      lat,
      lng,
      raw: null,
    });
  }
  // Sort by intensity, top 200
  out.sort((a, b) => b.intensity - a.intensity);
  return out.slice(0, 200);
}

// Helper to expose a fixed-size GeoJSON-style payload for the client map.
export function toClientLayer(items: GpsHotspot[]): GpsFeature[] {
  return items.map((h) => ({
    type: "Feature",
    geometry: { type: "Point", coordinates: [h.lng, h.lat] },
    properties: { intensity: h.intensity, regionKey: h.regionKey, snapshotDate: h.snapshotDate },
  }));
}

export type { GpsFeature };
