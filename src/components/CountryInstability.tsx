import type { StatRow } from "@/lib/dashboard";
import { slugify } from "@/lib/format";

// Country flag emoji from ISO-likely name lookups (approximate; falls back blank)
const FLAGS: Record<string, string> = {
  "Iran": "🇮🇷", "Russia": "🇷🇺", "Mexico": "🇲🇽", "United States": "🇺🇸",
  "China": "🇨🇳", "India": "🇮🇳", "Brazil": "🇧🇷", "Israel": "🇮🇱",
  "Ukraine": "🇺🇦", "Turkey": "🇹🇷", "Saudi Arabia": "🇸🇦", "Pakistan": "🇵🇰",
  "Afghanistan": "🇦🇫", "Syria": "🇸🇾", "Yemen": "🇾🇪", "Sudan": "🇸🇩",
  "Myanmar": "🇲🇲", "North Korea": "🇰🇵", "Venezuela": "🇻🇪", "Haiti": "🇭🇹",
  "Democratic Republic of the Congo": "🇨🇩", "Ethiopia": "🇪🇹", "Nigeria": "🇳🇬",
  "Indonesia": "🇮🇩", "Japan": "🇯🇵", "South Korea": "🇰🇷", "Philippines": "🇵🇭",
  "Chile": "🇨🇱", "Argentina": "🇦🇷", "Colombia": "🇨🇴", "Egypt": "🇪🇬",
  "Iraq": "🇮🇶", "Lebanon": "🇱🇧", "Libya": "🇱🇾", "Algeria": "🇩🇿",
  "Morocco": "🇲🇦", "South Africa": "🇿🇦", "Kenya": "🇰🇪", "France": "🇫🇷",
  "Germany": "🇩🇪", "United Kingdom": "🇬🇧", "Spain": "🇪🇸", "Italy": "🇮🇹",
  "Greece": "🇬🇷", "Poland": "🇵🇱", "Sweden": "🇸🇪", "Norway": "🇳🇴",
  "Finland": "🇫🇮", "Australia": "🇦🇺", "New Zealand": "🇳🇿", "Canada": "🇨🇦",
  "Taiwan": "🇹🇼", "Singapore": "🇸🇬", "Thailand": "🇹🇭", "Vietnam": "🇻🇳",
  "Papua New Guinea": "🇵🇬", "Madagascar": "🇲🇬",
};

export function CountryInstability({ countries }: { countries: StatRow[] }) {
  const ranked = [...countries].sort((a, b) => b.severityScore - a.severityScore).slice(0, 10);
  const maxScore = Math.max(1, ranked[0]?.severityScore ?? 1);
  return (
    <div style={{ border: "1px solid var(--line)", borderRadius: 10, background: "rgba(8,12,24,0.55)" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 12px", borderBottom: "1px solid var(--line)" }}>
        <div className="wm-mono" style={{ fontSize: 10, color: "var(--ink-1)", letterSpacing: "0.22em", textTransform: "uppercase", fontWeight: 600 }}>
          COUNTRY INSTABILITY
        </div>
        <span className="wm-mono" style={{ fontSize: 9, color: "var(--accent-hot)", letterSpacing: "0.2em" }}>LIVE</span>
      </div>
      <ul style={{ listStyle: "none", margin: 0, padding: 0 }}>
        {ranked.map((c, i) => {
          const pct = Math.max(8, Math.round((c.severityScore / maxScore) * 100));
          const score = Math.min(99, Math.round(c.severityScore * 2));
          return (
            <li key={c.key} style={{ padding: "10px 12px", borderBottom: "1px solid rgba(255,255,255,0.03)" }}>
              <a href={`/country/${slugify(c.key)}`} style={{ display: "block" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 8 }}>
                  <span style={{ fontSize: 12, color: "var(--ink-0)" }}>
                    <span className="wm-mono" style={{ color: "var(--ink-3)", marginRight: 8, fontSize: 10 }}>{String(i + 1).padStart(2, "0")}</span>
                    <span style={{ marginRight: 6 }}>{FLAGS[c.key] ?? "🏳"}</span>
                    {c.key}
                  </span>
                  <span className="wm-mono" style={{ fontSize: 11, color: "var(--accent-hot)", letterSpacing: "0.04em" }}>
                    {score}
                  </span>
                </div>
                <div style={{ marginTop: 5, height: 3, borderRadius: 3, background: "rgba(255,255,255,0.06)", overflow: "hidden" }}>
                  <div style={{
                    width: `${pct}%`, height: "100%",
                    background: "linear-gradient(90deg, var(--accent-hot), var(--accent-warm))",
                  }} />
                </div>
              </a>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
