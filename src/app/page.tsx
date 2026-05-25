import Link from "next/link";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { MetricCard } from "@/components/MetricCard";
import { ProjectCard } from "@/components/ProjectCard";
import { IngestStrip } from "@/components/IngestStrip";
import { GlobeSection } from "@/components/GlobeSection";
import { Sparkline } from "@/components/Sparkline";
import { SignalRowItem } from "@/components/SignalRow";
import { getDashboardSnapshot, getTimeBuckets } from "@/lib/dashboard";
import { CATEGORY_LABELS, formatRelative, severityColor, slugify } from "@/lib/format";

export const dynamic = "force-dynamic";
export const revalidate = 60;

export default async function Page() {
  const [snapshot, buckets] = await Promise.all([
    getDashboardSnapshot(500),
    getTimeBuckets({ buckets: 21 }),
  ]);
  const { signals, regions, countries, categories, totals } = snapshot;
  const sources = new Set(signals.map((s) => s.source));
  const topCountries = [...countries].sort((a, b) => b.severityScore - a.severityScore).slice(0, 8);

  return (
    <>
      <Header />
      <main>
        {/* HERO */}
        <section style={{ position: "relative", paddingTop: 84, paddingBottom: 56 }}>
          <div className="wm-shell" style={{ position: "relative" }}>
            <div className="wm-pill wm-fade-up" style={{ marginBottom: 28 }}>
              <span className="wm-dot" /> CONTINUOUSLY MONITORED · {totals.activeSignals} ACTIVE
            </div>
            <h1 className="wm-display wm-fade-up wm-delay-1" style={{
              fontSize: "clamp(44px, 7.2vw, 96px)", margin: 0, maxWidth: 1100,
            }}>
              Every quiet signal,
              <br />
              from one editorial atlas.
            </h1>
            <p className="wm-fade-up wm-delay-2" style={{
              marginTop: 28, maxWidth: 680, color: "var(--ink-1)",
              fontSize: 17, lineHeight: 1.6,
            }}>
              <strong style={{ color: "var(--ink-0)", fontWeight: 500 }}>Watchcomman Monitor</strong>{" "}
              fuses live disease intelligence, earthquakes, wildfires, storms, floods, and humanitarian
              disaster feeds — alongside our independent monitors — into one calm, cinematic dashboard.
            </p>
            <div className="wm-fade-up wm-delay-3" style={{ marginTop: 36, display: "flex", flexWrap: "wrap", gap: 14 }}>
              <Link href="/signals" style={{
                display: "inline-flex", alignItems: "center", gap: 10,
                padding: "14px 22px", borderRadius: 999,
                background: "linear-gradient(180deg, #f5f7ff, #c6cce0)",
                color: "#04060c", fontWeight: 500, fontSize: 14,
                boxShadow: "0 18px 50px rgba(245,247,255,0.18)",
                border: "1px solid rgba(255,255,255,0.4)",
              }}>
                Open the live stream <span aria-hidden>→</span>
              </Link>
              <a href="#globe" className="wm-glass" style={{
                padding: "13px 20px", fontSize: 14, color: "var(--ink-0)",
                borderRadius: 999, display: "inline-flex", gap: 10, alignItems: "center",
              }}>
                <span style={{ width: 7, height: 7, borderRadius: 50, background: "var(--accent)", boxShadow: "0 0 10px var(--accent)" }} />
                3D atlas
              </a>
              <Link href="/map" className="wm-glass" style={{
                padding: "13px 20px", fontSize: 14, color: "var(--ink-0)",
                borderRadius: 999, display: "inline-flex", gap: 10, alignItems: "center",
              }}>
                <span style={{ width: 7, height: 7, borderRadius: 50, background: "var(--accent-cool)", boxShadow: "0 0 10px var(--accent-cool)" }} />
                Flat map
              </Link>
              <Link href="/api-docs" className="wm-glass" style={{
                padding: "13px 20px", fontSize: 14, color: "var(--ink-0)",
                borderRadius: 999, display: "inline-flex", gap: 10, alignItems: "center",
              }}>
                <span style={{ width: 7, height: 7, borderRadius: 50, background: "var(--accent-warm)", boxShadow: "0 0 10px var(--accent-warm)" }} />
                Public API
              </Link>
            </div>
          </div>
        </section>

        <IngestStrip signals={signals} />

        {/* OVERVIEW METRICS */}
        <section style={{ paddingTop: 64, paddingBottom: 16 }}>
          <div className="wm-shell">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 22, flexWrap: "wrap", gap: 12 }}>
              <div>
                <div className="wm-eyebrow">System overview</div>
                <h2 style={{
                  fontFamily: "var(--font-display)", fontWeight: 300,
                  fontSize: "clamp(28px, 3vw, 40px)", margin: "8px 0 0", letterSpacing: "-0.01em",
                }}>What the platform sees right now</h2>
              </div>
              <span className="wm-mono" style={{ fontSize: 11, color: "var(--ink-3)", letterSpacing: "0.2em" }}>
                LAST INGEST · {formatRelative(totals.lastIngestAt)}
              </span>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 18 }}>
              <MetricCard label="Active signals" value={totals.activeSignals} hint="In rolling window across all sources" accent="default" delta="live" />
              <MetricCard label="Last 24h" value={totals.last24h} hint="New or updated in past 24 hours" accent="cool" />
              <MetricCard label="Last 7d" value={totals.last7d} hint="Activity in the past week" accent="cool" />
              <MetricCard label="High / critical" value={totals.highSeverity} hint="Flagged high or critical right now" accent="hot" delta={totals.highSeverity > 0 ? "elevated" : "stable"} />
              <MetricCard label="Countries watched" value={totals.countriesWatched} hint="Distinct countries with active signals" accent="warm" />
              <MetricCard label="Sources active" value={sources.size} hint={`${[...sources].sort().join(", ")}`} accent="default" />
            </div>

            {/* Trend sparkline */}
            <div className="wm-glass" style={{ marginTop: 22, padding: "20px 24px", display: "flex", justifyContent: "space-between", alignItems: "center", gap: 18, flexWrap: "wrap" }}>
              <div>
                <div className="wm-eyebrow">Global volume · 21 days</div>
                <div style={{ marginTop: 8, fontSize: 13, color: "var(--ink-2)", maxWidth: 360, lineHeight: 1.5 }}>
                  Daily count of signals across every category and severity.
                </div>
              </div>
              <Sparkline data={buckets} width={420} height={70} color="var(--accent)" />
            </div>
          </div>
        </section>

        <GlobeSection signals={signals} regions={regions} categories={categories} />

        {/* CATEGORY GRID */}
        <section style={{ paddingTop: 16, paddingBottom: 40 }}>
          <div className="wm-shell">
            <div style={{ marginBottom: 22 }}>
              <div className="wm-eyebrow">By category</div>
              <h2 style={{
                fontFamily: "var(--font-display)", fontWeight: 300,
                fontSize: "clamp(28px, 3vw, 40px)", margin: "8px 0 0", letterSpacing: "-0.01em",
              }}>What we track</h2>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 14 }}>
              {Object.entries(CATEGORY_LABELS).map(([slug, label]) => {
                const stat = categories.find((c) => c.key === slug);
                return (
                  <Link key={slug} href={`/disease/${slug}`} className="wm-glass" style={{
                    display: "block", padding: 18, borderRadius: 14,
                  }}>
                    <div className="wm-mono" style={{ fontSize: 10, color: "var(--ink-3)", letterSpacing: "0.2em", textTransform: "uppercase" }}>
                      {slug}
                    </div>
                    <div style={{ marginTop: 6, fontFamily: "var(--font-display)", fontSize: 22, fontWeight: 300, letterSpacing: "-0.01em" }}>
                      {label}
                    </div>
                    <div style={{ marginTop: 12, display: "flex", justifyContent: "space-between", fontSize: 11 }}>
                      <span className="wm-mono" style={{ color: "var(--ink-2)", letterSpacing: "0.18em" }}>{stat?.activeSignals ?? 0} active</span>
                      <span className="wm-mono" style={{ color: severityColor("elevated"), letterSpacing: "0.18em" }}>SCORE {(stat?.severityScore ?? 0).toFixed(1)}</span>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        </section>

        {/* TOP COUNTRIES */}
        <section style={{ paddingTop: 16, paddingBottom: 40 }}>
          <div className="wm-shell">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", flexWrap: "wrap", gap: 12, marginBottom: 22 }}>
              <div>
                <div className="wm-eyebrow">Countries</div>
                <h2 style={{
                  fontFamily: "var(--font-display)", fontWeight: 300,
                  fontSize: "clamp(28px, 3vw, 40px)", margin: "8px 0 0", letterSpacing: "-0.01em",
                }}>Most active countries</h2>
              </div>
              <Link href="/countries" className="wm-mono" style={{ fontSize: 11, color: "var(--accent)", letterSpacing: "0.2em" }}>
                ALL COUNTRIES ↗
              </Link>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: 12 }}>
              {topCountries.map((c, i) => (
                <Link key={c.key} href={`/country/${slugify(c.key)}`} className="wm-glass" style={{ display: "block", padding: 14, borderRadius: 12 }}>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span style={{ fontSize: 15 }}>{c.key}</span>
                    <span className="wm-mono" style={{ fontSize: 10, color: "var(--ink-3)", letterSpacing: "0.2em" }}>#{i + 1}</span>
                  </div>
                  <div style={{ marginTop: 8, fontSize: 11 }} className="wm-mono">
                    <span style={{ color: "var(--ink-2)", letterSpacing: "0.18em" }}>{c.activeSignals} ACTIVE · </span>
                    <span style={{ color: severityColor("elevated"), letterSpacing: "0.18em" }}>SCORE {c.severityScore.toFixed(1)}</span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* MONITORS */}
        <section id="monitors" style={{ paddingTop: 24, paddingBottom: 40 }}>
          <div className="wm-shell">
            <div style={{ marginBottom: 28 }}>
              <div className="wm-eyebrow">Connected monitors</div>
              <h2 style={{
                fontFamily: "var(--font-display)", fontWeight: 300,
                fontSize: "clamp(28px, 3vw, 40px)", margin: "8px 0 12px", letterSpacing: "-0.01em",
              }}>Specialised monitors. Unified surface.</h2>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: 22 }}>
              <ProjectCard
                name="Ebola Monitor"
                description="Live tracker for Ebola virus disease — case timelines, advisories, repatriation logistics, and outbreak surveillance across West and Central Africa."
                status="active"
                href="https://www.ebolamonitorapp.com"
                accent="warm"
                meta={[{ label: "Focus", value: "EVD outbreaks" }, { label: "Cadence", value: "12h ingest" }, { label: "Region", value: "Africa" }]}
              />
              <ProjectCard
                name="Hantavirus Monitor"
                description="Surveillance for hantavirus pulmonary syndrome and environmental rodent indicators across the Americas, with watch-list updates and seasonal forecasting."
                status="monitoring"
                href="https://hantavirus-monitor.up.railway.app"
                accent="cool"
                meta={[{ label: "Focus", value: "HPS / rodents" }, { label: "Cadence", value: "Daily" }, { label: "Region", value: "Americas" }]}
              />
            </div>
          </div>
        </section>

        {/* DATA SOURCES */}
        <section id="sources" style={{ paddingTop: 16, paddingBottom: 40 }}>
          <div className="wm-shell">
            <div className="wm-eyebrow">Authoritative inputs</div>
            <h2 style={{
              fontFamily: "var(--font-display)", fontWeight: 300,
              fontSize: "clamp(24px, 2.4vw, 32px)", margin: "8px 0 18px", letterSpacing: "-0.01em",
            }}>Where the data comes from</h2>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 14 }}>
              {[
                { name: "USGS", what: "Earthquakes ≥ M4.5, past week", href: "https://earthquake.usgs.gov/" },
                { name: "NASA EONET", what: "Wildfires, storms, volcanoes, floods", href: "https://eonet.gsfc.nasa.gov/" },
                { name: "ReliefWeb (OCHA)", what: "Humanitarian disasters & response", href: "https://reliefweb.int/" },
                { name: "GDACS", what: "Global disaster alerts (EU JRC)", href: "https://www.gdacs.org/" },
                { name: "WHO DON", what: "Disease Outbreak News", href: "https://www.who.int/emergencies/disease-outbreak-news" },
                { name: "Ebola Monitor", what: "EVD case + advisory tracker", href: "https://www.ebolamonitorapp.com" },
                { name: "Hantavirus Monitor", what: "HPS & rodent surveillance", href: "https://hantavirus-monitor.up.railway.app" },
              ].map((s) => (
                <a key={s.name} href={s.href} target="_blank" rel="noopener noreferrer" className="wm-glass" style={{ display: "block", padding: 16, borderRadius: 12 }}>
                  <div style={{ fontSize: 14, color: "var(--ink-0)" }}>{s.name}</div>
                  <div style={{ marginTop: 4, fontSize: 12, color: "var(--ink-2)" }}>{s.what}</div>
                </a>
              ))}
            </div>
          </div>
        </section>

        {/* LATEST SIGNALS LIST */}
        <section style={{ paddingTop: 16, paddingBottom: 24 }}>
          <div className="wm-shell">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 22, flexWrap: "wrap" }}>
              <div>
                <div className="wm-eyebrow">Recent signals</div>
                <h2 style={{
                  fontFamily: "var(--font-display)", fontWeight: 300,
                  fontSize: "clamp(24px, 2.5vw, 32px)", margin: "8px 0 0", letterSpacing: "-0.01em",
                }}>Live editorial feed</h2>
              </div>
              <Link href="/signals" className="wm-mono" style={{ fontSize: 11, color: "var(--accent)", letterSpacing: "0.2em" }}>
                BROWSE ALL ↗
              </Link>
            </div>
            <ul style={{ listStyle: "none", padding: 0, margin: 0, borderTop: "1px solid var(--line)" }}>
              {signals.slice(0, 12).map((s) => <SignalRowItem key={s.id} s={s} />)}
            </ul>
          </div>
        </section>

        <Footer lastIngestAt={totals.lastIngestAt} />
      </main>
    </>
  );
}
