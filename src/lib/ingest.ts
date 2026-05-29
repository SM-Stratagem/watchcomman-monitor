import { sql } from "drizzle-orm";
import { getDb } from "./db";
import {
  categoryStats, contracts, countryStats, cyberAdvisories, ingestRuns,
  news, regionStats, sanctionsEntries, signals,
} from "../../db/schema";
import { buildSeedSignals } from "./seed-signals";
import type { NormalizedSignal } from "./feeds/types";
import { fetchUsgs } from "./feeds/usgs";
import { fetchEonet } from "./feeds/eonet";
import { fetchReliefWeb } from "./feeds/reliefweb";
import { fetchGdacs } from "./feeds/gdacs";
import { fetchWhoDon } from "./feeds/who";
import { fetchGdelt } from "./feeds/gdelt";
import { fetchNoaaAlerts } from "./feeds/noaa";
import { fetchAllNews } from "./feeds/rss";
import { fetchAllCommercialNews } from "./feeds/news-apis";
import { fetchAcled } from "./feeds/conflict/acled";
import { fetchGdeltGkg } from "./feeds/gdelt-gkg";
import { recordFeedStatus } from "./feed-health";
import { fetchAllSanctions, type SanctionEntry } from "./feeds/sanctions";
import { fetchAllCyber, type CyberAdvisory } from "./feeds/cyber";
import { fetchAllContracts, type ContractEntry } from "./feeds/contracts";

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

async function timedFetch(slug: string, kind: string, fn: () => Promise<NormalizedSignal[]>): Promise<NormalizedSignal[]> {
  const t0 = Date.now();
  try {
    const items = await fn();
    await recordFeedStatus({ sourceSlug: slug, kind, ok: true, itemsReturned: items.length, durationMs: Date.now() - t0 });
    return items;
  } catch (e) {
    await recordFeedStatus({ sourceSlug: slug, kind, ok: false, durationMs: Date.now() - t0, error: e instanceof Error ? e.message : String(e) });
    return [];
  }
}

async function fetchAll(): Promise<NormalizedSignal[]> {
  const tasks: Array<Promise<NormalizedSignal[]>> = [
    timedFetch("usgs", "signal", fetchUsgs),
    timedFetch("eonet", "signal", fetchEonet),
    timedFetch("reliefweb", "signal", fetchReliefWeb),
    timedFetch("gdacs", "signal", fetchGdacs),
    timedFetch("who-don", "signal", fetchWhoDon),
    timedFetch("gdelt-doc", "signal", fetchGdelt),
    timedFetch("gdelt-gkg", "signal", fetchGdeltGkg),
    timedFetch("noaa-cap", "signal", fetchNoaaAlerts),
    timedFetch("acled", "signal", fetchAcled),
  ];

  // Optional sibling-monitor feeds.
  const ebolaUrl = process.env.EBOLA_MONITOR_FEED_URL;
  const hantaUrl = process.env.HANTA_MONITOR_FEED_URL;
  if (ebolaUrl) tasks.push(fetchSibling(ebolaUrl, "ebola"));
  if (hantaUrl) tasks.push(fetchSibling(hantaUrl, "hantavirus"));

  const results = await Promise.all(tasks.map((p) => p.catch(() => [] as NormalizedSignal[])));
  return results.flat();
}

async function persistSanctions(items: SanctionEntry[]): Promise<{ inserted: number; updated: number }> {
  if (items.length === 0) return { inserted: 0, updated: 0 };
  const db = getDb();
  const now = new Date();
  let inserted = 0;
  let updated = 0;
  for (const e of items) {
    try {
      const result = await db.insert(sanctionsEntries).values({
        externalKey: e.externalKey,
        jurisdiction: e.jurisdiction,
        listName: e.listName,
        entityName: e.entityName,
        entityType: e.entityType ?? null,
        program: e.program ?? null,
        addressCountry: e.addressCountry ?? null,
        remarks: e.remarks ?? null,
        rawJson: e.raw ? JSON.stringify(e.raw).slice(0, 4000) : null,
        listedAt: e.listedAt ? new Date(e.listedAt) : null,
        firstSeenAt: now,
        lastSeenAt: now,
      }).onConflictDoUpdate({
        target: sanctionsEntries.externalKey,
        set: {
          entityName: e.entityName,
          entityType: e.entityType ?? null,
          program: e.program ?? null,
          addressCountry: e.addressCountry ?? null,
          remarks: e.remarks ?? null,
          lastSeenAt: now,
        },
      }).returning({ id: sanctionsEntries.id, firstSeenAt: sanctionsEntries.firstSeenAt });
      const r = result[0];
      if (r && Math.abs(r.firstSeenAt.getTime() - now.getTime()) < 30_000) inserted++;
      else updated++;
    } catch {}
  }
  return { inserted, updated };
}

async function persistCyber(items: CyberAdvisory[]): Promise<number> {
  if (items.length === 0) return 0;
  const db = getDb();
  let n = 0;
  for (const c of items) {
    try {
      await db.insert(cyberAdvisories).values({
        externalKey: c.externalKey,
        source: c.source,
        cve: c.cve,
        title: c.title,
        summary: c.summary,
        severity: c.severity,
        cvss: c.cvss != null ? String(c.cvss) : null,
        vendor: c.vendor,
        product: c.product,
        link: c.link,
        publishedAt: new Date(c.publishedAt),
      }).onConflictDoUpdate({
        target: cyberAdvisories.externalKey,
        set: { severity: c.severity, summary: c.summary, cvss: c.cvss != null ? String(c.cvss) : null },
      });
      n++;
    } catch {}
  }
  return n;
}

async function persistContracts(items: ContractEntry[]): Promise<number> {
  if (items.length === 0) return 0;
  const db = getDb();
  let n = 0;
  for (const c of items) {
    try {
      await db.insert(contracts).values({
        externalKey: c.externalKey,
        jurisdiction: c.jurisdiction,
        title: c.title,
        agency: c.agency,
        naics: c.naics,
        valueUsd: c.valueUsd != null ? String(c.valueUsd) : null,
        country: c.country,
        summary: c.summary,
        link: c.link,
        publishedAt: new Date(c.publishedAt),
        deadlineAt: c.deadlineAt ? new Date(c.deadlineAt) : null,
      }).onConflictDoUpdate({
        target: contracts.externalKey,
        set: { title: c.title, summary: c.summary, link: c.link, deadlineAt: c.deadlineAt ? new Date(c.deadlineAt) : null },
      });
      n++;
    } catch {}
  }
  return n;
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
    const [newsRes, commercialRes] = await Promise.all([
      fetchAllNews({ concurrency: 12, max: 4000 }),
      fetchAllCommercialNews().catch(() => ({ items: [], bySource: {} })),
    ]);
    newsOk = newsRes.okSources;
    newsFailed = newsRes.failedSources;
    const combined = [...newsRes.items, ...commercialRes.items];
    // Dedup
    const seen = new Set<string>();
    const finalItems = combined.filter((i) => seen.has(i.externalKey) ? false : (seen.add(i.externalKey), true));
    // Batch upsert
    for (const item of finalItems) {
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

  // Defense layer ingest: sanctions, cyber, contracts. Each isolated; failures don't break the run.
  let sanctionsResult = { items: 0, inserted: 0, updated: 0, byJurisdiction: {} as Record<string, number> };
  let cyberResult = { items: 0, written: 0, bySource: {} as Record<string, number> };
  let contractsResult = { items: 0, written: 0, byJurisdiction: {} as Record<string, number> };

  try {
    const [s, c, ct] = await Promise.all([
      fetchAllSanctions().catch(() => ({ items: [] as SanctionEntry[], byJurisdiction: {} })),
      fetchAllCyber().catch(() => ({ items: [] as CyberAdvisory[], bySource: {} })),
      fetchAllContracts().catch(() => ({ items: [] as ContractEntry[], byJurisdiction: {} })),
    ]);
    if (s.items.length > 0) {
      const r = await persistSanctions(s.items);
      sanctionsResult = { items: s.items.length, inserted: r.inserted, updated: r.updated, byJurisdiction: s.byJurisdiction };
    }
    if (c.items.length > 0) {
      const n = await persistCyber(c.items);
      cyberResult = { items: c.items.length, written: n, bySource: c.bySource };
    }
    if (ct.items.length > 0) {
      const n = await persistContracts(ct.items);
      contractsResult = { items: ct.items.length, written: n, byJurisdiction: ct.byJurisdiction };
    }
    // Prune old contracts (>120d) + cyber (>180d).
    try { await db.execute(sql`DELETE FROM ${contracts} WHERE published_at < NOW() - INTERVAL '120 days'`); } catch {}
    try { await db.execute(sql`DELETE FROM ${cyberAdvisories} WHERE published_at < NOW() - INTERVAL '180 days'`); } catch {}
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
      notes: JSON.stringify({
        bySource,
        news: { inserted: newsInserted, okSources: newsOk, failedSources: newsFailed },
        sanctions: sanctionsResult,
        cyber: cyberResult,
        contracts: contractsResult,
      }).slice(0, 1600),
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
