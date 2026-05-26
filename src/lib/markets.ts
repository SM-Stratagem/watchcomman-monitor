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
  const url = `https://api.coingecko.com/api/v3/simple/price?ids=${CRYPTO_IDS.join(",")}&vs_currencies=usd&include_24hr_change=true`;
  const data = (await safeFetchJson(url, { timeoutMs: 6000 })) as Record<string, { usd: number; usd_24h_change: number }> | null;
  if (!data) return [];
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
  const out: Quote[] = [];
  for (const id of CRYPTO_IDS) {
    const v = data[id];
    if (!v) continue;
    const meta = NAMES[id];
    out.push({ symbol: meta.sym, name: meta.name, price: v.usd, changePct: v.usd_24h_change ?? 0, unit: "USD" });
  }
  return out;
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

export async function fetchCommodities(): Promise<Quote[]> {
  const SYMBOLS: Array<{ stooq: string; sym: string; name: string; unit: string }> = [
    { stooq: "cl.f", sym: "WTI", name: "Crude Oil (WTI)", unit: "USD/bbl" },
    { stooq: "co.f", sym: "Brent", name: "Brent Crude", unit: "USD/bbl" },
    { stooq: "gc.f", sym: "Gold", name: "Gold", unit: "USD/oz" },
    { stooq: "si.f", sym: "Silver", name: "Silver", unit: "USD/oz" },
    { stooq: "hg.f", sym: "Copper", name: "Copper", unit: "USD/lb" },
    { stooq: "ng.f", sym: "NatGas", name: "Natural Gas", unit: "USD/MMBtu" },
  ];
  const prices = await Promise.all(SYMBOLS.map((s) => fetchStooqOne(s.stooq)));
  const out: Quote[] = [];
  for (let i = 0; i < SYMBOLS.length; i++) {
    const p = prices[i];
    if (p == null) continue;
    out.push({ symbol: SYMBOLS[i].sym, name: SYMBOLS[i].name, price: p, changePct: 0, unit: SYMBOLS[i].unit });
  }
  return out;
}

export async function fetchIndices(): Promise<Quote[]> {
  const SYMBOLS: Array<{ stooq: string; sym: string; name: string }> = [
    { stooq: "^spx", sym: "S&P 500", name: "S&P 500" },
    { stooq: "^ndx", sym: "Nasdaq 100", name: "Nasdaq 100" },
    { stooq: "^dji", sym: "Dow", name: "Dow Jones" },
    { stooq: "^ftm", sym: "FTSE 100", name: "FTSE 100" },
    { stooq: "^dax", sym: "DAX", name: "DAX" },
    { stooq: "^nkx", sym: "Nikkei", name: "Nikkei 225" },
    { stooq: "^hsi", sym: "Hang Seng", name: "Hang Seng" },
    { stooq: "^vix", sym: "VIX", name: "VIX" },
  ];
  const prices = await Promise.all(SYMBOLS.map((s) => fetchStooqOne(s.stooq)));
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
