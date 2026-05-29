"use client";
import Link from "next/link";
import { useEffect, useState } from "react";

const SECTIONS: Array<{ title: string; items: Array<{ href: string; label: string; hint?: string }> }> = [
  {
    title: "Main",
    items: [
      { href: "/dashboard", label: "Dashboard" },
      { href: "/defense", label: "Defense overview" },
      { href: "/map", label: "Full-screen map" },
    ],
  },
  {
    title: "Theaters",
    items: [
      { href: "/theater/ukraine", label: "Ukraine" },
      { href: "/theater/taiwan", label: "Taiwan" },
      { href: "/theater/red-sea", label: "Red Sea" },
      { href: "/theater/korea", label: "Korea" },
      { href: "/theater/levant", label: "Levant" },
    ],
  },
  {
    title: "Intel",
    items: [
      { href: "/sanctions", label: "Sanctions delta" },
      { href: "/cyber", label: "Cyber threat intel" },
      { href: "/contracts", label: "Defense contracts" },
      { href: "/ships", label: "Maritime" },
      { href: "/military", label: "Military aviation" },
      { href: "/timeline", label: "Time machine" },
      { href: "/signals", label: "Signals" },
      { href: "/countries", label: "Countries" },
      { href: "/source-health", label: "Source health" },
    ],
  },
  {
    title: "Tools",
    items: [
      { href: "/watchlist", label: "Watchlist" },
      { href: "/briefing", label: "Briefing (HTML)" },
      { href: "/globe", label: "3D Globe" },
      { href: "/account", label: "My account" },
      { href: "/sources", label: "Sources" },
      { href: "/api-docs", label: "API" },
    ],
  },
];

export function MobileMenu() {
  const [open, setOpen] = useState(false);
  useEffect(() => {
    if (open) document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        aria-label="Open menu"
        className="wm-mobile-menu-btn"
        style={{
          background: "rgba(255,255,255,0.04)",
          border: "1px solid var(--line)",
          color: "var(--ink-0)",
          width: 34, height: 34, borderRadius: 8, cursor: "pointer",
          fontSize: 18, padding: 0, display: "none",
        }}
      >
        ☰
      </button>
      {open ? (
        <div
          onMouseDown={(e) => { if (e.target === e.currentTarget) setOpen(false); }}
          style={{
            position: "fixed", inset: 0, zIndex: 1000,
            background: "rgba(2,4,10,0.72)",
            backdropFilter: "blur(6px)",
            display: "flex", justifyContent: "flex-end",
          }}
        >
          <aside style={{
            width: "min(340px, 88vw)",
            height: "100%",
            background: "rgba(10,12,20,0.98)",
            borderLeft: "1px solid var(--line)",
            padding: "18px 18px 32px",
            overflow: "auto",
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <span className="wm-mono" style={{ fontSize: 10, color: "var(--ink-3)", letterSpacing: "0.22em" }}>NAVIGATE</span>
              <button onClick={() => setOpen(false)} aria-label="Close menu" style={{ background: "transparent", border: "none", color: "var(--ink-1)", fontSize: 20, cursor: "pointer", padding: 4 }}>✕</button>
            </div>
            {SECTIONS.map((s) => (
              <div key={s.title} style={{ marginBottom: 16 }}>
                <div className="wm-mono" style={{ fontSize: 9, color: "var(--accent)", letterSpacing: "0.22em", marginBottom: 6 }}>{s.title.toUpperCase()}</div>
                <ul style={{ listStyle: "none", margin: 0, padding: 0 }}>
                  {s.items.map((it) => (
                    <li key={it.href}>
                      <Link href={it.href} onClick={() => setOpen(false)} style={{ display: "block", padding: "8px 4px", color: "var(--ink-0)", fontSize: 14, borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                        {it.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </aside>
        </div>
      ) : null}
      <style>{`
        @media (max-width: 880px) {
          .wm-mobile-menu-btn { display: inline-flex !important; align-items: center; justify-content: center; }
        }
      `}</style>
    </>
  );
}
