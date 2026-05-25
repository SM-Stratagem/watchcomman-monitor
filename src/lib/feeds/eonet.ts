import { regionFromLatLng, safeFetchJson, type NormalizedSignal } from "./types";

type EonetEvent = {
  id: string;
  title: string;
  description?: string;
  link: string;
  categories: Array<{ id: string; title: string }>;
  sources?: Array<{ id: string; url: string }>;
  geometry: Array<{ date: string; type: string; coordinates: number[] | number[][] }>;
};

const URL_ = "https://eonet.gsfc.nasa.gov/api/v3/events?status=open&days=20&limit=80";

function categoryFor(eonetCatId: string): { cat: string; sub: string } {
  // EONET category ids: 8=wildfires, 10=severeStorms, 12=volcanoes, 14=earthquakes (rare), 15=floods, 16=landslides,
  // 17=manmade, 19=seaLakeIce, 6=drought, 7=dustHaze
  switch (eonetCatId) {
    case "wildfires": return { cat: "wildfire", sub: "active-fire" };
    case "severeStorms": return { cat: "storm", sub: "severe" };
    case "volcanoes": return { cat: "disaster", sub: "volcano" };
    case "floods": return { cat: "flood", sub: "active" };
    case "landslides": return { cat: "disaster", sub: "landslide" };
    case "drought": return { cat: "environment", sub: "drought" };
    case "dustHaze": return { cat: "environment", sub: "dust-haze" };
    case "seaLakeIce": return { cat: "environment", sub: "ice" };
    case "earthquakes": return { cat: "earthquake", sub: "nasa-confirmed" };
    case "manmade": return { cat: "disaster", sub: "manmade" };
    default: return { cat: "disaster", sub: eonetCatId };
  }
}

function severityForCat(cat: string): NormalizedSignal["severity"] {
  switch (cat) {
    case "wildfire": return "high";
    case "storm": return "elevated";
    case "flood": return "high";
    case "earthquake": return "elevated";
    case "disaster": return "elevated";
    default: return "moderate";
  }
}

function latestPoint(g: EonetEvent["geometry"]): { lat: number; lng: number; date: string } | null {
  if (!g?.length) return null;
  const last = g[g.length - 1];
  let lat: number | null = null;
  let lng: number | null = null;
  const c = last.coordinates;
  if (Array.isArray(c) && typeof c[0] === "number" && typeof c[1] === "number") {
    lng = c[0] as number; lat = c[1] as number;
  } else if (Array.isArray(c) && Array.isArray((c as unknown[])[0])) {
    // Polygon/MultiPolygon: take centroid of first ring
    const ring = (c as unknown as number[][][])[0];
    if (ring.length) {
      let sx = 0, sy = 0;
      for (const p of ring) { sx += p[0]; sy += p[1]; }
      lng = sx / ring.length;
      lat = sy / ring.length;
    }
  }
  if (lat == null || lng == null) return null;
  return { lat, lng, date: last.date };
}

export async function fetchEonet(): Promise<NormalizedSignal[]> {
  const data = (await safeFetchJson(URL_)) as { events?: EonetEvent[] } | null;
  if (!data?.events?.length) return [];
  const out: NormalizedSignal[] = [];
  for (const ev of data.events) {
    const pt = latestPoint(ev.geometry);
    if (!pt) continue;
    const catId = ev.categories?.[0]?.id ?? "disaster";
    const { cat, sub } = categoryFor(catId);
    out.push({
      externalKey: `eonet:${ev.id}`,
      source: "nasa-eonet",
      category: cat,
      subcategory: sub,
      severity: severityForCat(cat),
      title: ev.title,
      summary: ev.description?.slice(0, 280) || `${ev.categories?.[0]?.title ?? "Earth observation"} event tracked by NASA EONET.`,
      region: regionFromLatLng(pt.lat, pt.lng),
      country: null,
      latitude: pt.lat,
      longitude: pt.lng,
      magnitude: null,
      affected: null,
      occurredAt: new Date(pt.date).toISOString(),
      sourceUrl: ev.sources?.[0]?.url || ev.link,
    });
  }
  return out;
}
