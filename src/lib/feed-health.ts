// Per-source feed health helpers. Each ingest pipeline calls recordFeedStatus
// to upsert a row keyed by source_slug.

import { sql } from "drizzle-orm";
import { getDb } from "./db";
import { feedStatus } from "../../db/schema";

export type FeedStatusRow = {
  sourceSlug: string;
  kind: string;
  ok: boolean;
  itemsReturned: number;
  durationMs: number;
  error: string | null;
  lastSuccessAt: Date | null;
  lastFailureAt: Date | null;
  checkedAt: Date;
};

const toRows = (x: unknown): FeedStatusRow[] => (Array.isArray(x) ? x : ((x as { rows?: unknown[] }).rows ?? [])) as FeedStatusRow[];

export async function recordFeedStatus(input: {
  sourceSlug: string;
  kind?: string;
  ok: boolean;
  itemsReturned?: number;
  durationMs?: number;
  error?: string | null;
}): Promise<void> {
  const db = getDb();
  const now = new Date();
  await db.execute(sql`
    INSERT INTO ${feedStatus}
      (source_slug, kind, ok, items_returned, duration_ms, error, last_success_at, last_failure_at, checked_at)
    VALUES
      (${input.sourceSlug}, ${input.kind ?? "rss"}, ${input.ok}, ${input.itemsReturned ?? 0}, ${input.durationMs ?? 0},
       ${input.error ?? null},
       ${input.ok ? now.toISOString() : null}, ${input.ok ? null : now.toISOString()},
       ${now.toISOString()})
    ON CONFLICT (source_slug) DO UPDATE SET
      kind = EXCLUDED.kind,
      ok = EXCLUDED.ok,
      items_returned = EXCLUDED.items_returned,
      duration_ms = EXCLUDED.duration_ms,
      error = EXCLUDED.error,
      last_success_at = COALESCE(EXCLUDED.last_success_at, ${feedStatus.lastSuccessAt}),
      last_failure_at = COALESCE(EXCLUDED.last_failure_at, ${feedStatus.lastFailureAt}),
      checked_at = EXCLUDED.checked_at
  `).catch(() => undefined);
}

export type SourceHealth = {
  rows: FeedStatusRow[];
  totals: { ok: number; failed: number; total: number; never: number };
};

export async function getSourceHealth(): Promise<SourceHealth> {
  if (!process.env.DATABASE_URL) {
    return { rows: [], totals: { ok: 0, failed: 0, total: 0, never: 0 } };
  }
  try {
    const db = getDb();
    const res = await db.execute<FeedStatusRow>(sql`
      SELECT source_slug as "sourceSlug", kind, ok,
             items_returned as "itemsReturned", duration_ms as "durationMs", error,
             last_success_at as "lastSuccessAt", last_failure_at as "lastFailureAt",
             checked_at as "checkedAt"
      FROM ${feedStatus}
      ORDER BY (ok = false) DESC, source_slug ASC
      LIMIT 600
    `);
    const rows = toRows(res);
    let ok = 0;
    let failed = 0;
    for (const r of rows) { if (r.ok) ok++; else failed++; }
    return { rows, totals: { ok, failed, total: rows.length, never: 0 } };
  } catch {
    return { rows: [], totals: { ok: 0, failed: 0, total: 0, never: 0 } };
  }
}
