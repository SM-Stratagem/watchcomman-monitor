// Read helpers for the cyber threat intel panel.
import { sql } from "drizzle-orm";
import { getDb } from "./db";
import { cyberAdvisories } from "../../db/schema";

export type CyberPanelData = {
  recent: CyberRow[];
  totals: { kev: number; nvd: number; hibp: number; critical7d: number };
};

export type CyberRow = {
  externalKey: string;
  source: string;
  cve: string | null;
  title: string;
  summary: string | null;
  severity: string | null;
  cvss: string | null;
  vendor: string | null;
  product: string | null;
  link: string | null;
  publishedAt: Date;
};

const toRows = (x: unknown): CyberRow[] => (Array.isArray(x) ? x : ((x as { rows?: unknown[] }).rows ?? [])) as CyberRow[];

function emptyPanel(): CyberPanelData {
  return { recent: [], totals: { kev: 0, nvd: 0, hibp: 0, critical7d: 0 } };
}

export async function getCyberPanel(): Promise<CyberPanelData> {
  if (!process.env.DATABASE_URL) return emptyPanel();
  let db;
  try { db = getDb(); } catch { return emptyPanel(); }
  try {
  const recentRes = await db.execute<CyberRow>(sql`
    SELECT external_key as "externalKey", source, cve, title, summary, severity,
           cvss::text as cvss, vendor, product, link, published_at as "publishedAt"
    FROM ${cyberAdvisories}
    WHERE published_at >= NOW() - INTERVAL '14 days'
    ORDER BY
      CASE source WHEN 'kev' THEN 0 WHEN 'nvd' THEN 1 ELSE 2 END,
      published_at DESC
    LIMIT 60
  `);
  const totalsRes = await db.execute<{ source: string; n: number }>(sql`
    SELECT source, COUNT(*)::int as n
    FROM ${cyberAdvisories}
    WHERE published_at >= NOW() - INTERVAL '14 days'
    GROUP BY source
  `);
  const criticalRes = await db.execute<{ n: number }>(sql`
    SELECT COUNT(*)::int as n FROM ${cyberAdvisories}
    WHERE severity = 'critical' AND published_at >= NOW() - INTERVAL '7 days'
  `);

  const totals = { kev: 0, nvd: 0, hibp: 0, critical7d: 0 };
  for (const t of toRows(totalsRes) as unknown as Array<{ source: string; n: number }>) {
    if (t.source in totals) (totals as Record<string, number>)[t.source] = Number(t.n);
  }
  const c = (toRows(criticalRes) as unknown as Array<{ n: number }>)[0];
  totals.critical7d = Number(c?.n ?? 0);

  return { recent: toRows(recentRes), totals };
  } catch { return emptyPanel(); }
}
