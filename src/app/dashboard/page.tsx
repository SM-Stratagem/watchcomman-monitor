import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { OsintMap } from "@/components/OsintMap";
import { NewsPanel } from "@/components/NewsPanel";
import { Sparkline } from "@/components/Sparkline";
import { getDashboardSnapshot, getNews, getNewsCountsByRegion, getTimeBuckets } from "@/lib/dashboard";
import { severityColor } from "@/lib/format";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";
export const revalidate = 60;

export const metadata: Metadata = {
  title: "World Monitor — Real-Time Global Intelligence",
  description: "OSINT-grade real-time situation room: conflict zones, nuclear sites, military bases, undersea cables, spaceports, plus 200+ global news sources by region.",
};

const REGIONS = [
  { slug: "worldwide", label: "World News", accent: "var(--accent)" },
  { slug: "us", label: "United States", accent: "var(--accent-cool)" },
  { slug: "europe", label: "Europe", accent: "var(--accent-cool)" },
  { slug: "middle-east", label: "Middle East", accent: "var(--accent-hot)" },
  { slug: "africa", label: "Africa", accent: "var(--accent-warm)" },
  { slug: "latin-america", label: "Latin America", accent: "var(--accent-warm)" },
  { slug: "asia", label: "Asia-Pacific", accent: "var(--accent)" },
  { slug: "russia", label: "Russia & CIS", accent: "var(--accent-hot)" },
  { slug: "defense", label: "Defense / Intel", accent: "var(--accent-hot)" },
  { slug: "policy", label: "Government", accent: "var(--accent-cool)" },
  { slug: "energy", label: "Energy & Resources", accent: "var(--accent-warm)" },
  { slug: "finance", label: "Markets", accent: "var(--accent)" },
  { slug: "tech", label: "Technology", accent: "var(--accent-cool)" },
  { slug: "health", label: "Health", accent: "var(--accent)" },
];

export default async function Page() {
  const [snap, regionCounts, buckets, ...newsByRegion] = await Promise.all([
    getDashboardSnapshot(500),
    getNewsCountsByRegion(),
    getTimeBuckets({ buckets: 21 }),
    ...REGIONS.map((r) => getNews({ region: r.slug, sinceHours: 48, limit: 18 })),
  ]);

  const regionsWithNews = REGIONS.map((r, i) => ({ ...r, items: newsByRegion[i] }));
  const totalNews = Object.values(regionCounts).reduce((a, b) => a + b, 0);

  return (
    <>
      <Header />
      <main>
        {/* HERO BAR */}
        <section style={{ padding: "30px 28px 16px" }}>
          <div className="wm-shell" style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", flexWrap: "wrap", gap: 12 }}>
            <div>
              <div className="wm-mono" style={{ fontSize: 10, color: "var(--accent)", letterSpacing: "0.22em" }}>● LIVE OSINT DASHBOARD</div>
              <h1 className="wm-display" style={{ fontSize: "clamp(28px, 4vw, 48px)", margin: "8px 0 0", letterSpacing: "-0.01em" }}>
                World Monitor — Real-Time Global Intelligence
              </h1>
              <p style={{ color: "var(--ink-2)", marginTop: 8, fontSize: 13, maxWidth: 720, lineHeight: 1.6 }}>
                {totalNews.toLocaleString()} news items across {Object.keys(regionCounts).length} regions in the past 48 hours · {snap.signals.length} active disaster/intel signals · 216 sources monitored
              </p>
            </div>
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <span className="wm-mono" style={{ fontSize: 10, color: "var(--ink-3)", letterSpacing: "0.2em" }}>
                {new Date().toUTCString().slice(5, 22)} UTC
              </span>
            </div>
          </div>
        </section>

        {/* FULL-BLEED OSINT MAP */}
        <section style={{ padding: "0 28px 24px" }}>
          <div className="wm-shell">
            <OsintMap signals={snap.signals} />
          </div>
        </section>

        {/* TOP STRIP — strategic overview */}
        <section style={{ padding: "0 28px 28px" }}>
          <div className="wm-shell" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 14 }}>
            <div className="wm-glass" style={{ padding: 14 }}>
              <div className="wm-mono" style={{ fontSize: 9, color: "var(--ink-3)", letterSpacing: "0.22em" }}>STRATEGIC RISK</div>
              <div className="wm-display" style={{ fontSize: 36, marginTop: 4, color: severityColor("critical") }}>
                {Math.min(99, Math.round(snap.totals.highSeverity * 1.5 + snap.signals.length * 0.2))}
              </div>
              <div style={{ marginTop: 4, fontSize: 11, color: "var(--ink-2)" }}>Composite stress index</div>
            </div>
            <div className="wm-glass" style={{ padding: 14 }}>
              <div className="wm-mono" style={{ fontSize: 9, color: "var(--ink-3)", letterSpacing: "0.22em" }}>HIGH / CRITICAL</div>
              <div className="wm-display" style={{ fontSize: 36, marginTop: 4, color: severityColor("high") }}>{snap.totals.highSeverity}</div>
              <div style={{ marginTop: 4, fontSize: 11, color: "var(--ink-2)" }}>Active high+ severity signals</div>
            </div>
            <div className="wm-glass" style={{ padding: 14 }}>
              <div className="wm-mono" style={{ fontSize: 9, color: "var(--ink-3)", letterSpacing: "0.22em" }}>LAST 24H</div>
              <div className="wm-display" style={{ fontSize: 36, marginTop: 4, color: "var(--accent)" }}>{snap.totals.last24h}</div>
              <div style={{ marginTop: 4, fontSize: 11, color: "var(--ink-2)" }}>New signals · {snap.totals.countriesWatched} countries</div>
            </div>
            <div className="wm-glass" style={{ padding: 14 }}>
              <div className="wm-mono" style={{ fontSize: 9, color: "var(--ink-3)", letterSpacing: "0.22em" }}>21-DAY TREND</div>
              <div style={{ marginTop: 6 }}>
                <Sparkline data={buckets} width={200} height={42} color="var(--accent)" />
              </div>
            </div>
          </div>
        </section>

        {/* REGIONAL NEWS GRID */}
        <section style={{ padding: "0 28px 32px" }}>
          <div className="wm-shell">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 14 }}>
              <div>
                <div className="wm-eyebrow">Live news</div>
                <h2 style={{ fontFamily: "var(--font-display)", fontWeight: 300, fontSize: 28, margin: "6px 0 0", letterSpacing: "-0.01em" }}>
                  By region · last 48h
                </h2>
              </div>
              <a href="/sources" className="wm-mono" style={{ fontSize: 11, color: "var(--accent)", letterSpacing: "0.2em" }}>
                MANAGE SOURCES ↗
              </a>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: 14 }}>
              {regionsWithNews.map((r) => (
                <NewsPanel
                  key={r.slug}
                  title={r.label}
                  accent={r.accent}
                  items={r.items}
                  badge={`${regionCounts[r.slug] ?? r.items.length} · LIVE`}
                />
              ))}
            </div>
          </div>
        </section>

        {/* AI INSIGHTS + STRATEGIC POSTURE */}
        <section style={{ padding: "0 28px 32px" }}>
          <div className="wm-shell" style={{ display: "grid", gridTemplateColumns: "minmax(0, 2fr) minmax(0, 1fr)", gap: 14 }}>
            <div className="wm-glass" style={{ padding: 18 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div className="wm-mono" style={{ fontSize: 10, color: "var(--ink-1)", letterSpacing: "0.22em" }}>AI INSIGHTS · WORLD BRIEF</div>
                <span className="wm-mono" style={{ fontSize: 9, color: "var(--accent-warm)", letterSpacing: "0.2em", padding: "2px 8px", border: "1px solid var(--accent-warm)", borderRadius: 999 }}>
                  AUTO-SUMMARY
                </span>
              </div>
              <div style={{ marginTop: 14, fontSize: 14, color: "var(--ink-0)", lineHeight: 1.6 }}>
                {snap.signals[0] ? snap.signals[0].summary || snap.signals[0].title : "No critical events flagged in the last hour."}
              </div>
              <div style={{ marginTop: 14, display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 8 }}>
                {(snap.categories ?? []).slice(0, 6).map((c) => (
                  <a key={c.key} href={`/disease/${c.key}`} style={{
                    padding: "8px 10px", border: "1px solid var(--line)", borderRadius: 8,
                    background: "rgba(255,255,255,0.02)",
                  }}>
                    <div className="wm-mono" style={{ fontSize: 9, color: "var(--ink-3)", letterSpacing: "0.18em", textTransform: "uppercase" }}>{c.key}</div>
                    <div style={{ marginTop: 4, fontSize: 16, color: "var(--ink-0)" }}>{c.activeSignals}</div>
                  </a>
                ))}
              </div>
            </div>

            <div className="wm-glass" style={{ padding: 18 }}>
              <div className="wm-mono" style={{ fontSize: 10, color: "var(--ink-1)", letterSpacing: "0.22em" }}>AI STRATEGIC POSTURE</div>
              <div style={{ marginTop: 14, display: "grid", gap: 10 }}>
                {[
                  { name: "Middle East theater", level: "HOT", color: severityColor("critical") },
                  { name: "Eastern Europe", level: "ELEVATED", color: severityColor("elevated") },
                  { name: "Indo-Pacific", level: "WATCH", color: severityColor("moderate") },
                  { name: "Sahel", level: "ELEVATED", color: severityColor("elevated") },
                ].map((t) => (
                  <div key={t.name} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 10px", border: "1px solid var(--line)", borderRadius: 8 }}>
                    <span style={{ fontSize: 13, color: "var(--ink-0)" }}>{t.name}</span>
                    <span className="wm-mono" style={{ fontSize: 9, color: t.color, letterSpacing: "0.2em", padding: "2px 8px", border: `1px solid ${t.color}`, borderRadius: 999 }}>
                      {t.level}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <Footer lastIngestAt={snap.totals.lastIngestAt} />
      </main>
    </>
  );
}
