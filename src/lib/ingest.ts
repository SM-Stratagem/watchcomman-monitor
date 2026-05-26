import { sql } from "drizzle-orm";
import { getDb } from "./db";
import { categoryStats, countryStats, ingestRuns, news, regionStats, signals } from "../../db/schema";
import { buildSeedSignals } from "./seed-signals";
import type { NormalizedSignal } from "./feeds/types";
import { fetchUsgs } from "./feeds/usgs";
import { fetchEonet } from "./feeds/eonet";
import { fetchReliefWeb } from "./feeds/reliefweb";
import { fetchGdacs } from "./feeds/gdacs";
import { fetchWhoDon } from "./feeds/who";
import { fetchAllNews } from "./feeds/rss";

export type IngestResult = {
  runId: number;
  inserted: number;
  updated: number;
  total: number;
  errors: number;
  durationMs: number;
  bySource: Record<string, number>;
};

const SEVERITY_WEIGHT: Record<NormalizedSignal["severity"], number> = {
  low: 1,
  moderate: 2,
  elevated: 3,
  high: 4,
  critical: 5,
};

async function fetchAll(): Promise<NormalizedSignal[]> {
  const tasks: Array<Promise<NormalizedSignal[]>> = [
    fetchUsgs(),
    fetchEonet(),
    fetchReliefWeb(),
    fetchGdacs(),
    fetchWhoDon(),
  ];

  // Optional sibling-monitor feeds.
  const ebolaUrl = process.env.EBOLA_MONITOR_FEED_URL;
  const hantaUrl = process.env.HANTA_MONITOR_FEED_URL;
  if (ebolaUrl) tasks.push(fetchSibling(ebolaUrl, "ebola"));
  if (hantaUrl) tasks.push(fetchSibling(hantaUrl, "hantavirus"));

  const results = await Promise.all(tasks.map((p) => p.catch(() => [] as NormalizedSignal[])));
  return results.flat();
}

async function fetchSibling(url: string, source: string): Promise<NormalizedSignal[]> {
  try {
    const res = await fetch(url, { headers: { accept: "application/json" } });
    if (!res.ok) return [];
    const data = (await res.json()) as { signals?: Array<Partial<NormalizedSignal>> };
    if (!Array.isArray(data?.signals)) return [];
    const out: NormalizedSignal[] = [];
    for (const s of data.signals) {
      if (!s.externalKey || !s.title) continue;
      out.push({
        externalKey: String(s.externalKey),
        source: s.source || source,
        category: s.category || "outbreak",
        subcategory: s.subcategory ?? null,
        severity: (s.severity as NormalizedSignal["severity"]) || "moderate",
        title: s.title,
        summary: s.summary ?? null,
        region: s.region || "Global",
        country: s.country ?? null,
        latitude: typeof s.latitude === "number" ? s.latitude : null,
        longitude: typeof s.longitude === "number" ? s.longitude : null,
        magnitude: typeof s.magnitude === "number" ? s.magnitude : null,
        affected: typeof s.affected === "number" ? s.affected : null,
        occurredAt: s.occurredAt || new Date().toISOString(),
        sourceUrl: s.sourceUrl ?? null,
      });
    }
    return out;
  } catch {
    return [];
  }
}

export async function ingestSignals(): Promise<IngestResult> {
  const db = getDb();
  const startedAt = new Date();

  const [run] = await db
    .insert(ingestRuns)
    .values({ startedAt, total: 0, inserted: 0, updated: 0, errors: 0 })
    .returning({ id: ingestRuns.id });

  let inserted = 0;
  let updated = 0;
  let errors = 0;

  const seed = buildSeedSignals(startedAt);
  const live = await fetchAll();

  const byKey = new Map<string, NormalizedSignal>();
  for (const s of seed) byKey.set(s.externalKey, s as NormalizedSignal);
  for (const s of live) byKey.set(s.externalKey, s);
  const all = Array.from(byKey.values());

  const bySource: Record<string, number> = {};
  for (const s of all) bySource[s.source] = (bySource[s.source] ?? 0) + 1;

  for (const s of all) {
    try {
      const result = await db
        .insert(signals)
        .values({
          externalKey: s.externalKey,
          source: s.source,
          category: s.category,
          subcategory: s.subcategory ?? null,
          severity: s.severity,
          title: s.title,
          summary: s.summary,
          region: s.region,
          country: s.country,
          latitude: s.latitude != null ? String(s.latitude) : null,
          longitude: s.longitude != null ? String(s.longitude) : null,
          magnitude: s.magnitude != null ? String(s.magnitude) : null,
          affected: s.affected ?? null,
          occurredAt: new Date(s.occurredAt),
          sourceUrl: s.sourceUrl ?? null,
        })
        .onConflictDoUpdate({
          target: signals.externalKey,
          set: {
            severity: s.severity,
            title: s.title,
            summary: s.summary,
            subcategory: s.subcategory ?? null,
            magnitude: s.magnitude != null ? String(s.magnitude) : null,
            affected: s.affected ?? null,
            occurredAt: new Date(s.occurredAt),
            sourceUrl: s.sourceUrl ?? null,
          },
        })
        .returning({ id: signals.id, createdAt: signals.createdAt });

      if (result.length > 0) {
        const r = result[0];
        if (r.createdAt && Math.abs(r.createdAt.getTime() - startedAt.getTime()) < 60_000) {
          inserted++;
        } else {
          updated++;
        }
      }
    } catch {
      errors++;
    }
  }

  // Rebuild rollups (region, country, category).
  const regionAgg = new Map<string, { count: number; score: number }>();
  const countryAgg = new Map<string, { count: number; score: number }>();
  const categoryAgg = new Map<string, { count: number; score: number }>();
  for (const s of all) {
    const w = SEVERITY_WEIGHT[s.severity] ?? 1;
    if (s.region) {
      const e = regionAgg.get(s.region) ?? { count: 0, score: 0 };
      e.count++; e.score += w; regionAgg.set(s.region, e);
    }
    if (s.country) {
      const e = countryAgg.get(s.country) ?? { count: 0, score: 0 };
      e.count++; e.score += w; countryAgg.set(s.country, e);
    }
    const e = categoryAgg.get(s.category) ?? { count: 0, score: 0 };
    e.count++; e.score += w; categoryAgg.set(s.category, e);
  }

  try {
    await db.execute(sql`DELETE FROM ${regionStats}`);
    for (const [region, v] of regionAgg.entries()) {
      await db.insert(regionStats).values({
        region,
        activeSignals: v.count,
        severityScore: String(v.score.toFixed(2)),
      });
    }
    await db.execute(sql`DELETE FROM ${countryStats}`);
    for (const [country, v] of countryAgg.entries()) {
      await db.insert(countryStats).values({
        country,
        activeSignals: v.count,
        severityScore: String(v.score.toFixed(2)),
      });
    }
    await db.execute(sql`DELETE FROM ${categoryStats}`);
    for (const [category, v] of categoryAgg.entries()) {
      await db.insert(categoryStats).values({
        category,
        activeSignals: v.count,
        severityScore: String(v.score.toFixed(2)),
      });
    }
  } catch {
    errors++;
  }

  // News ingest (RSS feeds, 200+ sources)
  let newsInserted = 0;
  let newsOk = 0;
  let newsFailed = 0;
  try {
    const newsRes = await fetchAllNews({ concurrency: 12, max: 4000 });
    newsOk = newsRes.okSources;
    newsFailed = newsRes.failedSources;
    // Batch upsert
    for (const item of newsRes.items) {
      try {
        await db.insert(news).values({
          externalKey: item.externalKey,
          sourceSlug: item.sourceSlug,
          sourceName: item.sourceName,
          region: item.region,
          title: item.title,
          summary: item.summary,
          link: item.link,
          author: item.author,
          publishedAt: new Date(item.publishedAt),
        }).onConflictDoUpdate({
          target: news.externalKey,
          set: {
            title: item.title,
            summary: item.summary,
            link: item.link,
            publishedAt: new Date(item.publishedAt),
          },
        });
        newsInserted++;
      } catch {
        errors++;
      }
    }

    // Prune old news (keep ~30 days)
    const cutoff = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    try {
      await db.execute(sql`DELETE FROM ${news} WHERE published_at < ${cutoff.toISOString()}`);
    } catch {}
  } catch {
    errors++;
  }

  const endedAt = new Date();
  await db
    .update(ingestRuns)
    .set({
      endedAt,
      inserted,
      updated,
      total: all.length,
      errors,
      notes: JSON.stringify({ bySource, news: { inserted: newsInserted, okSources: newsOk, failedSources: newsFailed } }).slice(0, 800),
    })
    .where(sql`${ingestRuns.id} = ${run.id}`);

  return {
    runId: run.id,
    inserted,
    updated,
    total: all.length,
    errors,
    durationMs: endedAt.getTime() - startedAt.getTime(),
    bySource,
  };
}
