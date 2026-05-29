"use client";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";

type Item = {
  label: string;
  href: string;
  group: "Navigate" | "Theater" | "Intel" | "Tools" | "Adversary" | "External";
  hint?: string;
};

const ITEMS: Item[] = [
  { group: "Navigate", label: "Dashboard",         href: "/dashboard",      hint: "Main view" },
  { group: "Navigate", label: "Defense overview",  href: "/defense",        hint: "Landing" },
  { group: "Navigate", label: "Map",               href: "/map",            hint: "Full-screen" },
  { group: "Theater",  label: "Theater · Ukraine",  href: "/theater/ukraine" },
  { group: "Theater",  label: "Theater · Taiwan",   href: "/theater/taiwan" },
  { group: "Theater",  label: "Theater · Red Sea",  href: "/theater/red-sea" },
  { group: "Theater",  label: "Theater · Korea",    href: "/theater/korea" },
  { group: "Theater",  label: "Theater · Levant",   href: "/theater/levant" },
  { group: "Intel",    label: "Sanctions delta",    href: "/sanctions",      hint: "OFAC · EU · UK · BIS" },
  { group: "Intel",    label: "Cyber threat intel", href: "/cyber",          hint: "KEV · NVD · breaches" },
  { group: "Intel",    label: "Defense contracts",  href: "/contracts",      hint: "SAM · TED · DSCA" },
  { group: "Intel",    label: "Maritime · ships",   href: "/ships",          hint: "AIS · chokepoints" },
  { group: "Intel",    label: "Military aviation",  href: "/military",       hint: "ADSB mil filter" },
  { group: "Intel",    label: "Signals",            href: "/signals",        hint: "Raw events" },
  { group: "Intel",    label: "Countries",          href: "/countries",      hint: "Per-country instability" },
  { group: "Tools",    label: "Watchlist",          href: "/watchlist",      hint: "Track entities" },
  { group: "Tools",    label: "Briefing — 24h",     href: "/briefing?since=24", hint: "Printable PDF" },
  { group: "Tools",    label: "Briefing — 12h",     href: "/briefing?since=12" },
  { group: "Tools",    label: "Briefing — 1 week",  href: "/briefing?since=168" },
  { group: "Tools",    label: "Sources catalog",    href: "/sources" },
  { group: "Tools",    label: "API docs",           href: "/api-docs" },
];

export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const [idx, setIdx] = useState(0);
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement | null>(null);

  const close = useCallback(() => { setOpen(false); setQ(""); setIdx(0); }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault(); setOpen((o) => !o);
      } else if (e.key === "Escape" && open) {
        close();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, close]);

  useEffect(() => { if (open) setTimeout(() => inputRef.current?.focus(), 30); }, [open]);

  const filtered = useMemo(() => {
    const ql = q.trim().toLowerCase();
    if (!ql) return ITEMS;
    return ITEMS.filter((i) => (i.label + " " + (i.hint ?? "") + " " + i.group).toLowerCase().includes(ql));
  }, [q]);

  // Reset highlighted index whenever the query changes. Acceptable setState-in-effect
  // because it strictly synchronises a derived UI cursor with the input value.
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { setIdx(0); }, [q]);

  const go = useCallback((it: Item) => { close(); router.push(it.href); }, [close, router]);

  const onInputKey = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "ArrowDown") { e.preventDefault(); setIdx((i) => Math.min(filtered.length - 1, i + 1)); }
    if (e.key === "ArrowUp") { e.preventDefault(); setIdx((i) => Math.max(0, i - 1)); }
    if (e.key === "Enter" && filtered[idx]) { e.preventDefault(); go(filtered[idx]); }
  };

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        title="Search / jump (⌘K)"
        className="wm-mono"
        style={{
          display: "inline-flex", alignItems: "center", gap: 8,
          padding: "5px 10px 5px 8px",
          fontSize: 10.5, letterSpacing: "0.16em",
          color: "var(--ink-2)",
          background: "rgba(255,255,255,0.04)",
          border: "1px solid var(--line)",
          borderRadius: 8,
          cursor: "pointer",
        }}
      >
        <span style={{ fontSize: 11 }}>⌕</span>
        <span>SEARCH</span>
        <kbd style={{
          fontSize: 9, padding: "1px 5px", border: "1px solid var(--line-strong)",
          borderRadius: 3, color: "var(--ink-3)", background: "rgba(255,255,255,0.03)",
        }}>⌘K</kbd>
      </button>

      {open ? (
        <div
          role="dialog"
          aria-modal="true"
          onMouseDown={(e) => { if (e.target === e.currentTarget) close(); }}
          style={{
            position: "fixed", inset: 0, zIndex: 1000,
            background: "rgba(2,4,10,0.65)",
            backdropFilter: "blur(6px)",
            display: "flex", alignItems: "flex-start", justifyContent: "center",
            paddingTop: "10vh",
          }}
        >
          <div style={{
            width: "min(620px, 92vw)",
            background: "rgba(10,12,20,0.96)",
            border: "1px solid var(--line)",
            borderRadius: 14,
            boxShadow: "0 40px 100px rgba(0,0,0,0.55)",
            overflow: "hidden",
          }}>
            <input
              ref={inputRef}
              value={q}
              onChange={(e) => setQ(e.target.value)}
              onKeyDown={onInputKey}
              placeholder="Jump to a page, theater, or tool…"
              style={{
                width: "100%", padding: "16px 18px", fontSize: 14,
                background: "transparent", color: "var(--ink-0)",
                border: "none", borderBottom: "1px solid var(--line)",
                outline: "none",
                fontFamily: "var(--font-sans)",
              }}
            />
            <div style={{ maxHeight: "60vh", overflow: "auto", padding: 6 }}>
              {filtered.length === 0 ? (
                <div className="wm-mono" style={{ padding: 16, textAlign: "center", color: "var(--ink-3)", fontSize: 11, letterSpacing: "0.18em" }}>
                  NO MATCHES
                </div>
              ) : (
                groupItems(filtered).map((g) => (
                  <div key={g.group}>
                    <div className="wm-mono" style={{ padding: "8px 10px 4px", fontSize: 9, color: "var(--ink-3)", letterSpacing: "0.22em" }}>
                      {g.group.toUpperCase()}
                    </div>
                    {g.items.map((it) => {
                      const flat = filtered.indexOf(it);
                      const isActive = flat === idx;
                      return (
                        <button
                          key={it.href}
                          onMouseEnter={() => setIdx(flat)}
                          onClick={() => go(it)}
                          style={{
                            display: "flex", justifyContent: "space-between", alignItems: "center",
                            width: "100%", textAlign: "left",
                            padding: "9px 12px", borderRadius: 8,
                            border: "none",
                            background: isActive ? "rgba(125,240,194,0.10)" : "transparent",
                            color: "var(--ink-0)", cursor: "pointer",
                          }}
                        >
                          <span>
                            <span style={{ fontSize: 13 }}>{it.label}</span>
                            {it.hint ? <span style={{ display: "block", fontSize: 10.5, color: "var(--ink-3)", marginTop: 2 }}>{it.hint}</span> : null}
                          </span>
                          {isActive ? <span className="wm-mono" style={{ fontSize: 9, color: "var(--accent)", letterSpacing: "0.18em" }}>↵</span> : null}
                        </button>
                      );
                    })}
                  </div>
                ))
              )}
            </div>
            <div className="wm-mono" style={{ padding: "8px 14px", fontSize: 9, color: "var(--ink-3)", letterSpacing: "0.18em", borderTop: "1px solid var(--line)", display: "flex", justifyContent: "space-between" }}>
              <span>↑↓ NAVIGATE · ↵ OPEN · ESC CLOSE</span>
              <span>{filtered.length} ITEMS</span>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}

function groupItems(items: Item[]): Array<{ group: Item["group"]; items: Item[] }> {
  const order: Item["group"][] = ["Navigate", "Theater", "Intel", "Tools", "Adversary", "External"];
  const map = new Map<Item["group"], Item[]>();
  for (const it of items) {
    if (!map.has(it.group)) map.set(it.group, []);
    map.get(it.group)!.push(it);
  }
  return order.filter((g) => map.has(g)).map((g) => ({ group: g, items: map.get(g)! }));
}
