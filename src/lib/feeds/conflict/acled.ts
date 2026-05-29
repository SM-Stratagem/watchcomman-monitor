// ACLED (Armed Conflict Location & Event Data) — public REST API.
// Free tier requires email registration; we expect ACLED_EMAIL + ACLED_API_KEY in env.
// Endpoint: https://api.acleddata.com/acled/read?key=KEY&email=EMAIL&limit=500&event_date=YYYY-MM-DD|YYYY-MM-DD
// Maps each event into a NormalizedSignal with category="conflict".

import { safeFetchJson } from "../types";
import type { NormalizedSignal } from "../types";

type AcledRow = {
  event_id_cnty?: string;
  event_date?: string;
  event_type?: string;
  sub_event_type?: string;
  actor1?: string;
  actor2?: string;
  country?: string;
  region?: string;
  admin1?: string;
  admin2?: string;
  location?: string;
  latitude?: string;
  longitude?: string;
  fatalities?: string;
  notes?: string;
  source?: string;
};

type AcledResponse = { success?: boolean; status?: number; count?: number; data?: AcledRow[] };

const ACLED_REGION_TO_DASHBOARD: Record<string, NormalizedSignal["region"]> = {
  "Western Africa":      "West & Central Africa",
  "Middle Africa":       "West & Central Africa",
  "Eastern Africa":      "East Africa",
  "Southern Africa":     "Southern Africa",
  "Northern Africa":     "North Africa & Middle East",
  "Middle East":         "North Africa & Middle East",
  "Caucasus and Central Asia": "Asia",
  "Central Asia":        "Asia",
  "South Asia":          "Asia",
  "Southeast Asia":      "Southeast Asia",
  "East Asia":           "Asia",
  "Europe":              "Europe",
  "Caribbean":           "Central America & Caribbean",
  "Central America":     "Central America & Caribbean",
  "South America":       "South America",
};

function severity(fat: number, type: string): NormalizedSignal["severity"] {
  if (fat >= 50) return "critical";
  if (fat >= 10) return "high";
  if (fat >= 1) return "elevated";
  if (type.toLowerCase().includes("battles") || type.toLowerCase().includes("explosions")) return "moderate";
  return "low";
}

export async function fetchAcled(): Promise<NormalizedSignal[]> {
  const key = process.env.ACLED_API_KEY;
  const email = process.env.ACLED_EMAIL;
  if (!key || !email) return [];
  const today = new Date();
  const start = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
  const fmt = (d: Date): string => d.toISOString().slice(0, 10);
  const url = `https://api.acleddata.com/acled/read?key=${key}&email=${encodeURIComponent(email)}&event_date=${fmt(start)}|${fmt(today)}&event_date_where=BETWEEN&limit=500&fields=event_id_cnty|event_date|event_type|sub_event_type|actor1|actor2|country|region|location|latitude|longitude|fatalities|notes|source`;
  const j = (await safeFetchJson(url, { timeoutMs: 30_000 })) as AcledResponse | null;
  if (!j?.data?.length) return [];

  const out: NormalizedSignal[] = [];
  for (const r of j.data) {
    if (!r.event_id_cnty) continue;
    const lat = r.latitude ? Number(r.latitude) : null;
    const lng = r.longitude ? Number(r.longitude) : null;
    const fat = r.fatalities ? Number(r.fatalities) : 0;
    const sev = severity(fat, r.event_type ?? "");
    const region = ACLED_REGION_TO_DASHBOARD[r.region ?? ""] ?? "Global";
    const actors = [r.actor1, r.actor2].filter(Boolean).join(" vs. ");
    const title = `${r.event_type ?? "Conflict"}${r.sub_event_type ? ` — ${r.sub_event_type}` : ""}${r.location ? ` · ${r.location}` : ""}${fat > 0 ? ` · ${fat} killed` : ""}`;
    out.push({
      externalKey: `acled:${r.event_id_cnty}`,
      source: "acled",
      category: "conflict",
      subcategory: r.sub_event_type ?? r.event_type ?? null,
      severity: sev,
      title,
      summary: [actors, r.notes].filter(Boolean).join(" — ").slice(0, 360) || null,
      region,
      country: r.country ?? null,
      latitude: Number.isFinite(lat) ? (lat as number) : null,
      longitude: Number.isFinite(lng) ? (lng as number) : null,
      magnitude: null,
      affected: Number.isFinite(fat) ? fat : null,
      occurredAt: r.event_date ? new Date(r.event_date).toISOString() : new Date().toISOString(),
      sourceUrl: null,
    });
  }
  return out;
}
