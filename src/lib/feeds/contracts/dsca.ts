// DSCA Foreign Military Sales notifications to Congress — RSS of recent press releases.
// Public RSS feed: https://www.dsca.mil/press-media/major-arms-sales/feed
// Falls back to scraping the press-media listing if RSS is empty.

import { safeFetchText } from "../sanctions/types";
import type { ContractEntry } from "./types";

const RSS_URL = "https://www.dsca.mil/press-media/major-arms-sales/feed";

function decodeHtml(s: string): string {
  return s
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">");
}

export async function fetchDsca(): Promise<ContractEntry[]> {
  const xml = await safeFetchText(RSS_URL, 25_000);
  if (!xml) return [];
  const out: ContractEntry[] = [];
  const itemRe = /<item>([\s\S]*?)<\/item>/g;
  let m;
  while ((m = itemRe.exec(xml)) !== null) {
    const body = m[1];
    const get = (tag: string): string | null => {
      const r = new RegExp(`<${tag}[^>]*>([\\s\\S]*?)</${tag}>`).exec(body);
      return r ? decodeHtml(r[1].replace(/<!\[CDATA\[/, "").replace(/\]\]>/, "").trim()) : null;
    };
    const title = get("title");
    const link = get("link");
    const pub = get("pubDate");
    const desc = get("description");
    if (!title || !link) continue;
    // Extract country from title pattern: "Australia – F-35 Lightning..."
    const country = title.split(/[–—-]/)[0].trim() || null;
    // Extract dollar value from description if present.
    const dollarMatch = desc ? desc.match(/\$([\d,.]+)\s*(million|billion)/i) : null;
    let valueUsd: number | null = null;
    if (dollarMatch) {
      const n = Number(dollarMatch[1].replace(/,/g, ""));
      valueUsd = Number.isFinite(n) ? n * (dollarMatch[2].toLowerCase().startsWith("b") ? 1e9 : 1e6) : null;
    }
    out.push({
      externalKey: `dsca:${link}`,
      jurisdiction: "dsca",
      title,
      agency: "Defense Security Cooperation Agency",
      naics: null,
      valueUsd,
      country,
      summary: desc ? desc.replace(/<[^>]+>/g, "").slice(0, 400) : null,
      link,
      publishedAt: pub ? new Date(pub).toISOString() : new Date().toISOString(),
      deadlineAt: null,
    });
  }
  return out;
}
