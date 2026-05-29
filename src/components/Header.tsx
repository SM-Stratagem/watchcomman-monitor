import Link from "next/link";
import { CommandPalette } from "./CommandPalette";
import { MobileMenu } from "./MobileMenu";

const PRIMARY = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/theater", label: "Theaters" },
];

const INTEL = [
  { href: "/sanctions", label: "Sanctions", desc: "OFAC · EU · UK · BIS delta" },
  { href: "/cyber", label: "Cyber threat intel", desc: "CISA KEV · NVD · breaches" },
  { href: "/contracts", label: "Defense contracts", desc: "SAM · TED · UK · DSCA" },
  { href: "/ships", label: "Maritime", desc: "AIS · chokepoints · vessels" },
  { href: "/military", label: "Military air", desc: "ADSB military filter" },
  { href: "/timeline", label: "Time machine", desc: "Scrub 24h to 30d" },
];

const TOOLS = [
  { href: "/watchlist", label: "Watchlist", desc: "Track entities + keywords" },
  { href: "/briefing", label: "Briefing (HTML)", desc: "Printable situation report" },
  { href: "/briefing.pdf?token=YOUR_TOKEN", label: "Briefing PDF", desc: "Supporter-only download" },
  { href: "/globe", label: "3D Globe", desc: "Hand-shaded atlas" },
  { href: "/signals", label: "Signals", desc: "All raw events" },
  { href: "/map", label: "Map", desc: "Full-screen OSINT map" },
  { href: "/source-health", label: "Source health", desc: "Per-feed status" },
  { href: "/account", label: "My account", desc: "Supporter dashboard" },
  { href: "/sources", label: "Sources", desc: "Manage feed catalog" },
  { href: "/api-docs", label: "API", desc: "JSON / RSS endpoints" },
];

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
          "linear-gradient(180deg, rgba(4,6,12,0.82) 0%, rgba(4,6,12,0.55) 70%, rgba(4,6,12,0.2) 100%)",
        borderBottom: "1px solid rgba(255,255,255,0.05)",
      }}
    >
      <div
        className="wm-shell"
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "14px 28px",
          gap: 18,
        }}
      >
        <Link
          href="/"
          style={{ display: "flex", alignItems: "center", gap: 12, flexShrink: 0 }}
          aria-label="Watchcomman Monitor home"
        >
          <span
            aria-hidden
            style={{
              width: 28,
              height: 28,
              borderRadius: 8,
              background: "conic-gradient(from 220deg, #7df0c2, #7ab8ff, #f6c177, #7df0c2)",
              boxShadow: "0 0 24px rgba(125,240,194,0.4)",
              position: "relative",
            }}
          >
            <span style={{ position: "absolute", inset: 4, background: "var(--bg-0)", borderRadius: 6 }} />
          </span>
          <span style={{ display: "flex", flexDirection: "column", lineHeight: 1 }}>
            <span style={{ fontFamily: "var(--font-display)", fontSize: 17, fontWeight: 400, letterSpacing: "-0.01em" }}>
              Watchcomman
            </span>
            <span className="wm-mono" style={{ fontSize: 9.5, color: "var(--ink-2)", letterSpacing: "0.22em" }}>
              MONITOR · OSINT
            </span>
          </span>
        </Link>

        <nav className="wm-nav" style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, color: "var(--ink-1)", flex: 1, justifyContent: "center" }}>
          {PRIMARY.map((p) => (
            <Link key={p.href} href={p.href} className="wm-nav-link wm-nav-pri">{p.label}</Link>
          ))}
          <NavGroup label="Intel" items={INTEL} />
          <NavGroup label="Tools" items={TOOLS} />
        </nav>

        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <CommandPalette />
          <span className="wm-pill wm-live-pill" style={{ fontSize: 9.5 }}>
            <span className="wm-dot" /> LIVE
          </span>
          <MobileMenu />
        </div>
      </div>
      <style>{`
        .wm-nav-link {
          color: var(--ink-1);
          transition: color 0.18s ease, background 0.18s ease;
          font-family: var(--font-sans);
          padding: 6px 10px;
          border-radius: 6px;
          display: inline-flex;
          align-items: center;
        }
        .wm-nav-link:hover { color: var(--ink-0); background: rgba(255,255,255,0.04); }
        .wm-nav-pri { font-weight: 500; }
        .wm-nav-group { position: relative; }
        .wm-nav-group-btn {
          background: none;
          border: none;
          color: inherit;
          cursor: pointer;
          padding: 6px 10px;
          border-radius: 6px;
          font: inherit;
          display: inline-flex;
          align-items: center;
          gap: 4px;
          transition: color 0.18s ease, background 0.18s ease;
        }
        .wm-nav-group-btn:hover { color: var(--ink-0); background: rgba(255,255,255,0.04); }
        .wm-nav-group:hover .wm-nav-dropdown { display: block; }
        .wm-nav-dropdown {
          display: none;
          position: absolute;
          top: calc(100% + 6px);
          left: 0;
          min-width: 260px;
          background: rgba(8,10,18,0.96);
          border: 1px solid var(--line);
          border-radius: 10px;
          padding: 6px;
          box-shadow: 0 24px 60px rgba(0,0,0,0.55), 0 0 0 1px rgba(255,255,255,0.02);
          backdrop-filter: blur(20px) saturate(140%);
        }
        .wm-nav-dropdown a {
          display: flex;
          flex-direction: column;
          padding: 9px 12px;
          border-radius: 6px;
          color: var(--ink-1);
          transition: background 0.15s ease, color 0.15s ease;
        }
        .wm-nav-dropdown a:hover { background: rgba(255,255,255,0.05); color: var(--ink-0); }
        .wm-nav-dropdown .wm-nav-label { font-size: 13px; font-weight: 500; }
        .wm-nav-dropdown .wm-nav-desc { font-size: 10.5px; color: var(--ink-3); margin-top: 2px; }
        @media (max-width: 880px) {
          .wm-nav { display: none !important; }
          .wm-live-pill { display: none !important; }
        }
      `}</style>
    </header>
  );
}

function NavGroup({ label, items }: { label: string; items: Array<{ href: string; label: string; desc?: string }> }) {
  return (
    <div className="wm-nav-group">
      <button className="wm-nav-group-btn" aria-haspopup="menu">
        {label}
        <span style={{ fontSize: 9, opacity: 0.6 }}>▾</span>
      </button>
      <div className="wm-nav-dropdown" role="menu">
        {items.map((it) => (
          <Link key={it.href} href={it.href} role="menuitem">
            <span className="wm-nav-label">{it.label}</span>
            {it.desc ? <span className="wm-nav-desc">{it.desc}</span> : null}
          </Link>
        ))}
      </div>
    </div>
  );
}
