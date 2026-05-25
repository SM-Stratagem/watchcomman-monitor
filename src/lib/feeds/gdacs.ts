import { regionFromLatLng, safeFetchJson, type NormalizedSignal } from "./types";

type GdacsFeature = {
  properties: {
    eventid: number | string;
    eventtype: string; // EQ TC FL DR VO WF
    alertlevel: string; // Green Orange Red
    name?: string;
    description?: string;
    fromdate?: string;
    todate?: string;
    country?: string;
    countryiso3?: string;
    severitydata?: { severity?: number; severitytext?: string };
    url?: { report?: string; details?: string };
    htmldescription?: string;
    affectedcountries?: Array<{ countryname: string }>;
  };
  geometry: { coordinates: [number, number] };
};

const URL_ = "https://www.gdacs.org/gdacsapi/api/events/geteventlist/MAP";

function categoryFor(t: string): { cat: string; sub: string } {
  switch ((t || "").toUpperCase()) {
    case "EQ": return { cat: "earthquake", sub: "gdacs" };
    case "TC": return { cat: "storm", sub: "tropical-cyclone" };
    case "FL": return { cat: "flood", sub: "gdacs" };
    case "DR": return { cat: "environment", sub: "drought" };
    case "VO": return { cat: "disaster", sub: "volcano" };
    case "WF": return { cat: "wildfire", sub: "gdacs" };
    default: return { cat: "disaster", sub: t?.toLowerCase() || "unknown" };
  }
}

function severityForAlert(level: string): NormalizedSignal["severity"] {
  switch ((level || "").toLowerCase()) {
    case "red": return "critical";
    case "orange": return "high";
    case "green": return "moderate";
    default: return "low";
  }
}

export async function fetchGdacs(): Promise<NormalizedSignal[]> {
  const data = (await safeFetchJson(URL_)) as { features?: GdacsFeature[] } | null;
  if (!data?.features?.length) return [];
  const out: NormalizedSignal[] = [];
  for (const f of data.features) {
    const p = f.properties;
    const [lng, lat] = f.geometry?.coordinates ?? [null, null];
    if (lat == null || lng == null) continue;
    const { cat, sub } = categoryFor(p.eventtype);
    const title = p.name || `${p.eventtype} event`;
    out.push({
      externalKey: `gdacs:${p.eventtype}-${p.eventid}`,
      source: "gdacs",
      category: cat,
      subcategory: sub,
      severity: severityForAlert(p.alertlevel),
      title,
      summary: (p.description || p.htmldescription || "").replace(/<[^>]+>/g, "").slice(0, 240) || null,
      region: regionFromLatLng(lat, lng),
      country: p.country ?? p.affectedcountries?.[0]?.countryname ?? null,
      latitude: lat,
      longitude: lng,
      magnitude: p.severitydata?.severity ?? null,
      affected: null,
      occurredAt: new Date(p.fromdate || Date.now()).toISOString(),
      sourceUrl: p.url?.report || p.url?.details || "https://www.gdacs.org/",
    });
  }
  return out;
}
