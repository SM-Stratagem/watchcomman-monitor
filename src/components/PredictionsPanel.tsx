import { getLiveMarkets } from "@/lib/predictions";

function fmtVol(n: number | null, source: string): string {
  if (n == null) return "";
  if (source === "Manifold") return `Ṁ${Math.round(n).toLocaleString()}`;
  if (n > 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n > 1_000) return `$${(n / 1_000).toFixed(0)}k`;
  return `$${Math.round(n)}`;
}

export async function PredictionsPanel() {
  const markets = await getLiveMarkets();
  return (
    <div style={{ border: "1px solid var(--line)", borderRadius: 10, background: "rgba(8,12,24,0.55)", display: "flex", flexDirection: "column", maxHeight: 520 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 12px", borderBottom: "1px solid var(--line)" }}>
        <div className="wm-mono" style={{ fontSize: 10, color: "var(--ink-1)", letterSpacing: "0.22em", textTransform: "uppercase", fontWeight: 600 }}>
          PREDICTIONS · LIVE MARKETS
        </div>
        <span className="wm-mono" style={{ fontSize: 9, color: "var(--accent-cool)", letterSpacing: "0.2em" }}>{markets.length} ACTIVE</span>
      </div>
      <ul style={{ listStyle: "none", margin: 0, padding: 0, overflow: "auto" }}>
        {markets.length === 0 ? (
          <li className="wm-mono" style={{ padding: 14, color: "var(--ink-3)", fontSize: 11, textAlign: "center" }}>LOADING…</li>
        ) : markets.map((p) => {
          const pct = Math.round(p.probability * 100);
          const color = pct > 50 ? "var(--accent)" : pct > 25 ? "var(--accent-warm)" : "var(--accent-hot)";
          return (
            <li key={p.id} style={{ padding: "10px 12px", borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
              <a href={p.href} target="_blank" rel="noopener noreferrer">
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 10 }}>
                  <span style={{ fontSize: 12, color: "var(--ink-0)", lineHeight: 1.35 }}>{p.question}</span>
                  <span className="wm-mono" style={{ fontSize: 14, color, fontWeight: 600 }}>{pct}%</span>
                </div>
                <div style={{ marginTop: 6, height: 3, borderRadius: 3, background: "rgba(255,255,255,0.06)", overflow: "hidden" }}>
                  <div style={{ width: `${pct}%`, height: "100%", background: color }} />
                </div>
                <div style={{ marginTop: 4, display: "flex", justifyContent: "space-between" }}>
                  <span className="wm-mono" style={{ fontSize: 9, color: "var(--ink-3)", letterSpacing: "0.16em" }}>{p.source}</span>
                  {p.vol != null ? <span className="wm-mono" style={{ fontSize: 9, color: "var(--ink-3)", letterSpacing: "0.16em" }}>VOL {fmtVol(p.vol, p.source)}</span> : null}
                </div>
              </a>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
