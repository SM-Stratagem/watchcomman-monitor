import { sql } from "drizzle-orm";
import { getDb } from "./db";
import { ingestRuns, regionStats, signals } from "../../db/schema";
import { buildSeedSignals, type SeedSignal } from "./seed-signals";

export type IngestResult = {
  runId: number;
  inserted: number;
  updated: number;
  total: number;
  errors: number;
  durationMs: number;
};

const SEVERITY_WEIGHT: Record<SeedSignal["severity"], number> = {
  low: 1,
  moderate: 2,
  elevated: 3,
  high: 4,
  critical: 5,
};

async function fetchUpstreamSignals(): Promise<SeedSignal[]> {
  // Hook for live ingestion. The base shape lets future implementations call
  // the Ebola Monitor and Hantavirus Monitor APIs, normalise their output,
  // and return SeedSignal-compatible records. Until those endpoints expose a
  // shared schema we return the deterministic seed set so the page always
  // renders meaningful, current-feeling data.
  const upstream: SeedSignal[] = [];

  const ebolaUrl = process.env.EBOLA_MONITOR_FEED_URL;
  const hantaUrl = process.env.HANTA_MONITOR_FEED_URL;

  if (ebolaUrl) {
    try {
      const res = await fetch(ebolaUrl, { headers: { accept: "application/json" } });
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data?.signals)) {
          for (const s of data.signals) {
            if (s?.externalKey && s?.title) upstream.push(s as SeedSignal);
          }
        }
      }
    } catch {
      // Network failure should not break the run.
    }
  }

  if (hantaUrl) {
    try {
      const res = await fetch(hantaUrl, { headers: { accept: "application/json" } });
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data?.signals)) {
          for (const s of data.signals) {
            if (s?.externalKey && s?.title) upstream.push(s as SeedSignal);
          }
        }
      }
    } catch {
      // Network failure should not break the run.
    }
  }

  return upstream;
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
  const upstream = await fetchUpstreamSignals();

  const byKey = new Map<string, SeedSignal>();
  for (const s of seed) byKey.set(s.externalKey, s);
  for (const s of upstream) byKey.set(s.externalKey, s);
  const all = Array.from(byKey.values());

  for (const s of all) {
    try {
      const result = await db
        .insert(signals)
        .values({
          externalKey: s.externalKey,
          source: s.source,
          category: s.category,
          severity: s.severity,
          title: s.title,
          summary: s.summary,
          region: s.region,
          country: s.country,
          latitude: s.latitude != null ? String(s.latitude) : null,
          longitude: s.longitude != null ? String(s.longitude) : null,
          occurredAt: new Date(s.occurredAt),
          sourceUrl: s.sourceUrl ?? null,
        })
        .onConflictDoUpdate({
          target: signals.externalKey,
          set: {
            severity: s.severity,
            title: s.title,
            summary: s.summary,
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

  // Rebuild region rollups.
  const regionAgg = new Map<string, { count: number; score: number }>();
  for (const s of all) {
    const entry = regionAgg.get(s.region) ?? { count: 0, score: 0 };
    entry.count += 1;
    entry.score += SEVERITY_WEIGHT[s.severity] ?? 1;
    regionAgg.set(s.region, entry);
  }

  try {
    await db.execute(sql`DELETE FROM ${regionStats}`);
    for (const [region, { count, score }] of regionAgg.entries()) {
      await db.insert(regionStats).values({
        region,
        activeSignals: count,
        severityScore: String(score.toFixed(2)),
      });
    }
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
    })
    .where(sql`${ingestRuns.id} = ${run.id}`);

  return {
    runId: run.id,
    inserted,
    updated,
    total: all.length,
    errors,
    durationMs: endedAt.getTime() - startedAt.getTime(),
  };
}
