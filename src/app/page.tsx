import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { MetricCard } from "@/components/MetricCard";
import { ProjectCard } from "@/components/ProjectCard";
import { IngestStrip } from "@/components/IngestStrip";
import { GlobeSection } from "@/components/GlobeSection";
import { getDashboardSnapshot } from "@/lib/dashboard";

export const dynamic = "force-dynamic";
export const revalidate = 60;

function formatRelative(iso: string | null): string {
  if (!iso) return "moments ago";
  const t = new Date(iso).getTime();
  const diff = Date.now() - t;
  if (Number.isNaN(diff)) return "moments ago";
  const min = Math.max(1, Math.round(diff / 60_000));
  if (min < 60) return `${min}m ago`;
  const hr = Math.round(min / 60);
  if (hr < 24) return `${hr}h ago`;
  const d = Math.round(hr / 24);
  return `${d}d ago`;
}

export default async function Page() {
  const snapshot = await getDashboardSnapshot();
  const { signals, regions, totals } = snapshot;

  const sources = new Set(signals.map((s) => s.source));
  const categories = new Set(signals.map((s) => s.category));

  return (
    <>
      <Header />
      <main>
        {/* HERO */}
        <section
          style={{
            position: "relative",
            paddingTop: 84,
            paddingBottom: 56,
          }}
        >
          <div className="wm-shell" style={{ position: "relative" }}>
            <div
              className="wm-pill wm-fade-up"
              style={{ marginBottom: 28 }}
            >
              <span className="wm-dot" /> CONTINUOUSLY MONITORED
            </div>

            <h1
              className="wm-display wm-fade-up wm-delay-1"
              style={{
                fontSize: "clamp(44px, 7.2vw, 96px)",
                margin: 0,
                maxWidth: 1100,
              }}
            >
              A single editorial surface
              <br />
              for the world&apos;s quiet signals.
            </h1>

            <p
              className="wm-fade-up wm-delay-2"
              style={{
                marginTop: 28,
                maxWidth: 640,
                color: "var(--ink-1)",
                fontSize: 17,
                lineHeight: 1.6,
              }}
            >
              <strong style={{ color: "var(--ink-0)", fontWeight: 500 }}>Watchcomman Monitor</strong>{" "}
              aggregates live disease intelligence, environmental indicators, and logistics signals
              from our independent monitors into a single, calm, cinematic dashboard.
            </p>

            <div
              className="wm-fade-up wm-delay-3"
              style={{
                marginTop: 36,
                display: "flex",
                flexWrap: "wrap",
                gap: 14,
              }}
            >
              <a
                href="#globe"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 10,
                  padding: "14px 22px",
                  borderRadius: 999,
                  background: "linear-gradient(180deg, #f5f7ff, #c6cce0)",
                  color: "#04060c",
                  fontWeight: 500,
                  fontSize: 14,
                  boxShadow: "0 18px 50px rgba(245,247,255,0.18)",
                  border: "1px solid rgba(255,255,255,0.4)",
                }}
              >
                Open the live atlas
                <span aria-hidden>→</span>
              </a>
              <a
                href="https://www.ebolamonitorapp.com"
                target="_blank"
                rel="noopener noreferrer"
                className="wm-glass"
                style={{
                  padding: "13px 20px",
                  fontSize: 14,
                  color: "var(--ink-0)",
                  borderRadius: 999,
                  display: "inline-flex",
                  gap: 10,
                  alignItems: "center",
                }}
              >
                <span style={{ width: 7, height: 7, borderRadius: 50, background: "var(--accent-hot)", boxShadow: "0 0 10px var(--accent-hot)" }} />
                Ebola Monitor
              </a>
              <a
                href="https://hantavirus-monitor.up.railway.app"
                target="_blank"
                rel="noopener noreferrer"
                className="wm-glass"
                style={{
                  padding: "13px 20px",
                  fontSize: 14,
                  color: "var(--ink-0)",
                  borderRadius: 999,
                  display: "inline-flex",
                  gap: 10,
                  alignItems: "center",
                }}
              >
                <span style={{ width: 7, height: 7, borderRadius: 50, background: "var(--accent-cool)", boxShadow: "0 0 10px var(--accent-cool)" }} />
                Hantavirus Monitor
              </a>
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
                <h2
                  style={{
                    fontFamily: "var(--font-display)",
                    fontWeight: 300,
                    fontSize: "clamp(28px, 3vw, 40px)",
                    margin: "8px 0 0",
                    letterSpacing: "-0.01em",
                  }}
                >
                  What the platform sees right now
                </h2>
              </div>
              <span
                className="wm-mono"
                style={{ fontSize: 11, color: "var(--ink-3)", letterSpacing: "0.2em" }}
              >
                LAST INGEST · {formatRelative(totals.lastIngestAt)}
              </span>
            </div>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
                gap: 18,
              }}
            >
              <MetricCard
                label="Active signals"
                value={totals.activeSignals}
                hint="Across all monitors and seeded baseline"
                accent="default"
                delta="live"
              />
              <MetricCard
                label="Regions watched"
                value={totals.regionsWatched}
                hint="Continents and sub-regions with at least one active record"
                accent="cool"
              />
              <MetricCard
                label="High-severity"
                value={totals.highSeverity}
                hint="Signals flagged high or critical in the rolling window"
                accent="hot"
                delta={totals.highSeverity > 0 ? "elevated" : "stable"}
              />
              <MetricCard
                label="Sources / categories"
                value={`${sources.size}·${categories.size}`}
                hint={`Upstream monitors active: ${[...sources].join(", ")}`}
                accent="warm"
              />
            </div>
          </div>
        </section>

        <GlobeSection signals={signals} regions={regions} />

        {/* PROJECTS */}
        <section id="monitors" style={{ paddingTop: 24, paddingBottom: 40 }}>
          <div className="wm-shell">
            <div style={{ marginBottom: 28 }}>
              <div className="wm-eyebrow">Connected monitors</div>
              <h2
                style={{
                  fontFamily: "var(--font-display)",
                  fontWeight: 300,
                  fontSize: "clamp(28px, 3vw, 40px)",
                  margin: "8px 0 12px",
                  letterSpacing: "-0.01em",
                }}
              >
                Two specialised monitors. One unified surface.
              </h2>
              <p style={{ color: "var(--ink-2)", maxWidth: 620, fontSize: 14, lineHeight: 1.65 }}>
                Each underlying monitor maintains its own ingestion pipeline, schema, and editorial
                pace. Watchcomman threads their output into a shared atlas without flattening their
                domain expertise.
              </p>
            </div>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
                gap: 22,
              }}
            >
              <ProjectCard
                name="Ebola Monitor"
                description="Live tracker for Ebola virus disease — case timelines, advisories, repatriation logistics, and outbreak surveillance across West and Central Africa."
                status="active"
                href="https://www.ebolamonitorapp.com"
                accent="warm"
                meta={[
                  { label: "Focus", value: "EVD outbreaks" },
                  { label: "Cadence", value: "12h ingest" },
                  { label: "Region", value: "Africa" },
                ]}
              />
              <ProjectCard
                name="Hantavirus Monitor"
                description="Surveillance for hantavirus pulmonary syndrome and environmental rodent indicators across the Americas, with watch-list updates and seasonal forecasting."
                status="monitoring"
                href="https://hantavirus-monitor.up.railway.app"
                accent="cool"
                meta={[
                  { label: "Focus", value: "HPS / rodents" },
                  { label: "Cadence", value: "Daily" },
                  { label: "Region", value: "Americas" },
                ]}
              />
            </div>
          </div>
        </section>

        {/* INFO / EDITORIAL */}
        <section id="about" style={{ paddingTop: 56, paddingBottom: 56 }}>
          <div
            className="wm-shell"
            style={{
              display: "grid",
              gridTemplateColumns: "minmax(0, 1fr) minmax(0, 1fr)",
              gap: 48,
              alignItems: "start",
            }}
          >
            <div>
              <div className="wm-eyebrow">Philosophy</div>
              <h2
                style={{
                  fontFamily: "var(--font-display)",
                  fontWeight: 300,
                  fontSize: "clamp(28px, 3vw, 44px)",
                  margin: "8px 0 22px",
                  letterSpacing: "-0.01em",
                  maxWidth: 520,
                }}
              >
                Calm intelligence. Editorial pace. Continuous monitoring.
              </h2>
              <p style={{ color: "var(--ink-1)", fontSize: 15, lineHeight: 1.75 }}>
                Watchcomman Monitor exists to make global health and environmental intelligence
                <em> comprehensible</em>, not dramatic. We sit at the intersection of a newsroom and a
                control surface: rigorous about sources, deliberate about visual noise, and biased
                toward signals that actually move decision-making.
              </p>
              <p style={{ color: "var(--ink-1)", fontSize: 15, lineHeight: 1.75, marginTop: 18 }}>
                Our monitors are independent products with their own depth of domain knowledge. This
                surface aggregates their normalised outputs into a single atlas, with severity-aware
                colour grading, region rollups, and a continuously updated ticker — so a single look
                tells you what is steady, what is shifting, and what deserves your attention.
              </p>
            </div>
            <div
              className="wm-glass"
              style={{ padding: "30px 32px 32px" }}
            >
              <div className="wm-eyebrow" style={{ marginBottom: 14 }}>
                How the data moves
              </div>
              <ol
                style={{
                  listStyle: "none",
                  padding: 0,
                  margin: 0,
                  display: "grid",
                  gap: 18,
                  counterReset: "step",
                }}
              >
                {[
                  {
                    title: "Upstream monitors",
                    body: "Ebola and Hantavirus monitors run their own ingestion against verified public-health and environmental sources.",
                  },
                  {
                    title: "Normalisation",
                    body: "Watchcomman pulls and normalises signals into a shared shape: category, severity, region, geocode, and recency.",
                  },
                  {
                    title: "Rollups & severity score",
                    body: "Each region gets a composite severity score that drives the atlas ordering and the regional ranking panel.",
                  },
                  {
                    title: "Continuous render",
                    body: "The dashboard surfaces the rolling window every page load, with cron-driven refreshes on a 30-minute cadence.",
                  },
                ].map((step, i) => (
                  <li
                    key={step.title}
                    style={{
                      display: "grid",
                      gridTemplateColumns: "30px 1fr",
                      gap: 14,
                    }}
                  >
                    <span
                      className="wm-mono"
                      style={{
                        fontSize: 11,
                        color: "var(--accent)",
                        letterSpacing: "0.16em",
                        paddingTop: 2,
                      }}
                    >
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <div>
                      <div
                        style={{
                          fontFamily: "var(--font-sans)",
                          fontWeight: 500,
                          fontSize: 14,
                          color: "var(--ink-0)",
                          marginBottom: 4,
                        }}
                      >
                        {step.title}
                      </div>
                      <div style={{ color: "var(--ink-2)", fontSize: 13, lineHeight: 1.6 }}>
                        {step.body}
                      </div>
                    </div>
                  </li>
                ))}
              </ol>
            </div>
          </div>
        </section>

        {/* LATEST SIGNALS LIST */}
        <section style={{ paddingTop: 16, paddingBottom: 24 }}>
          <div className="wm-shell">
            <div style={{ marginBottom: 22 }}>
              <div className="wm-eyebrow">Recent signals</div>
              <h2
                style={{
                  fontFamily: "var(--font-display)",
                  fontWeight: 300,
                  fontSize: "clamp(24px, 2.5vw, 32px)",
                  margin: "8px 0 0",
                  letterSpacing: "-0.01em",
                }}
              >
                Live editorial feed
              </h2>
            </div>
            <ul
              style={{
                listStyle: "none",
                padding: 0,
                margin: 0,
                display: "grid",
                gap: 0,
                borderTop: "1px solid var(--line)",
              }}
            >
              {signals.slice(0, 10).map((s) => (
                <li
                  key={s.id}
                  style={{
                    display: "grid",
                    gridTemplateColumns: "120px 110px 1fr 160px",
                    gap: 18,
                    padding: "18px 0",
                    borderBottom: "1px solid var(--line)",
                    alignItems: "baseline",
                  }}
                >
                  <span
                    className="wm-mono"
                    style={{ fontSize: 10, color: "var(--ink-3)", letterSpacing: "0.2em", textTransform: "uppercase" }}
                  >
                    {formatRelative(s.occurredAt)}
                  </span>
                  <span
                    className="wm-mono"
                    style={{ fontSize: 10, color: "var(--accent)", letterSpacing: "0.2em", textTransform: "uppercase" }}
                  >
                    {s.severity}
                  </span>
                  <div style={{ fontSize: 14, color: "var(--ink-0)", lineHeight: 1.5 }}>
                    {s.sourceUrl ? (
                      <a
                        href={s.sourceUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{ color: "var(--ink-0)", borderBottom: "1px solid transparent" }}
                      >
                        {s.title}
                      </a>
                    ) : (
                      s.title
                    )}
                    {s.summary ? (
                      <div style={{ color: "var(--ink-2)", fontSize: 13, marginTop: 4 }}>
                        {s.summary}
                      </div>
                    ) : null}
                  </div>
                  <span
                    className="wm-mono"
                    style={{ fontSize: 11, color: "var(--ink-2)", textAlign: "right" }}
                  >
                    {s.country ?? s.region ?? "—"}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </section>

        <Footer lastIngestAt={totals.lastIngestAt} />
      </main>
      <style>{`
        @media (max-width: 760px) {
          main section .wm-shell {
            display: block !important;
          }
          main section .wm-shell > * { margin-bottom: 28px; }
          ul li[style*='grid'] {
            grid-template-columns: 90px 1fr !important;
          }
          ul li[style*='grid'] > *:nth-child(4) { display: none; }
        }
      `}</style>
    </>
  );
}
