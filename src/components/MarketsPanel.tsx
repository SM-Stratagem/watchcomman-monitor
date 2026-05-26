import type { Quote } from "@/lib/markets";

function fmt(n: number, dp = 2): string {
  if (!Number.isFinite(n)) return "—";
  if (Math.abs(n) >= 1000) return n.toLocaleString(undefined, { maximumFractionDigits: 0 });
  if (Math.abs(n) >= 1) return n.toFixed(dp);
  return n.toFixed(4);
}

export function MarketsPanel({
  title,
  quotes,
  accent = "var(--accent)",
  showChange = true,
  unit = "",
}: {
  title: string;
  quotes: Quote[];
  accent?: string;
  showChange?: boolean;
  unit?: string;
}) {
  return (
    <div style={{
      border: "1px solid var(--line)", borderRadius: 10,
      background: "rgba(8,12,24,0.55)",
      display: "flex", flexDirection: "column",
      minHeight: 240,
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 12px", borderBottom: "1px solid var(--line)" }}>
        <div className="wm-mono" style={{ fontSize: 10, color: "var(--ink-1)", letterSpacing: "0.22em", textTransform: "uppercase", fontWeight: 600 }}>
          {title}
        </div>
        <span className="wm-mono" style={{ fontSize: 9, color: accent, letterSpacing: "0.2em" }}>
          LIVE
        </span>
      </div>
      <ul style={{ listStyle: "none", margin: 0, padding: 0 }}>
        {quotes.length === 0 ? (
          <li className="wm-mono" style={{ padding: 14, color: "var(--ink-3)", fontSize: 11, textAlign: "center" }}>NO DATA</li>
        ) : (
          quotes.map((q) => {
            const up = q.changePct >= 0;
            return (
              <li key={q.symbol} style={{ padding: "9px 12px", borderBottom: "1px solid rgba(255,255,255,0.04)", display: "grid", gridTemplateColumns: "1fr auto auto", gap: 10, alignItems: "baseline" }}>
                <span style={{ fontSize: 12, color: "var(--ink-0)" }}>
                  <span className="wm-mono" style={{ color: accent, fontSize: 11, marginRight: 8 }}>{q.symbol}</span>
                  <span style={{ color: "var(--ink-2)", fontSize: 11 }}>{q.name}</span>
                </span>
                <span className="wm-mono" style={{ fontSize: 12, color: "var(--ink-0)", textAlign: "right" }}>
                  {fmt(q.price)} <span style={{ color: "var(--ink-3)", fontSize: 9 }}>{q.unit ?? unit}</span>
                </span>
                {showChange && q.changePct !== 0 ? (
                  <span className="wm-mono" style={{ fontSize: 11, color: up ? "var(--accent)" : "var(--accent-hot)", textAlign: "right" }}>
                    {up ? "+" : ""}{q.changePct.toFixed(2)}%
                  </span>
                ) : <span />}
              </li>
            );
          })
        )}
      </ul>
    </div>
  );
}
