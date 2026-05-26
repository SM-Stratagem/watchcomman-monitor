// Real-time aircraft positions.
// Primary: ADSB.lol — free, no key, not IP-blocked from cloud providers.
// Fallback: OpenSky Network (HTTP basic auth via OPENSKY_API_KEY) — often blocked from cloud IPs.

export type Flight = {
  icao24: string;
  callsign: string;
  origin: string | null;
  lng: number;
  lat: number;
  alt: number | null;     // metres (we convert from ft when needed)
  velocity: number | null; // m/s
  heading: number | null;
};

type Cache = { items: Flight[]; expiresAt: number };
let cache: Cache | null = null;
const TTL_MS = 90_000;

type AdsbAc = {
  hex: string;
  flight?: string;
  r?: string;        // registration
  t?: string;        // aircraft type
  alt_baro?: number; // feet
  gs?: number;       // ground speed knots
  track?: number;
  lat: number;
  lon: number;
  category?: string;
};

async function fetchAdsbLol(): Promise<Flight[]> {
  // ADSB.lol has no global "all states" endpoint; we sample several large radii.
  // Each call returns up to ~1000 aircraft within 250nm of the lat/lon.
  const POINTS: Array<[number, number]> = [
    [40, 0],       // Mediterranean
    [50, 0],       // UK/N. Europe
    [40, -90],     // Central US
    [40, -100],    // Western US
    [25, -80],     // Florida/Caribbean
    [-30, -60],    // South America
    [30, 30],      // North Africa / Middle East
    [25, 50],      // Gulf
    [35, 105],     // China
    [35, 135],     // Japan
    [-30, 145],    // Australia
    [50, 30],      // Russia/Ukraine
  ];

  const results = await Promise.all(POINTS.map(async ([lat, lon]) => {
    try {
      const controller = new AbortController();
      const t = setTimeout(() => controller.abort(), 8_000);
      const res = await fetch(`https://api.adsb.lol/v2/lat/${lat}/lon/${lon}/dist/250`, {
        headers: { "user-agent": "watchcomman-monitor/1.0", accept: "application/json" },
        signal: controller.signal,
      });
      clearTimeout(t);
      if (!res.ok) return [];
      const d = (await res.json()) as { ac?: AdsbAc[] };
      return d.ac ?? [];
    } catch { return []; }
  }));

  const all: AdsbAc[] = results.flat();
  const seen = new Set<string>();
  const out: Flight[] = [];
  for (const a of all) {
    if (!a.hex || seen.has(a.hex)) continue;
    seen.add(a.hex);
    if (typeof a.lat !== "number" || typeof a.lon !== "number") continue;
    out.push({
      icao24: a.hex,
      callsign: (a.flight ?? a.r ?? "").trim() || "—",
      origin: null,
      lng: a.lon,
      lat: a.lat,
      alt: a.alt_baro != null ? Math.round(a.alt_baro * 0.3048) : null,
      velocity: a.gs != null ? Math.round(a.gs * 0.514444) : null,
      heading: a.track ?? null,
    });
    if (out.length >= 1500) break;
  }
  return out;
}

async function fetchOpenSky(): Promise<Flight[]> {
  const user = process.env.OPENSKY_USERNAME ?? process.env.OPENSKY_API_KEY;
  const pass = process.env.OPENSKY_PASSWORD ?? "";
  const headers: Record<string, string> = { "user-agent": "watchcomman-monitor/1.0" };
  if (user) headers.authorization = "Basic " + Buffer.from(`${user}:${pass}`).toString("base64");
  try {
    const controller = new AbortController();
    const t = setTimeout(() => controller.abort(), 12_000);
    const res = await fetch("https://opensky-network.org/api/states/all", { headers, signal: controller.signal });
    clearTimeout(t);
    if (!res.ok) return [];
    const data = (await res.json()) as { states?: unknown[][] | null };
    if (!data?.states?.length) return [];
    const items: Flight[] = [];
    for (let i = 0; i < data.states.length; i += 6) {
      const row = data.states[i];
      const lng = row[5] as number | null;
      const lat = row[6] as number | null;
      if (lng == null || lat == null) continue;
      items.push({
        icao24: String(row[0] ?? ""),
        callsign: String(row[1] ?? "").trim() || "—",
        origin: row[2] as string | null,
        lng, lat,
        alt: row[7] as number | null,
        velocity: row[9] as number | null,
        heading: row[10] as number | null,
      });
      if (items.length >= 1200) break;
    }
    return items;
  } catch { return []; }
}

export async function getFlights(): Promise<Flight[]> {
  if (cache && cache.expiresAt > Date.now()) return cache.items;
  // Try ADSB.lol first (works from cloud IPs)
  let items = await fetchAdsbLol();
  if (items.length === 0) items = await fetchOpenSky();
  cache = { items, expiresAt: Date.now() + (items.length ? TTL_MS : 60_000) };
  return items;
}
