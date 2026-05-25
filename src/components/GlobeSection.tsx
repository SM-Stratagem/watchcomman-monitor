"use client";

import { useMemo, useState } from "react";
import dynamic from "next/dynamic";
import type { SignalRow, RegionRow } from "@/lib/dashboard";

const Globe = dynamic(() => import("./Globe"), {
  ssr: false,
  loading: () => (
    <div
      style={{
        height: "100%",
        width: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        color: "var(--ink-3)",
        fontFamily: "var(--font-mono)",
        fontSize: 11,
        letterSpacing: "0.2em",
      }}
    >
      LOADING ATLAS…
    </div>
  ),
});

type Props = {
  signals: SignalRow[];
  regions: RegionRow[];
};

const SEV_BADGE: Record<string, string> = {
  low: "var(--accent)",
  moderate: "var(--accent-cool)",
  elevated: "var(--accent-warm)",
  high: "#ff8a5b",
  critical: "var(--accent-hot)",
};

export function GlobeSection({ signals, regions }: Props) {
  const [hovered, setHovered] = useState<{ id: string | number; label: string; severity: string } | null>(null);

  const points = useMemo(
    () =>
      signals
        .filter((s) => s.latitude != null && s.longitude != null)
        .map((s) => ({
          id: s.id,
          lat: s.latitude as number,
          lng: s.longitude as number,
          severity: s.severity,
          label: `${s.title} · ${s.country ?? s.region ?? ""}`.trim(),
        })),
    [signals],
  );

  const topRegions = useMemo(
    () =>
      [...regions]
        .sort((a, b) => b.severityScore - a.severityScore)
        .slice(0, 6),
    [regions],
  );

  return (
    <section
      id="globe"
      style={{
        position: "relative",
        margin: "32px 0 48px",
      }}
    >
      <div
        className="wm-shell"
        style={{
          display: "grid",
          gridTemplateColumns: "minmax(0, 1.6fr) minmax(280px, 1fr)",
          gap: 28,
          alignItems: "stretch",
        }}
      >
        <div
          className="wm-glass"
          style={{
            position: "relative",
            minHeight: 560,
            height: 620,
            overflow: "hidden",
            padding: 0,
          }}
        >
          <div
            style={{
              position: "absolute",
              inset: 0,
              padding: 0,
            }}
          >
            <Globe points={points} onHover={(p) => setHovered(p ? { id: p.id, label: p.label, severity: p.severity } : null)} />
          </div>
          <div
            style={{
              position: "absolute",
              top: 18,
              left: 22,
              right: 22,
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              pointerEvents: "none",
              zIndex: 2,
            }}
          >
            <div className="wm-pill">
              <span className="wm-dot" /> LIVE ATLAS
            </div>
            <div
              className="wm-mono"
              style={{ fontSize: 10, color: "var(--ink-3)", letterSpacing: "0.22em" }}
            >
              {points.length} SIGNALS · {regions.length} REGIONS
            </div>
          </div>
          <div
            style={{
              position: "absolute",
              bottom: 18,
              right: 22,
              display: "flex",
              gap: 12,
              pointerEvents: "none",
              zIndex: 2,
            }}
          >
            {(["low", "elevated", "high", "critical"] as const).map((s) => (
              <span
                key={s}
                className="wm-mono"
                style={{
                  display: "inline-flex",
                  gap: 6,
                  alignItems: "center",
                  fontSize: 9,
                  letterSpacing: "0.2em",
                  color: "var(--ink-2)",
                  textTransform: "uppercase",
                }}
              >
                <span
                  style={{
                    width: 6,
                    height: 6,
                    borderRadius: 50,
                    background: SEV_BADGE[s],
                    boxShadow: `0 0 8px ${SEV_BADGE[s]}`,
                  }}
                />
                {s}
              </span>
            ))}
          </div>
        </div>

        <aside
          className="wm-glass"
          style={{
            padding: "26px 26px 22px",
            display: "flex",
            flexDirection: "column",
            gap: 18,
          }}
        >
          <div>
            <div className="wm-eyebrow">Atlas overview</div>
            <h3
              style={{
                margin: "8px 0 0",
                fontFamily: "var(--font-display)",
                fontWeight: 300,
                fontSize: 24,
                lineHeight: 1.1,
                letterSpacing: "-0.01em",
              }}
            >
              {hovered ? hovered.label : "Top regions by composite severity"}
            </h3>
            {hovered ? (
              <div
                className="wm-mono"
                style={{
                  marginTop: 8,
                  fontSize: 10,
                  color: SEV_BADGE[hovered.severity] ?? SEV_BADGE.low,
                  letterSpacing: "0.22em",
                  textTransform: "uppercase",
                }}
              >
                Severity · {hovered.severity}
              </div>
            ) : null}
          </div>
          <hr className="wm-divider" />
          <ol style={{ listStyle: "none", padding: 0, margin: 0, display: "grid", gap: 14 }}>
            {topRegions.map((r, i) => {
              const max = topRegions[0]?.severityScore ?? 1;
              const pct = Math.max(8, Math.round((r.severityScore / Math.max(max, 1)) * 100));
              return (
                <li key={r.region}>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "baseline",
                      justifyContent: "space-between",
                      gap: 12,
                    }}
                  >
                    <span style={{ fontSize: 13, color: "var(--ink-0)" }}>
                      <span
                        className="wm-mono"
                        style={{ color: "var(--ink-3)", marginRight: 10, fontSize: 11 }}
                      >
                        {String(i + 1).padStart(2, "0")}
                      </span>
                      {r.region}
                    </span>
                    <span
                      className="wm-mono"
                      style={{ fontSize: 11, color: "var(--ink-2)" }}
                    >
                      {r.activeSignals} · {r.severityScore.toFixed(1)}
                    </span>
                  </div>
                  <div
                    style={{
                      marginTop: 6,
                      height: 4,
                      borderRadius: 4,
                      background: "rgba(255,255,255,0.06)",
                      overflow: "hidden",
                    }}
                  >
                    <div
                      style={{
                        width: `${pct}%`,
                        height: "100%",
                        background:
                          "linear-gradient(90deg, var(--accent-cool), var(--accent), var(--accent-warm))",
                        boxShadow: "0 0 10px rgba(125,240,194,0.4)",
                      }}
                    />
                  </div>
                </li>
              );
            })}
          </ol>
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
