import type { NewsRow } from "@/lib/dashboard";
import { NewsItem } from "./NewsItem";

export function NewsPanel({
  title,
  badge,
  items,
  accent = "var(--accent)",
  height,
}: {
  title: string;
  badge?: string;
  items: NewsRow[];
  accent?: string;
  height?: number;
}) {
  return (
    <div style={{
      border: "1px solid var(--line)", borderRadius: 10,
      background: "rgba(8,12,24,0.55)",
      display: "flex", flexDirection: "column",
      minHeight: height ?? 300, maxHeight: height ?? 380,
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 12px", borderBottom: "1px solid var(--line)" }}>
        <div className="wm-mono" style={{ fontSize: 10, color: "var(--ink-1)", letterSpacing: "0.22em", textTransform: "uppercase", fontWeight: 600 }}>
          {title}
        </div>
        <span className="wm-mono" style={{ fontSize: 9, color: accent, letterSpacing: "0.2em", padding: "2px 7px", borderRadius: 999, border: `1px solid ${accent}`, opacity: 0.85 }}>
          {badge ?? `LIVE · ${items.length}`}
        </span>
      </div>
      <div style={{ overflow: "auto", padding: 4 }}>
        {items.length === 0 ? (
          <div style={{ padding: 14, color: "var(--ink-3)", fontSize: 11, textAlign: "center" }} className="wm-mono">
            NO RECENT ITEMS
          </div>
        ) : (
          <ul style={{ listStyle: "none", margin: 0, padding: 0 }}>
            {items.slice(0, 18).map((n) => (
              <NewsItem key={n.id} item={n} accent={accent} />
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
