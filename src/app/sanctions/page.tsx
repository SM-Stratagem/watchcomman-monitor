import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { SanctionsPanel } from "@/components/SanctionsPanel";
import { getSanctionsDelta } from "@/lib/sanctions-diff";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";
export const revalidate = 300;

export const metadata: Metadata = {
  title: "Sanctions Delta — World Monitor",
  description: "Live OFAC, EU, UK OFSI, and BIS Entity List designations and removals — defense-grade compliance signal.",
};

export default async function Page() {
  const delta = await getSanctionsDelta(24);
  const week = await getSanctionsDelta(7 * 24);

  return (
    <>
      <Header />
      <main>
        <section style={{ padding: "30px 28px 14px" }}>
          <div className="wm-shell">
            <div className="wm-mono" style={{ fontSize: 10, color: "var(--accent)", letterSpacing: "0.22em" }}>● SANCTIONS DELTA</div>
            <h1 className="wm-display" style={{ fontSize: "clamp(28px, 4vw, 44px)", margin: "8px 0 0" }}>
              Sanctions & Export Controls
            </h1>
            <p style={{ color: "var(--ink-2)", marginTop: 8, fontSize: 13, maxWidth: 800, lineHeight: 1.6 }}>
              Live diff of OFAC SDN, EU consolidated CFSP, UK OFSI, and US BIS Entity List. Surfacing newly listed entities, programs, and home countries — built for defense compliance and export-control analysts.
            </p>
          </div>
        </section>

        <section style={{ padding: "0 28px 22px" }}>
          <div className="wm-shell" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: 14 }}>
            <SanctionsPanel delta={delta} />
            <SanctionsPanel delta={{ ...week, added: week.added.slice(0, 30) }} />
          </div>
        </section>

        <section style={{ padding: "0 28px 24px" }}>
          <div className="wm-shell wm-glass" style={{ padding: 16 }}>
            <h2 style={{ fontSize: 18, margin: "0 0 10px", color: "var(--ink-0)" }}>All new designations · 7 days</h2>
            <div style={{ overflow: "auto", maxHeight: 540 }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
                <thead>
                  <tr style={{ position: "sticky", top: 0, background: "rgba(8,12,24,0.95)" }}>
                    <Th>Jurisdiction</Th><Th>List</Th><Th>Entity</Th><Th>Type</Th><Th>Program</Th><Th>Country</Th><Th>Listed</Th>
                  </tr>
                </thead>
                <tbody>
                  {week.added.length === 0 && (
                    <tr><td colSpan={7} style={{ padding: 18, textAlign: "center", color: "var(--ink-3)" }} className="wm-mono">NO LISTINGS · 7d</td></tr>
                  )}
                  {week.added.map((r) => (
                    <tr key={r.externalKey} style={{ borderTop: "1px solid var(--line)" }}>
                      <Td><span style={{ color: "var(--accent-hot)" }}>{r.jurisdiction.toUpperCase()}</span></Td>
                      <Td>{r.listName}</Td>
                      <Td><strong style={{ color: "var(--ink-0)" }}>{r.entityName}</strong></Td>
                      <Td>{r.entityType ?? "—"}</Td>
                      <Td>{r.program ?? "—"}</Td>
                      <Td>{r.addressCountry ?? "—"}</Td>
                      <Td>{r.firstSeenAt ? new Date(r.firstSeenAt).toLocaleDateString() : ""}</Td>
                    </tr>
                  ))}
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
  return <th style={{ textAlign: "left", padding: "8px 10px", color: "var(--ink-3)", fontWeight: 500, fontSize: 10, letterSpacing: "0.18em" }} className="wm-mono">{children}</th>;
}
function Td({ children }: { children: React.ReactNode }) {
  return <td style={{ padding: "8px 10px", color: "var(--ink-2)" }}>{children}</td>;
}
