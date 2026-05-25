import { regionFromLatLng, safeFetchJson, type NormalizedSignal } from "./types";

type RwDisaster = {
  id: number | string;
  fields: {
    name: string;
    description?: string;
    status?: string;
    date?: { created?: string; changed?: string };
    country?: Array<{ name: string; iso3?: string; location?: { lat: number; lon: number } }>;
    type?: Array<{ name: string; code?: string }>;
    url_alias?: string;
  };
};

const URL_ =
  "https://api.reliefweb.int/v1/disasters?appname=watchcomman-monitor&profile=full&limit=40&sort[]=date.changed:desc";

function severityForStatus(status?: string): NormalizedSignal["severity"] {
  switch ((status || "").toLowerCase()) {
    case "alert": return "elevated";
    case "ongoing": return "high";
    case "past": return "low";
    default: return "moderate";
  }
}

function subFromTypes(types?: RwDisaster["fields"]["type"]): string {
  if (!types?.length) return "disaster";
  return types[0].name.toLowerCase();
}

export async function fetchReliefWeb(): Promise<NormalizedSignal[]> {
  const data = (await safeFetchJson(URL_)) as { data?: RwDisaster[] } | null;
  if (!data?.data?.length) return [];
  const out: NormalizedSignal[] = [];
  for (const d of data.data) {
    const f = d.fields;
    const c0 = f.country?.[0];
    const lat = c0?.location?.lat ?? null;
    const lng = c0?.location?.lon ?? null;
    out.push({
      externalKey: `reliefweb:${d.id}`,
      source: "reliefweb",
      category: "disaster",
      subcategory: subFromTypes(f.type),
      severity: severityForStatus(f.status),
      title: f.name,
      summary: (f.description || "").replace(/\s+/g, " ").trim().slice(0, 260) || null,
      region: regionFromLatLng(lat, lng),
      country: c0?.name ?? null,
      latitude: lat,
      longitude: lng,
      magnitude: null,
      affected: null,
      occurredAt: new Date(f.date?.changed || f.date?.created || Date.now()).toISOString(),
      sourceUrl: f.url_alias || `https://reliefweb.int/disaster/${d.id}`,
    });
  }
  return out;
}
