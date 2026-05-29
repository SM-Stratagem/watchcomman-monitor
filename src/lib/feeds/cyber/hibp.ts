// HaveIBeenPwned breach disclosures — public endpoint (no key required for breaches list).
// https://haveibeenpwned.com/api/v3/breaches
// Returns metadata for ~700 historic+recent breaches; we keep the last 30 days.
import { safeFetchJson } from "../types";
import type { CyberAdvisory } from "./types";

const URL = "https://haveibeenpwned.com/api/v3/breaches";

type HibpEntry = {
  Name?: string;
  Title?: string;
  Domain?: string;
  BreachDate?: string;
  AddedDate?: string;
  PwnCount?: number;
  Description?: string;
  IsVerified?: boolean;
  IsSensitive?: boolean;
  IsSpamList?: boolean;
};

export async function fetchHibpRecent(): Promise<CyberAdvisory[]> {
  const j = (await safeFetchJson(URL, { timeoutMs: 25_000, headers: { "user-agent": "watchcomman-monitor" } })) as HibpEntry[] | null;
  if (!Array.isArray(j)) return [];
  const cutoff = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const out: CyberAdvisory[] = [];
  for (const b of j) {
    if (!b.Name) continue;
    const added = b.AddedDate ? new Date(b.AddedDate) : null;
    if (!added || added < cutoff) continue;
    const summary = b.Description ? b.Description.replace(/<[^>]+>/g, "").slice(0, 400) : null;
    const records = b.PwnCount ? `${b.PwnCount.toLocaleString()} records` : null;
    out.push({
      externalKey: `hibp:${b.Name}`,
      source: "hibp",
      cve: null,
      title: `${b.Title ?? b.Name} · breach disclosed${records ? ` (${records})` : ""}`,
      summary,
      severity: (b.PwnCount ?? 0) > 1_000_000 ? "high" : "medium",
      cvss: null,
      vendor: b.Domain ?? null,
      product: null,
      link: `https://haveibeenpwned.com/PwnedWebsites#${b.Name}`,
      publishedAt: added.toISOString(),
    });
  }
  return out;
}
