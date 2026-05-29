// PDF brief route. Gated by supporter unsub-token (?token=...).
// Anyone without a valid token gets a 402 Payment Required prompting them to BMC.

import { NextResponse } from "next/server";
import { getSupporterByUnsub } from "@/lib/supporters";
import { renderBriefingPdf } from "@/lib/briefing-pdf";
import { getDashboardSnapshot, getNews } from "@/lib/dashboard";
import { getAiBrief } from "@/lib/ai";
import { getSanctionsDelta } from "@/lib/sanctions-diff";
import { getCyberPanel } from "@/lib/cyber";
import { computeChokepointStatus } from "@/lib/maritime";
import { THEATERS_BY_SLUG, isNewsInTheater, isSignalInTheater } from "@/lib/theaters";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const token = url.searchParams.get("token");
  const sinceHours = Math.min(168, Math.max(1, Number(url.searchParams.get("since") ?? 24) || 24));
  const theaterSlug = url.searchParams.get("theater");
  const watchlistParam = url.searchParams.get("watchlist");
  const dateParam = url.searchParams.get("date");

  // If token absent, return 402 with friendly HTML.
  if (!token) {
    return new Response(
      `<!doctype html><html><head><meta charset="utf-8"><title>Subscriber-only · Watchcomman Monitor</title></head><body style="font-family:system-ui;background:#04060c;color:#f5f7ff;padding:60px;text-align:center;line-height:1.6">
        <h1 style="font-weight:300;font-size:32px">Subscriber-only PDF</h1>
        <p style="max-width:520px;margin:16px auto">Support Watchcomman Monitor on Buy Me a Coffee to receive the daily PDF brief in your inbox every morning, plus an API key.</p>
        <p style="margin-top:24px"><a href="https://buymeacoffee.com" style="background:#ffdd00;color:#000;padding:12px 18px;border-radius:6px;text-decoration:none;font-weight:600">☕  Buy me a coffee</a></p>
        <p style="margin-top:18px;font-size:12px;color:#888">Or just read the live brief at <a href="/dashboard" style="color:#7df0c2">/dashboard</a>.</p>
      </body></html>`,
      { status: 402, headers: { "content-type": "text/html; charset=utf-8" } },
    );
  }
  const supporter = await getSupporterByUnsub(token);
  if (!supporter || !supporter.active) {
    return NextResponse.json({ error: "invalid or inactive token" }, { status: 401 });
  }

  // Gather data
  const [snap, allNews, sanctions, cyber] = await Promise.all([
    getDashboardSnapshot(500),
    getNews({ sinceHours, limit: 400 }),
    getSanctionsDelta(24).catch(() => null),
    getCyberPanel().catch(() => null),
  ]);
  let signals = snap.signals;
  let news = allNews;
  const theater = theaterSlug ? THEATERS_BY_SLUG[theaterSlug] : null;
  if (theater) {
    signals = signals.filter((s) => isSignalInTheater(theater, s));
    news = news.filter((n) => isNewsInTheater(theater, n));
  }
  const watchlist = watchlistParam ? watchlistParam.split(",").map((s) => s.trim()).filter(Boolean) : [];
  if (watchlist.length > 0) {
    const wl = watchlist.map((s) => s.toLowerCase());
    signals = signals.filter((s) => wl.some((k) => `${s.title} ${s.summary ?? ""} ${s.country ?? ""}`.toLowerCase().includes(k)));
    news = news.filter((n) => wl.some((k) => `${n.title} ${n.summary ?? ""}`.toLowerCase().includes(k)));
  }
  const brief = await getAiBrief(news, signals);
  const chokepoints = computeChokepointStatus(news, signals);

  const date = dateParam ? new Date(dateParam) : new Date();
  const pdf = await renderBriefingPdf({
    brief, signals, news, sanctions, cyber, chokepoints, date,
    scope: { theater: theater?.label ?? null, watchlist },
  });

  const ymd = date.toISOString().slice(0, 10);
  const stem = theater ? `watchcomman-${theater.slug}-${ymd}` : watchlist.length ? `watchcomman-watchlist-${ymd}` : `watchcomman-brief-${ymd}`;
  return new Response(new Uint8Array(pdf), {
    status: 200,
    headers: {
      "content-type": "application/pdf",
      "content-disposition": `inline; filename="${stem}.pdf"`,
      "cache-control": "private, max-age=300",
    },
  });
}
