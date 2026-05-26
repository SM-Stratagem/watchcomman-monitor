import { regionFromLatLng, safeFetchJson, type NormalizedSignal } from "./types";

// NOAA CAP Alerts API — free, active US weather alerts
const URL_ = "https://api.weather.gov/alerts/active?status=actual&urgency=Immediate,Expected";

type NoaaFeature = {
  id: string;
  properties: {
    event: string;
    headline?: string;
    description?: string;
    severity: string;
    urgency: string;
    certainty: string;
    sent: string;
    effective?: string;
    areaDesc?: string;
    senderName?: string;
    web?: string;
  };
  geometry: { type: string; coordinates: number[][][] | number[][][][] } | null;
};

function severityFor(s: string): NormalizedSignal["severity"] {
  switch ((s || "").toLowerCase()) {
    case "extreme": return "critical";
    case "severe": return "high";
    case "moderate": return "elevated";
    case "minor": return "moderate";
    default: return "low";
  }
}

function centroid(g: NoaaFeature["geometry"]): [number, number] | null {
  if (!g) return null;
  // Walk the nested arrays for coordinate pairs
  const flat: number[][] = [];
  const recurse = (n: unknown) => {
    if (!Array.isArray(n)) return;
    if (typeof n[0] === "number" && typeof n[1] === "number") {
      flat.push(n as number[]); return;
    }
    n.forEach(recurse);
  };
  recurse(g.coordinates as unknown);
  if (!flat.length) return null;
  let sx = 0, sy = 0;
  for (const [lng, lat] of flat) { sx += lng; sy += lat; }
  return [sx / flat.length, sy / flat.length];
}

export async function fetchNoaaAlerts(): Promise<NormalizedSignal[]> {
  const data = (await safeFetchJson(URL_, { headers: { accept: "application/geo+json" } })) as { features?: NoaaFeature[] } | null;
  if (!data?.features?.length) return [];
  const out: NormalizedSignal[] = [];
  for (const f of data.features.slice(0, 80)) {
    const p = f.properties;
    const c = centroid(f.geometry);
    out.push({
      externalKey: `noaa:${f.id}`.slice(0, 380),
      source: "noaa",
      category: "storm",
      subcategory: p.event?.toLowerCase().replace(/\s+/g, "-") || "weather",
      severity: severityFor(p.severity),
      title: p.headline?.slice(0, 200) || p.event,
      summary: (p.description || "").replace(/\s+/g, " ").slice(0, 280) || null,
      region: c ? regionFromLatLng(c[1], c[0], "North America") : "North America",
      country: "United States",
      latitude: c?.[1] ?? null,
      longitude: c?.[0] ?? null,
      magnitude: null,
      affected: null,
      occurredAt: p.effective || p.sent || new Date().toISOString(),
      sourceUrl: p.web || "https://www.weather.gov/",
    });
  }
  return out;
}
