import type { SignalRow } from "@/lib/dashboard";

const SEVERITY_COLOR: Record<string, string> = {
  low: "var(--accent)",
  moderate: "var(--accent-cool)",
  elevated: "var(--accent-warm)",
  high: "#ff8a5b",
  critical: "var(--accent-hot)",
};

export function IngestStrip({ signals }: { signals: SignalRow[] }) {
  const visible = signals.slice(0, 16);
  const doubled = [...visible, ...visible];

  return (
    <div
      style={{
        position: "relative",
        borderTop: "1px solid var(--line)",
        borderBottom: "1px solid var(--line)",
        background: "rgba(4,6,12,0.55)",
        overflow: "hidden",
      }}
      aria-label="Live ingest ticker"
    >
      <div
        aria-hidden
        style={{
          position: "absolute",
          inset: 0,
          background:
            "linear-gradient(90deg, var(--bg-0) 0%, transparent 6%, transparent 94%, var(--bg-0) 100%)",
          zIndex: 2,
          pointerEvents: "none",
        }}
      />
      <div className="wm-ticker" style={{ padding: "14px 24px" }}>
        {doubled.map((s, i) => (
          <span
            key={`${s.id}-${i}`}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 12,
              fontSize: 12,
              color: "var(--ink-1)",
              fontFamily: "var(--font-mono)",
            }}
          >
            <span
              style={{
                width: 6,
                height: 6,
                borderRadius: 50,
                background: SEVERITY_COLOR[s.severity] ?? SEVERITY_COLOR.low,
                boxShadow: `0 0 8px ${SEVERITY_COLOR[s.severity] ?? SEVERITY_COLOR.low}`,
              }}
            />
            <span style={{ color: "var(--ink-3)", letterSpacing: "0.2em" }}>
              {s.source.toUpperCase()}
            </span>
            <span style={{ color: "var(--ink-1)" }}>{s.title}</span>
            <span style={{ color: "var(--ink-3)" }}>·</span>
            <span style={{ color: "var(--ink-2)" }}>{s.country ?? s.region}</span>
          </span>
        ))}
      </div>
    </div>
  );
}
