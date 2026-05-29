// EU TED (Tenders Electronic Daily) — defense-relevant procurement notices.
// Public search API: https://api.ted.europa.eu/v3/notices/search (POST)
// Defense CPV codes: 35*  (military equipment), 50*  (repair/maintenance), 73* (R&D).
// We hit the GET-style RSS query for CPV class 35 which is reliable + key-free.

import { safeFetchText } from "../sanctions/types";
import type { ContractEntry } from "./types";

// TED publishes per-day XML index files; this RSS-style endpoint surfaces recent notices for CPV 35.
const URL = "https://ted.europa.eu/api/v3.0/notices/atom?q=PD%3D%5BLAST_7_DAYS%5D+AND+%28CPV%3D35*%29";

export async function fetchEuTed(): Promise<ContractEntry[]> {
  const xml = await safeFetchText(URL, 30_000);
  if (!xml) return [];
  const out: ContractEntry[] = [];
  const entryRe = /<entry>([\s\S]*?)<\/entry>/g;
  let m;
  while ((m = entryRe.exec(xml)) !== null) {
    const body = m[1];
    const get = (tag: string): string | null => {
      const r = new RegExp(`<${tag}[^>]*>([\\s\\S]*?)</${tag}>`).exec(body);
      return r ? r[1].replace(/<!\[CDATA\[/, "").replace(/\]\]>/, "").trim() : null;
    };
    const id = get("id");
    const title = get("title");
    const updated = get("updated") ?? get("published");
    const linkMatch = /<link[^>]*href="([^"]+)"/.exec(body);
    const link = linkMatch ? linkMatch[1] : null;
    if (!id || !title) continue;
    out.push({
      externalKey: `ted:${id}`,
      jurisdiction: "eu-ted",
      title,
      agency: null,
      naics: null,
      valueUsd: null,
      country: null,
      summary: null,
      link,
      publishedAt: updated ? new Date(updated).toISOString() : new Date().toISOString(),
      deadlineAt: null,
    });
  }
  return out;
}
