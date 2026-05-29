import { NextResponse } from "next/server";
import { getDashboardSnapshot, getNews } from "@/lib/dashboard";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const q = (url.searchParams.get("q") ?? "").trim();
  const since = Number(url.searchParams.get("sinceHours") ?? 48);

  if (!q) {
    return NextResponse.json({ count: 0, news: [], signals: [] }, { headers: { "access-control-allow-origin": "*" } });
  }

  const terms = q.split(",").map((t) => t.trim().toLowerCase()).filter(Boolean);
  if (terms.length === 0) {
    return NextResponse.json({ count: 0, news: [], signals: [] }, { headers: { "access-control-allow-origin": "*" } });
  }

  const [news, snap] = await Promise.all([
    getNews({ sinceHours: since, limit: 800 }),
    getDashboardSnapshot(500),
  ]);

  const matchedNews = news.filter((n) => {
    const blob = `${n.title} ${n.summary ?? ""} ${n.sourceName}`.toLowerCase();
    return terms.some((t) => blob.includes(t));
  });
  const matchedSig = snap.signals.filter((s) => {
    const blob = `${s.title} ${s.summary ?? ""} ${s.country ?? ""} ${s.region ?? ""}`.toLowerCase();
    return terms.some((t) => blob.includes(t));
  });

  return NextResponse.json(
    { count: matchedNews.length + matchedSig.length, news: matchedNews.slice(0, 100), signals: matchedSig.slice(0, 80), terms },
    { headers: { "cache-control": "no-store", "access-control-allow-origin": "*" } },
  );
}
