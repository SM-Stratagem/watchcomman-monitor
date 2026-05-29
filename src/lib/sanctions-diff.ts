// Sanctions delta — entries added/removed in the last N hours, using first_seen / last_seen.
import { sql } from "drizzle-orm";
import { getDb } from "./db";
import { sanctionsEntries } from "../../db/schema";

export type SanctionsDelta = {
  added: SanctionRow[];
  removed: SanctionRow[];
  totals: Record<string, { total: number; added24h: number; added7d: number }>;
};

export type SanctionRow = {
  externalKey: string;
  jurisdiction: string;
  listName: string;
  entityName: string;
  entityType: string | null;
  program: string | null;
  addressCountry: string | null;
  firstSeenAt: Date | null;
  lastSeenAt: Date | null;
};

const JURISDICTIONS = ["ofac", "eu", "uk", "bis"] as const;

function emptyDelta(): SanctionsDelta {
  const totals: SanctionsDelta["totals"] = {};
  for (const j of JURISDICTIONS) totals[j] = { total: 0, added24h: 0, added7d: 0 };
  return { added: [], removed: [], totals };
}

export async function getSanctionsDelta(sinceHours = 24): Promise<SanctionsDelta> {
  if (!process.env.DATABASE_URL) return emptyDelta();
  let db;
  try { db = getDb(); } catch { return emptyDelta(); }
  const since = new Date(Date.now() - sinceHours * 60 * 60 * 1000);
  const dropCutoff = new Date(Date.now() - 36 * 60 * 60 * 1000);

  try {
  const addedRows = await db.execute<SanctionRow>(sql`
    SELECT external_key as "externalKey", jurisdiction, list_name as "listName",
           entity_name as "entityName", entity_type as "entityType",
           program, address_country as "addressCountry",
           first_seen_at as "firstSeenAt", last_seen_at as "lastSeenAt"
    FROM ${sanctionsEntries}
    WHERE first_seen_at >= ${since.toISOString()}
    ORDER BY first_seen_at DESC
    LIMIT 500
  `);
  const removedRows = await db.execute<SanctionRow>(sql`
    SELECT external_key as "externalKey", jurisdiction, list_name as "listName",
           entity_name as "entityName", entity_type as "entityType",
           program, address_country as "addressCountry",
           first_seen_at as "firstSeenAt", last_seen_at as "lastSeenAt"
    FROM ${sanctionsEntries}
    WHERE last_seen_at < ${dropCutoff.toISOString()}
    ORDER BY last_seen_at DESC
    LIMIT 500
  `);

  const totalsRaw = await db.execute<{ jurisdiction: string; total: number; added24h: number; added7d: number }>(sql`
    SELECT jurisdiction,
           COUNT(*)::int as total,
           COUNT(*) FILTER (WHERE first_seen_at >= NOW() - INTERVAL '24 hours')::int as added24h,
           COUNT(*) FILTER (WHERE first_seen_at >= NOW() - INTERVAL '7 days')::int as added7d
    FROM ${sanctionsEntries}
    GROUP BY jurisdiction
  `);

  const totals: SanctionsDelta["totals"] = {};
  for (const j of JURISDICTIONS) totals[j] = { total: 0, added24h: 0, added7d: 0 };
  // pg may return rows as array or .rows
  const totalsArr = Array.isArray(totalsRaw) ? totalsRaw : ((totalsRaw as { rows?: unknown[] }).rows ?? []);
  for (const t of totalsArr as Array<{ jurisdiction: string; total: number; added24h: number; added7d: number }>) {
    totals[t.jurisdiction] = { total: Number(t.total), added24h: Number(t.added24h), added7d: Number(t.added7d) };
  }

  const toArr = (x: unknown): SanctionRow[] => (Array.isArray(x) ? x : ((x as { rows?: unknown[] }).rows ?? [])) as SanctionRow[];
  return { added: toArr(addedRows), removed: toArr(removedRows), totals };
  } catch { return emptyDelta(); }
}
