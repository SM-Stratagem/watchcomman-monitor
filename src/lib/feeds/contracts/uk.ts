// UK Contracts Finder — MOD-relevant notices via the public Atom feed.
// https://www.contractsfinder.service.gov.uk/Published/Notices/Atom
// We filter for MOD or Defence in the title/description.

import { safeFetchText } from "../sanctions/types";
import type { ContractEntry } from "./types";

const URL = "https://www.contractsfinder.service.gov.uk/Published/Notices/Atom";

export async function fetchUkContracts(): Promise<ContractEntry[]> {
  const xml = await safeFetchText(URL, 30_000);
  if (!xml) return [];
  const out: ContractEntry[] = [];
  const entryRe = /<entry>([\s\S]*?)<\/entry>/g;
  let m;
  while ((m = entryRe.exec(xml)) !== null) {
    const body = m[1];
    const get = (tag: string): string | null => {
      const r = new RegExp(`<${tag}[^>]*>([\\s\\S]*?)</${tag}>`).exec(body);
      return r ? r[1].replace(/<!\[CDATA\[/, "").replace(/\]\]>/, "").replace(/<[^>]+>/g, "").trim() : null;
    };
    const id = get("id");
    const title = get("title") ?? "";
    const summary = get("summary");
    const updated = get("updated") ?? get("published");
    const author = get("name");
    const linkMatch = /<link[^>]*href="([^"]+)"/.exec(body);
    const link = linkMatch ? linkMatch[1] : null;
    if (!id || !title) continue;

    const blob = `${title} ${summary ?? ""} ${author ?? ""}`.toLowerCase();
    const isDefence = blob.includes("ministry of defence") || blob.includes("defence ") || blob.includes("dstl ") || blob.includes("dasa ") || blob.includes("ukstratcom");
    if (!isDefence) continue;

    out.push({
      externalKey: `uk-cf:${id}`,
      jurisdiction: "uk-gov",
      title,
      agency: author,
      naics: null,
      valueUsd: null,
      country: "United Kingdom",
      summary,
      link,
      publishedAt: updated ? new Date(updated).toISOString() : new Date().toISOString(),
      deadlineAt: null,
    });
  }
  return out;
}
