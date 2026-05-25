import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";

export const metadata = {
  title: "About Watchcomman Monitor",
  description:
    "How Watchcomman Monitor aggregates and surfaces live disease intelligence across independent monitoring projects.",
};

export default function AboutPage() {
  return (
    <>
      <Header />
      <main className="wm-shell" style={{ paddingTop: 64, paddingBottom: 80, maxWidth: 760 }}>
        <div className="wm-eyebrow">About the platform</div>
        <h1
          style={{
            fontFamily: "var(--font-display)",
            fontWeight: 300,
            fontSize: "clamp(36px, 5vw, 60px)",
            margin: "10px 0 28px",
            letterSpacing: "-0.01em",
            lineHeight: 1.05,
          }}
        >
          A calm aggregation surface for global monitoring.
        </h1>
        <p style={{ color: "var(--ink-1)", fontSize: 17, lineHeight: 1.75 }}>
          Watchcomman Monitor is the unifying landing surface for our independent disease and
          environmental monitoring projects. It is designed to be a single, editorially weighted
          entry point — the place a researcher, journalist, or operator opens when they want one
          look at what is changing globally.
        </p>
        <p style={{ color: "var(--ink-1)", fontSize: 16, lineHeight: 1.75, marginTop: 18 }}>
          The platform does not replace the underlying monitors. Each retains its own deep schema,
          authoritative source list, and editorial cadence. Watchcomman pulls their normalised
          outputs into a shared shape — category, severity, region, geocode, recency — and renders
          them as a continuous atlas.
        </p>
        <h2
          style={{
            fontFamily: "var(--font-display)",
            fontWeight: 300,
            fontSize: 30,
            margin: "44px 0 14px",
            letterSpacing: "-0.01em",
          }}
        >
          What we monitor
        </h2>
        <ul style={{ color: "var(--ink-1)", fontSize: 15, lineHeight: 1.8, paddingLeft: 18 }}>
          <li>
            <strong>Ebola virus disease</strong> — outbreak surveillance, advisories, and medical
            logistics across West and Central Africa.
          </li>
          <li>
            <strong>Hantavirus pulmonary syndrome</strong> — case clusters and environmental rodent
            indicators across the Americas.
          </li>
          <li>
            <strong>Logistics and environmental signals</strong> — supporting context such as
            cold-chain capacity, seasonal vector pressure, and advisory cycles.
          </li>
        </ul>
        <h2
          style={{
            fontFamily: "var(--font-display)",
            fontWeight: 300,
            fontSize: 30,
            margin: "44px 0 14px",
            letterSpacing: "-0.01em",
          }}
        >
          Data freshness
        </h2>
        <p style={{ color: "var(--ink-1)", fontSize: 15, lineHeight: 1.75 }}>
          A cron-driven ingest runs every 30 minutes against the upstream monitors and our seeded
          baseline. The atlas reflects the most recent rolling window. The public dashboard JSON is
          available at <a href="/api/dashboard">/api/dashboard</a> for developers and machine
          consumers.
        </p>
      </main>
      <Footer lastIngestAt={null} />
    </>
  );
}
