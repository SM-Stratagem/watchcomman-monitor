import { regionFromLatLng, type NormalizedSignal } from "./types";

// WHO Disease Outbreak News doesn't expose a clean JSON feed publicly; we parse their
// RSS via fetch. If unavailable, we silently return [].
const URL_ = "https://www.who.int/feeds/entity/csr/don/en/rss.xml";

function safeText(s: string | null | undefined): string {
  if (!s) return "";
  return s.replace(/<!\[CDATA\[(.*?)\]\]>/gs, "$1").replace(/<[^>]+>/g, "").trim();
}

export async function fetchWhoDon(): Promise<NormalizedSignal[]> {
  try {
    const controller = new AbortController();
    const t = setTimeout(() => controller.abort(), 12_000);
    const res = await fetch(URL_, {
      headers: { "user-agent": "watchcomman-monitor/1.0" },
      signal: controller.signal,
    });
    clearTimeout(t);
    if (!res.ok) return [];
    const xml = await res.text();
    const items = xml.split(/<item[\s>]/i).slice(1);
    const out: NormalizedSignal[] = [];
    for (const item of items.slice(0, 20)) {
      const titleMatch = item.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
      const linkMatch = item.match(/<link[^>]*>([\s\S]*?)<\/link>/i);
      const dateMatch = item.match(/<pubDate[^>]*>([\s\S]*?)<\/pubDate>/i);
      const descMatch = item.match(/<description[^>]*>([\s\S]*?)<\/description>/i);
      const title = safeText(titleMatch?.[1]);
      if (!title) continue;
      const link = safeText(linkMatch?.[1]);
      const date = safeText(dateMatch?.[1]);
      const desc = safeText(descMatch?.[1]);
      // Country often appears like "Disease – Country"
      let country: string | null = null;
      const dashSplit = title.split(/\s[–—-]\s/);
      if (dashSplit.length >= 2) country = dashSplit[dashSplit.length - 1].trim() || null;
      out.push({
        externalKey: `who-don:${link || title}`,
        source: "who",
        category: "outbreak",
        subcategory: "who-don",
        severity: "elevated",
        title,
        summary: desc.slice(0, 280) || null,
        region: regionFromLatLng(null, null, "Global"),
        country,
        latitude: null,
        longitude: null,
        magnitude: null,
        affected: null,
        occurredAt: date ? new Date(date).toISOString() : new Date().toISOString(),
        sourceUrl: link || "https://www.who.int/emergencies/disease-outbreak-news",
      });
    }
    return out;
  } catch {
    return [];
  }
}
