type Props = {
  name: string;
  description: string;
  status: "active" | "monitoring" | "watch";
  href: string;
  meta: { label: string; value: string }[];
  accent: "warm" | "cool";
};

const STATUS_LABEL: Record<Props["status"], string> = {
  active: "ACTIVE INGEST",
  monitoring: "MONITORING",
  watch: "WATCH",
};

const ACCENT_GRADIENT: Record<Props["accent"], string> = {
  warm:
    "radial-gradient(80% 100% at 0% 0%, rgba(255,107,129,0.16), transparent 60%), radial-gradient(70% 90% at 100% 100%, rgba(246,193,119,0.15), transparent 60%)",
  cool:
    "radial-gradient(80% 100% at 0% 0%, rgba(122,184,255,0.14), transparent 60%), radial-gradient(70% 90% at 100% 100%, rgba(125,240,194,0.16), transparent 60%)",
};

const ACCENT_DOT: Record<Props["accent"], string> = {
  warm: "var(--accent-hot)",
  cool: "var(--accent)",
};

export function ProjectCard({ name, description, status, href, meta, accent }: Props) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="wm-glass"
      style={{
        position: "relative",
        display: "flex",
        flexDirection: "column",
        padding: "26px 28px 28px",
        overflow: "hidden",
        transition: "transform 0.4s ease, border-color 0.3s ease",
        borderColor: "rgba(255,255,255,0.08)",
        textDecoration: "none",
      }}
    >
      <span
        aria-hidden
        style={{
          position: "absolute",
          inset: 0,
          background: ACCENT_GRADIENT[accent],
          pointerEvents: "none",
        }}
      />
      <div
        style={{
          position: "relative",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 22,
        }}
      >
        <span
          className="wm-mono"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
            fontSize: 10,
            letterSpacing: "0.22em",
            color: ACCENT_DOT[accent],
            textTransform: "uppercase",
          }}
        >
          <span
            style={{
              width: 6,
              height: 6,
              borderRadius: 50,
              background: ACCENT_DOT[accent],
              boxShadow: `0 0 10px ${ACCENT_DOT[accent]}`,
            }}
          />
          {STATUS_LABEL[status]}
        </span>
        <span className="wm-mono" style={{ fontSize: 10, color: "var(--ink-3)" }}>
          OPEN ↗
        </span>
      </div>
      <h3
        style={{
          position: "relative",
          fontFamily: "var(--font-display)",
          fontWeight: 300,
          fontSize: 30,
          lineHeight: 1.05,
          letterSpacing: "-0.01em",
          margin: 0,
          marginBottom: 14,
        }}
      >
        {name}
      </h3>
      <p
        style={{
          position: "relative",
          color: "var(--ink-1)",
          fontSize: 14,
          lineHeight: 1.6,
          margin: 0,
          marginBottom: 24,
          maxWidth: 480,
        }}
      >
        {description}
      </p>
      <div
        style={{
          position: "relative",
          marginTop: "auto",
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))",
          gap: 12,
          paddingTop: 18,
          borderTop: "1px solid rgba(255,255,255,0.07)",
        }}
      >
        {meta.map((m) => (
          <div key={m.label}>
            <div
              className="wm-mono"
              style={{
                fontSize: 9,
                letterSpacing: "0.2em",
                color: "var(--ink-3)",
                textTransform: "uppercase",
              }}
            >
              {m.label}
            </div>
            <div style={{ fontSize: 13, color: "var(--ink-0)", marginTop: 4 }}>{m.value}</div>
          </div>
        ))}
      </div>
    </a>
  );
}
