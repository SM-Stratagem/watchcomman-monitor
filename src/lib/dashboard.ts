import { and, desc, eq, gte, inArray, sql } from "drizzle-orm";
import { getDb } from "./db";
import { categoryStats, countryStats, ingestRuns, news, regionStats, signals } from "../../db/schema";
import { buildSeedSignals } from "./seed-signals";

export type SignalRow = {
  id: number;
  externalKey: string;
  source: string;
  category: string;
  subcategory: string | null;
  severity: string;
  title: string;
  summary: string | null;
  region: string | null;
  country: string | null;
  latitude: number | null;
  longitude: number | null;
  magnitude: number | null;
  affected: number | null;
  occurredAt: string;
  sourceUrl: string | null;
};

export type StatRow = {
  key: string;
  activeSignals: number;
  severityScore: number;
};

export type DashboardSnapshot = {
  signals: SignalRow[];
  regions: StatRow[];
  countries: StatRow[];
  categories: StatRow[];
  totals: {
    activeSignals: number;
    regionsWatched: number;
    countriesWatched: number;
    highSeverity: number;
    last24h: number;
    last7d: number;
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

const SEVERITY_WEIGHT: Record<string, number> = {
  low: 1,
  moderate: 2,
  elevated: 3,
  high: 4,
  critical: 5,
};

function fromSeed(): DashboardSnapshot {
  const now = new Date();
  const seed = buildSeedSignals(now);
  const regions = new Map<string, { count: number; score: number }>();
  const countries = new Map<string, { count: number; score: number }>();
  const cats = new Map<string, { count: number; score: number }>();

  const rows: SignalRow[] = seed.map((s, i) => {
    const w = SEVERITY_WEIGHT[s.severity] ?? 1;
    const r = regions.get(s.region) ?? { count: 0, score: 0 };
    r.count++; r.score += w; regions.set(s.region, r);
    if (s.country) {
      const c = countries.get(s.country) ?? { count: 0, score: 0 };
      c.count++; c.score += w; countries.set(s.country, c);
    }
    const k = cats.get(s.category) ?? { count: 0, score: 0 };
    k.count++; k.score += w; cats.set(s.category, k);
    return {
      id: i + 1,
      externalKey: s.externalKey,
      source: s.source,
      category: s.category,
      subcategory: null,
      severity: s.severity,
      title: s.title,
      summary: s.summary,
      region: s.region,
      country: s.country,
      latitude: s.latitude,
      longitude: s.longitude,
      magnitude: null,
      affected: null,
      occurredAt: s.occurredAt,
      sourceUrl: s.sourceUrl ?? null,
    };
  });

  const toStatRows = (m: Map<string, { count: number; score: number }>): StatRow[] =>
    Array.from(m.entries()).map(([k, v]) => ({ key: k, activeSignals: v.count, severityScore: v.score }));

  const dayMs = 24 * 60 * 60 * 1000;
  const nowT = now.getTime();
  return {
    signals: rows,
    regions: toStatRows(regions),
    countries: toStatRows(countries),
    categories: toStatRows(cats),
    totals: {
      activeSignals: rows.length,
      regionsWatched: regions.size,
      countriesWatched: countries.size,
      highSeverity: rows.filter((s) => s.severity === "high" || s.severity === "critical").length,
      last24h: rows.filter((s) => nowT - new Date(s.occurredAt).getTime() < dayMs).length,
      last7d: rows.filter((s) => nowT - new Date(s.occurredAt).getTime() < 7 * dayMs).length,
      lastIngestAt: null,
      lastIngestDurationMs: null,
    },
    source: "seed",
  };
}

function mapSignal(s: typeof signals.$inferSelect): SignalRow {
  return {
    id: s.id,
    externalKey: s.externalKey,
    source: s.source,
    category: s.category,
    subcategory: s.subcategory ?? null,
    severity: s.severity,
    title: s.title,
    summary: s.summary,
    region: s.region,
    country: s.country,
    latitude: toNum(s.latitude),
    longitude: toNum(s.longitude),
    magnitude: toNum(s.magnitude),
    affected: s.affected ?? null,
    occurredAt: s.occurredAt.toISOString(),
    sourceUrl: s.sourceUrl,
  };
}

export async function getDashboardSnapshot(limit = 300): Promise<DashboardSnapshot> {
  if (!process.env.DATABASE_URL) return fromSeed();

  try {
    const db = getDb();
    const sigRows = await db
      .select()
      .from(signals)
      .orderBy(desc(signals.occurredAt))
      .limit(limit);

    if (sigRows.length === 0) return fromSeed();

    const [regRows, ctyRows, catRows, lastRunRows] = await Promise.all([
      db.select().from(regionStats).orderBy(desc(regionStats.severityScore)),
      db.select().from(countryStats).orderBy(desc(countryStats.severityScore)),
      db.select().from(categoryStats).orderBy(desc(categoryStats.severityScore)),
      db.select().from(ingestRuns).orderBy(desc(ingestRuns.startedAt)).limit(1),
    ]);
    const lastRun = lastRunRows[0];

    const mapped = sigRows.map(mapSignal);
    const nowT = Date.now();
    const dayMs = 24 * 60 * 60 * 1000;

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
      regions: regRows.map((r) => ({ key: r.region, activeSignals: r.activeSignals, severityScore: toNum(r.severityScore) ?? 0 })),
      countries: ctyRows.map((r) => ({ key: r.country, activeSignals: r.activeSignals, severityScore: toNum(r.severityScore) ?? 0 })),
      categories: catRows.map((r) => ({ key: r.category, activeSignals: r.activeSignals, severityScore: toNum(r.severityScore) ?? 0 })),
      totals: {
        activeSignals: mapped.length,
        regionsWatched: regRows.length,
        countriesWatched: ctyRows.length,
        highSeverity: mapped.filter((s) => s.severity === "high" || s.severity === "critical").length,
        last24h: mapped.filter((s) => nowT - new Date(s.occurredAt).getTime() < dayMs).length,
        last7d: mapped.filter((s) => nowT - new Date(s.occurredAt).getTime() < 7 * dayMs).length,
        lastIngestAt,
        lastIngestDurationMs,
      },
      source: "db",
    };
  } catch {
    return fromSeed();
  }
}

export async function getSignalsFiltered(opts: {
  category?: string;
  source?: string;
  severity?: string;
  country?: string;
  region?: string;
  sinceHours?: number;
  limit?: number;
}): Promise<SignalRow[]> {
  if (!process.env.DATABASE_URL) {
    const all = (await getDashboardSnapshot()).signals;
    return filterInMem(all, opts);
  }
  try {
    const db = getDb();
    const conds = [];
    if (opts.category) conds.push(eq(signals.category, opts.category));
    if (opts.source) conds.push(eq(signals.source, opts.source));
    if (opts.severity) conds.push(eq(signals.severity, opts.severity));
    if (opts.country) conds.push(eq(signals.country, opts.country));
    if (opts.region) conds.push(eq(signals.region, opts.region));
    if (opts.sinceHours) {
      const cutoff = new Date(Date.now() - opts.sinceHours * 60 * 60 * 1000);
      conds.push(gte(signals.occurredAt, cutoff));
    }
    const where = conds.length ? and(...conds) : undefined;
    const rows = await db
      .select()
      .from(signals)
      .where(where)
      .orderBy(desc(signals.occurredAt))
      .limit(opts.limit ?? 100);
    return rows.map(mapSignal);
  } catch {
    return [];
  }
}

function filterInMem(rows: SignalRow[], opts: Parameters<typeof getSignalsFiltered>[0]): SignalRow[] {
  const cutoff = opts.sinceHours ? Date.now() - opts.sinceHours * 60 * 60 * 1000 : null;
  return rows.filter((s) => {
    if (opts.category && s.category !== opts.category) return false;
    if (opts.source && s.source !== opts.source) return false;
    if (opts.severity && s.severity !== opts.severity) return false;
    if (opts.country && s.country !== opts.country) return false;
    if (opts.region && s.region !== opts.region) return false;
    if (cutoff != null && new Date(s.occurredAt).getTime() < cutoff) return false;
    return true;
  }).slice(0, opts.limit ?? 100);
}

export type NewsRow = {
  id: number;
  externalKey: string;
  sourceSlug: string;
  sourceName: string;
  region: string;
  title: string;
  summary: string | null;
  link: string;
  author: string | null;
  publishedAt: string;
};

export async function getNews(opts: {
  region?: string;
  sources?: string[];
  sinceHours?: number;
  limit?: number;
}): Promise<NewsRow[]> {
  if (!process.env.DATABASE_URL) return [];
  try {
    const db = getDb();
    const conds = [];
    if (opts.region) conds.push(eq(news.region, opts.region));
    if (opts.sources?.length) conds.push(inArray(news.sourceSlug, opts.sources));
    if (opts.sinceHours) {
      const cutoff = new Date(Date.now() - opts.sinceHours * 60 * 60 * 1000);
      conds.push(gte(news.publishedAt, cutoff));
    }
    const where = conds.length ? and(...conds) : undefined;
    const rows = await db
      .select()
      .from(news)
      .where(where)
      .orderBy(desc(news.publishedAt))
      .limit(opts.limit ?? 50);
    return rows.map((r) => ({
      id: r.id,
      externalKey: r.externalKey,
      sourceSlug: r.sourceSlug,
      sourceName: r.sourceName,
      region: r.region,
      title: r.title,
      summary: r.summary,
      link: r.link,
      author: r.author,
      publishedAt: r.publishedAt.toISOString(),
    }));
  } catch {
    return [];
  }
}

export async function getNewsCountsByRegion(): Promise<Record<string, number>> {
  if (!process.env.DATABASE_URL) return {};
  try {
    const db = getDb();
    const cutoff = new Date(Date.now() - 48 * 60 * 60 * 1000);
    const rows = await db
      .select({ region: news.region, count: sql<number>`count(*)::int` })
      .from(news)
      .where(gte(news.publishedAt, cutoff))
      .groupBy(news.region);
    const out: Record<string, number> = {};
    for (const r of rows) out[r.region] = r.count;
    return out;
  } catch {
    return {};
  }
}

export async function getTimeBuckets(opts: {
  category?: string;
  country?: string;
  buckets?: number; // number of days, default 14
}): Promise<Array<{ date: string; count: number }>> {
  const days = opts.buckets ?? 14;
  const out: Array<{ date: string; count: number }> = [];
  const start = new Date();
  start.setUTCHours(0, 0, 0, 0);

  const rows = await getSignalsFiltered({
    category: opts.category,
    country: opts.country,
    sinceHours: days * 24,
    limit: 1000,
  });

  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(start.getTime() - i * 24 * 60 * 60 * 1000);
    const next = d.getTime() + 24 * 60 * 60 * 1000;
    const count = rows.filter((s) => {
      const t = new Date(s.occurredAt).getTime();
      return t >= d.getTime() && t < next;
    }).length;
    out.push({ date: d.toISOString().slice(0, 10), count });
  }
  return out;
}
