import type { NewsRow } from "@/lib/dashboard";
import { affiliationColor, affiliationLabel, flagEmoji, getProvenance } from "@/lib/provenance";
import { formatRelative } from "@/lib/format";

type Props = {
  item: NewsRow;
  accent?: string;
  showSummary?: boolean;
};

// One news item with provenance chips: flag, language, affiliation badge.
// Used everywhere a news row renders.
export function NewsItem({ item, accent = "var(--accent)", showSummary = false }: Props) {
  const p = getProvenance(item.sourceSlug, item.region);
  return (
    <li style={{ padding: "8px 10px", borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
      <a href={item.link} target="_blank" rel="noopener noreferrer" style={{ display: "block" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 8 }}>
          <span style={{ display: "inline-flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
            <span style={{ fontSize: 12 }} title={p.country}>{flagEmoji(p.country)}</span>
            <span className="wm-mono" style={{ fontSize: 9, color: accent, letterSpacing: "0.16em", textTransform: "uppercase" }}>
              {item.sourceName}
            </span>
            <span className="wm-mono" title={`Language: ${p.language.toUpperCase()}`} style={{ fontSize: 8, color: "var(--ink-3)", padding: "1px 5px", border: "1px solid var(--line)", borderRadius: 3, letterSpacing: "0.12em" }}>
              {p.language.toUpperCase()}
            </span>
            <span
              className="wm-mono"
              title={`${affiliationLabel(p.affiliation)} · bias: ${p.bias}`}
              style={{
                fontSize: 8,
                color: affiliationColor(p.affiliation),
                padding: "1px 5px",
                border: `1px solid ${affiliationColor(p.affiliation)}`,
                borderRadius: 3,
                letterSpacing: "0.12em",
                opacity: 0.85,
              }}
            >
              {affiliationLabel(p.affiliation)}
            </span>
          </span>
          <span className="wm-mono" style={{ fontSize: 9, color: "var(--ink-3)", letterSpacing: "0.14em" }}>
            {formatRelative(item.publishedAt)}
          </span>
        </div>
        <div style={{ marginTop: 3, color: "var(--ink-0)", fontSize: 12, lineHeight: 1.35 }}>{item.title}</div>
        {showSummary && item.summary ? (
          <div style={{ marginTop: 2, color: "var(--ink-2)", fontSize: 11, lineHeight: 1.4 }}>{item.summary.slice(0, 220)}</div>
        ) : null}
      </a>
    </li>
  );
}
