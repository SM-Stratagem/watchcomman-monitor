import type { SignalRow } from "@/lib/dashboard";
import { formatRelative, severityColor } from "@/lib/format";

export function SignalRowItem({ s, showCountry = true }: { s: SignalRow; showCountry?: boolean }) {
  return (
    <li
      style={{
        display: "grid",
        gridTemplateColumns: "100px 96px 1fr 140px",
        gap: 18,
        padding: "16px 0",
        borderBottom: "1px solid var(--line)",
        alignItems: "baseline",
      }}
    >
      <span className="wm-mono" style={{ fontSize: 10, color: "var(--ink-3)", letterSpacing: "0.2em", textTransform: "uppercase" }}>
        {formatRelative(s.occurredAt)}
      </span>
      <span
        className="wm-mono"
        style={{
          fontSize: 10,
          color: severityColor(s.severity),
          letterSpacing: "0.2em",
          textTransform: "uppercase",
        }}
      >
        ● {s.severity}
      </span>
      <div style={{ fontSize: 14, color: "var(--ink-0)", lineHeight: 1.5 }}>
        {s.sourceUrl ? (
          <a href={s.sourceUrl} target="_blank" rel="noopener noreferrer" style={{ color: "var(--ink-0)" }}>
            {s.title}
          </a>
        ) : (
          s.title
        )}
        {s.summary ? (
          <div style={{ color: "var(--ink-2)", fontSize: 13, marginTop: 4 }}>{s.summary}</div>
        ) : null}
        <div className="wm-mono" style={{ fontSize: 10, color: "var(--ink-3)", letterSpacing: "0.18em", marginTop: 6, textTransform: "uppercase" }}>
          {s.source}{s.subcategory ? ` · ${s.subcategory}` : ""}{s.magnitude != null ? ` · mag ${s.magnitude}` : ""}
        </div>
      </div>
      {showCountry ? (
        <span className="wm-mono" style={{ fontSize: 11, color: "var(--ink-2)", textAlign: "right" }}>
          {s.country ?? s.region ?? "—"}
        </span>
      ) : <span />}
    </li>
  );
}
