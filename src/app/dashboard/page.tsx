import Link from "next/link";
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
import { SanctionsPanel } from "@/components/SanctionsPanel";
import { CyberPanel } from "@/components/CyberPanel";
import { ContractsPanel } from "@/components/ContractsPanel";
import { AdversaryTracker, ADVERSARIES } from "@/components/AdversaryTracker";
import { MilitaryAirPanel } from "@/components/MilitaryAirPanel";
import { MaritimePanel } from "@/components/MaritimePanel";
import { getDashboardSnapshot, getNews, getNewsCountsByRegion, getTimeBuckets } from "@/lib/dashboard";
import { getMarketSnapshot } from "@/lib/markets";
import { getAiBrief } from "@/lib/ai";
import { getSanctionsDelta } from "@/lib/sanctions-diff";
import { getCyberPanel } from "@/lib/cyber";
import { getContracts } from "@/lib/contracts";
import { getMilitaryFlights } from "@/lib/military-flights";
import { computeChokepointStatus } from "@/lib/maritime";
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
  const [snap, regionCounts, buckets, markets, aggregateNews, sanctions, cyber, contracts, milFlights, ...newsByRegion] = await Promise.all([
    getDashboardSnapshot(500),
    getNewsCountsByRegion(),
    getTimeBuckets({ buckets: 21 }),
    getMarketSnapshot(),
    getNews({ sinceHours: 12, limit: 200 }),
    getSanctionsDelta(24).catch(() => ({ added: [], removed: [], totals: { ofac: { total: 0, added24h: 0, added7d: 0 }, eu: { total: 0, added24h: 0, added7d: 0 }, uk: { total: 0, added24h: 0, added7d: 0 }, bis: { total: 0, added24h: 0, added7d: 0 } } })),
    getCyberPanel().catch(() => ({ recent: [], totals: { kev: 0, nvd: 0, hibp: 0, critical7d: 0 } })),
    getContracts(40).catch(() => ({ recent: [], totals: { samCount: 0, tedCount: 0, ukCount: 0, dscaCount: 0, total: 0 } })),
    getMilitaryFlights().catch(() => []),
    ...REGIONS.map((r) => getNews({ region: r.slug, sinceHours: 48, limit: 18 })),
  ]);

  const brief = await getAiBrief(aggregateNews, snap.signals);
  const regionsWithNews = REGIONS.map((r, i) => ({ ...r, items: newsByRegion[i] }));
  const totalNews = Object.values(regionCounts).reduce((a, b) => a + b, 0);
  const riskScore = Math.min(99, Math.round(snap.totals.highSeverity * 1.5 + snap.signals.length * 0.2));
  const renderedAt = new Date().getTime();
  const chokepoints = computeChokepointStatus(aggregateNews, snap.signals);

  return (
    <>
      <Header />
      <main>
        {/* HERO BAR */}
        <section style={{ padding: "36px 28px 18px" }}>
          <div className="wm-shell" style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", flexWrap: "wrap", gap: 12 }}>
            <div>
              <div style={{ display: "inline-flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
                <span className="wm-pulse" aria-hidden />
                <span className="wm-mono" style={{ fontSize: 10, color: "var(--accent)", letterSpacing: "0.22em" }}>
                  LIVE OSINT DASHBOARD · {snap.totals.lastIngestAt ? `LAST INGEST ${new Date(snap.totals.lastIngestAt).toUTCString().slice(17, 22)} UTC` : "INGEST PENDING"}
                </span>
              </div>
              <h1 className="wm-display" style={{ fontSize: "clamp(30px, 4.4vw, 52px)", margin: "0", letterSpacing: "-0.015em" }}>
                World Monitor — Real-Time Global Intelligence
              </h1>
              <p style={{ color: "var(--ink-2)", marginTop: 10, fontSize: 13.5, maxWidth: 800, lineHeight: 1.6 }}>
                {totalNews.toLocaleString()} news items · {snap.signals.length} active signals · {snap.totals.countriesWatched} countries · {milFlights.length.toLocaleString()} military aircraft · {chokepoints.length} chokepoints monitored · AI brief
              </p>
              <div style={{ marginTop: 12, display: "flex", gap: 6, flexWrap: "wrap" }}>
                <Link href="/theater" className="wm-mono" style={{ padding: "5px 10px", fontSize: 10, color: "var(--accent)", border: "1px solid var(--accent)", borderRadius: 6, letterSpacing: "0.18em" }}>THEATERS ↗</Link>
                <Link href="/sanctions" className="wm-mono" style={{ padding: "5px 10px", fontSize: 10, color: "var(--ink-1)", border: "1px solid var(--line-strong)", borderRadius: 6, letterSpacing: "0.18em" }}>SANCTIONS</Link>
                <Link href="/cyber" className="wm-mono" style={{ padding: "5px 10px", fontSize: 10, color: "var(--ink-1)", border: "1px solid var(--line-strong)", borderRadius: 6, letterSpacing: "0.18em" }}>CYBER</Link>
                <Link href="/ships" className="wm-mono" style={{ padding: "5px 10px", fontSize: 10, color: "var(--ink-1)", border: "1px solid var(--line-strong)", borderRadius: 6, letterSpacing: "0.18em" }}>MARITIME</Link>
                <Link href="/military" className="wm-mono" style={{ padding: "5px 10px", fontSize: 10, color: "var(--ink-1)", border: "1px solid var(--line-strong)", borderRadius: 6, letterSpacing: "0.18em" }}>MILITARY AIR</Link>
                <Link href="/briefing" className="wm-mono" style={{ padding: "5px 10px", fontSize: 10, color: "var(--ink-1)", border: "1px solid var(--line-strong)", borderRadius: 6, letterSpacing: "0.18em" }}>BRIEFING PDF ↗</Link>
              </div>
            </div>
            <div className="wm-mono" style={{ fontSize: 10, color: "var(--ink-3)", letterSpacing: "0.2em", textAlign: "right" }}>
              <div>{new Date().toUTCString().slice(5, 22)} UTC</div>
              <div style={{ marginTop: 2 }}>RISK {riskScore} · {snap.totals.highSeverity} HIGH+</div>
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
            <div className="wm-tile wm-tile-accent">
              <div className="wm-mono" style={{ fontSize: 9, color: "var(--ink-3)", letterSpacing: "0.22em" }}>STRATEGIC RISK</div>
              <div className="wm-display" style={{ fontSize: 38, marginTop: 4, color: severityColor("critical") }}>{riskScore}</div>
              <div style={{ fontSize: 11, color: "var(--ink-2)" }}>Composite stress index</div>
            </div>
            <div className="wm-tile">
              <div className="wm-mono" style={{ fontSize: 9, color: "var(--ink-3)", letterSpacing: "0.22em" }}>HIGH · CRITICAL</div>
              <div className="wm-display" style={{ fontSize: 38, marginTop: 4, color: severityColor("high") }}>{snap.totals.highSeverity}</div>
              <div style={{ fontSize: 11, color: "var(--ink-2)" }}>Active signals flagged high+</div>
            </div>
            <div className="wm-tile">
              <div className="wm-mono" style={{ fontSize: 9, color: "var(--ink-3)", letterSpacing: "0.22em" }}>LAST 24H</div>
              <div className="wm-display" style={{ fontSize: 38, marginTop: 4, color: "var(--accent)" }}>{snap.totals.last24h}</div>
              <div style={{ fontSize: 11, color: "var(--ink-2)" }}>New signals</div>
            </div>
            <div className="wm-tile">
              <div className="wm-mono" style={{ fontSize: 9, color: "var(--ink-3)", letterSpacing: "0.22em" }}>NEWS · 48H</div>
              <div className="wm-display" style={{ fontSize: 38, marginTop: 4, color: "var(--accent-cool)" }}>{totalNews.toLocaleString()}</div>
              <div style={{ fontSize: 11, color: "var(--ink-2)" }}>From 380+ sources</div>
            </div>
            <div className="wm-tile">
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

        {/* DEFENSE INTEL ROW: Sanctions + Cyber + Contracts */}
        <section style={{ padding: "0 28px 22px" }}>
          <div className="wm-shell" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(310px, 1fr))", gap: 14 }}>
            <SanctionsPanel delta={sanctions} compact />
            <CyberPanel data={cyber} compact />
            <ContractsPanel data={contracts} compact />
          </div>
        </section>

        {/* ADVERSARY TRACKERS */}
        <section style={{ padding: "0 28px 22px" }}>
          <div className="wm-shell" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(290px, 1fr))", gap: 14 }}>
            {ADVERSARIES.map((a) => (
              <AdversaryTracker key={a.slug} config={a} news={aggregateNews} signals={snap.signals} asOf={renderedAt} />
            ))}
          </div>
        </section>

        {/* MILITARY AIR + MARITIME */}
        <section style={{ padding: "0 28px 22px" }}>
          <div className="wm-shell" style={{ display: "grid", gridTemplateColumns: "minmax(0, 1fr) minmax(0, 1fr)", gap: 14 }}>
            <MilitaryAirPanel flights={milFlights} compact />
            <MaritimePanel items={chokepoints} compact />
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
