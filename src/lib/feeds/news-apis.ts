// Optional commercial news APIs — used if env vars set.
// NEWSAPI_KEY → newsapi.org (free dev tier 100 req/day, 24h delay)
// GNEWS_KEY → gnews.io (100 req/day free)
// MEDIASTACK_KEY → mediastack.com (500/mo free)
// THENEWSAPI_KEY → thenewsapi.com (500/mo free)
// NEWSDATA_KEY → newsdata.io (200/mo free)

import type { NewsItem } from "./rss";

const REGION_BY_COUNTRY: Record<string, string> = {
  us: "us", gb: "europe", de: "europe", fr: "europe", it: "europe", es: "europe",
  ru: "russia", ua: "europe", il: "middle-east", ir: "middle-east", sa: "middle-east",
  ae: "middle-east", eg: "middle-east", jp: "asia", cn: "asia", kr: "asia", in: "asia",
  ng: "africa", za: "africa", ke: "africa", br: "latin-america", mx: "latin-america",
  ar: "latin-america", cl: "latin-america", au: "oceania", nz: "oceania",
};

async function safeJson(url: string, headers: Record<string, string> = {}): Promise<unknown | null> {
  try {
    const controller = new AbortController();
    const t = setTimeout(() => controller.abort(), 12_000);
    const res = await fetch(url, { headers: { "user-agent": "watchcomman-monitor/1.0", ...headers }, signal: controller.signal });
    clearTimeout(t);
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

export async function fetchNewsApi(): Promise<NewsItem[]> {
  const key = process.env.NEWSAPI_KEY;
  if (!key) return [];
  const out: NewsItem[] = [];
  const countries = ["us", "gb", "de", "fr", "ru", "il", "in", "jp", "cn", "br", "ng", "au"];
  for (const c of countries) {
    const data = (await safeJson(`https://newsapi.org/v2/top-headlines?country=${c}&pageSize=20&apiKey=${key}`)) as {
      articles?: Array<{ title: string; description?: string; url: string; publishedAt: string; source?: { name: string; id?: string }; author?: string }>;
    } | null;
    if (!data?.articles) continue;
    for (const a of data.articles) {
      if (!a.title || !a.url) continue;
      out.push({
        externalKey: `newsapi:${a.url}`.slice(0, 380),
        sourceSlug: a.source?.id ?? `newsapi-${c}`,
        sourceName: a.source?.name ?? `NewsAPI ${c.toUpperCase()}`,
        region: REGION_BY_COUNTRY[c] ?? "worldwide",
        title: a.title,
        summary: a.description ?? null,
        link: a.url,
        author: a.author ?? null,
        publishedAt: a.publishedAt ?? new Date().toISOString(),
      });
    }
  }
  return out;
}

export async function fetchGNews(): Promise<NewsItem[]> {
  const key = process.env.GNEWS_KEY;
  if (!key) return [];
  const out: NewsItem[] = [];
  const topics = [
    { topic: "world", region: "worldwide" },
    { topic: "nation", region: "us" },
    { topic: "business", region: "finance" },
    { topic: "technology", region: "tech" },
    { topic: "science", region: "climate" },
    { topic: "health", region: "health" },
  ];
  for (const t of topics) {
    const data = (await safeJson(`https://gnews.io/api/v4/top-headlines?topic=${t.topic}&lang=en&max=20&apikey=${key}`)) as {
      articles?: Array<{ title: string; description?: string; url: string; publishedAt: string; source?: { name: string } }>;
    } | null;
    if (!data?.articles) continue;
    for (const a of data.articles) {
      if (!a.title || !a.url) continue;
      out.push({
        externalKey: `gnews:${a.url}`.slice(0, 380),
        sourceSlug: `gnews-${t.topic}`,
        sourceName: a.source?.name ?? `GNews ${t.topic}`,
        region: t.region,
        title: a.title,
        summary: a.description ?? null,
        link: a.url,
        author: null,
        publishedAt: a.publishedAt ?? new Date().toISOString(),
      });
    }
  }
  return out;
}

export async function fetchMediastack(): Promise<NewsItem[]> {
  const key = process.env.MEDIASTACK_KEY;
  if (!key) return [];
  const out: NewsItem[] = [];
  const data = (await safeJson(`https://api.mediastack.com/v1/news?access_key=${key}&languages=en&limit=100&sort=published_desc`)) as {
    data?: Array<{ title: string; description?: string; url: string; published_at: string; source: string; country?: string; author?: string }>;
  } | null;
  if (!data?.data) return [];
  for (const a of data.data) {
    if (!a.title || !a.url) continue;
    out.push({
      externalKey: `mediastack:${a.url}`.slice(0, 380),
      sourceSlug: "mediastack",
      sourceName: a.source ?? "Mediastack",
      region: REGION_BY_COUNTRY[(a.country || "").toLowerCase()] ?? "worldwide",
      title: a.title,
      summary: a.description ?? null,
      link: a.url,
      author: a.author ?? null,
      publishedAt: a.published_at ?? new Date().toISOString(),
    });
  }
  return out;
}

export async function fetchTheNewsApi(): Promise<NewsItem[]> {
  const key = process.env.THENEWSAPI_KEY;
  if (!key) return [];
  const data = (await safeJson(`https://api.thenewsapi.com/v1/news/top?language=en&limit=50&api_token=${key}`)) as {
    data?: Array<{ uuid: string; title: string; description?: string; url: string; published_at: string; source: string; categories?: string[] }>;
  } | null;
  if (!data?.data) return [];
  const out: NewsItem[] = [];
  for (const a of data.data) {
    out.push({
      externalKey: `thenewsapi:${a.uuid}`.slice(0, 380),
      sourceSlug: "thenewsapi",
      sourceName: a.source ?? "TheNewsAPI",
      region: "worldwide",
      title: a.title,
      summary: a.description ?? null,
      link: a.url,
      author: null,
      publishedAt: a.published_at,
    });
  }
  return out;
}

export async function fetchNewsData(): Promise<NewsItem[]> {
  const key = process.env.NEWSDATA_KEY;
  if (!key) return [];
  const data = (await safeJson(`https://newsdata.io/api/1/news?apikey=${key}&language=en&size=50`)) as {
    results?: Array<{ article_id: string; title: string; description?: string; link: string; pubDate: string; source_id: string; country?: string[]; creator?: string[] }>;
  } | null;
  if (!data?.results) return [];
  const out: NewsItem[] = [];
  for (const a of data.results) {
    const cc = (a.country?.[0] || "").toLowerCase();
    out.push({
      externalKey: `newsdata:${a.article_id}`.slice(0, 380),
      sourceSlug: a.source_id ?? "newsdata",
      sourceName: a.source_id ?? "NewsData",
      region: REGION_BY_COUNTRY[cc] ?? "worldwide",
      title: a.title,
      summary: a.description ?? null,
      link: a.link,
      author: a.creator?.[0] ?? null,
      publishedAt: a.pubDate ?? new Date().toISOString(),
    });
  }
  return out;
}

export async function fetchAllCommercialNews(): Promise<{ items: NewsItem[]; bySource: Record<string, number> }> {
  const [a, b, c, d, e] = await Promise.all([
    fetchNewsApi().catch(() => []),
    fetchGNews().catch(() => []),
    fetchMediastack().catch(() => []),
    fetchTheNewsApi().catch(() => []),
    fetchNewsData().catch(() => []),
  ]);
  const items = [...a, ...b, ...c, ...d, ...e];
  return {
    items,
    bySource: { newsapi: a.length, gnews: b.length, mediastack: c.length, thenewsapi: d.length, newsdata: e.length },
  };
}
