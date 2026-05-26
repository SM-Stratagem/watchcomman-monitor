"use client";
import { useEffect, useMemo, useState } from "react";
import type { Source } from "@/lib/sources";

const STORAGE = "wm:enabled-sources";

export function SourceManager({ sources, regions }: { sources: Source[]; regions: Array<{ slug: string; label: string }> }) {
  const [enabled, setEnabled] = useState<Set<string>>(() => new Set());
  const [region, setRegion] = useState<string>("all");
  const [query, setQuery] = useState("");
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const raw = localStorage.getItem(STORAGE);
      if (raw) {
        const arr = JSON.parse(raw) as string[];
        setEnabled(new Set(arr));
      } else {
        setEnabled(new Set(sources.filter((s) => s.defaultEnabled).map((s) => s.slug)));
      }
    } catch {}
    setLoaded(true);
  }, [sources]);

  useEffect(() => {
    if (!loaded) return;
    try { localStorage.setItem(STORAGE, JSON.stringify(Array.from(enabled))); } catch {}
  }, [enabled, loaded]);

  const filtered = useMemo(() => sources.filter((s) => {
    if (region !== "all" && s.region !== region) return false;
    if (query) {
      const q = query.toLowerCase();
      if (!s.name.toLowerCase().includes(q) && !s.slug.includes(q)) return false;
    }
    return true;
  }), [sources, region, query]);

  const toggle = (slug: string) => {
    setEnabled((s) => {
      const n = new Set(s);
      if (n.has(slug)) n.delete(slug); else n.add(slug);
      return n;
    });
  };
  const enableAll = () => setEnabled(new Set(filtered.map((s) => s.slug)));
  const disableAll = () => {
    setEnabled((s) => {
      const n = new Set(s);
      for (const f of filtered) n.delete(f.slug);
      return n;
    });
  };

  return (
    <div className="wm-glass" style={{ padding: 0, borderRadius: 14, overflow: "hidden" }}>
      <div style={{ padding: "14px 18px", borderBottom: "1px solid var(--line)", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 10 }}>
        <div>
          <div className="wm-mono" style={{ fontSize: 11, letterSpacing: "0.2em", color: "var(--ink-2)" }}>SOURCES</div>
          <div style={{ marginTop: 4, fontSize: 13, color: "var(--ink-0)" }}>
            <span className="wm-mono" style={{ color: "var(--accent)" }}>{enabled.size}</span>
            <span className="wm-mono" style={{ color: "var(--ink-3)" }}> / {sources.length} enabled</span>
          </div>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={enableAll} className="wm-mono" style={{
            padding: "6px 14px", borderRadius: 999, border: "1px solid var(--line-strong)",
            background: "rgba(125,240,194,0.08)", color: "var(--accent)",
            cursor: "pointer", fontSize: 10, letterSpacing: "0.18em",
          }}>SELECT ALL</button>
          <button onClick={disableAll} className="wm-mono" style={{
            padding: "6px 14px", borderRadius: 999, border: "1px solid var(--line-strong)",
            background: "transparent", color: "var(--ink-2)",
            cursor: "pointer", fontSize: 10, letterSpacing: "0.18em",
          }}>SELECT NONE</button>
        </div>
      </div>

      <div style={{ padding: "12px 18px", borderBottom: "1px solid var(--line)", display: "flex", gap: 8, flexWrap: "wrap" }}>
        {[{ slug: "all", label: "All" }, ...regions].map((r) => (
          <button
            key={r.slug}
            onClick={() => setRegion(r.slug)}
            className="wm-mono"
            style={{
              padding: "5px 12px", borderRadius: 999, cursor: "pointer",
              border: `1px solid ${region === r.slug ? "var(--accent)" : "var(--line-strong)"}`,
              background: region === r.slug ? "rgba(125,240,194,0.08)" : "transparent",
              color: region === r.slug ? "var(--accent)" : "var(--ink-1)",
              fontSize: 10, letterSpacing: "0.18em", textTransform: "uppercase",
            }}
          >
            {r.label}
          </button>
        ))}
      </div>

      <div style={{ padding: "12px 18px", borderBottom: "1px solid var(--line)" }}>
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Filter sources…"
          style={{
            width: "100%", padding: "8px 12px",
            background: "rgba(0,0,0,0.3)", border: "1px solid var(--line-strong)",
            borderRadius: 8, color: "var(--ink-0)", fontSize: 13,
          }}
        />
      </div>

      <div style={{ padding: 14, maxHeight: 600, overflow: "auto" }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 6 }}>
          {filtered.map((s) => {
            const on = enabled.has(s.slug);
            const dead = !s.rss;
            return (
              <label key={s.slug} style={{
                display: "flex", alignItems: "center", gap: 8,
                padding: "8px 10px", borderRadius: 6,
                border: `1px solid ${on ? "var(--accent)" : "var(--line)"}`,
                background: on ? "rgba(125,240,194,0.05)" : "transparent",
                cursor: dead ? "not-allowed" : "pointer",
                opacity: dead ? 0.5 : 1,
              }}>
                <input type="checkbox" checked={on} disabled={dead} onChange={() => toggle(s.slug)} style={{ accentColor: "var(--accent)" }} />
                <span className="wm-mono" style={{ fontSize: 11, color: on ? "var(--accent)" : "var(--ink-1)", letterSpacing: "0.06em" }}>
                  {s.name}
                </span>
                {dead ? (
                  <span className="wm-mono" style={{ marginLeft: "auto", fontSize: 8, color: "var(--ink-3)", letterSpacing: "0.16em" }}>NO RSS</span>
                ) : null}
              </label>
            );
          })}
        </div>
      </div>
    </div>
  );
}
