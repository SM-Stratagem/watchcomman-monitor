import { activeRssSources, type Source } from "@/lib/sources";

export type NewsItem = {
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

function decodeEntities(s: string): string {
  return s
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)))
    .replace(/&#x([0-9a-f]+);/gi, (_, n) => String.fromCharCode(parseInt(n, 16)));
}

function clean(s: string | undefined | null): string {
  if (!s) return "";
  return decodeEntities(
    s
      .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1")
      .replace(/<[^>]+>/g, "")
      .replace(/\s+/g, " ")
      .trim(),
  );
}

function pick(item: string, tag: string): string | null {
  const re = new RegExp(`<${tag}(?:\\s[^>]*)?>([\\s\\S]*?)</${tag}>`, "i");
  const m = item.match(re);
  return m ? m[1] : null;
}

function pickAttr(item: string, tag: string, attr: string): string | null {
  const re = new RegExp(`<${tag}(?:\\s[^>]*?)?${attr}=["']([^"']+)["']`, "i");
  const m = item.match(re);
  return m ? m[1] : null;
}

function parseDate(raw: string | null | undefined): string {
  if (!raw) return new Date().toISOString();
  const d = new Date(raw);
  if (Number.isFinite(d.getTime())) return d.toISOString();
  return new Date().toISOString();
}

function parseRssXml(xml: string, src: Source): NewsItem[] {
  // Try <item> (RSS 2.0), then <entry> (Atom).
  const out: NewsItem[] = [];
  const itemRe = /<item[\s>][\s\S]*?<\/item>/gi;
  const entryRe = /<entry[\s>][\s\S]*?<\/entry>/gi;
  const chunks = xml.match(itemRe) || xml.match(entryRe) || [];

  for (const raw of chunks.slice(0, 25)) {
    const title = clean(pick(raw, "title"));
    if (!title) continue;
    let link = clean(pick(raw, "link"));
    if (!link) link = pickAttr(raw, "link", "href") || "";
    if (!link) link = clean(pick(raw, "guid")) || "";

    const summary =
      clean(pick(raw, "description")) ||
      clean(pick(raw, "summary")) ||
      clean(pick(raw, "content:encoded")) ||
      clean(pick(raw, "content")) ||
      null;

    const dateRaw =
      pick(raw, "pubDate") || pick(raw, "published") || pick(raw, "updated") || pick(raw, "dc:date");
    const author =
      clean(pick(raw, "dc:creator")) || clean(pick(raw, "author")) || null;

    const guid = clean(pick(raw, "guid")) || link || title;
    out.push({
      externalKey: `${src.slug}:${guid}`.slice(0, 380),
      sourceSlug: src.slug,
      sourceName: src.name,
      region: src.region,
      title,
      summary: summary ? summary.slice(0, 480) : null,
      link: link || src.rss || "",
      author: author?.slice(0, 180) || null,
      publishedAt: parseDate(dateRaw),
    });
  }
  return out;
}

async function fetchOne(src: Source, timeoutMs = 8000): Promise<NewsItem[]> {
  if (!src.rss) return [];
  try {
    const controller = new AbortController();
    const t = setTimeout(() => controller.abort(), timeoutMs);
    const res = await fetch(src.rss, {
      headers: {
        "user-agent": "watchcomman-monitor/1.0 (+https://www.monitor-info.app)",
        accept: "application/rss+xml, application/atom+xml, application/xml, text/xml, */*;q=0.1",
      },
      signal: controller.signal,
    });
    clearTimeout(t);
    if (!res.ok) return [];
    const xml = await res.text();
    return parseRssXml(xml, src);
  } catch {
    return [];
  }
}

export async function fetchAllNews(opts: { concurrency?: number; max?: number } = {}): Promise<{
  items: NewsItem[];
  bySource: Record<string, number>;
  okSources: number;
  failedSources: number;
}> {
  const sources = activeRssSources();
  const conc = opts.concurrency ?? 12;
  const all: NewsItem[] = [];
  const bySource: Record<string, number> = {};
  let ok = 0, failed = 0;

  // Simple semaphore via batches
  for (let i = 0; i < sources.length; i += conc) {
    const batch = sources.slice(i, i + conc);
    const results = await Promise.all(batch.map((s) => fetchOne(s)));
    for (let j = 0; j < batch.length; j++) {
      const items = results[j];
      bySource[batch[j].slug] = items.length;
      if (items.length) ok++; else failed++;
      for (const it of items) all.push(it);
    }
  }

  // Deduplicate by externalKey, keep most recent
  const map = new Map<string, NewsItem>();
  for (const it of all) {
    const prev = map.get(it.externalKey);
    if (!prev || new Date(it.publishedAt) > new Date(prev.publishedAt)) {
      map.set(it.externalKey, it);
    }
  }
  const limit = opts.max ?? 4000;
  return { items: Array.from(map.values()).slice(0, limit), bySource, okSources: ok, failedSources: failed };
}
