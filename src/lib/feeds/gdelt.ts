import { regionFromLatLng, safeFetchJson, type NormalizedSignal } from "./types";

// GDELT 2.0 Doc API — global news article events, free, no API key.
// We query for major conflict / disaster / geopolitical events in the last day.
// Docs: https://blog.gdeltproject.org/gdelt-doc-2-0-api-debuts/

type GdeltArticle = {
  url: string;
  url_mobile?: string;
  title: string;
  seendate: string; // YYYYMMDDTHHMMSSZ
  socialimage?: string;
  domain: string;
  language: string;
  sourcecountry?: string;
};

const QUERIES = [
  // Each query returns up to 75 articles
  { q: 'theme:WB_2436_CONFLICT_AND_VIOLENCE sourcelang:eng', tag: "conflict", sev: "high" as const },
  { q: 'theme:NATURAL_DISASTER sourcelang:eng', tag: "disaster", sev: "elevated" as const },
  { q: 'theme:TERRORISM sourcelang:eng', tag: "terror", sev: "high" as const },
  { q: 'theme:CYBER_ATTACK sourcelang:eng', tag: "cyber", sev: "elevated" as const },
];

function parseSeenDate(s: string): string {
  if (!s || s.length < 14) return new Date().toISOString();
  const y = s.slice(0, 4), m = s.slice(4, 6), d = s.slice(6, 8);
  const hh = s.slice(9, 11), mm = s.slice(11, 13), ss = s.slice(13, 15);
  const iso = `${y}-${m}-${d}T${hh}:${mm}:${ss}Z`;
  const dt = new Date(iso);
  return Number.isFinite(dt.getTime()) ? dt.toISOString() : new Date().toISOString();
}

// Country ISO 2-letter → rough coords (centroid). Subset for major countries.
const COUNTRY_COORDS: Record<string, [number, number]> = {
  US: [-95.7, 37.1], CN: [104.2, 35.9], RU: [105.3, 61.5], IN: [78.96, 20.59],
  BR: [-51.92, -14.24], CA: [-106.34, 56.13], MX: [-102.55, 23.63], DE: [10.45, 51.17],
  FR: [2.21, 46.23], GB: [-3.43, 55.38], IT: [12.57, 41.87], ES: [-3.75, 40.46],
  JP: [138.25, 36.20], KR: [127.77, 35.91], AU: [133.78, -25.27], TR: [35.24, 38.96],
  IR: [53.69, 32.43], IL: [34.85, 31.05], EG: [30.80, 26.82], SA: [45.08, 23.89],
  AE: [53.85, 23.42], UA: [31.17, 48.38], PL: [19.13, 51.92], SE: [18.64, 60.13],
  NO: [8.47, 60.47], FI: [25.75, 61.92], NL: [5.29, 52.13], BE: [4.47, 50.5],
  CH: [8.23, 46.82], AT: [14.55, 47.52], GR: [21.82, 39.07], PT: [-8.22, 39.4],
  IE: [-8.24, 53.41], DK: [9.50, 56.26], CZ: [15.47, 49.82], HU: [19.50, 47.16],
  RO: [24.97, 45.94], BG: [25.49, 42.73], RS: [21.01, 44.02], HR: [15.20, 45.10],
  ZA: [22.94, -30.56], NG: [8.68, 9.08], KE: [37.91, -0.02], ET: [40.49, 9.15],
  EG2: [30.80, 26.82], MA: [-7.09, 31.79], DZ: [1.66, 28.03], LY: [17.23, 26.34],
  SD: [30.22, 12.86], SY: [38.99, 34.80], IQ: [43.68, 33.22], YE: [48.52, 15.55],
  AF: [67.71, 33.94], PK: [69.35, 30.38], BD: [90.36, 23.69], LK: [80.77, 7.87],
  TH: [100.99, 15.87], VN: [108.28, 14.06], PH: [121.77, 12.88], ID: [113.92, -0.79],
  MY: [101.98, 4.21], SG: [103.82, 1.35], MM: [95.96, 21.92], KH: [104.99, 12.57],
  LA: [102.50, 19.85], MN: [103.85, 46.86], KP: [127.51, 40.34], TW: [120.96, 23.7],
  AR: [-63.62, -38.42], CL: [-71.54, -35.68], CO: [-74.30, 4.57], PE: [-75.02, -9.19],
  VE: [-66.59, 6.42], EC: [-78.18, -1.83], BO: [-63.59, -16.29], PY: [-58.44, -23.44],
  UY: [-55.77, -32.52], CU: [-77.78, 21.52], JM: [-77.30, 18.11], HT: [-72.29, 18.97],
  DO: [-70.16, 18.74], GT: [-90.23, 15.78], HN: [-86.24, 15.20], NI: [-85.21, 12.86],
  CR: [-83.75, 9.75], PA: [-80.78, 8.54],
};

export async function fetchGdelt(): Promise<NormalizedSignal[]> {
  const out: NormalizedSignal[] = [];
  for (const block of QUERIES) {
    const url = `https://api.gdeltproject.org/api/v2/doc/doc?query=${encodeURIComponent(block.q)}&mode=ArtList&format=json&maxrecords=50&sort=DateDesc&timespan=1d`;
    const data = (await safeFetchJson(url, { timeoutMs: 12_000 })) as { articles?: GdeltArticle[] } | null;
    if (!data?.articles?.length) continue;
    for (const a of data.articles) {
      const cc = (a.sourcecountry || "").toUpperCase().slice(0, 2);
      const coords = COUNTRY_COORDS[cc] ?? null;
      const lng = coords?.[0] ?? null;
      const lat = coords?.[1] ?? null;
      out.push({
        externalKey: `gdelt:${block.tag}:${a.url}`,
        source: "gdelt",
        category: block.tag === "disaster" ? "disaster" : block.tag === "cyber" ? "advisory" : "advisory",
        subcategory: block.tag,
        severity: block.sev,
        title: a.title,
        summary: `${a.domain} — ${a.language?.toUpperCase() ?? ""}`,
        region: regionFromLatLng(lat, lng, "Global"),
        country: a.sourcecountry || null,
        latitude: lat,
        longitude: lng,
        magnitude: null,
        affected: null,
        occurredAt: parseSeenDate(a.seendate),
        sourceUrl: a.url,
      });
    }
  }
  // Dedup by externalKey
  const map = new Map<string, NormalizedSignal>();
  for (const s of out) map.set(s.externalKey, s);
  return Array.from(map.values()).slice(0, 200);
}
