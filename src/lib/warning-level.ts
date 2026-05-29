// Composite Strategic Warning Indicator.
// 5-step ladder (5 = stable, 1 = critical), inspired by DEFCON / alert posture.
// Inputs are *current* state; level is recomputed every page load.

import type { AiBrief } from "./ai";
import type { SignalRow } from "./dashboard";
import type { SanctionsDelta } from "./sanctions-diff";
import type { CyberPanelData } from "./cyber";
import type { ChokepointStatus } from "./maritime";

export type WarningLevel = {
  level: 1 | 2 | 3 | 4 | 5;
  label: string;
  description: string;
  score: number;       // 0..100 (higher = worse)
  drivers: string[];   // human-readable list of what's pushing it
  color: string;
};

const LEVELS: Record<number, { label: string; description: string; color: string }> = {
  5: { label: "STABLE",     description: "Routine global posture",                            color: "var(--accent)" },
  4: { label: "GUARDED",    description: "Localized tensions, no systemic risk",              color: "var(--accent-cool)" },
  3: { label: "WATCH",      description: "Multiple active flashpoints",                       color: "var(--accent-warm)" },
  2: { label: "ELEVATED",   description: "Crisis active; cross-theater spillover plausible",  color: "#ff9266" },
  1: { label: "CRITICAL",   description: "Acute crisis, sustained escalation",                color: "var(--accent-hot)" },
};

export function computeWarningLevel(input: {
  brief: AiBrief;
  signals: SignalRow[];
  sanctions: SanctionsDelta | null;
  cyber: CyberPanelData | null;
  chokepoints: ChokepointStatus[];
}): WarningLevel {
  const { brief, signals, sanctions, cyber, chokepoints } = input;
  const drivers: string[] = [];
  let score = 0;

  // High/critical signal density
  const highSeverity = signals.filter((s) => s.severity === "high" || s.severity === "critical").length;
  const sigPct = signals.length > 0 ? highSeverity / signals.length : 0;
  if (highSeverity >= 25 || sigPct >= 0.35) { score += 30; drivers.push(`${highSeverity} high/critical signals`); }
  else if (highSeverity >= 12) { score += 18; drivers.push(`${highSeverity} high-severity signals`); }
  else if (highSeverity >= 5) { score += 10; }

  // AI brief: theaters at HOT or ELEVATED
  const hot = brief.theaters.filter((t) => t.level === "HOT").length;
  const elev = brief.theaters.filter((t) => t.level === "ELEVATED").length;
  if (hot >= 2) { score += 30; drivers.push(`${hot} theaters HOT`); }
  else if (hot === 1) { score += 18; drivers.push("1 theater HOT"); }
  if (elev >= 2) score += 8;

  // Chokepoints
  const critChokes = chokepoints.filter((c) => c.risk === "critical").length;
  const highChokes = chokepoints.filter((c) => c.risk === "high").length;
  if (critChokes > 0) { score += 18; drivers.push(`${critChokes} chokepoint critical`); }
  else if (highChokes >= 2) { score += 10; drivers.push(`${highChokes} chokepoints high-risk`); }

  // Sanctions velocity
  const sanctionsToday = sanctions ? Object.values(sanctions.totals).reduce((a, t) => a + t.added24h, 0) : 0;
  if (sanctionsToday >= 50) { score += 8; drivers.push(`${sanctionsToday} new designations / 24h`); }
  else if (sanctionsToday >= 15) { score += 4; }

  // Cyber crisis density
  const crit7d = cyber?.totals.critical7d ?? 0;
  if (crit7d >= 15) { score += 8; drivers.push(`${crit7d} critical CVEs / 7d`); }
  else if (crit7d >= 5) { score += 4; }

  score = Math.min(100, score);

  let level: 1 | 2 | 3 | 4 | 5;
  if (score >= 70) level = 1;
  else if (score >= 50) level = 2;
  else if (score >= 30) level = 3;
  else if (score >= 12) level = 4;
  else level = 5;

  if (drivers.length === 0) drivers.push("No major escalation factors");

  return {
    level,
    label: LEVELS[level].label,
    description: LEVELS[level].description,
    score,
    drivers,
    color: LEVELS[level].color,
  };
}
