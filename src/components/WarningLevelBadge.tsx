import type { WarningLevel } from "@/lib/warning-level";

export function WarningLevelBadge({ w, compact = false }: { w: WarningLevel; compact?: boolean }) {
  return (
    <div className="wm-tile" style={{ display: "flex", flexDirection: "column", gap: 8, minWidth: compact ? 160 : 240 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 8 }}>
        <span className="wm-mono" style={{ fontSize: 9, color: "var(--ink-3)", letterSpacing: "0.22em" }}>STRATEGIC WARNING</span>
        <span className="wm-mono" style={{ fontSize: 9, color: "var(--ink-3)", letterSpacing: "0.18em" }}>{w.score}/100</span>
      </div>
      <div style={{ display: "flex", alignItems: "baseline", gap: 10 }}>
        <span className="wm-display" style={{ fontSize: 38, color: w.color }}>WL-{w.level}</span>
        <span className="wm-mono" style={{ fontSize: 11, color: w.color, letterSpacing: "0.18em", padding: "2px 8px", border: `1px solid ${w.color}`, borderRadius: 999 }}>{w.label}</span>
      </div>
      <div style={{ fontSize: 11, color: "var(--ink-2)" }}>{w.description}</div>
      {/* Ladder */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 3, marginTop: 4 }}>
        {[5, 4, 3, 2, 1].map((step) => (
          <div key={step} style={{
            height: 4,
            borderRadius: 2,
            background: step >= w.level ? w.color : "rgba(255,255,255,0.06)",
            opacity: step === w.level ? 1 : 0.55,
          }} />
        ))}
      </div>
      {!compact && (
        <div style={{ marginTop: 4, fontSize: 10.5, color: "var(--ink-3)", lineHeight: 1.45 }}>
          {w.drivers.slice(0, 3).map((d, i) => <div key={i}>· {d}</div>)}
        </div>
      )}
    </div>
  );
}
