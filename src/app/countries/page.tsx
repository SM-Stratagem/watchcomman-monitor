import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { getDashboardSnapshot } from "@/lib/dashboard";
import { severityColor, slugify } from "@/lib/format";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";
export const revalidate = 60;

export const metadata: Metadata = {
  title: "Countries — Watchcomman Monitor",
  description: "All countries with active signals in the Watchcomman Monitor rolling window, ranked by composite severity score.",
};

export default async function Page() {
  const snap = await getDashboardSnapshot(500);
  const top = [...snap.countries].sort((a, b) => b.severityScore - a.severityScore);

  return (
    <>
      <Header />
      <main style={{ paddingTop: 72, paddingBottom: 40 }}>
        <div className="wm-shell">
          <div className="wm-eyebrow">Index</div>
          <h1 className="wm-display" style={{ fontSize: "clamp(36px, 5vw, 64px)", margin: "8px 0 18px" }}>Countries watched</h1>
          <p style={{ color: "var(--ink-2)", fontSize: 14, maxWidth: 640, lineHeight: 1.6, marginBottom: 28 }}>
            Every country with at least one active signal in the rolling window. Severity score is the sum of severity
            weights across all of that country&apos;s active signals.
          </p>

          <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 12 }}>
            {top.map((c, i) => (
              <li key={c.key}>
                <a href={`/country/${slugify(c.key)}`} className="wm-glass" style={{
                  display: "block", padding: 16, borderRadius: 14,
                  textDecoration: "none",
                }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                    <span style={{ fontSize: 16, color: "var(--ink-0)" }}>{c.key}</span>
                    <span className="wm-mono" style={{ fontSize: 10, color: "var(--ink-3)", letterSpacing: "0.2em" }}>#{i + 1}</span>
                  </div>
                  <div style={{ marginTop: 8, display: "flex", justifyContent: "space-between", fontSize: 11 }}>
                    <span className="wm-mono" style={{ color: "var(--ink-2)", letterSpacing: "0.18em" }}>{c.activeSignals} active</span>
                    <span className="wm-mono" style={{ color: severityColor("elevated"), letterSpacing: "0.18em" }}>SCORE {c.severityScore.toFixed(1)}</span>
                  </div>
                </a>
              </li>
            ))}
          </ul>
        </div>
      </main>
      <Footer lastIngestAt={snap.totals.lastIngestAt} />
    </>
  );
}
