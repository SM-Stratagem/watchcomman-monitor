"use client";
import { useEffect, useState } from "react";

// Deterministic, second-by-second running counters based on widely-cited annual rates.
// Numbers anchored to mid-2026 reference values.

type CounterDef = {
  key: string;
  label: string;
  base: number;          // Value at anchor time
  perSecond: number;     // Increment / decrement per second
  unit?: string;
  color?: string;
  decimals?: number;
};

// Anchor: 2026-01-01T00:00:00Z
const ANCHOR = Date.UTC(2026, 0, 1, 0, 0, 0);

const COUNTERS: CounterDef[] = [
  { key: "pop", label: "World population", base: 8_200_000_000, perSecond: 2.5, color: "var(--accent)" },
  { key: "births", label: "Births today", base: 0, perSecond: 4.3, color: "var(--accent)" },
  { key: "deaths", label: "Deaths today", base: 0, perSecond: 1.8, color: "var(--accent-hot)" },
  { key: "co2", label: "CO₂ emitted (tonnes / yr)", base: 37_000_000_000, perSecond: 1170, color: "var(--accent-warm)", unit: "t" },
  { key: "oil", label: "Crude oil consumed (bbl / yr)", base: 36_500_000_000, perSecond: 1157, color: "var(--accent-warm)", unit: "bbl" },
  { key: "internet", label: "Internet users", base: 5_400_000_000, perSecond: 3.0, color: "var(--accent-cool)" },
  { key: "smartphones", label: "Smartphones in use", base: 6_500_000_000, perSecond: 1.6, color: "var(--accent-cool)" },
  { key: "military", label: "Global military spend ($)", base: 2_400_000_000_000, perSecond: 76_103, color: "var(--accent-hot)", unit: "$" },
];

export function LiveCounters() {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 500);
    return () => clearInterval(t);
  }, []);

  // For "today" counters we reset at UTC midnight
  const startOfDay = new Date();
  startOfDay.setUTCHours(0, 0, 0, 0);
  const secondsToday = (now - startOfDay.getTime()) / 1000;
  const secondsSinceAnchor = Math.max(0, (now - ANCHOR) / 1000);

  return (
    <div style={{ border: "1px solid var(--line)", borderRadius: 10, background: "rgba(8,12,24,0.55)" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 12px", borderBottom: "1px solid var(--line)" }}>
        <div className="wm-mono" style={{ fontSize: 10, color: "var(--ink-1)", letterSpacing: "0.22em", textTransform: "uppercase", fontWeight: 600 }}>
          LIVE COUNTERS
        </div>
        <span className="wm-mono" style={{ fontSize: 9, color: "var(--accent)", letterSpacing: "0.2em" }}>RUNNING</span>
      </div>
      <ul style={{ listStyle: "none", margin: 0, padding: 0 }}>
        {COUNTERS.map((c) => {
          const elapsed = c.key === "births" || c.key === "deaths" ? secondsToday : secondsSinceAnchor;
          const v = c.base + elapsed * c.perSecond;
          const display = Math.round(v).toLocaleString();
          return (
            <li key={c.key} style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: 10, padding: "8px 12px", borderBottom: "1px solid rgba(255,255,255,0.03)" }}>
              <span style={{ fontSize: 11, color: "var(--ink-2)" }}>{c.label}</span>
              <span className="wm-mono" style={{ fontSize: 12, color: c.color ?? "var(--ink-0)", letterSpacing: "0.04em" }}>
                {c.unit === "$" ? "$" : ""}{display}{c.unit && c.unit !== "$" ? ` ${c.unit}` : ""}
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
