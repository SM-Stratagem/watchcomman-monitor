import type { SanctionsDelta, SanctionRow } from "@/lib/sanctions-diff";

const JUR_LABEL: Record<string, string> = { ofac: "🇺🇸 OFAC", eu: "🇪🇺 EU", uk: "🇬🇧 UK OFSI", bis: "🇺🇸 BIS" };

export function SanctionsPanel({ delta, compact = false }: { delta: SanctionsDelta; compact?: boolean }) {
  const recent = delta.added.slice(0, compact ? 6 : 30);
  return (
    <div className="wm-glass" style={{ padding: 0, display: "flex", flexDirection: "column", minHeight: 280 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 14px", borderBottom: "1px solid var(--line)" }}>
        <div>
          <div className="wm-mono" style={{ fontSize: 9, color: "var(--ink-3)", letterSpacing: "0.22em" }}>SANCTIONS Δ</div>
          <div style={{ fontSize: 16, color: "var(--ink-0)", marginTop: 2, fontWeight: 500 }}>
            New designations · 24h
          </div>
        </div>
        <a href="/sanctions" className="wm-mono" style={{ fontSize: 10, color: "var(--accent)", letterSpacing: "0.18em" }}>VIEW ALL ↗</a>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", borderBottom: "1px solid var(--line)" }}>
        {(["ofac", "eu", "uk", "bis"] as const).map((j) => {
          const t = delta.totals[j];
          return (
            <div key={j} style={{ padding: "10px 12px", borderRight: "1px solid var(--line)" }}>
              <div className="wm-mono" style={{ fontSize: 9, color: "var(--ink-3)", letterSpacing: "0.18em" }}>{JUR_LABEL[j]}</div>
              <div className="wm-display" style={{ fontSize: 22, marginTop: 2, color: t.added24h > 0 ? "var(--accent-hot)" : "var(--ink-2)" }}>+{t.added24h}</div>
              <div style={{ fontSize: 10, color: "var(--ink-3)" }}>{t.total.toLocaleString()} total</div>
            </div>
          );
        })}
      </div>
      <div style={{ overflow: "auto", padding: 2, flex: 1 }}>
        {recent.length === 0 ? (
          <div style={{ padding: 16, color: "var(--ink-3)", fontSize: 11, textAlign: "center" }} className="wm-mono">
            NO NEW DESIGNATIONS · 24h
          </div>
        ) : (
          <ul style={{ listStyle: "none", margin: 0, padding: 0 }}>
            {recent.map((row) => (
              <SanctionsItem key={row.externalKey} row={row} />
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

function SanctionsItem({ row }: { row: SanctionRow }) {
  return (
    <li style={{ padding: "8px 12px", borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 8 }}>
        <span className="wm-mono" style={{ fontSize: 9, color: "var(--accent-hot)", letterSpacing: "0.16em" }}>
          {JUR_LABEL[row.jurisdiction] ?? row.jurisdiction.toUpperCase()} · {row.listName}
        </span>
        <span className="wm-mono" style={{ fontSize: 9, color: "var(--ink-3)" }}>
          {row.firstSeenAt ? new Date(row.firstSeenAt).toLocaleDateString() : ""}
        </span>
      </div>
      <div style={{ marginTop: 3, color: "var(--ink-0)", fontSize: 12, lineHeight: 1.35 }}>
        {row.entityName}
      </div>
      <div style={{ marginTop: 2, color: "var(--ink-3)", fontSize: 10 }}>
        {[row.entityType, row.program, row.addressCountry].filter(Boolean).join(" · ")}
      </div>
    </li>
  );
}
