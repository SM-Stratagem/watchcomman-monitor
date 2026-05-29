import type { ContractsData, ContractRow } from "@/lib/contracts";
import { formatRelative } from "@/lib/format";

const JUR_BADGE: Record<string, string> = {
  "us-sam": "🇺🇸 SAM.gov", "eu-ted": "🇪🇺 EU TED", "uk-gov": "🇬🇧 UK MOD", "dsca": "🇺🇸 DSCA FMS",
};

const fmtValue = (v: string | null): string | null => {
  if (!v) return null;
  const n = Number(v);
  if (!Number.isFinite(n)) return null;
  if (n >= 1e9) return `$${(n / 1e9).toFixed(2)}B`;
  if (n >= 1e6) return `$${(n / 1e6).toFixed(1)}M`;
  if (n >= 1e3) return `$${(n / 1e3).toFixed(1)}K`;
  return `$${n.toFixed(0)}`;
};

export function ContractsPanel({ data, compact = false }: { data: ContractsData; compact?: boolean }) {
  const items = data.recent.slice(0, compact ? 8 : 60);
  return (
    <div className="wm-glass" style={{ padding: 0, display: "flex", flexDirection: "column", minHeight: 280 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 14px", borderBottom: "1px solid var(--line)" }}>
        <div>
          <div className="wm-mono" style={{ fontSize: 9, color: "var(--ink-3)", letterSpacing: "0.22em" }}>DEFENSE CONTRACTS</div>
          <div style={{ fontSize: 16, color: "var(--ink-0)", marginTop: 2, fontWeight: 500 }}>Procurement opportunities · 60d</div>
        </div>
        <a href="/contracts" className="wm-mono" style={{ fontSize: 10, color: "var(--accent)", letterSpacing: "0.18em" }}>VIEW ALL ↗</a>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", borderBottom: "1px solid var(--line)" }}>
        <Stat label="SAM.GOV" value={data.totals.samCount} />
        <Stat label="EU TED" value={data.totals.tedCount} />
        <Stat label="UK MOD" value={data.totals.ukCount} />
        <Stat label="DSCA FMS" value={data.totals.dscaCount} accent="var(--accent-hot)" />
      </div>
      <div style={{ overflow: "auto", padding: 2, flex: 1 }}>
        {items.length === 0 ? (
          <div style={{ padding: 18, color: "var(--ink-3)", fontSize: 11, textAlign: "center" }} className="wm-mono">
            INGEST NOT YET POPULATED · CRON RUN PENDING
          </div>
        ) : (
          <ul style={{ listStyle: "none", margin: 0, padding: 0 }}>
            {items.map((row) => <ContractItem key={row.externalKey} row={row} />)}
          </ul>
        )}
      </div>
    </div>
  );
}

function Stat({ label, value, accent = "var(--accent)" }: { label: string; value: number; accent?: string }) {
  return (
    <div style={{ padding: "10px 12px", borderRight: "1px solid var(--line)" }}>
      <div className="wm-mono" style={{ fontSize: 9, color: "var(--ink-3)", letterSpacing: "0.18em" }}>{label}</div>
      <div className="wm-display" style={{ fontSize: 22, marginTop: 2, color: accent }}>{value}</div>
    </div>
  );
}

function ContractItem({ row }: { row: ContractRow }) {
  const value = fmtValue(row.valueUsd);
  return (
    <li style={{ padding: "8px 12px", borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
      <a href={row.link ?? "#"} target="_blank" rel="noopener noreferrer" style={{ display: "block" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 8 }}>
          <span className="wm-mono" style={{ fontSize: 9, color: "var(--accent)", letterSpacing: "0.16em" }}>
            {JUR_BADGE[row.jurisdiction] ?? row.jurisdiction}
            {value ? ` · ${value}` : ""}
            {row.country ? ` · ${row.country}` : ""}
          </span>
          <span className="wm-mono" style={{ fontSize: 9, color: "var(--ink-3)" }}>{formatRelative(row.publishedAt)}</span>
        </div>
        <div style={{ marginTop: 3, color: "var(--ink-0)", fontSize: 12, lineHeight: 1.35 }}>{row.title}</div>
        {row.agency ? (
          <div style={{ marginTop: 2, color: "var(--ink-3)", fontSize: 10 }}>{row.agency}</div>
        ) : null}
      </a>
    </li>
  );
}
