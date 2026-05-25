import { WorldMap } from "@/components/WorldMap";
import { getDashboardSnapshot } from "@/lib/dashboard";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";
export const revalidate = 120;

export const metadata: Metadata = {
  title: "Live world map — embed",
  description: "Embeddable live world map of global monitoring signals.",
};

export default async function Page() {
  const snap = await getDashboardSnapshot(300);
  return (
    <main style={{ padding: 14 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 8 }}>
        <span className="wm-mono" style={{ fontSize: 10, color: "var(--ink-2)", letterSpacing: "0.18em" }}>
          POWERED BY <a href="https://watchcomman-monitor-production.up.railway.app" target="_blank" rel="noopener noreferrer" style={{ color: "var(--accent)" }}>WATCHCOMMAN MONITOR</a>
        </span>
        <span className="wm-mono" style={{ fontSize: 10, color: "var(--ink-3)", letterSpacing: "0.18em" }}>
          {snap.signals.length} SIGNALS
        </span>
      </div>
      <WorldMap signals={snap.signals} />
    </main>
  );
}
