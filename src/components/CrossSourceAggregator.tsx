import type { NewsRow } from "@/lib/dashboard";

// Surfaces stories that multiple sources are covering simultaneously.
// We bucket headlines by overlapping noun-content and rank by source count.

const STOP = new Set([
  "the", "a", "an", "of", "in", "on", "for", "to", "and", "or", "with", "as", "by", "is", "are",
  "was", "were", "be", "been", "has", "have", "had", "this", "that", "it", "its", "after", "over",
  "from", "at", "into", "but", "not", "no", "more", "less", "than", "new", "says", "say", "amid",
  "calls", "set", "made", "will", "would", "could", "may", "might", "can", "us", "uk", "eu",
]);

function tokens(s: string): Set<string> {
  return new Set(
    s.toLowerCase()
      .replace(/[^a-z0-9 ]/g, " ")
      .split(/\s+/)
      .filter((t) => t.length >= 4 && !STOP.has(t)),
  );
}

function jaccard(a: Set<string>, b: Set<string>): number {
  if (a.size === 0 || b.size === 0) return 0;
  let inter = 0;
  for (const t of a) if (b.has(t)) inter++;
  return inter / new Set([...a, ...b]).size;
}

export function CrossSourceAggregator({ items }: { items: NewsRow[] }) {
  // Cluster by jaccard >= 0.18
  const used = new Set<number>();
  const clusters: { key: string; titles: NewsRow[] }[] = [];
  const tok = items.map((n) => tokens(n.title));
  for (let i = 0; i < items.length; i++) {
    if (used.has(i)) continue;
    const cluster: NewsRow[] = [items[i]];
    used.add(i);
    for (let j = i + 1; j < items.length; j++) {
      if (used.has(j)) continue;
      if (jaccard(tok[i], tok[j]) >= 0.18) {
        cluster.push(items[j]);
        used.add(j);
      }
    }
    if (cluster.length >= 2) {
      clusters.push({ key: items[i].title, titles: cluster });
    }
  }
  clusters.sort((a, b) => b.titles.length - a.titles.length);
  const top = clusters.slice(0, 8);

  return (
    <div style={{ border: "1px solid var(--line)", borderRadius: 10, background: "rgba(8,12,24,0.55)" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 12px", borderBottom: "1px solid var(--line)" }}>
        <div className="wm-mono" style={{ fontSize: 10, color: "var(--ink-1)", letterSpacing: "0.22em", textTransform: "uppercase", fontWeight: 600 }}>
          CROSS-SOURCE SIGNAL AGGREGATOR
        </div>
        <span className="wm-mono" style={{ fontSize: 9, color: "var(--accent-warm)", letterSpacing: "0.2em" }}>
          {top.length} CONVERGENCES
        </span>
      </div>
      <ul style={{ listStyle: "none", margin: 0, padding: 0 }}>
        {top.length === 0 ? (
          <li className="wm-mono" style={{ padding: 14, color: "var(--ink-3)", fontSize: 11, textAlign: "center" }}>NO CONVERGENT STORIES</li>
        ) : (
          top.map((c) => {
            const uniqueSources = new Set(c.titles.map((t) => t.sourceSlug));
            return (
              <li key={c.titles[0].id} style={{ padding: "10px 12px", borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                  <span className="wm-mono" style={{ fontSize: 9, color: "var(--accent-warm)", letterSpacing: "0.2em" }}>
                    {uniqueSources.size} SOURCES
                  </span>
                  <span className="wm-mono" style={{ fontSize: 9, color: "var(--ink-3)", letterSpacing: "0.16em" }}>
                    {c.titles.length} ARTICLES
                  </span>
                </div>
                <a href={c.titles[0].link} target="_blank" rel="noopener noreferrer" style={{ display: "block", marginTop: 4, fontSize: 12, color: "var(--ink-0)", lineHeight: 1.4 }}>
                  {c.titles[0].title}
                </a>
                <div style={{ marginTop: 6, display: "flex", flexWrap: "wrap", gap: 4 }}>
                  {Array.from(uniqueSources).slice(0, 6).map((s) => (
                    <span key={s} className="wm-mono" style={{ fontSize: 8, color: "var(--ink-3)", letterSpacing: "0.14em", padding: "2px 6px", border: "1px solid var(--line-strong)", borderRadius: 4 }}>
                      {c.titles.find((t) => t.sourceSlug === s)?.sourceName.slice(0, 16)}
                    </span>
                  ))}
                </div>
              </li>
            );
          })
        )}
      </ul>
    </div>
  );
}
