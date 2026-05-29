// NIST NVD CVE API v2.0 — published in the last 24h with CVSS ≥ 7.0.
// https://services.nvd.nist.gov/rest/json/cves/2.0
// Free, no key required; rate-limited to ~5 req/30s without an API key.
import { safeFetchJson } from "../types";
import { type CyberAdvisory, cvssSeverity } from "./types";

type Cvss = { baseScore?: number; baseSeverity?: string };
type Metric = { cvssData?: Cvss };
type NvdItem = {
  cve?: {
    id?: string;
    published?: string;
    lastModified?: string;
    descriptions?: { lang?: string; value?: string }[];
    metrics?: {
      cvssMetricV31?: Metric[];
      cvssMetricV30?: Metric[];
      cvssMetricV2?: Metric[];
    };
    configurations?: { nodes?: { cpeMatch?: { criteria?: string }[] }[] }[];
  };
};
type NvdPayload = { vulnerabilities?: NvdItem[] };

function extractVendorProduct(cpe: string | undefined): { vendor: string | null; product: string | null } {
  if (!cpe) return { vendor: null, product: null };
  // cpe:2.3:a:vendor:product:version:...
  const parts = cpe.split(":");
  return { vendor: parts[3] || null, product: parts[4] || null };
}

export async function fetchNvdRecent(): Promise<CyberAdvisory[]> {
  const now = new Date();
  const start = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  const fmt = (d: Date): string => d.toISOString().replace(/\.\d+Z$/, ".000");
  const url = `https://services.nvd.nist.gov/rest/json/cves/2.0?pubStartDate=${fmt(start)}&pubEndDate=${fmt(now)}&resultsPerPage=500`;
  const headers: Record<string, string> = {};
  if (process.env.NVD_API_KEY) headers.apiKey = process.env.NVD_API_KEY;
  const j = (await safeFetchJson(url, { timeoutMs: 30_000, headers })) as NvdPayload | null;
  if (!j?.vulnerabilities?.length) return [];

  const out: CyberAdvisory[] = [];
  for (const item of j.vulnerabilities) {
    const c = item.cve;
    if (!c?.id) continue;
    const cvss = c.metrics?.cvssMetricV31?.[0]?.cvssData?.baseScore
      ?? c.metrics?.cvssMetricV30?.[0]?.cvssData?.baseScore
      ?? c.metrics?.cvssMetricV2?.[0]?.cvssData?.baseScore
      ?? null;
    if (cvss == null || cvss < 7.0) continue;
    const desc = c.descriptions?.find((d) => d.lang === "en")?.value ?? null;
    const cpe = c.configurations?.[0]?.nodes?.[0]?.cpeMatch?.[0]?.criteria;
    const { vendor, product } = extractVendorProduct(cpe);
    out.push({
      externalKey: `nvd:${c.id}`,
      source: "nvd",
      cve: c.id,
      title: `${c.id}${product ? ` · ${product}` : ""}`,
      summary: desc ? desc.slice(0, 400) : null,
      severity: cvssSeverity(cvss),
      cvss,
      vendor,
      product,
      link: `https://nvd.nist.gov/vuln/detail/${c.id}`,
      publishedAt: c.published ? new Date(c.published).toISOString() : new Date().toISOString(),
    });
  }
  return out;
}
