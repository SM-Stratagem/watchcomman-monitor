// Time machine data endpoint. Returns signals + news bucketed into hour buckets
// for the last N hours (default 7d = 168h).
// Used by /timeline page to scrub. API-key gated by middleware.

import { NextResponse } from "next/server";
import { sql } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { signals, news } from "../../../../../db/schema";

export const dynamic = "force-dynamic";

type Bucket = {
  hour: string; // ISO truncated to hour, e.g. "2026-05-28T13:00:00Z"
  signals: number;
  news: number;
  high: number;
};

export async function GET(req: Request) {
  const url = new URL(req.url);
  const hours = Math.min(720, Math.max(24, Number(url.searchParams.get("hours") ?? 168) || 168));
  if (!process.env.DATABASE_URL) {
    return NextResponse.json({ hours, buckets: [], note: "no database" });
  }
  const db = getDb();
  try {
    const sigRes = await db.execute<{ hour: string; n: number; high: number }>(sql`
      SELECT to_char(date_trunc('hour', occurred_at), 'YYYY-MM-DD"T"HH24:MI:SS"Z"') as hour,
             COUNT(*)::int as n,
             COUNT(*) FILTER (WHERE severity IN ('high','critical'))::int as high
      FROM ${signals}
      WHERE occurred_at >= NOW() - INTERVAL '1 hour' * ${hours}
      GROUP BY 1
    `);
    const newsRes = await db.execute<{ hour: string; n: number }>(sql`
      SELECT to_char(date_trunc('hour', published_at), 'YYYY-MM-DD"T"HH24:MI:SS"Z"') as hour,
             COUNT(*)::int as n
      FROM ${news}
      WHERE published_at >= NOW() - INTERVAL '1 hour' * ${hours}
      GROUP BY 1
    `);
    const toArr = <T>(x: unknown): T[] => (Array.isArray(x) ? x : ((x as { rows?: unknown[] }).rows ?? [])) as T[];

    const map = new Map<string, Bucket>();
    for (const r of toArr<{ hour: string; n: number; high: number }>(sigRes)) {
      map.set(r.hour, { hour: r.hour, signals: Number(r.n), news: 0, high: Number(r.high) });
    }
    for (const r of toArr<{ hour: string; n: number }>(newsRes)) {
      const ex = map.get(r.hour);
      if (ex) ex.news = Number(r.n);
      else map.set(r.hour, { hour: r.hour, signals: 0, news: Number(r.n), high: 0 });
    }
    const buckets = Array.from(map.values()).sort((a, b) => a.hour.localeCompare(b.hour));
    return NextResponse.json({ hours, buckets }, { headers: { "cache-control": "private, max-age=60", "access-control-allow-origin": "*" } });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "internal" }, { status: 500 });
  }
}
