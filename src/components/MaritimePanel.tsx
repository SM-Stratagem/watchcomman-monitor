import type { ChokepointStatus } from "@/lib/maritime";

const RISK_COLOR: Record<ChokepointStatus["risk"], string> = {
  low: "var(--accent)",
  elevated: "var(--accent-warm)",
  high: "var(--accent-warm)",
  critical: "var(--accent-hot)",
};

export function MaritimePanel({ items, compact = false }: { items: ChokepointStatus[]; compact?: boolean }) {
  const show = items.slice(0, compact ? 5 : 50);
  const highRisk = items.filter((i) => i.risk === "high" || i.risk === "critical").length;
  return (
    <div className="wm-glass" style={{ padding: 0, display: "flex", flexDirection: "column", minHeight: 280 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", padding: "10px 14px", borderBottom: "1px solid var(--line)" }}>
        <div>
          <div className="wm-mono" style={{ fontSize: 9, color: "var(--ink-3)", letterSpacing: "0.22em" }}>MARITIME · CHOKEPOINTS</div>
          <div style={{ fontSize: 16, color: "var(--ink-0)", marginTop: 2, fontWeight: 500 }}>
            {items.length} strategic narrows · {highRisk} active
          </div>
        </div>
        <a href="/ships" className="wm-mono" style={{ fontSize: 10, color: "var(--accent)", letterSpacing: "0.18em" }}>VIEW ALL ↗</a>
      </div>
      <ul style={{ listStyle: "none", margin: 0, padding: 0, overflow: "auto" }}>
        {show.map((c) => (
          <li key={c.slug} style={{ padding: "10px 14px", borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 8 }}>
              <div style={{ display: "flex", flexDirection: "column" }}>
                <span style={{ fontSize: 13, color: "var(--ink-0)", fontWeight: 500 }}>{c.name}</span>
                <span style={{ fontSize: 10.5, color: "var(--ink-3)", marginTop: 2 }}>
                  {c.oilMbd != null ? `${c.oilMbd} Mb/d oil` : ""}
                  {c.oilMbd != null && c.containerPct != null ? " · " : ""}
                  {c.containerPct != null ? `${c.containerPct}% global trade` : ""}
                </span>
              </div>
              <span className="wm-mono" style={{ fontSize: 9, color: RISK_COLOR[c.risk], letterSpacing: "0.18em", padding: "2px 8px", border: `1px solid ${RISK_COLOR[c.risk]}`, borderRadius: 999 }}>
                {c.risk.toUpperCase()} · {c.mentionsLast48h}
              </span>
            </div>
            {c.topHeadline ? (
              <div style={{ marginTop: 5, fontSize: 11, color: "var(--ink-2)", lineHeight: 1.4 }}>↳ {c.topHeadline}</div>
            ) : null}
          </li>
        ))}
      </ul>
    </div>
  );
}
