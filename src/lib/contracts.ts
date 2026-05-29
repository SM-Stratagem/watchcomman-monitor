// Read helpers for the defense contracts panel.
import { sql } from "drizzle-orm";
import { getDb } from "./db";
import { contracts } from "../../db/schema";

export type ContractsData = {
  recent: ContractRow[];
  totals: { samCount: number; tedCount: number; ukCount: number; dscaCount: number; total: number };
};

export type ContractRow = {
  externalKey: string;
  jurisdiction: string;
  title: string;
  agency: string | null;
  naics: string | null;
  valueUsd: string | null;
  country: string | null;
  summary: string | null;
  link: string | null;
  publishedAt: Date;
  deadlineAt: Date | null;
};

const toRows = (x: unknown): ContractRow[] => (Array.isArray(x) ? x : ((x as { rows?: unknown[] }).rows ?? [])) as ContractRow[];

function emptyContracts(): ContractsData {
  return { recent: [], totals: { samCount: 0, tedCount: 0, ukCount: 0, dscaCount: 0, total: 0 } };
}

export async function getContracts(limit = 100): Promise<ContractsData> {
  if (!process.env.DATABASE_URL) return emptyContracts();
  let db;
  try { db = getDb(); } catch { return emptyContracts(); }
  try {
  const recentRes = await db.execute<ContractRow>(sql`
    SELECT external_key as "externalKey", jurisdiction, title, agency, naics,
           value_usd::text as "valueUsd", country, summary, link,
           published_at as "publishedAt", deadline_at as "deadlineAt"
    FROM ${contracts}
    WHERE published_at >= NOW() - INTERVAL '60 days'
    ORDER BY published_at DESC
    LIMIT ${limit}
  `);
  const totalsRes = await db.execute<{ jurisdiction: string; n: number }>(sql`
    SELECT jurisdiction, COUNT(*)::int as n FROM ${contracts}
    WHERE published_at >= NOW() - INTERVAL '60 days'
    GROUP BY jurisdiction
  `);
  const totals = { samCount: 0, tedCount: 0, ukCount: 0, dscaCount: 0, total: 0 };
  for (const t of (toRows(totalsRes) as unknown as Array<{ jurisdiction: string; n: number }>)) {
    const n = Number(t.n);
    totals.total += n;
    if (t.jurisdiction === "us-sam") totals.samCount = n;
    if (t.jurisdiction === "eu-ted") totals.tedCount = n;
    if (t.jurisdiction === "uk-gov") totals.ukCount = n;
    if (t.jurisdiction === "dsca")   totals.dscaCount = n;
  }
  return { recent: toRows(recentRes), totals };
  } catch { return emptyContracts(); }
}
