// Live market data: crypto (CoinGecko), FX (exchangerate.host), public commodity references.
// All free, no API key needed.

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
  const data = (await safeFetchJson(url)) as Record<string, { usd: number; usd_24h_change: number }> | null;
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
    out.push({
      symbol: meta.sym,
      name: meta.name,
      price: v.usd,
      changePct: v.usd_24h_change ?? 0,
      unit: "USD",
    });
  }
  return out;
}

export async function fetchFx(): Promise<Quote[]> {
  // exchangerate.host is free; uses EUR as base by default. We pivot to USD.
  const url = "https://api.exchangerate.host/latest?base=USD&symbols=EUR,GBP,JPY,CNY,RUB,INR,BRL,CHF,CAD,AUD,KRW,TRY";
  const data = (await safeFetchJson(url)) as { rates?: Record<string, number> } | null;
  if (!data?.rates) return [];
  const PAIRS: Array<[string, string]> = [
    ["EUR", "Euro"],
    ["GBP", "British Pound"],
    ["JPY", "Japanese Yen"],
    ["CNY", "Chinese Yuan"],
    ["RUB", "Russian Ruble"],
    ["INR", "Indian Rupee"],
    ["BRL", "Brazilian Real"],
    ["CHF", "Swiss Franc"],
    ["CAD", "Canadian Dollar"],
    ["AUD", "Australian Dollar"],
    ["KRW", "South Korean Won"],
    ["TRY", "Turkish Lira"],
  ];
  const out: Quote[] = [];
  for (const [sym, name] of PAIRS) {
    const r = data.rates[sym];
    if (!r) continue;
    out.push({ symbol: `USD/${sym}`, name, price: r, changePct: 0, unit: "" });
  }
  return out;
}

// Cached commodity reference quotes: scrape-free public endpoint via Frankfurter for metals is unreliable.
// We use stooq.com static CSV via fetch as a stable, key-less fallback for major futures.
export async function fetchCommodities(): Promise<Quote[]> {
  const SYMBOLS: Array<{ stooq: string; sym: string; name: string; unit: string }> = [
    { stooq: "cl.f", sym: "WTI", name: "Crude Oil (WTI)", unit: "USD/bbl" },
    { stooq: "co.f", sym: "Brent", name: "Brent Crude", unit: "USD/bbl" },
    { stooq: "gc.f", sym: "Gold", name: "Gold", unit: "USD/oz" },
    { stooq: "si.f", sym: "Silver", name: "Silver", unit: "USD/oz" },
    { stooq: "hg.f", sym: "Copper", name: "Copper", unit: "USD/lb" },
    { stooq: "ng.f", sym: "NatGas", name: "Natural Gas", unit: "USD/MMBtu" },
  ];
  const out: Quote[] = [];
  for (const s of SYMBOLS) {
    try {
      const controller = new AbortController();
      const t = setTimeout(() => controller.abort(), 8000);
      const res = await fetch(`https://stooq.com/q/l/?s=${s.stooq}&i=d`, {
        headers: { "user-agent": "watchcomman-monitor/1.0" },
        signal: controller.signal,
      });
      clearTimeout(t);
      if (!res.ok) continue;
      const csv = await res.text();
      const lines = csv.trim().split("\n");
      if (lines.length < 2) continue;
      const cols = lines[1].split(",");
      const price = Number(cols[6]);
      if (!Number.isFinite(price)) continue;
      out.push({ symbol: s.sym, name: s.name, price, changePct: 0, unit: s.unit });
    } catch {}
  }
  return out;
}

// Major equity indices via stooq (static CSV — close-of-prev day; intraday requires paid)
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
  const out: Quote[] = [];
  for (const s of SYMBOLS) {
    try {
      const controller = new AbortController();
      const t = setTimeout(() => controller.abort(), 8000);
      const res = await fetch(`https://stooq.com/q/l/?s=${s.stooq}&i=d`, {
        headers: { "user-agent": "watchcomman-monitor/1.0" },
        signal: controller.signal,
      });
      clearTimeout(t);
      if (!res.ok) continue;
      const csv = await res.text();
      const lines = csv.trim().split("\n");
      if (lines.length < 2) continue;
      const cols = lines[1].split(",");
      const price = Number(cols[6]);
      if (!Number.isFinite(price)) continue;
      out.push({ symbol: s.sym, name: s.name, price, changePct: 0 });
    } catch {}
  }
  return out;
}

export async function getMarketSnapshot(): Promise<{
  crypto: Quote[];
  fx: Quote[];
  commodities: Quote[];
  indices: Quote[];
  generated: string;
}> {
  const [crypto, fx, commodities, indices] = await Promise.all([
    fetchCrypto().catch(() => []),
    fetchFx().catch(() => []),
    fetchCommodities().catch(() => []),
    fetchIndices().catch(() => []),
  ]);
  return { crypto, fx, commodities, indices, generated: new Date().toISOString() };
}
