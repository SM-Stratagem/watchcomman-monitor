export type CyberAdvisory = {
  externalKey: string;
  source: "kev" | "nvd" | "hibp" | "ics-cert";
  cve: string | null;
  title: string;
  summary: string | null;
  severity: "critical" | "high" | "medium" | "low" | null;
  cvss: number | null;
  vendor: string | null;
  product: string | null;
  link: string | null;
  publishedAt: string;
};

export function cvssSeverity(cvss: number | null | undefined): CyberAdvisory["severity"] {
  if (cvss == null) return null;
  if (cvss >= 9.0) return "critical";
  if (cvss >= 7.0) return "high";
  if (cvss >= 4.0) return "medium";
  return "low";
}
