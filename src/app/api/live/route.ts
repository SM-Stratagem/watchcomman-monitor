// Public live-counter endpoint used by the dashboard LIVE INTAKE bar.
// Returns minimal aggregate counts — not the underlying data. Always public
// regardless of API_PUBLIC_READ so the UI bar works for everyone.

import { NextResponse } from "next/server";
import { sql } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { signals, news, ingestRuns } from "../../../../db/schema";
import { getMilitaryFlights } from "@/lib/military-flights";

export const dynamic = "force-dynamic";

export async function GET() {
  let activeSignals = 0;
  let highSeverity = 0;
  let news24 = 0;
  let lastIngestAt: string | null = null;
  let flightCount = 0;
  let militaryCount = 0;

  // DB counters
  if (process.env.DATABASE_URL) {
    try {
      const db = getDb();
      const sigRes = await db.execute<{ total: number; high: number }>(sql`
        SELECT COUNT(*)::int as total,
               COUNT(*) FILTER (WHERE severity IN ('high','critical'))::int as high
        FROM ${signals}
        WHERE occurred_at >= NOW() - INTERVAL '7 days'
      `);
      const newsRes = await db.execute<{ n: number }>(sql`
        SELECT COUNT(*)::int as n FROM ${news} WHERE published_at >= NOW() - INTERVAL '24 hours'
      `);
      const ingestRes = await db.execute<{ ended: Date | null; started: Date | null }>(sql`
        SELECT ended_at as ended, started_at as started FROM ${ingestRuns}
        ORDER BY started_at DESC LIMIT 1
      `);
      const toArr = <T>(x: unknown): T[] => (Array.isArray(x) ? x : ((x as { rows?: unknown[] }).rows ?? [])) as T[];
      const sig = toArr<{ total: number; high: number }>(sigRes)[0];
      const n = toArr<{ n: number }>(newsRes)[0];
      const ing = toArr<{ ended: Date | null; started: Date | null }>(ingestRes)[0];
      if (sig) { activeSignals = Number(sig.total); highSeverity = Number(sig.high); }
      if (n) news24 = Number(n.n);
      if (ing) lastIngestAt = (ing.ended ?? ing.started) ? new Date(ing.ended ?? ing.started!).toISOString() : null;
    } catch {}
  }

  // Flight counters via in-memory cache (refreshed every ~90s).
  try {
    const mil = await getMilitaryFlights();
    militaryCount = mil.length;
  } catch {}
  // For total flights we hit the same in-memory cache used by /api/v1/flights.
  try {
    const { getFlights } = await import("@/lib/flights");
    const all = await getFlights();
    flightCount = all.length;
  } catch {}

  return NextResponse.json({
    activeSignals,
    highSeverity,
    news24,
    flightCount,
    militaryCount,
    lastIngestAt,
    generated: new Date().toISOString(),
  }, { headers: { "cache-control": "public, max-age=15", "access-control-allow-origin": "*" } });
}
