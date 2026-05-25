import type { ReactNode } from "react";

type Props = {
  label: string;
  value: ReactNode;
  delta?: string;
  hint?: string;
  accent?: "default" | "warm" | "cool" | "hot";
};

const ACCENT_COLORS: Record<NonNullable<Props["accent"]>, string> = {
  default: "var(--accent)",
  warm: "var(--accent-warm)",
  cool: "var(--accent-cool)",
  hot: "var(--accent-hot)",
};

export function MetricCard({ label, value, delta, hint, accent = "default" }: Props) {
  return (
    <article
      className="wm-glass"
      style={{
        position: "relative",
        padding: "18px 20px 20px",
        overflow: "hidden",
      }}
    >
      <span
        aria-hidden
        style={{
          position: "absolute",
          inset: 0,
          background: `radial-gradient(60% 100% at 100% 0%, ${ACCENT_COLORS[accent]}26, transparent 70%)`,
          pointerEvents: "none",
        }}
      />
      <div style={{ position: "relative", display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <span
          className="wm-eyebrow"
          style={{ fontSize: 10, color: "var(--ink-2)" }}
        >
          {label}
        </span>
        {delta ? (
          <span
            className="wm-mono"
            style={{
              fontSize: 10,
              padding: "3px 8px",
              borderRadius: 999,
              border: "1px solid rgba(255,255,255,0.10)",
              color: ACCENT_COLORS[accent],
              letterSpacing: "0.1em",
            }}
          >
            {delta}
          </span>
        ) : null}
      </div>
      <div
        style={{
          marginTop: 14,
          fontFamily: "var(--font-display)",
          fontWeight: 300,
          fontSize: 38,
          lineHeight: 1,
          letterSpacing: "-0.01em",
        }}
      >
        {value}
      </div>
      {hint ? (
        <div style={{ marginTop: 10, fontSize: 12, color: "var(--ink-2)", lineHeight: 1.55 }}>
          {hint}
        </div>
      ) : null}
    </article>
  );
}
