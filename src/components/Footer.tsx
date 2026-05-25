import Link from "next/link";

export function Footer({ lastIngestAt }: { lastIngestAt: string | null }) {
  const year = new Date().getFullYear();
  return (
    <footer
      style={{
        marginTop: 96,
        paddingTop: 48,
        paddingBottom: 56,
        borderTop: "1px solid var(--line)",
        background:
          "linear-gradient(180deg, rgba(4,6,12,0) 0%, rgba(4,6,12,0.85) 100%)",
      }}
    >
      <div
        className="wm-shell"
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
          gap: 32,
        }}
      >
        <div>
          <div className="wm-eyebrow" style={{ marginBottom: 12 }}>Watchcomman Monitor</div>
          <p style={{ color: "var(--ink-2)", fontSize: 13, lineHeight: 1.7, maxWidth: 320 }}>
            A unified global monitoring surface aggregating live signals from independent
            disease and environmental monitors. Built for situational clarity.
          </p>
        </div>
        <div>
          <div className="wm-eyebrow" style={{ marginBottom: 12 }}>Monitors</div>
          <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "grid", gap: 8, fontSize: 13 }}>
            <li>
              <a href="https://www.ebolamonitorapp.com" target="_blank" rel="noopener noreferrer">
                Ebola Monitor →
              </a>
            </li>
            <li>
              <a
                href="https://hantavirus-monitor.up.railway.app"
                target="_blank"
                rel="noopener noreferrer"
              >
                Hantavirus Monitor →
              </a>
            </li>
          </ul>
        </div>
        <div>
          <div className="wm-eyebrow" style={{ marginBottom: 12 }}>Reference</div>
          <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "grid", gap: 8, fontSize: 13 }}>
            <li><Link href="/about">About the platform</Link></li>
            <li><Link href="/privacy">Privacy</Link></li>
            <li><a href="/api/dashboard">Public dashboard JSON</a></li>
          </ul>
        </div>
        <div>
          <div className="wm-eyebrow" style={{ marginBottom: 12 }}>Status</div>
          <div className="wm-mono" style={{ color: "var(--ink-1)", fontSize: 12, lineHeight: 1.8 }}>
            <div>
              INGEST · {lastIngestAt ? new Date(lastIngestAt).toUTCString() : "scheduled every 30m"}
            </div>
            <div>SOURCES · 2 monitors + seeded baseline</div>
            <div>CADENCE · continuous polling</div>
          </div>
        </div>
      </div>
      <div
        className="wm-shell"
        style={{
          marginTop: 36,
          paddingTop: 18,
          borderTop: "1px solid var(--line)",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          fontSize: 11,
          color: "var(--ink-3)",
          fontFamily: "var(--font-mono)",
          letterSpacing: "0.14em",
          textTransform: "uppercase",
          flexWrap: "wrap",
          gap: 12,
        }}
      >
        <span>© {year} SM Stratagem · Watchcomman Monitor</span>
        <span>v1.0 · build active</span>
      </div>
    </footer>
  );
}
