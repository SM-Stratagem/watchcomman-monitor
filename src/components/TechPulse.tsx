import { getTechPulse } from "@/lib/tech-pulse";
import { formatRelative } from "@/lib/format";

export async function TechPulse() {
  const { hn, gh } = await getTechPulse();
  return (
    <div style={{ display: "grid", gridTemplateColumns: "minmax(0, 1fr) minmax(0, 1fr)", gap: 14 }}>
      <PulseList title="HACKER NEWS · FRONT PAGE" items={hn} accent="var(--accent-warm)" />
      <PulseList title="GITHUB TRENDING (7D)" items={gh} accent="var(--accent)" />
    </div>
  );
}

function PulseList({ title, items, accent }: { title: string; items: import("@/lib/tech-pulse").TechItem[]; accent: string }) {
  return (
    <div style={{ border: "1px solid var(--line)", borderRadius: 10, background: "rgba(8,12,24,0.55)" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 12px", borderBottom: "1px solid var(--line)" }}>
        <div className="wm-mono" style={{ fontSize: 10, color: "var(--ink-1)", letterSpacing: "0.22em", textTransform: "uppercase", fontWeight: 600 }}>
          {title}
        </div>
        <span className="wm-mono" style={{ fontSize: 9, color: accent, letterSpacing: "0.2em" }}>LIVE</span>
      </div>
      <ul style={{ listStyle: "none", margin: 0, padding: 0, maxHeight: 360, overflow: "auto" }}>
        {items.length === 0 ? (
          <li className="wm-mono" style={{ padding: 14, color: "var(--ink-3)", fontSize: 11, textAlign: "center" }}>NO DATA</li>
        ) : items.map((it) => (
          <li key={it.id} style={{ padding: "8px 12px", borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
            <a href={it.url} target="_blank" rel="noopener noreferrer">
              <div style={{ display: "flex", justifyContent: "space-between", gap: 6 }}>
                <span className="wm-mono" style={{ fontSize: 10, color: accent, letterSpacing: "0.12em" }}>
                  {it.source === "github" ? "★" : "▲"} {it.points.toLocaleString()}
                </span>
                <span className="wm-mono" style={{ fontSize: 9, color: "var(--ink-3)", letterSpacing: "0.14em" }}>
                  {formatRelative(it.createdAt)}
                </span>
              </div>
              <div style={{ marginTop: 3, fontSize: 12, color: "var(--ink-0)", lineHeight: 1.35 }}>
                {it.title}
              </div>
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}
