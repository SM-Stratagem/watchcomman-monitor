import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { SignalRowItem } from "@/components/SignalRow";
import { Sparkline } from "@/components/Sparkline";
import { getDashboardSnapshot, getSignalsFiltered, getTimeBuckets } from "@/lib/dashboard";
import { CATEGORY_LABELS, severityColor } from "@/lib/format";
import { notFound } from "next/navigation";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";
export const revalidate = 60;

const CATS = Object.keys(CATEGORY_LABELS);

export function generateStaticParams() {
  return CATS.map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const label = CATEGORY_LABELS[slug] ?? slug;
  return {
    title: `${label} — Watchcomman Monitor`,
    description: `Live signals, trend, and country distribution for ${label.toLowerCase()} tracked by Watchcomman Monitor.`,
  };
}

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  if (!CATS.includes(slug)) notFound();
  const label = CATEGORY_LABELS[slug];

  const [rows, buckets, snap] = await Promise.all([
    getSignalsFiltered({ category: slug, sinceHours: 24 * 30, limit: 100 }),
    getTimeBuckets({ category: slug, buckets: 21 }),
    getDashboardSnapshot(500),
  ]);

  const byCountry = new Map<string, { count: number; high: number }>();
  for (const s of rows) {
    if (!s.country) continue;
    const e = byCountry.get(s.country) ?? { count: 0, high: 0 };
    e.count++;
    if (s.severity === "high" || s.severity === "critical") e.high++;
    byCountry.set(s.country, e);
  }
  const countries = Array.from(byCountry.entries())
    .map(([country, v]) => ({ country, ...v }))
    .sort((a, b) => b.high - a.high || b.count - a.count)
    .slice(0, 12);

  const totalCount = rows.length;
  const highCount = rows.filter((r) => r.severity === "high" || r.severity === "critical").length;

  return (
    <>
      <Header />
      <main style={{ paddingTop: 72, paddingBottom: 40 }}>
        <div className="wm-shell">
          <a href="/signals" className="wm-mono" style={{ fontSize: 11, color: "var(--ink-2)", letterSpacing: "0.2em" }}>
            ← BACK TO STREAM
          </a>
          <div className="wm-eyebrow" style={{ marginTop: 18 }}>Category</div>
          <h1 className="wm-display" style={{ fontSize: "clamp(36px, 5vw, 64px)", margin: "8px 0 18px" }}>
            {label}
          </h1>
          <p style={{ color: "var(--ink-2)", fontSize: 14, maxWidth: 640, lineHeight: 1.6 }}>
            Active rolling window for {label.toLowerCase()}. Trend covers the last 21 days.
            High and critical signals are weighted up in the country ranking.
          </p>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 18, marginTop: 28 }}>
            <div className="wm-glass" style={{ padding: 18 }}>
              <div className="wm-eyebrow">Active (30d)</div>
              <div className="wm-display" style={{ fontSize: 40, marginTop: 8 }}>{totalCount}</div>
            </div>
            <div className="wm-glass" style={{ padding: 18 }}>
              <div className="wm-eyebrow">High / critical</div>
              <div className="wm-display" style={{ fontSize: 40, marginTop: 8, color: severityColor("high") }}>{highCount}</div>
            </div>
            <div className="wm-glass" style={{ padding: 18 }}>
              <div className="wm-eyebrow">Trend · 21d</div>
              <div style={{ marginTop: 8 }}>
                <Sparkline data={buckets} width={260} height={50} color="var(--accent)" />
              </div>
            </div>
            <div className="wm-glass" style={{ padding: 18 }}>
              <div className="wm-eyebrow">RSS / API</div>
              <div style={{ marginTop: 10, display: "flex", gap: 8, flexDirection: "column" }}>
                <a className="wm-mono" style={{ fontSize: 12, color: "var(--accent)" }} href={`/api/v1/signals?category=${slug}&limit=50`}>JSON ↗</a>
                <a className="wm-mono" style={{ fontSize: 12, color: "var(--accent)" }} href={`/api/v1/signals.rss?category=${slug}`}>RSS ↗</a>
              </div>
            </div>
          </div>

          <section style={{ marginTop: 40 }}>
            <div className="wm-eyebrow">Top countries · {label}</div>
            <ul style={{ listStyle: "none", margin: "14px 0 0", padding: 0, borderTop: "1px solid var(--line)" }}>
              {countries.length === 0 ? (
                <li style={{ padding: "14px 0", color: "var(--ink-2)", fontSize: 14 }}>No country-tagged signals in window.</li>
              ) : (
                countries.map((c) => (
                  <li key={c.country} style={{
                    display: "grid", gridTemplateColumns: "1fr 80px 80px", gap: 14,
                    padding: "12px 0", borderBottom: "1px solid var(--line)", alignItems: "center",
                  }}>
                    <span style={{ fontSize: 14 }}>{c.country}</span>
                    <span className="wm-mono" style={{ fontSize: 11, color: "var(--ink-2)", textAlign: "right" }}>{c.count} total</span>
                    <span className="wm-mono" style={{ fontSize: 11, color: severityColor("high"), textAlign: "right" }}>{c.high} high+</span>
                  </li>
                ))
              )}
            </ul>
          </section>

          <section style={{ marginTop: 40 }}>
            <div className="wm-eyebrow">Recent {label.toLowerCase()}</div>
            <ul style={{ listStyle: "none", margin: "14px 0 0", padding: 0, borderTop: "1px solid var(--line)" }}>
              {rows.slice(0, 40).map((s) => <SignalRowItem key={s.id} s={s} />)}
            </ul>
          </section>
        </div>
      </main>
      <Footer lastIngestAt={snap.totals.lastIngestAt} />
    </>
  );
}
