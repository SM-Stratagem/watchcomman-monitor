"use client";

import { useMemo, useState } from "react";
import dynamic from "next/dynamic";
import type { SignalRow, StatRow } from "@/lib/dashboard";
import { severityColor, slugify } from "@/lib/format";

const Globe = dynamic(() => import("./Globe"), {
  ssr: false,
  loading: () => (
    <div style={{
      height: "100%", width: "100%", display: "flex",
      alignItems: "center", justifyContent: "center",
      color: "var(--ink-3)", fontFamily: "var(--font-mono)",
      fontSize: 11, letterSpacing: "0.2em",
    }}>LOADING ATLAS…</div>
  ),
});

type Props = {
  signals: SignalRow[];
  regions: StatRow[];
  categories?: StatRow[];
};

const SEVERITIES = ["critical", "high", "elevated", "moderate", "low"] as const;

export function GlobeSection({ signals, regions, categories = [] }: Props) {
  const [hovered, setHovered] = useState<{ id: string | number; label: string; severity: string } | null>(null);
  const [selected, setSelected] = useState<SignalRow | null>(null);
  const [sevFilter, setSevFilter] = useState<string | null>(null);
  const [catFilter, setCatFilter] = useState<string | null>(null);

  const filtered = useMemo(() => signals.filter((s) => {
    if (s.latitude == null || s.longitude == null) return false;
    if (sevFilter && s.severity !== sevFilter) return false;
    if (catFilter && s.category !== catFilter) return false;
    return true;
  }), [signals, sevFilter, catFilter]);

  const points = useMemo(
    () => filtered.map((s) => ({
      id: s.id,
      lat: s.latitude as number,
      lng: s.longitude as number,
      severity: s.severity,
      label: `${s.title} · ${s.country ?? s.region ?? ""}`.trim(),
    })),
    [filtered],
  );

  const onGlobeClick = (p: { id: string | number }) => {
    const m = filtered.find((s) => s.id === p.id);
    if (m) setSelected(m);
  };

  const topRegions = useMemo(() =>
    [...regions].sort((a, b) => b.severityScore - a.severityScore).slice(0, 6),
    [regions],
  );

  const cats = useMemo(() => {
    if (categories.length) return categories.slice(0, 6);
    const m = new Map<string, number>();
    for (const s of signals) m.set(s.category, (m.get(s.category) ?? 0) + 1);
    return Array.from(m.entries()).map(([k, v]) => ({ key: k, activeSignals: v, severityScore: 0 }))
      .sort((a, b) => b.activeSignals - a.activeSignals).slice(0, 6);
  }, [categories, signals]);

  return (
    <section id="globe" style={{ position: "relative", margin: "32px 0 48px" }}>
      <div className="wm-shell" style={{
        display: "grid",
        gridTemplateColumns: "minmax(0, 1.6fr) minmax(280px, 1fr)",
        gap: 28, alignItems: "stretch",
      }}>
        <div className="wm-glass" style={{ position: "relative", minHeight: 560, height: 640, overflow: "hidden", padding: 0 }}>
          <div style={{ position: "absolute", inset: 0 }}>
            <Globe
              points={points}
              onHover={(p) => setHovered(p ? { id: p.id, label: p.label, severity: p.severity } : null)}
              onClick={onGlobeClick}
            />
          </div>
          <div style={{
            position: "absolute", top: 18, left: 22, right: 22,
            display: "flex", justifyContent: "space-between", alignItems: "center",
            pointerEvents: "none", zIndex: 2,
          }}>
            <div className="wm-pill"><span className="wm-dot" /> LIVE ATLAS</div>
            <div className="wm-mono" style={{ fontSize: 10, color: "var(--ink-3)", letterSpacing: "0.22em" }}>
              {points.length} OF {signals.length} VISIBLE
            </div>
          </div>

          {/* Filter chips overlay */}
          <div style={{
            position: "absolute", top: 56, left: 22, right: 22,
            display: "flex", flexWrap: "wrap", gap: 6, zIndex: 3,
          }}>
            {[null, ...SEVERITIES].map((s, i) => (
              <button
                key={s ?? `sev-all-${i}`} onClick={() => setSevFilter(s)} className="wm-mono"
                style={{
                  padding: "4px 9px", borderRadius: 999, cursor: "pointer",
                  border: `1px solid ${sevFilter === s ? severityColor(s ?? "low") : "rgba(255,255,255,0.12)"}`,
                  background: sevFilter === s ? "rgba(255,255,255,0.06)" : "rgba(8,12,24,0.6)",
                  color: sevFilter === s ? severityColor(s ?? "low") : "var(--ink-1)",
                  fontSize: 9, letterSpacing: "0.18em", textTransform: "uppercase",
                  backdropFilter: "blur(6px)",
                }}
              >{s ?? "All"}</button>
            ))}
          </div>

          {/* Selected detail card */}
          {selected ? (
            <div className="wm-glass" style={{
              position: "absolute", left: 18, bottom: 18, maxWidth: 380, padding: 14,
              borderRadius: 12, zIndex: 4,
            }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 10 }}>
                <div className="wm-mono" style={{
                  fontSize: 10, color: severityColor(selected.severity),
                  letterSpacing: "0.2em", textTransform: "uppercase",
                }}>
                  ● {selected.severity} · {selected.category}
                </div>
                <button onClick={() => setSelected(null)} style={{
                  background: "transparent", border: "none", color: "var(--ink-3)",
                  fontSize: 16, cursor: "pointer", lineHeight: 1, padding: 0,
                }} aria-label="Close">×</button>
              </div>
              <div style={{ marginTop: 6, color: "var(--ink-0)", fontSize: 13, lineHeight: 1.4 }}>
                {selected.sourceUrl ? <a href={selected.sourceUrl} target="_blank" rel="noopener noreferrer">{selected.title}</a> : selected.title}
              </div>
              {selected.summary ? <div style={{ marginTop: 6, color: "var(--ink-2)", fontSize: 12, lineHeight: 1.5 }}>{selected.summary}</div> : null}
              <div style={{ marginTop: 10, display: "flex", flexWrap: "wrap", gap: 8 }}>
                {selected.country ? (
                  <a href={`/country/${slugify(selected.country)}`} className="wm-mono" style={{ fontSize: 10, padding: "3px 8px", borderRadius: 999, border: "1px solid var(--line-strong)", color: "var(--ink-1)" }}>
                    {selected.country} ↗
                  </a>
                ) : null}
                <a href={`/disease/${selected.category}`} className="wm-mono" style={{ fontSize: 10, padding: "3px 8px", borderRadius: 999, border: "1px solid var(--line-strong)", color: "var(--ink-1)" }}>
                  {selected.category} ↗
                </a>
              </div>
            </div>
          ) : null}
        </div>

        <aside className="wm-glass" style={{ padding: "26px 26px 22px", display: "flex", flexDirection: "column", gap: 16 }}>
          <div>
            <div className="wm-eyebrow">Atlas overview</div>
            <h3 style={{
              margin: "8px 0 0", fontFamily: "var(--font-display)",
              fontWeight: 300, fontSize: 22, lineHeight: 1.15, letterSpacing: "-0.01em",
            }}>
              {hovered ? hovered.label : "Top regions by composite severity"}
            </h3>
            {hovered ? (
              <div className="wm-mono" style={{
                marginTop: 8, fontSize: 10,
                color: severityColor(hovered.severity),
                letterSpacing: "0.22em", textTransform: "uppercase",
              }}>Severity · {hovered.severity}</div>
            ) : null}
          </div>

          <hr className="wm-divider" />

          <ol style={{ listStyle: "none", padding: 0, margin: 0, display: "grid", gap: 12 }}>
            {topRegions.map((r, i) => {
              const max = topRegions[0]?.severityScore ?? 1;
              const pct = Math.max(8, Math.round((r.severityScore / Math.max(max, 1)) * 100));
              return (
                <li key={r.key}>
                  <a href={`/region/${slugify(r.key)}`} style={{ display: "block" }}>
                    <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 12 }}>
                      <span style={{ fontSize: 13, color: "var(--ink-0)" }}>
                        <span className="wm-mono" style={{ color: "var(--ink-3)", marginRight: 10, fontSize: 11 }}>
                          {String(i + 1).padStart(2, "0")}
                        </span>
                        {r.key}
                      </span>
                      <span className="wm-mono" style={{ fontSize: 11, color: "var(--ink-2)" }}>
                        {r.activeSignals} · {r.severityScore.toFixed(1)}
                      </span>
                    </div>
                    <div style={{ marginTop: 6, height: 4, borderRadius: 4, background: "rgba(255,255,255,0.06)", overflow: "hidden" }}>
                      <div style={{
                        width: `${pct}%`, height: "100%",
                        background: "linear-gradient(90deg, var(--accent-cool), var(--accent), var(--accent-warm))",
                        boxShadow: "0 0 10px rgba(125,240,194,0.4)",
                      }} />
                    </div>
                  </a>
                </li>
              );
            })}
          </ol>

          <hr className="wm-divider" />

          <div>
            <div className="wm-eyebrow">By category</div>
            <div style={{ marginTop: 10, display: "flex", flexWrap: "wrap", gap: 6 }}>
              {cats.map((c) => (
                <button
                  key={c.key} onClick={() => setCatFilter(catFilter === c.key ? null : c.key)} className="wm-mono"
                  style={{
                    padding: "4px 10px", borderRadius: 999, cursor: "pointer",
                    border: `1px solid ${catFilter === c.key ? "var(--accent-cool)" : "var(--line-strong)"}`,
                    background: catFilter === c.key ? "rgba(122,184,255,0.08)" : "transparent",
                    color: catFilter === c.key ? "var(--accent-cool)" : "var(--ink-1)",
                    fontSize: 10, letterSpacing: "0.16em", textTransform: "uppercase",
                  }}
                >{c.key} · {c.activeSignals}</button>
              ))}
            </div>
            <div className="wm-mono" style={{ fontSize: 10, color: "var(--ink-3)", letterSpacing: "0.2em", marginTop: 12 }}>
              Tap a marker → details · Tap category → filter
            </div>
          </div>
        </aside>
      </div>
      <style>{`
        @media (max-width: 980px) {
          #globe .wm-shell {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </section>
  );
}
