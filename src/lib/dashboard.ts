import { desc, sql } from "drizzle-orm";
import { getDb } from "./db";
import { ingestRuns, regionStats, signals } from "../../db/schema";
import { buildSeedSignals } from "./seed-signals";

export type SignalRow = {
  id: number;
  externalKey: string;
  source: string;
  category: string;
  severity: string;
  title: string;
  summary: string | null;
  region: string | null;
  country: string | null;
  latitude: number | null;
  longitude: number | null;
  occurredAt: string;
  sourceUrl: string | null;
};

export type RegionRow = {
  region: string;
  activeSignals: number;
  severityScore: number;
};

export type DashboardSnapshot = {
  signals: SignalRow[];
  regions: RegionRow[];
  totals: {
    activeSignals: number;
    regionsWatched: number;
    highSeverity: number;
    lastIngestAt: string | null;
    lastIngestDurationMs: number | null;
  };
  source: "db" | "seed";
};

function toNum(v: unknown): number | null {
  if (v == null) return null;
  if (typeof v === "number") return v;
  if (typeof v === "string") {
    const n = Number(v);
    return Number.isFinite(n) ? n : null;
  }
  return null;
}

function fromSeed(): DashboardSnapshot {
  const now = new Date();
  const seed = buildSeedSignals(now);
  const regions = new Map<string, { count: number; score: number }>();
  const sevWeight: Record<string, number> = {
    low: 1,
    moderate: 2,
    elevated: 3,
    high: 4,
    critical: 5,
  };

  const rows: SignalRow[] = seed.map((s, i) => {
    const r = regions.get(s.region) ?? { count: 0, score: 0 };
    r.count += 1;
    r.score += sevWeight[s.severity] ?? 1;
    regions.set(s.region, r);
    return {
      id: i + 1,
      externalKey: s.externalKey,
      source: s.source,
      category: s.category,
      severity: s.severity,
      title: s.title,
      summary: s.summary,
      region: s.region,
      country: s.country,
      latitude: s.latitude,
      longitude: s.longitude,
      occurredAt: s.occurredAt,
      sourceUrl: s.sourceUrl ?? null,
    };
  });

  const regionRows: RegionRow[] = Array.from(regions.entries()).map(([region, v]) => ({
    region,
    activeSignals: v.count,
    severityScore: v.score,
  }));

  return {
    signals: rows,
    regions: regionRows,
    totals: {
      activeSignals: rows.length,
      regionsWatched: regionRows.length,
      highSeverity: rows.filter((s) => s.severity === "high" || s.severity === "critical").length,
      lastIngestAt: null,
      lastIngestDurationMs: null,
    },
    source: "seed",
  };
}

export async function getDashboardSnapshot(): Promise<DashboardSnapshot> {
  if (!process.env.DATABASE_URL) {
    return fromSeed();
  }

  try {
    const db = getDb();

    const sigRows = await db
      .select()
      .from(signals)
      .orderBy(desc(signals.occurredAt))
      .limit(200);

    if (sigRows.length === 0) {
      return fromSeed();
    }

    const regRows = await db
      .select()
      .from(regionStats)
      .orderBy(desc(regionStats.severityScore));

    const lastRunRows = await db
      .select()
      .from(ingestRuns)
      .orderBy(desc(ingestRuns.startedAt))
      .limit(1);
    const lastRun = lastRunRows[0];

    const mapped: SignalRow[] = sigRows.map((s) => ({
      id: s.id,
      externalKey: s.externalKey,
      source: s.source,
      category: s.category,
      severity: s.severity,
      title: s.title,
      summary: s.summary,
      region: s.region,
      country: s.country,
      latitude: toNum(s.latitude),
      longitude: toNum(s.longitude),
      occurredAt: s.occurredAt.toISOString(),
      sourceUrl: s.sourceUrl,
    }));

    const regions: RegionRow[] = regRows.map((r) => ({
      region: r.region,
      activeSignals: r.activeSignals,
      severityScore: toNum(r.severityScore) ?? 0,
    }));

    const lastIngestAt = lastRun?.endedAt
      ? lastRun.endedAt.toISOString()
      : lastRun?.startedAt
        ? lastRun.startedAt.toISOString()
        : null;
    const lastIngestDurationMs =
      lastRun?.endedAt && lastRun?.startedAt
        ? lastRun.endedAt.getTime() - lastRun.startedAt.getTime()
        : null;

    return {
      signals: mapped,
      regions,
      totals: {
        activeSignals: mapped.length,
        regionsWatched: regions.length,
        highSeverity: mapped.filter(
          (s) => s.severity === "high" || s.severity === "critical",
        ).length,
        lastIngestAt,
        lastIngestDurationMs,
      },
      source: "db",
    };
  } catch {
    return fromSeed();
  } finally {
    // Keep pool open for subsequent requests on the same server.
    void sql``;
  }
}
