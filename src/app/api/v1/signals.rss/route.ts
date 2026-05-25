import { NextRequest } from "next/server";
import { getSignalsFiltered } from "@/lib/dashboard";

export const dynamic = "force-dynamic";

function escapeXml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams;
  const rows = await getSignalsFiltered({
    category: q.get("category") || undefined,
    severity: q.get("severity") || undefined,
    country: q.get("country") || undefined,
    region: q.get("region") || undefined,
    sinceHours: 72,
    limit: 50,
  });

  const origin = req.nextUrl.origin;
  const items = rows
    .map((s) => {
      const link = s.sourceUrl || `${origin}/signals#${s.id}`;
      const title = `[${s.severity.toUpperCase()}] ${s.title}`;
      const desc = [s.summary, s.country ? `Country: ${s.country}` : null, s.region ? `Region: ${s.region}` : null]
        .filter(Boolean)
        .join(" — ");
      return `
    <item>
      <title>${escapeXml(title)}</title>
      <link>${escapeXml(link)}</link>
      <guid isPermaLink="false">${escapeXml(s.externalKey)}</guid>
      <pubDate>${new Date(s.occurredAt).toUTCString()}</pubDate>
      <category>${escapeXml(s.category)}</category>
      <description>${escapeXml(desc || s.title)}</description>
    </item>`;
    })
    .join("");

  const xml = `<?xml version="1.0" encoding="UTF-8" ?>
<rss version="2.0">
  <channel>
    <title>Watchcomman Monitor — Live signals</title>
    <link>${origin}</link>
    <description>Live disease, disaster, and environmental signals aggregated by Watchcomman Monitor.</description>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
    ${items}
  </channel>
</rss>`;

  return new Response(xml, {
    headers: {
      "content-type": "application/rss+xml; charset=utf-8",
      "cache-control": "public, max-age=300, s-maxage=300",
    },
  });
}
