// GDELT 2.0 GKG (Global Knowledge Graph) — themed event queries.
// Uses GDELT Doc 2.0 API with `theme:` filters which are more precise than
// keyword queries. Themes catalog: https://blog.gdeltproject.org/gdelt-2-0-our-global-world-in-realtime/

import { safeFetchJson, type NormalizedSignal } from "./types";

type Article = {
  url: string;
  title: string;
  seendate: string;
  domain: string;
  language: string;
  sourcecountry?: string;
};

const THEMES: Array<{ theme: string; tag: string; severity: NormalizedSignal["severity"]; subcat: string }> = [
  { theme: "KILL",                      tag: "violence",     severity: "high",     subcat: "kill" },
  { theme: "TERROR",                    tag: "terror",       severity: "high",     subcat: "terror" },
  { theme: "MILITARY_ATTACK",           tag: "conflict",     severity: "critical", subcat: "military_attack" },
  { theme: "ARMEDCONFLICT",             tag: "conflict",     severity: "high",     subcat: "armed_conflict" },
  { theme: "TAX_FNCACT_MILITARY",       tag: "conflict",     severity: "moderate", subcat: "military_actor" },
  { theme: "SECURITY_SERVICES",         tag: "policy",       severity: "moderate", subcat: "security_services" },
  { theme: "WB_700_CRISIS_AND_DISASTER_MANAGEMENT", tag: "disaster", severity: "elevated", subcat: "crisis" },
  { theme: "WB_2199_ARMS_AND_DEFENSE",  tag: "defense",      severity: "moderate", subcat: "arms_defense" },
];

function parseSeenDate(s: string): string {
  if (!s || s.length < 14) return new Date().toISOString();
  const y = s.slice(0, 4), m = s.slice(4, 6), d = s.slice(6, 8);
  const hh = s.slice(9, 11), mm = s.slice(11, 13), ss = s.slice(13, 15);
  const iso = `${y}-${m}-${d}T${hh}:${mm}:${ss}Z`;
  const dt = new Date(iso);
  return Number.isFinite(dt.getTime()) ? dt.toISOString() : new Date().toISOString();
}

export async function fetchGdeltGkg(): Promise<NormalizedSignal[]> {
  const out: NormalizedSignal[] = [];
  await Promise.all(THEMES.map(async (cfg) => {
    const url = `https://api.gdeltproject.org/api/v2/doc/doc?query=theme:${cfg.theme}%20sourcelang:eng&mode=ArtList&maxrecords=40&format=json&timespan=12h`;
    const j = (await safeFetchJson(url, { timeoutMs: 18_000 })) as { articles?: Article[] } | null;
    if (!j?.articles?.length) return;
    for (const a of j.articles) {
      if (!a.url || !a.title) continue;
      out.push({
        externalKey: `gdelt-gkg:${cfg.theme}:${a.url}`,
        source: "gdelt-gkg",
        category: cfg.tag,
        subcategory: cfg.subcat,
        severity: cfg.severity,
        title: a.title.slice(0, 280),
        summary: `Theme: ${cfg.theme} · domain ${a.domain}`,
        region: "Global",
        country: null,
        latitude: null,
        longitude: null,
        occurredAt: parseSeenDate(a.seendate),
        sourceUrl: a.url,
      });
    }
  }));
  // Dedup by externalKey (themes can overlap).
  const seen = new Set<string>();
  return out.filter((s) => seen.has(s.externalKey) ? false : (seen.add(s.externalKey), true));
}
