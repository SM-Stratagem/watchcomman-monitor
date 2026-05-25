import { regionFromLatLng, safeFetchJson, type NormalizedSignal } from "./types";

type UsgsFeature = {
  id: string;
  properties: {
    mag: number;
    place: string;
    time: number;
    url: string;
    title: string;
    tsunami?: number;
  };
  geometry: { coordinates: [number, number, number] };
};

function severityForMag(mag: number): NormalizedSignal["severity"] {
  if (mag >= 7) return "critical";
  if (mag >= 6) return "high";
  if (mag >= 5) return "elevated";
  if (mag >= 4) return "moderate";
  return "low";
}

function countryHintFromPlace(place: string): string | null {
  if (!place) return null;
  const parts = place.split(",").map((p) => p.trim()).filter(Boolean);
  return parts.length ? parts[parts.length - 1] : null;
}

// 4.5+ magnitude earthquakes worldwide, past week
const URL = "https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/4.5_week.geojson";

export async function fetchUsgs(): Promise<NormalizedSignal[]> {
  const data = (await safeFetchJson(URL)) as { features?: UsgsFeature[] } | null;
  if (!data?.features?.length) return [];

  const out: NormalizedSignal[] = [];
  for (const f of data.features) {
    const [lng, lat] = f.geometry?.coordinates ?? [null, null];
    const mag = f.properties?.mag;
    if (lat == null || lng == null || mag == null) continue;
    const place = f.properties?.place ?? "";
    const country = countryHintFromPlace(place);
    out.push({
      externalKey: `usgs:${f.id}`,
      source: "usgs",
      category: "earthquake",
      subcategory: f.properties?.tsunami ? "tsunami-watch" : null,
      severity: severityForMag(mag),
      title: `M${mag.toFixed(1)} earthquake — ${place || "unknown"}`,
      summary: f.properties?.tsunami
        ? `Magnitude ${mag.toFixed(1)} event; tsunami advisory possible.`
        : `Magnitude ${mag.toFixed(1)} seismic event recorded.`,
      region: regionFromLatLng(lat, lng, "Global"),
      country,
      latitude: lat,
      longitude: lng,
      magnitude: mag,
      affected: null,
      occurredAt: new Date(f.properties.time).toISOString(),
      sourceUrl: f.properties?.url,
    });
  }
  return out.slice(0, 30);
}
