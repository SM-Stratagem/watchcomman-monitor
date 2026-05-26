// OpenSky Network — free real-time aircraft positions.
// https://opensky-network.org/apidoc/rest.html
// Anonymous gets 100 req/day. With OPENSKY_USERNAME/PASSWORD it's ~4k/day.

export type Flight = {
  icao24: string;
  callsign: string;
  origin: string | null;
  lng: number;
  lat: number;
  alt: number | null;     // metres
  velocity: number | null; // m/s
  heading: number | null;
};

type Cache = { items: Flight[]; expiresAt: number };
let cache: Cache | null = null;
const TTL_MS = 90_000;

export async function getFlights(): Promise<Flight[]> {
  if (cache && cache.expiresAt > Date.now()) return cache.items;
  // Accept either OPENSKY_API_KEY (UUID-as-username, blank password) or USERNAME+PASSWORD pair.
  const user = process.env.OPENSKY_USERNAME ?? process.env.OPENSKY_API_KEY;
  const pass = process.env.OPENSKY_PASSWORD ?? "";
  const headers: Record<string, string> = { "user-agent": "watchcomman-monitor/1.0" };
  if (user) {
    headers.authorization = "Basic " + Buffer.from(`${user}:${pass}`).toString("base64");
  }
  try {
    const controller = new AbortController();
    const t = setTimeout(() => controller.abort(), 15_000);
    const res = await fetch("https://opensky-network.org/api/states/all", { headers, signal: controller.signal });
    clearTimeout(t);
    if (!res.ok) {
      console.log(`[opensky] HTTP ${res.status} from ${user ? "authed" : "anon"} request`);
      cache = { items: [], expiresAt: Date.now() + 60_000 };
      return [];
    }
    const data = (await res.json()) as { states?: unknown[][] | null };
    if (!data?.states?.length) { cache = { items: [], expiresAt: Date.now() + 60_000 }; return []; }
    // Sample subset to avoid overwhelming the DOM
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
    cache = { items, expiresAt: Date.now() + TTL_MS };
    return items;
  } catch (e) {
    console.log(`[opensky] fetch error: ${e instanceof Error ? e.message : String(e)}`);
    cache = { items: [], expiresAt: Date.now() + 60_000 };
    return [];
  }
}
