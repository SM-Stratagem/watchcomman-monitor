// Normalised signal shape used by all feed fetchers and the seed builder.
export type NormalizedSignal = {
  externalKey: string;
  source: string;
  category: string;
  subcategory?: string | null;
  severity: "low" | "moderate" | "elevated" | "high" | "critical";
  title: string;
  summary: string | null;
  region: string;
  country: string | null;
  latitude: number | null;
  longitude: number | null;
  magnitude?: number | null;
  affected?: number | null;
  occurredAt: string;
  sourceUrl?: string | null;
};

export function regionFromLatLng(lat: number | null, lng: number | null, fallback = "Global"): string {
  if (lat == null || lng == null) return fallback;
  if (lat >= 35 && lat <= 72 && lng >= -25 && lng <= 45) return "Europe";
  if (lat >= 8 && lat <= 80 && lng >= 25 && lng <= 180) return "Asia";
  if (lat >= -10 && lat <= 25 && lng >= 90 && lng <= 145) return "Southeast Asia";
  if (lat >= -50 && lat <= 12 && lng >= 110 && lng <= 180) return "Oceania";
  if (lat >= 12 && lat <= 38 && lng >= -20 && lng <= 60) return "North Africa & Middle East";
  if (lat >= -5 && lat <= 18 && lng >= -20 && lng <= 55) return "West & Central Africa";
  if (lat >= -36 && lat <= 5 && lng >= 0 && lng <= 55) return "Southern Africa";
  if (lat >= -36 && lat <= 5 && lng >= 25 && lng <= 55) return "East Africa";
  if (lat >= 15 && lat <= 80 && lng >= -170 && lng <= -50) return "North America";
  if (lat >= 7 && lat <= 30 && lng >= -120 && lng <= -60) return "Central America & Caribbean";
  if (lat >= -56 && lat <= 13 && lng >= -90 && lng <= -34) return "South America";
  return fallback;
}

export async function safeFetchJson(
  url: string,
  { timeoutMs = 12_000, headers }: { timeoutMs?: number; headers?: Record<string, string> } = {},
): Promise<unknown | null> {
  try {
    const controller = new AbortController();
    const t = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const res = await fetch(url, {
        headers: { "user-agent": "watchcomman-monitor/1.0", accept: "application/json", ...headers },
        signal: controller.signal,
      });
      if (!res.ok) return null;
      return await res.json();
    } finally {
      clearTimeout(t);
    }
  } catch {
    return null;
  }
}
