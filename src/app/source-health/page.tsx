import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { getSourceHealth } from "@/lib/feed-health";
import { SOURCES_BY_SLUG } from "@/lib/sources";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";
export const revalidate = 60;

export const metadata: Metadata = {
  title: "Source Health — World Monitor",
  description: "Live per-source feed health: last success, last failure, items returned, status badge.",
};

const KIND_LABEL: Record<string, string> = {
  rss: "RSS", signal: "SIGNALS", sanctions: "SANCTIONS", cyber: "CYBER", contracts: "CONTRACTS", flights: "FLIGHTS",
};

function statusLabel(ok: boolean, items: number): { label: string; color: string } {
  if (!ok) return { label: "DOWN", color: "var(--accent-hot)" };
  if (items === 0) return { label: "EMPTY", color: "var(--accent-warm)" };
  return { label: "OK", color: "var(--accent)" };
}

function relative(d: Date | null): string {
  if (!d) return "—";
  const diff = Date.now() - new Date(d).getTime();
  const m = Math.round(diff / 60_000);
  if (m < 60) return `${m}m`;
  const h = Math.round(m / 60);
  if (h < 24) return `${h}h`;
  return `${Math.round(h / 24)}d`;
}

export default async function Page() {
  const h = await getSourceHealth();
  return (
    <>
      <Header />
      <main>
        <section style={{ padding: "30px 28px 14px" }}>
          <div className="wm-shell">
            <div className="wm-mono" style={{ fontSize: 10, color: "var(--accent)", letterSpacing: "0.22em" }}>● SOURCE HEALTH</div>
            <h1 className="wm-display" style={{ fontSize: "clamp(28px, 4vw, 44px)", margin: "8px 0 0" }}>Feed Health</h1>
            <p style={{ color: "var(--ink-2)", marginTop: 8, fontSize: 13, maxWidth: 800, lineHeight: 1.6 }}>
              Status of every feed in the catalog — last successful fetch, last failure, items returned in the latest ingest cycle.
            </p>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 14, marginTop: 18 }}>
              <div className="wm-tile">
                <div className="wm-mono" style={{ fontSize: 9, color: "var(--ink-3)", letterSpacing: "0.22em" }}>SOURCES TRACKED</div>
                <div className="wm-display" style={{ fontSize: 32, marginTop: 4 }}>{h.totals.total}</div>
              </div>
              <div className="wm-tile">
                <div className="wm-mono" style={{ fontSize: 9, color: "var(--ink-3)", letterSpacing: "0.22em" }}>HEALTHY</div>
                <div className="wm-display" style={{ fontSize: 32, marginTop: 4, color: "var(--accent)" }}>{h.totals.ok}</div>
              </div>
              <div className="wm-tile">
                <div className="wm-mono" style={{ fontSize: 9, color: "var(--ink-3)", letterSpacing: "0.22em" }}>FAILING</div>
                <div className="wm-display" style={{ fontSize: 32, marginTop: 4, color: "var(--accent-hot)" }}>{h.totals.failed}</div>
              </div>
            </div>
          </div>
        </section>

        <section style={{ padding: "0 28px 32px" }}>
          <div className="wm-shell wm-glass" style={{ padding: 0 }}>
            <div style={{ overflow: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
                <thead>
                  <tr style={{ borderBottom: "1px solid var(--line)", background: "rgba(255,255,255,0.02)" }}>
                    <Th>Source</Th><Th>Kind</Th><Th>Status</Th><Th>Items</Th><Th>Last OK</Th><Th>Last Fail</Th><Th>Checked</Th>
                  </tr>
                </thead>
                <tbody>
                  {h.rows.length === 0 ? (
                    <tr><td colSpan={7} style={{ padding: 20, color: "var(--ink-3)", textAlign: "center" }} className="wm-mono">NO DATA · INGEST NOT YET RUN</td></tr>
                  ) : h.rows.map((r) => {
                    const s = statusLabel(r.ok, r.itemsReturned);
                    const meta = SOURCES_BY_SLUG[r.sourceSlug];
                    return (
                      <tr key={r.sourceSlug} style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                        <Td>
                          <strong style={{ color: "var(--ink-0)" }}>{meta?.name ?? r.sourceSlug}</strong>
                          <div style={{ fontSize: 10, color: "var(--ink-3)" }}>{r.sourceSlug}</div>
                        </Td>
                        <Td><span className="wm-mono" style={{ fontSize: 9, color: "var(--ink-3)", letterSpacing: "0.18em" }}>{KIND_LABEL[r.kind] ?? r.kind.toUpperCase()}</span></Td>
                        <Td>
                          <span className="wm-mono" style={{ fontSize: 9, color: s.color, padding: "2px 8px", border: `1px solid ${s.color}`, borderRadius: 999, letterSpacing: "0.18em" }}>{s.label}</span>
                        </Td>
                        <Td><span className="wm-mono" style={{ color: "var(--ink-1)" }}>{r.itemsReturned.toLocaleString()}</span></Td>
                        <Td><span className="wm-mono" style={{ color: r.lastSuccessAt ? "var(--ink-2)" : "var(--ink-3)" }}>{relative(r.lastSuccessAt)}</span></Td>
                        <Td><span className="wm-mono" style={{ color: r.lastFailureAt ? "var(--accent-hot)" : "var(--ink-3)" }}>{relative(r.lastFailureAt)}</span></Td>
                        <Td><span className="wm-mono" style={{ color: "var(--ink-3)" }}>{relative(r.checkedAt)}</span></Td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </section>
        <Footer />
      </main>
    </>
  );
}

function Th({ children }: { children: React.ReactNode }) {
  return <th style={{ textAlign: "left", padding: "10px 14px", color: "var(--ink-3)", fontSize: 9.5, letterSpacing: "0.18em", fontWeight: 500 }} className="wm-mono">{children}</th>;
}
function Td({ children }: { children: React.ReactNode }) {
  return <td style={{ padding: "8px 14px", color: "var(--ink-2)" }}>{children}</td>;
}
