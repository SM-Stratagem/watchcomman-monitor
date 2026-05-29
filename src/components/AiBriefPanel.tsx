import type { AiBrief } from "@/lib/ai";
import { severityColor } from "@/lib/format";

const LEVEL_COLOR: Record<string, string> = {
  HOT: severityColor("critical"),
  ELEVATED: severityColor("elevated"),
  WATCH: severityColor("moderate"),
  STABLE: severityColor("low"),
};

export function AiBriefPanel({ brief }: { brief: AiBrief }) {
  const cred = brief.credibility;
  const confColor = cred?.confidence === "high" ? "var(--accent)" : cred?.confidence === "medium" ? "var(--accent-warm)" : "var(--accent-hot)";
  return (
    <div className="wm-glass" style={{ padding: 16, display: "flex", flexDirection: "column", gap: 12 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
        <div className="wm-mono" style={{ fontSize: 10, color: "var(--ink-1)", letterSpacing: "0.22em" }}>AI · WORLD BRIEF</div>
        <span className="wm-mono" style={{ fontSize: 9, color: brief.model ? "var(--accent)" : "var(--accent-warm)", letterSpacing: "0.2em", padding: "2px 8px", border: `1px solid ${brief.model ? "var(--accent)" : "var(--accent-warm)"}`, borderRadius: 999 }}>
          {brief.model ?? "FALLBACK"}
        </span>
      </div>
      {cred ? (
        <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
          <span className="wm-mono" title="Confidence" style={{ fontSize: 9, color: confColor, letterSpacing: "0.18em", padding: "2px 8px", border: `1px solid ${confColor}`, borderRadius: 4 }}>
            {cred.confidence.toUpperCase()} CONFIDENCE
          </span>
          <span className="wm-mono" style={{ fontSize: 9, color: "var(--ink-3)", letterSpacing: "0.16em" }}>
            {cred.sourcesAnalyzed} SOURCES · {cred.independentSources} INDEP{cred.stateMediaSources > 0 ? ` · ${cred.stateMediaSources} STATE` : ""}
          </span>
        </div>
      ) : null}
      <div style={{ fontSize: 14, color: "var(--ink-0)", lineHeight: 1.5 }}>{brief.headline}</div>
      {brief.bullets.length > 0 ? (
        <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "grid", gap: 6 }}>
          {brief.bullets.map((b, i) => (
            <li key={i} style={{ display: "flex", gap: 8, alignItems: "baseline" }}>
              <span className="wm-mono" style={{ fontSize: 9, color: "var(--accent)", letterSpacing: "0.18em" }}>—</span>
              <span style={{ fontSize: 12, color: "var(--ink-1)", lineHeight: 1.45 }}>{b}</span>
            </li>
          ))}
        </ul>
      ) : null}
      <div style={{ display: "grid", gap: 6, paddingTop: 8, borderTop: "1px solid var(--line)" }}>
        <div className="wm-mono" style={{ fontSize: 9, color: "var(--ink-3)", letterSpacing: "0.22em" }}>STRATEGIC POSTURE</div>
        {brief.theaters.map((t) => (
          <div key={t.name} style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: 8, alignItems: "center" }}>
            <div>
              <div style={{ fontSize: 12, color: "var(--ink-0)" }}>{t.name}</div>
              {t.note ? <div style={{ fontSize: 11, color: "var(--ink-3)", marginTop: 2 }}>{t.note}</div> : null}
            </div>
            <span className="wm-mono" style={{ fontSize: 9, color: LEVEL_COLOR[t.level] ?? "var(--ink-2)", letterSpacing: "0.2em", padding: "2px 8px", border: `1px solid ${LEVEL_COLOR[t.level] ?? "var(--ink-2)"}`, borderRadius: 999 }}>
              {t.level}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
