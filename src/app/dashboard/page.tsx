import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { OsintMap } from "@/components/OsintMap";
import { NewsPanel } from "@/components/NewsPanel";
import { MarketsPanel } from "@/components/MarketsPanel";
import { Sparkline } from "@/components/Sparkline";
import { WebcamsPanel } from "@/components/WebcamsPanel";
import { WorldClock } from "@/components/WorldClock";
import { LiveCounters } from "@/components/LiveCounters";
import { CountryInstability } from "@/components/CountryInstability";
import { CrossSourceAggregator } from "@/components/CrossSourceAggregator";
import { PredictionsPanel } from "@/components/PredictionsPanel";
import { AiBriefPanel } from "@/components/AiBriefPanel";
import { TechPulse } from "@/components/TechPulse";
import { getDashboardSnapshot, getNews, getNewsCountsByRegion, getTimeBuckets } from "@/lib/dashboard";
import { getMarketSnapshot } from "@/lib/markets";
import { getAiBrief } from "@/lib/ai";
import { severityColor } from "@/lib/format";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";
export const revalidate = 60;

export const metadata: Metadata = {
  title: "World Monitor — Real-Time Global Intelligence",
  description: "OSINT-grade real-time situation room: conflict zones, nuclear sites, military bases, undersea cables, spaceports, live flights, 280+ news sources, AI brief, markets, predictions, webcams.",
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
  { slug: "climate", label: "Climate", accent: "var(--accent)" },
];

export default async function Page() {
  const [snap, regionCounts, buckets, markets, aggregateNews, ...newsByRegion] = await Promise.all([
    getDashboardSnapshot(500),
    getNewsCountsByRegion(),
    getTimeBuckets({ buckets: 21 }),
    getMarketSnapshot(),
    getNews({ sinceHours: 12, limit: 200 }),
    ...REGIONS.map((r) => getNews({ region: r.slug, sinceHours: 48, limit: 18 })),
  ]);

  const brief = await getAiBrief(aggregateNews, snap.signals);
  const regionsWithNews = REGIONS.map((r, i) => ({ ...r, items: newsByRegion[i] }));
  const totalNews = Object.values(regionCounts).reduce((a, b) => a + b, 0);
  const riskScore = Math.min(99, Math.round(snap.totals.highSeverity * 1.5 + snap.signals.length * 0.2));

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
              <p style={{ color: "var(--ink-2)", marginTop: 8, fontSize: 13, maxWidth: 800, lineHeight: 1.6 }}>
                {totalNews.toLocaleString()} news items / 48h · {snap.signals.length} active signals · {snap.totals.countriesWatched} countries · 280+ sources · live flights · AI brief · prediction markets
              </p>
            </div>
            <div className="wm-mono" style={{ fontSize: 10, color: "var(--ink-3)", letterSpacing: "0.2em" }}>
              {new Date().toUTCString().slice(5, 22)} UTC
            </div>
          </div>
        </section>

        {/* OSINT MAP */}
        <section style={{ padding: "0 28px 24px" }}>
          <div className="wm-shell"><OsintMap signals={snap.signals} /></div>
        </section>

        {/* STRATEGIC STRIP */}
        <section style={{ padding: "0 28px 22px" }}>
          <div className="wm-shell" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 14 }}>
            <div className="wm-glass" style={{ padding: 14 }}>
              <div className="wm-mono" style={{ fontSize: 9, color: "var(--ink-3)", letterSpacing: "0.22em" }}>STRATEGIC RISK</div>
              <div className="wm-display" style={{ fontSize: 36, marginTop: 4, color: severityColor("critical") }}>{riskScore}</div>
              <div style={{ fontSize: 11, color: "var(--ink-2)" }}>Composite stress</div>
            </div>
            <div className="wm-glass" style={{ padding: 14 }}>
              <div className="wm-mono" style={{ fontSize: 9, color: "var(--ink-3)", letterSpacing: "0.22em" }}>HIGH / CRITICAL</div>
              <div className="wm-display" style={{ fontSize: 36, marginTop: 4, color: severityColor("high") }}>{snap.totals.highSeverity}</div>
              <div style={{ fontSize: 11, color: "var(--ink-2)" }}>Signals flagged high+</div>
            </div>
            <div className="wm-glass" style={{ padding: 14 }}>
              <div className="wm-mono" style={{ fontSize: 9, color: "var(--ink-3)", letterSpacing: "0.22em" }}>LAST 24H</div>
              <div className="wm-display" style={{ fontSize: 36, marginTop: 4, color: "var(--accent)" }}>{snap.totals.last24h}</div>
              <div style={{ fontSize: 11, color: "var(--ink-2)" }}>New signals</div>
            </div>
            <div className="wm-glass" style={{ padding: 14 }}>
              <div className="wm-mono" style={{ fontSize: 9, color: "var(--ink-3)", letterSpacing: "0.22em" }}>NEWS / 48H</div>
              <div className="wm-display" style={{ fontSize: 36, marginTop: 4, color: "var(--accent-cool)" }}>{totalNews}</div>
              <div style={{ fontSize: 11, color: "var(--ink-2)" }}>RSS + commercial APIs</div>
            </div>
            <div className="wm-glass" style={{ padding: 14 }}>
              <div className="wm-mono" style={{ fontSize: 9, color: "var(--ink-3)", letterSpacing: "0.22em" }}>21-DAY TREND</div>
              <div style={{ marginTop: 6 }}><Sparkline data={buckets} width={200} height={40} color="var(--accent)" /></div>
            </div>
          </div>
        </section>

        {/* AI BRIEF + CROSS-SOURCE + INSTABILITY */}
        <section style={{ padding: "0 28px 22px" }}>
          <div className="wm-shell" style={{ display: "grid", gridTemplateColumns: "minmax(0, 1fr) minmax(0, 1.4fr) minmax(0, 1fr)", gap: 14 }}>
            <AiBriefPanel brief={brief} />
            <CrossSourceAggregator items={aggregateNews} />
            <CountryInstability countries={snap.countries} />
          </div>
        </section>

        {/* MARKETS */}
        <section style={{ padding: "0 28px 22px" }}>
          <div className="wm-shell" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 14 }}>
            <MarketsPanel title="Crypto" quotes={markets.crypto} accent="var(--accent-warm)" />
            {markets.stocks.length > 0 ? <MarketsPanel title="Stocks" quotes={markets.stocks} accent="var(--accent)" /> : null}
            <MarketsPanel title="Indices" quotes={markets.indices} accent="var(--accent)" showChange={false} />
            <MarketsPanel title="Commodities" quotes={markets.commodities} accent="var(--accent-warm)" showChange={false} />
            <MarketsPanel title="FX (USD base)" quotes={markets.fx} accent="var(--accent-cool)" showChange={false} />
          </div>
        </section>

        {/* REGIONAL NEWS GRID */}
        <section style={{ padding: "0 28px 32px" }}>
          <div className="wm-shell">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 14 }}>
              <div>
                <div className="wm-eyebrow">Live news</div>
                <h2 style={{ fontFamily: "var(--font-display)", fontWeight: 300, fontSize: 28, margin: "6px 0 0", letterSpacing: "-0.01em" }}>By region · last 48h</h2>
              </div>
              <a href="/sources" className="wm-mono" style={{ fontSize: 11, color: "var(--accent)", letterSpacing: "0.2em" }}>
                MANAGE SOURCES ↗
              </a>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: 14 }}>
              {regionsWithNews.map((r) => (
                <NewsPanel key={r.slug} title={r.label} accent={r.accent} items={r.items} badge={`${regionCounts[r.slug] ?? r.items.length} · LIVE`} />
              ))}
            </div>
          </div>
        </section>

        {/* PREDICTIONS + TECH PULSE */}
        <section style={{ padding: "0 28px 22px" }}>
          <div className="wm-shell" style={{ display: "grid", gridTemplateColumns: "minmax(320px, 1fr) minmax(0, 2fr)", gap: 14 }}>
            <PredictionsPanel />
            <TechPulse />
          </div>
        </section>

        {/* WEBCAMS */}
        <section style={{ padding: "0 28px 22px" }}>
          <div className="wm-shell"><WebcamsPanel /></div>
        </section>

        {/* CLOCK + COUNTERS */}
        <section style={{ padding: "0 28px 40px" }}>
          <div className="wm-shell" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: 14 }}>
            <WorldClock />
            <LiveCounters />
          </div>
        </section>

        <Footer lastIngestAt={snap.totals.lastIngestAt} />
      </main>
    </>
  );
}
