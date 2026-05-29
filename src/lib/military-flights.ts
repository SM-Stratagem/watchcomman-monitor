// Military aircraft tracker — ADSB.lol /v2/mil dedicated endpoint.
// Returns all currently-airborne aircraft flagged as military in ADSB.lol's database.

export type MilFlight = {
  icao24: string;
  callsign: string;
  registration: string | null;
  type: string | null;
  category: string | null;
  lat: number;
  lng: number;
  alt: number | null;      // feet
  velocity: number | null; // knots
  heading: number | null;
  squawk: string | null;
  emergency: string | null;
};

type Cache = { items: MilFlight[]; expiresAt: number };
let cache: Cache | null = null;
const TTL_MS = 120_000;

type AdsbAc = {
  hex?: string;
  flight?: string;
  r?: string;
  t?: string;
  category?: string;
  alt_baro?: number;
  gs?: number;
  track?: number;
  lat?: number;
  lon?: number;
  squawk?: string;
  emergency?: string;
};

export async function getMilitaryFlights(): Promise<MilFlight[]> {
  if (cache && cache.expiresAt > Date.now()) return cache.items;
  try {
    const controller = new AbortController();
    const t = setTimeout(() => controller.abort(), 10_000);
    const res = await fetch("https://api.adsb.lol/v2/mil", {
      headers: { "user-agent": "watchcomman-monitor/1.0", accept: "application/json" },
      signal: controller.signal,
    });
    clearTimeout(t);
    if (!res.ok) return [];
    const d = (await res.json()) as { ac?: AdsbAc[] };
    const items: MilFlight[] = [];
    for (const a of d.ac ?? []) {
      if (!a.hex || typeof a.lat !== "number" || typeof a.lon !== "number") continue;
      items.push({
        icao24: a.hex,
        callsign: (a.flight ?? a.r ?? "").trim() || "—",
        registration: a.r ?? null,
        type: a.t ?? null,
        category: a.category ?? null,
        lat: a.lat,
        lng: a.lon,
        alt: a.alt_baro ?? null,
        velocity: a.gs ?? null,
        heading: a.track ?? null,
        squawk: a.squawk ?? null,
        emergency: a.emergency && a.emergency !== "none" ? a.emergency : null,
      });
    }
    cache = { items, expiresAt: Date.now() + TTL_MS };
    return items;
  } catch {
    return [];
  }
}

// Group by approximate region using the bbox classifier we already have.
export function regionForFlight(f: { lat: number; lng: number }): string {
  const { lat, lng } = f;
  if (lat >= 35 && lat <= 72 && lng >= -25 && lng <= 45) return "Europe";
  if (lat >= 30 && lat <= 50 && lng >= 25 && lng <= 60) return "Middle East";
  if (lat >= 8 && lat <= 50 && lng >= 60 && lng <= 145) return "Asia-Pacific";
  if (lat >= -50 && lat <= 12 && lng >= 110 && lng <= 180) return "Oceania";
  if (lat >= 15 && lat <= 80 && lng >= -170 && lng <= -50) return "North America";
  if (lat >= -56 && lat <= 15 && lng >= -120 && lng <= -34) return "Latin America";
  if (lat >= -36 && lat <= 38 && lng >= -25 && lng <= 60) return "Africa";
  return "Other";
}

// Best-effort country-of-origin hint from ICAO hex range.
// Public ranges: https://www.icao.int/publications/Documents/8643_Doc.pdf
// We just bucket the common ones for quick UI badges.
export function countryFromHex(hex: string): string | null {
  if (!hex || hex.length < 6) return null;
  const i = parseInt(hex.slice(0, 6), 16);
  if (!Number.isFinite(i)) return null;
  if (i >= 0xA00000 && i <= 0xAFFFFF) return "US";
  if (i >= 0x400000 && i <= 0x43FFFF) return "GB";
  if (i >= 0x440000 && i <= 0x447FFF) return "AT";
  if (i >= 0x3C0000 && i <= 0x3FFFFF) return "DE";
  if (i >= 0x380000 && i <= 0x3BFFFF) return "FR";
  if (i >= 0x300000 && i <= 0x33FFFF) return "IT";
  if (i >= 0x340000 && i <= 0x37FFFF) return "ES";
  if (i >= 0x100000 && i <= 0x1FFFFF) return "RU";
  if (i >= 0x780000 && i <= 0x7BFFFF) return "CN";
  if (i >= 0x840000 && i <= 0x87FFFF) return "JP";
  if (i >= 0x880000 && i <= 0x88FFFF) return "TH";
  if (i >= 0x710000 && i <= 0x717FFF) return "KR";
  if (i >= 0x738000 && i <= 0x73BFFF) return "KP";
  if (i >= 0x800000 && i <= 0x83FFFF) return "IN";
  if (i >= 0x738000 && i <= 0x73BFFF) return "IL";
  if (i >= 0x750000 && i <= 0x7FFFFF) return "ID";
  if (i >= 0xC00000 && i <= 0xC3FFFF) return "CA";
  if (i >= 0x7C0000 && i <= 0x7FFFFF) return "AU";
  return null;
}
