// Free prediction-market APIs: Manifold (no key) and Polymarket Gamma (no key).

import { safeFetchJson } from "./feeds/types";

export type LiveMarket = {
  id: string;
  question: string;
  probability: number;
  vol: number | null;       // USD-ish (or mana for Manifold)
  source: "Manifold" | "Polymarket" | "Kalshi";
  href: string;
  closeTime: string | null;
};

type ManifoldMarket = {
  id: string;
  question: string;
  url: string;
  probability?: number;
  closeTime?: number;
  volume?: number;
  isResolved?: boolean;
  outcomeType?: string;
};

async function fetchManifold(): Promise<LiveMarket[]> {
  // Top, currently-active markets
  const url = "https://api.manifold.markets/v0/markets?limit=50&order=volume";
  const data = (await safeFetchJson(url)) as ManifoldMarket[] | null;
  if (!Array.isArray(data)) return [];
  const out: LiveMarket[] = [];
  for (const m of data) {
    if (m.isResolved) continue;
    if (m.outcomeType && m.outcomeType !== "BINARY") continue;
    if (typeof m.probability !== "number") continue;
    out.push({
      id: `manifold:${m.id}`,
      question: m.question,
      probability: m.probability,
      vol: m.volume ?? null,
      source: "Manifold",
      href: m.url,
      closeTime: m.closeTime ? new Date(m.closeTime).toISOString() : null,
    });
  }
  return out.slice(0, 20);
}

type PolyMarket = {
  id: string | number;
  question?: string;
  slug?: string;
  outcomePrices?: string;   // "[\"0.74\", \"0.26\"]"
  outcomes?: string;        // "[\"Yes\",\"No\"]"
  volumeNum?: number;
  endDate?: string;
  active?: boolean;
  closed?: boolean;
};

async function fetchPolymarket(): Promise<LiveMarket[]> {
  const url = "https://gamma-api.polymarket.com/markets?limit=80&order=volume24hr&ascending=false&closed=false";
  const data = (await safeFetchJson(url)) as PolyMarket[] | null;
  if (!Array.isArray(data)) return [];
  const out: LiveMarket[] = [];
  for (const m of data) {
    if (!m.question || m.closed || m.active === false) continue;
    let yesProb: number | null = null;
    try {
      const prices = JSON.parse(m.outcomePrices ?? "[]") as string[];
      const outcomes = JSON.parse(m.outcomes ?? "[]") as string[];
      const yesIdx = outcomes.findIndex((o) => /yes/i.test(o));
      if (yesIdx >= 0 && prices[yesIdx]) yesProb = Number(prices[yesIdx]);
      else if (prices[0]) yesProb = Number(prices[0]);
    } catch {}
    if (yesProb == null || !Number.isFinite(yesProb)) continue;
    out.push({
      id: `polymarket:${m.id}`,
      question: m.question,
      probability: yesProb,
      vol: m.volumeNum ?? null,
      source: "Polymarket",
      href: `https://polymarket.com/event/${m.slug ?? m.id}`,
      closeTime: m.endDate ?? null,
    });
  }
  return out.slice(0, 20);
}

let cache: { items: LiveMarket[]; expiresAt: number } | null = null;
const TTL_MS = 5 * 60 * 1000;

export async function getLiveMarkets(): Promise<LiveMarket[]> {
  if (cache && cache.expiresAt > Date.now()) return cache.items;
  const [manifold, poly] = await Promise.all([fetchManifold(), fetchPolymarket()]);
  const items = [...poly, ...manifold].slice(0, 24);
  cache = { items, expiresAt: Date.now() + TTL_MS };
  return items;
}
