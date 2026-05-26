import Link from "next/link";

export function Header() {
  return (
    <header
      style={{
        position: "sticky",
        top: 0,
        zIndex: 30,
        backdropFilter: "blur(14px) saturate(140%)",
        WebkitBackdropFilter: "blur(14px) saturate(140%)",
        background:
          "linear-gradient(180deg, rgba(4,6,12,0.72) 0%, rgba(4,6,12,0.42) 70%, rgba(4,6,12,0) 100%)",
        borderBottom: "1px solid rgba(255,255,255,0.04)",
      }}
    >
      <div
        className="wm-shell"
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "18px 28px",
        }}
      >
        <Link
          href="/"
          style={{ display: "flex", alignItems: "center", gap: 12 }}
          aria-label="Watchcomman Monitor home"
        >
          <span
            aria-hidden
            style={{
              width: 28,
              height: 28,
              borderRadius: 8,
              background:
                "conic-gradient(from 220deg, #7df0c2, #7ab8ff, #f6c177, #7df0c2)",
              boxShadow: "0 0 24px rgba(125,240,194,0.4)",
              position: "relative",
            }}
          >
            <span
              style={{
                position: "absolute",
                inset: 4,
                background: "var(--bg-0)",
                borderRadius: 6,
              }}
            />
          </span>
          <span style={{ display: "flex", flexDirection: "column", lineHeight: 1 }}>
            <span
              style={{
                fontFamily: "var(--font-display)",
                fontSize: 17,
                fontWeight: 400,
                letterSpacing: "-0.01em",
              }}
            >
              Watchcomman
            </span>
            <span
              className="wm-mono"
              style={{ fontSize: 10, color: "var(--ink-2)", letterSpacing: "0.22em" }}
            >
              MONITOR
            </span>
          </span>
        </Link>
        <nav
          style={{
            display: "flex",
            alignItems: "center",
            gap: 22,
            fontSize: 13,
            color: "var(--ink-1)",
          }}
        >
          <Link href="/dashboard" className="wm-nav-link">Dashboard</Link>
          <Link href="/signals" className="wm-nav-link">Signals</Link>
          <Link href="/map" className="wm-nav-link">Map</Link>
          <Link href="/countries" className="wm-nav-link">Countries</Link>
          <Link href="/sources" className="wm-nav-link">Sources</Link>
          <Link href="/api-docs" className="wm-nav-link">API</Link>
          <span className="wm-pill" style={{ fontSize: 10 }}>
            <span className="wm-dot" /> LIVE
          </span>
        </nav>
      </div>
      <style>{`
        .wm-nav-link {
          color: var(--ink-1);
          transition: color 0.2s ease;
          font-family: var(--font-sans);
        }
        .wm-nav-link:hover { color: var(--ink-0); }
        @media (max-width: 560px) {
          .wm-nav-link { display: none; }
        }
      `}</style>
    </header>
  );
}
