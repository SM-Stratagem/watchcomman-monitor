import type { CyberPanelData, CyberRow } from "@/lib/cyber";
import { formatRelative } from "@/lib/format";

const SOURCE_BADGE: Record<string, string> = {
  kev: "🛡 CISA KEV", nvd: "💀 NVD CVE", hibp: "🔓 HIBP BREACH", "ics-cert": "⚠ ICS-CERT",
};

const sevColor = (sev: string | null): string => {
  switch (sev) {
    case "critical": return "var(--accent-hot, #d54c4c)";
    case "high":     return "var(--accent-warm, #d8995a)";
    case "medium":   return "var(--accent, #c9a86a)";
    default:         return "var(--ink-3, #8c8a87)";
  }
};

export function CyberPanel({ data, compact = false }: { data: CyberPanelData; compact?: boolean }) {
  const items = data.recent.slice(0, compact ? 8 : 60);
  return (
    <div className="wm-glass" style={{ padding: 0, display: "flex", flexDirection: "column", minHeight: 280 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 14px", borderBottom: "1px solid var(--line)" }}>
        <div>
          <div className="wm-mono" style={{ fontSize: 9, color: "var(--ink-3)", letterSpacing: "0.22em" }}>CYBER THREAT INTEL</div>
          <div style={{ fontSize: 16, color: "var(--ink-0)", marginTop: 2, fontWeight: 500 }}>
            Actively-exploited & critical CVEs
          </div>
        </div>
        <a href="/cyber" className="wm-mono" style={{ fontSize: 10, color: "var(--accent)", letterSpacing: "0.18em" }}>VIEW ALL ↗</a>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", borderBottom: "1px solid var(--line)" }}>
        <Stat label="KEV 14d" value={data.totals.kev} accent="var(--accent-hot)" />
        <Stat label="NVD HIGH+ 14d" value={data.totals.nvd} accent="var(--accent-warm)" />
        <Stat label="BREACH 14d" value={data.totals.hibp} accent="var(--accent-cool)" />
        <Stat label="CRITICAL 7d" value={data.totals.critical7d} accent="var(--accent)" />
      </div>

      <div style={{ overflow: "auto", padding: 2, flex: 1 }}>
        {items.length === 0 ? (
          <div style={{ padding: 18, color: "var(--ink-3)", fontSize: 11, textAlign: "center" }} className="wm-mono">
            INGEST NOT YET POPULATED · TRY AFTER FIRST CRON
          </div>
        ) : (
          <ul style={{ listStyle: "none", margin: 0, padding: 0 }}>
            {items.map((row) => <CyberItem key={row.externalKey} row={row} />)}
          </ul>
        )}
      </div>
    </div>
  );
}

function Stat({ label, value, accent }: { label: string; value: number; accent: string }) {
  return (
    <div style={{ padding: "10px 12px", borderRight: "1px solid var(--line)" }}>
      <div className="wm-mono" style={{ fontSize: 9, color: "var(--ink-3)", letterSpacing: "0.18em" }}>{label}</div>
      <div className="wm-display" style={{ fontSize: 22, marginTop: 2, color: accent }}>{value}</div>
    </div>
  );
}

function CyberItem({ row }: { row: CyberRow }) {
  return (
    <li style={{ padding: "8px 12px", borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
      <a href={row.link ?? "#"} target="_blank" rel="noopener noreferrer" style={{ display: "block" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 8 }}>
          <span className="wm-mono" style={{ fontSize: 9, color: sevColor(row.severity), letterSpacing: "0.16em" }}>
            {SOURCE_BADGE[row.source] ?? row.source.toUpperCase()}
            {row.cvss ? ` · CVSS ${Number(row.cvss).toFixed(1)}` : ""}
            {row.severity ? ` · ${row.severity.toUpperCase()}` : ""}
          </span>
          <span className="wm-mono" style={{ fontSize: 9, color: "var(--ink-3)" }}>{formatRelative(row.publishedAt)}</span>
        </div>
        <div style={{ marginTop: 3, color: "var(--ink-0)", fontSize: 12, lineHeight: 1.35 }}>{row.title}</div>
        {row.summary ? (
          <div style={{ marginTop: 2, color: "var(--ink-2)", fontSize: 11, lineHeight: 1.4 }}>{row.summary.slice(0, 220)}</div>
        ) : null}
      </a>
    </li>
  );
}
