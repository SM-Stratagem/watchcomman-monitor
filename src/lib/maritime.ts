// Maritime intel layer.
// 1. Strategic chokepoints with risk indicators derived from current news/signal keyword matches.
// 2. Recent maritime incident headlines (filtered from existing news catalog).
// 3. Optional live vessel positions from AISStream.io (requires AISSTREAM_API_KEY).
//
// AISStream is a free WebSocket service requiring email registration at aisstream.io.
// We don't open a persistent connection from the server (Railway is request-scoped);
// for live AIS, clients can connect from the browser using the same key.

import type { NewsRow, SignalRow } from "./dashboard";

export type Chokepoint = {
  slug: string;
  name: string;
  short: string;
  lat: number;
  lng: number;
  /** Daily oil throughput (million barrels/day) */
  oilMbd?: number;
  /** Daily container traffic share (% global) */
  containerPct?: number;
  blurb: string;
  /** Keywords matched against news/signals to compute live risk score. */
  keywords: string[];
};

export const CHOKEPOINTS: Chokepoint[] = [
  {
    slug: "hormuz",
    name: "Strait of Hormuz",
    short: "Hormuz",
    lat: 26.5, lng: 56.5,
    oilMbd: 20,
    blurb: "World's most strategic oil chokepoint. ~20 Mb/d crude (~30% of seaborne oil).",
    keywords: ["hormuz", "iran navy", "irgc navy", "tanker seizure", "iranian fast attack", "oman gulf"],
  },
  {
    slug: "bab-el-mandeb",
    name: "Bab el-Mandeb",
    short: "Bab el-Mandeb",
    lat: 12.6, lng: 43.3,
    oilMbd: 6,
    blurb: "Red Sea south entrance. Houthi missile/UAS interdictions ongoing; ~12% of world container trade.",
    keywords: ["bab el-mandeb", "bab al-mandab", "houthi", "ansar allah", "red sea", "yemen", "centcom", "tanker", "merchant vessel", "drone boat"],
  },
  {
    slug: "suez",
    name: "Suez Canal",
    short: "Suez",
    lat: 30.5, lng: 32.3,
    containerPct: 12,
    blurb: "Egypt's Suez Canal — 12% of global trade, heavily impacted by Red Sea re-routing.",
    keywords: ["suez", "egyptian canal", "scuc"],
  },
  {
    slug: "malacca",
    name: "Strait of Malacca",
    short: "Malacca",
    lat: 2.8, lng: 101.5,
    oilMbd: 16,
    containerPct: 25,
    blurb: "Singapore–Malaysia–Indonesia. ~16 Mb/d oil flow, 25% of all maritime trade.",
    keywords: ["malacca", "singapore strait", "south china sea", "spratly"],
  },
  {
    slug: "bosporus",
    name: "Bosporus / Turkish Straits",
    short: "Bosporus",
    lat: 41.1, lng: 29.0,
    oilMbd: 3,
    blurb: "Russian Black Sea fleet exit + Russian/Kazakh oil flow. Heavily monitored.",
    keywords: ["bosporus", "bosphorus", "turkish straits", "black sea", "kerch"],
  },
  {
    slug: "taiwan-strait",
    name: "Taiwan Strait",
    short: "Taiwan Strait",
    lat: 24.5, lng: 119.0,
    containerPct: 23,
    blurb: "Critical for ~50% of global container traffic. PLA Navy posturing + frequent freedom-of-navigation transits.",
    keywords: ["taiwan strait", "pla navy", "adiz", "fonops", "taiwan strait crossing"],
  },
  {
    slug: "panama",
    name: "Panama Canal",
    short: "Panama",
    lat: 9.1, lng: -79.7,
    containerPct: 6,
    blurb: "Atlantic ↔ Pacific shortcut. Climate-driven water shortages now constrain throughput.",
    keywords: ["panama canal", "gatun"],
  },
  {
    slug: "kerch",
    name: "Kerch Strait",
    short: "Kerch",
    lat: 45.3, lng: 36.6,
    blurb: "Russian Sea of Azov / Crimea access. Bridge has been struck multiple times.",
    keywords: ["kerch", "crimea bridge", "azov", "russian black sea"],
  },
];

export type ChokepointStatus = Chokepoint & {
  risk: "low" | "elevated" | "high" | "critical";
  mentionsLast48h: number;
  topHeadline: string | null;
};

const MARITIME_KEYWORDS = [
  "tanker", "vessel", "merchant ship", "cargo ship", "shipping", "maritime",
  "naval", "frigate", "destroyer", "carrier", "submarine", "navy",
  "missile strike", "drone boat", "houthi", "anti-ship", "ais", "hijack",
  "boarded", "interdicted", "ramming", "collision",
];

function classify(n: number): ChokepointStatus["risk"] {
  if (n >= 25) return "critical";
  if (n >= 10) return "high";
  if (n >= 4) return "elevated";
  return "low";
}

export function computeChokepointStatus(news: NewsRow[], signals: SignalRow[]): ChokepointStatus[] {
  const newsBlob = news.map((n) => ({ row: n, blob: `${n.title} ${n.summary ?? ""}`.toLowerCase() }));
  const sigBlob = signals.map((s) => ({ row: s, blob: `${s.title} ${s.summary ?? ""} ${s.country ?? ""}`.toLowerCase() }));
  const out: ChokepointStatus[] = [];
  const cutoff = Date.now() - 48 * 60 * 60 * 1000;
  for (const c of CHOKEPOINTS) {
    let mentions = 0;
    let topHeadline: string | null = null;
    for (const { row, blob } of newsBlob) {
      if (new Date(row.publishedAt).getTime() < cutoff) continue;
      if (c.keywords.some((k) => blob.includes(k))) {
        mentions++;
        if (!topHeadline) topHeadline = row.title;
      }
    }
    for (const { row, blob } of sigBlob) {
      if (new Date(row.occurredAt).getTime() < cutoff) continue;
      if (c.keywords.some((k) => blob.includes(k))) mentions += 2; // signals weight 2x
    }
    out.push({ ...c, mentionsLast48h: mentions, risk: classify(mentions), topHeadline });
  }
  return out.sort((a, b) => b.mentionsLast48h - a.mentionsLast48h);
}

// Surface news items that look maritime-related (for the /ships page incident feed).
export function maritimeNewsFilter(news: NewsRow[]): NewsRow[] {
  return news.filter((n) => {
    const blob = `${n.title} ${n.summary ?? ""}`.toLowerCase();
    return MARITIME_KEYWORDS.some((k) => blob.includes(k));
  });
}
