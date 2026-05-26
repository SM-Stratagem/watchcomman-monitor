// Live market data: crypto (CoinGecko), FX (Frankfurter), commodities + indices (Stooq).
// All free, no API key.

import { safeFetchJson } from "./feeds/types";

export type Quote = {
  symbol: string;
  name: string;
  price: number;
  changePct: number;
  unit?: string;
};

const CRYPTO_IDS = ["bitcoin", "ethereum", "binancecoin", "solana", "ripple", "cardano", "tron", "dogecoin"];

export async function fetchCrypto(): Promise<Quote[]> {
  // Try CoinGecko first
  const cgUrl = `https://api.coingecko.com/api/v3/simple/price?ids=${CRYPTO_IDS.join(",")}&vs_currencies=usd&include_24hr_change=true`;
  const cg = (await safeFetchJson(cgUrl, { timeoutMs: 5000 })) as Record<string, { usd: number; usd_24h_change: number }> | null;
  const NAMES: Record<string, { sym: string; name: string }> = {
    bitcoin: { sym: "BTC", name: "Bitcoin" },
    ethereum: { sym: "ETH", name: "Ethereum" },
    binancecoin: { sym: "BNB", name: "BNB" },
    solana: { sym: "SOL", name: "Solana" },
    ripple: { sym: "XRP", name: "XRP" },
    cardano: { sym: "ADA", name: "Cardano" },
    tron: { sym: "TRX", name: "Tron" },
    dogecoin: { sym: "DOGE", name: "Dogecoin" },
  };
  if (cg && Object.keys(cg).length) {
    const out: Quote[] = [];
    for (const id of CRYPTO_IDS) {
      const v = cg[id];
      if (!v) continue;
      const meta = NAMES[id];
      out.push({ symbol: meta.sym, name: meta.name, price: v.usd, changePct: v.usd_24h_change ?? 0, unit: "USD" });
    }
    if (out.length) return out;
  }
  // Fallback: CoinCap (free, often allows cloud IPs)
  const ccUrl = "https://api.coincap.io/v2/assets?limit=20";
  const cc = (await safeFetchJson(ccUrl, { timeoutMs: 5000 })) as { data?: Array<{ id: string; symbol: string; name: string; priceUsd: string; changePercent24Hr: string }> } | null;
  if (cc?.data?.length) {
    const want = new Set(["bitcoin", "ethereum", "binance-coin", "solana", "xrp", "cardano", "tron", "dogecoin"]);
    const out: Quote[] = [];
    for (const a of cc.data) {
      if (!want.has(a.id)) continue;
      out.push({ symbol: a.symbol, name: a.name, price: Number(a.priceUsd), changePct: Number(a.changePercent24Hr), unit: "USD" });
    }
    return out;
  }
  return [];
}

export async function fetchFx(): Promise<Quote[]> {
  const url = "https://api.frankfurter.dev/v1/latest?base=USD&symbols=EUR,GBP,JPY,CNY,INR,BRL,CHF,CAD,AUD,KRW,TRY,RUB";
  const data = (await safeFetchJson(url, { timeoutMs: 6000 })) as { rates?: Record<string, number> } | null;
  if (!data?.rates) return [];
  const PAIRS: Array<[string, string]> = [
    ["EUR", "Euro"], ["GBP", "British Pound"], ["JPY", "Japanese Yen"], ["CNY", "Chinese Yuan"],
    ["RUB", "Russian Ruble"], ["INR", "Indian Rupee"], ["BRL", "Brazilian Real"], ["CHF", "Swiss Franc"],
    ["CAD", "Canadian Dollar"], ["AUD", "Australian Dollar"], ["KRW", "S. Korean Won"], ["TRY", "Turkish Lira"],
  ];
  const out: Quote[] = [];
  for (const [sym, name] of PAIRS) {
    const r = data.rates[sym];
    if (!r) continue;
    out.push({ symbol: `USD/${sym}`, name, price: r, changePct: 0, unit: "" });
  }
  return out;
}

async function fetchStooqOne(symbol: string): Promise<number | null> {
  try {
    const controller = new AbortController();
    const t = setTimeout(() => controller.abort(), 4000);
    const res = await fetch(`https://stooq.com/q/l/?s=${symbol}&i=d`, {
      headers: { "user-agent": "watchcomman-monitor/1.0" },
      signal: controller.signal,
    });
    clearTimeout(t);
    if (!res.ok) return null;
    const csv = await res.text();
    const lines = csv.trim().split("\n").filter((l) => l.trim());
    for (const line of lines) {
      const cols = line.split(",");
      const p = Number(cols[6]);
      if (Number.isFinite(p) && p > 0) return p;
    }
    return null;
  } catch { return null; }
}

async function fetchYahooOne(symbol: string): Promise<number | null> {
  try {
    const controller = new AbortController();
    const t = setTimeout(() => controller.abort(), 4000);
    const res = await fetch(`https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?interval=1d&range=1d`, {
      headers: {
        "user-agent": "Mozilla/5.0 (compatible; watchcomman/1.0)",
        accept: "application/json",
      },
      signal: controller.signal,
    });
    clearTimeout(t);
    if (!res.ok) return null;
    const data = (await res.json()) as { chart?: { result?: Array<{ meta?: { regularMarketPrice?: number } }> } };
    const p = data.chart?.result?.[0]?.meta?.regularMarketPrice;
    return typeof p === "number" && p > 0 ? p : null;
  } catch { return null; }
}

async function fetchSymbol(stooq: string, yahoo: string): Promise<number | null> {
  // Try both in parallel, return first successful
  const [s, y] = await Promise.all([fetchStooqOne(stooq), fetchYahooOne(yahoo)]);
  return s ?? y ?? null;
}

export async function fetchCommodities(): Promise<Quote[]> {
  const SYMBOLS: Array<{ stooq: string; yahoo: string; sym: string; name: string; unit: string }> = [
    { stooq: "cl.f", yahoo: "CL=F", sym: "WTI", name: "Crude Oil (WTI)", unit: "USD/bbl" },
    { stooq: "co.f", yahoo: "BZ=F", sym: "Brent", name: "Brent Crude", unit: "USD/bbl" },
    { stooq: "gc.f", yahoo: "GC=F", sym: "Gold", name: "Gold", unit: "USD/oz" },
    { stooq: "si.f", yahoo: "SI=F", sym: "Silver", name: "Silver", unit: "USD/oz" },
    { stooq: "hg.f", yahoo: "HG=F", sym: "Copper", name: "Copper", unit: "USD/lb" },
    { stooq: "ng.f", yahoo: "NG=F", sym: "NatGas", name: "Natural Gas", unit: "USD/MMBtu" },
  ];
  const prices = await Promise.all(SYMBOLS.map((s) => fetchSymbol(s.stooq, s.yahoo)));
  const out: Quote[] = [];
  for (let i = 0; i < SYMBOLS.length; i++) {
    const p = prices[i];
    if (p == null) continue;
    out.push({ symbol: SYMBOLS[i].sym, name: SYMBOLS[i].name, price: p, changePct: 0, unit: SYMBOLS[i].unit });
  }
  return out;
}

export async function fetchIndices(): Promise<Quote[]> {
  const SYMBOLS: Array<{ stooq: string; yahoo: string; sym: string; name: string }> = [
    { stooq: "^spx", yahoo: "^GSPC", sym: "S&P 500", name: "S&P 500" },
    { stooq: "^ndx", yahoo: "^NDX", sym: "Nasdaq 100", name: "Nasdaq 100" },
    { stooq: "^dji", yahoo: "^DJI", sym: "Dow", name: "Dow Jones" },
    { stooq: "^ftm", yahoo: "^FTSE", sym: "FTSE 100", name: "FTSE 100" },
    { stooq: "^dax", yahoo: "^GDAXI", sym: "DAX", name: "DAX" },
    { stooq: "^nkx", yahoo: "^N225", sym: "Nikkei", name: "Nikkei 225" },
    { stooq: "^hsi", yahoo: "^HSI", sym: "Hang Seng", name: "Hang Seng" },
    { stooq: "^vix", yahoo: "^VIX", sym: "VIX", name: "VIX" },
  ];
  const prices = await Promise.all(SYMBOLS.map((s) => fetchSymbol(s.stooq, s.yahoo)));
  const out: Quote[] = [];
  for (let i = 0; i < SYMBOLS.length; i++) {
    const p = prices[i];
    if (p == null) continue;
    out.push({ symbol: SYMBOLS[i].sym, name: SYMBOLS[i].name, price: p, changePct: 0 });
  }
  return out;
}

// In-memory cache to avoid hitting Stooq/CoinGecko on every page render
let cache: { snap: MarketSnapshot; expiresAt: number } | null = null;
const TTL_MS = 90_000;

export type MarketSnapshot = {
  crypto: Quote[];
  fx: Quote[];
  commodities: Quote[];
  indices: Quote[];
  generated: string;
};

export async function getMarketSnapshot(): Promise<MarketSnapshot> {
  if (cache && cache.expiresAt > Date.now()) return cache.snap;
  const [crypto, fx, commodities, indices] = await Promise.all([
    fetchCrypto().catch(() => []),
    fetchFx().catch(() => []),
    fetchCommodities().catch(() => []),
    fetchIndices().catch(() => []),
  ]);
  const snap = { crypto, fx, commodities, indices, generated: new Date().toISOString() };
  cache = { snap, expiresAt: Date.now() + TTL_MS };
  return snap;
}
