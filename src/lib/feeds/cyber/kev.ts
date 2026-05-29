// CISA Known Exploited Vulnerabilities catalog.
// JSON: https://www.cisa.gov/sites/default/files/feeds/known_exploited_vulnerabilities.json
import { safeFetchJson } from "../types";
import type { CyberAdvisory } from "./types";

const URL = "https://www.cisa.gov/sites/default/files/feeds/known_exploited_vulnerabilities.json";

type KevEntry = {
  cveID: string;
  vendorProject?: string;
  product?: string;
  vulnerabilityName?: string;
  dateAdded?: string;
  shortDescription?: string;
  knownRansomwareCampaignUse?: string;
  notes?: string;
};

type KevPayload = { vulnerabilities?: KevEntry[] };

export async function fetchKev(): Promise<CyberAdvisory[]> {
  const j = (await safeFetchJson(URL, { timeoutMs: 30_000 })) as KevPayload | null;
  if (!j?.vulnerabilities?.length) return [];
  const out: CyberAdvisory[] = [];
  for (const v of j.vulnerabilities) {
    if (!v.cveID) continue;
    out.push({
      externalKey: `kev:${v.cveID}`,
      source: "kev",
      cve: v.cveID,
      title: v.vulnerabilityName || `${v.vendorProject ?? ""} ${v.product ?? ""}`.trim() || v.cveID,
      summary: v.shortDescription ?? null,
      severity: "critical",
      cvss: null,
      vendor: v.vendorProject ?? null,
      product: v.product ?? null,
      link: `https://nvd.nist.gov/vuln/detail/${v.cveID}`,
      publishedAt: v.dateAdded ? new Date(v.dateAdded).toISOString() : new Date().toISOString(),
    });
  }
  return out;
}
