"use client";
import { useMemo, useState } from "react";
import type { SignalRow } from "@/lib/dashboard";
import { severityColor } from "@/lib/format";

const W = 1000;
const H = 500;

function project(lat: number, lng: number): [number, number] {
  const x = ((lng + 180) / 360) * W;
  const y = ((90 - lat) / 180) * H;
  return [x, y];
}

const SEV_R: Record<string, number> = {
  critical: 7, high: 5.5, elevated: 4.2, moderate: 3.4, low: 2.6,
};

export function WorldMap({ signals }: { signals: SignalRow[] }) {
  const [hover, setHover] = useState<SignalRow | null>(null);
  const [sevFilter, setSevFilter] = useState<string | null>(null);
  const [catFilter, setCatFilter] = useState<string | null>(null);

  const cats = useMemo(() => Array.from(new Set(signals.map((s) => s.category))).sort(), [signals]);
  const sevs = ["critical", "high", "elevated", "moderate", "low"];

  const filtered = signals.filter((s) => {
    if (s.latitude == null || s.longitude == null) return false;
    if (sevFilter && s.severity !== sevFilter) return false;
    if (catFilter && s.category !== catFilter) return false;
    return true;
  });

  return (
    <div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 14 }}>
        {[null, ...sevs].map((s, i) => (
          <button
            key={s ?? `all-sev-${i}`}
            onClick={() => setSevFilter(s)}
            className="wm-mono"
            style={{
              padding: "5px 10px", borderRadius: 999,
              border: `1px solid ${sevFilter === s ? "var(--accent)" : "var(--line-strong)"}`,
              background: sevFilter === s ? "rgba(125,240,194,0.08)" : "transparent",
              color: sevFilter === s ? "var(--accent)" : "var(--ink-1)",
              fontSize: 10, letterSpacing: "0.18em", textTransform: "uppercase", cursor: "pointer",
            }}
          >
            {s ?? "All sev"}
          </button>
        ))}
        <span style={{ width: 14 }} />
        {[null, ...cats].map((c, i) => (
          <button
            key={c ?? `all-cat-${i}`}
            onClick={() => setCatFilter(c)}
            className="wm-mono"
            style={{
              padding: "5px 10px", borderRadius: 999,
              border: `1px solid ${catFilter === c ? "var(--accent-cool)" : "var(--line-strong)"}`,
              background: catFilter === c ? "rgba(122,184,255,0.08)" : "transparent",
              color: catFilter === c ? "var(--accent-cool)" : "var(--ink-1)",
              fontSize: 10, letterSpacing: "0.18em", textTransform: "uppercase", cursor: "pointer",
            }}
          >
            {c ?? "All cat"}
          </button>
        ))}
      </div>

      <div style={{ position: "relative", borderRadius: 18, overflow: "hidden", border: "1px solid var(--line)", background: "linear-gradient(180deg, #060914, #03050b)" }}>
        <svg viewBox={`0 0 ${W} ${H}`} width="100%" style={{ display: "block" }}>
          {/* Latitude lines */}
          {[15, 30, 45, 60, 75].map((g) => (
            <g key={g} stroke="rgba(255,255,255,0.04)" strokeWidth="0.5">
              <line x1="0" x2={W} y1={(90 - g) / 180 * H} y2={(90 - g) / 180 * H} />
              <line x1="0" x2={W} y1={(90 + g) / 180 * H} y2={(90 + g) / 180 * H} />
            </g>
          ))}
          {/* Longitude lines */}
          {[-150, -120, -90, -60, -30, 0, 30, 60, 90, 120, 150].map((g) => (
            <line key={g} stroke="rgba(255,255,255,0.04)" strokeWidth="0.5"
              x1={((g + 180) / 360) * W} x2={((g + 180) / 360) * W} y1="0" y2={H} />
          ))}
          {/* Equator + prime meridian */}
          <line x1="0" x2={W} y1={H / 2} y2={H / 2} stroke="rgba(255,255,255,0.08)" strokeWidth="0.8" />
          <line x1={W / 2} x2={W / 2} y1="0" y2={H} stroke="rgba(255,255,255,0.08)" strokeWidth="0.8" />

          {/* Markers */}
          {filtered.map((s) => {
            const [x, y] = project(s.latitude!, s.longitude!);
            const r = SEV_R[s.severity] ?? 3;
            const c = severityColor(s.severity);
            return (
              <g key={s.id} onMouseEnter={() => setHover(s)} onMouseLeave={() => setHover((h) => (h?.id === s.id ? null : h))} style={{ cursor: "pointer" }}>
                <circle cx={x} cy={y} r={r * 2.4} fill={c} opacity="0.10" />
                <circle cx={x} cy={y} r={r * 1.4} fill={c} opacity="0.22" />
                <circle cx={x} cy={y} r={r} fill={c} stroke="#fff" strokeOpacity="0.7" strokeWidth="0.6">
                  <title>{`${s.severity.toUpperCase()} · ${s.title}${s.country ? ` (${s.country})` : ""}`}</title>
                </circle>
              </g>
            );
          })}
        </svg>
        {hover ? (
          <div className="wm-glass" style={{
            position: "absolute", left: 18, bottom: 18, maxWidth: 380, padding: 14,
            borderRadius: 12, fontSize: 12,
          }}>
            <div className="wm-mono" style={{ fontSize: 10, color: severityColor(hover.severity), letterSpacing: "0.2em", textTransform: "uppercase" }}>
              ● {hover.severity} · {hover.category}{hover.subcategory ? ` · ${hover.subcategory}` : ""}
            </div>
            <div style={{ marginTop: 6, color: "var(--ink-0)", fontSize: 13, lineHeight: 1.4 }}>
              {hover.sourceUrl ? <a href={hover.sourceUrl} target="_blank" rel="noopener noreferrer">{hover.title}</a> : hover.title}
            </div>
            {hover.summary ? <div style={{ marginTop: 4, color: "var(--ink-2)", fontSize: 12 }}>{hover.summary}</div> : null}
            <div className="wm-mono" style={{ marginTop: 8, fontSize: 10, color: "var(--ink-3)", letterSpacing: "0.2em" }}>
              {hover.country ?? hover.region ?? "—"} · {new Date(hover.occurredAt).toLocaleString()}
            </div>
          </div>
        ) : null}
      </div>

      <div style={{ marginTop: 10, fontSize: 11, color: "var(--ink-3)", display: "flex", justifyContent: "space-between" }}>
        <span className="wm-mono" style={{ letterSpacing: "0.2em" }}>{filtered.length} of {signals.length} signals · equirectangular projection</span>
      </div>
    </div>
  );
}
