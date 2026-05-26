// Curated probability questions — manually maintained. In production, wire to
// Manifold Markets / Kalshi public markets via their open APIs.

type Prediction = {
  question: string;
  probability: number;     // 0..1
  vol?: string;
  source: string;
  href: string;
};

const PREDICTIONS: Prediction[] = [
  { question: "Will the US enter formal war with Iran before 2027?", probability: 0.06, vol: "$1.2M", source: "Manifold", href: "https://manifold.markets/" },
  { question: "Will Bitcoin close above $200k in 2026?", probability: 0.34, vol: "$4.6M", source: "Kalshi", href: "https://kalshi.com/" },
  { question: "Will Russia hold occupied Ukrainian territory through 2026?", probability: 0.72, vol: "$880k", source: "Polymarket", href: "https://polymarket.com/" },
  { question: "Will a major AI lab achieve AGI-grade benchmark by 2027?", probability: 0.18, vol: "$2.1M", source: "Manifold", href: "https://manifold.markets/" },
  { question: "Will the Fed cut rates again in 2026?", probability: 0.83, vol: "$5.4M", source: "Kalshi", href: "https://kalshi.com/" },
  { question: "Will Taiwan be invaded by China before 2030?", probability: 0.11, vol: "$3.8M", source: "Polymarket", href: "https://polymarket.com/" },
];

export function PredictionsPanel() {
  return (
    <div style={{ border: "1px solid var(--line)", borderRadius: 10, background: "rgba(8,12,24,0.55)" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 12px", borderBottom: "1px solid var(--line)" }}>
        <div className="wm-mono" style={{ fontSize: 10, color: "var(--ink-1)", letterSpacing: "0.22em", textTransform: "uppercase", fontWeight: 600 }}>
          PREDICTIONS
        </div>
        <span className="wm-mono" style={{ fontSize: 9, color: "var(--accent-cool)", letterSpacing: "0.2em" }}>PROBABILITY MARKETS</span>
      </div>
      <ul style={{ listStyle: "none", margin: 0, padding: 0 }}>
        {PREDICTIONS.map((p) => {
          const pct = Math.round(p.probability * 100);
          return (
            <li key={p.question} style={{ padding: "10px 12px", borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
              <a href={p.href} target="_blank" rel="noopener noreferrer">
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 10 }}>
                  <span style={{ fontSize: 12, color: "var(--ink-0)", lineHeight: 1.35 }}>{p.question}</span>
                  <span className="wm-mono" style={{ fontSize: 14, color: pct > 50 ? "var(--accent)" : pct > 25 ? "var(--accent-warm)" : "var(--accent-hot)", fontWeight: 600 }}>
                    {pct}%
                  </span>
                </div>
                <div style={{ marginTop: 6, height: 3, borderRadius: 3, background: "rgba(255,255,255,0.06)", overflow: "hidden" }}>
                  <div style={{
                    width: `${pct}%`, height: "100%",
                    background: pct > 50 ? "var(--accent)" : pct > 25 ? "var(--accent-warm)" : "var(--accent-hot)",
                  }} />
                </div>
                <div style={{ marginTop: 4, display: "flex", justifyContent: "space-between" }}>
                  <span className="wm-mono" style={{ fontSize: 9, color: "var(--ink-3)", letterSpacing: "0.16em" }}>{p.source}</span>
                  {p.vol ? <span className="wm-mono" style={{ fontSize: 9, color: "var(--ink-3)", letterSpacing: "0.16em" }}>VOL {p.vol}</span> : null}
                </div>
              </a>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
