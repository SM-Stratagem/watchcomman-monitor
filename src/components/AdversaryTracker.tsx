import type { NewsRow, SignalRow } from "@/lib/dashboard";

export type AdversaryConfig = {
  slug: "pla" | "russia-air" | "iran" | "dprk";
  label: string;
  flag: string;
  accent: string;
  keywords: string[];        // for filtering news + signals
  signalKeywords?: string[]; // optional override for signals
  blurb: string;
};

export const ADVERSARIES: AdversaryConfig[] = [
  {
    slug: "pla",
    label: "PLA Activity",
    flag: "🇨🇳",
    accent: "var(--accent-hot)",
    keywords: ["pla", "plaaf", "pla navy", "adiz", "taiwan strait", "spratly", "paracel", "south china sea", "scs", "j-16", "j-20", "type 055", "type 075", "carrier shandong", "carrier liaoning", "fujian"],
    blurb: "Chinese military activity — ADIZ incursions, naval movements, exercises.",
  },
  {
    slug: "russia-air",
    label: "Russian Aviation",
    flag: "🇷🇺",
    accent: "var(--accent-hot)",
    keywords: ["russian aircraft", "russian bomber", "tu-95", "tu-22", "tu-160", "su-34", "su-35", "su-57", "russian jet", "russian drone", "shahed", "geran", "russian aviation", "vks", "kalibr", "iskander", "kh-101", "kh-555"],
    blurb: "Russian VKS bomber sorties, missile launches, drone activity, NATO intercepts.",
  },
  {
    slug: "iran",
    label: "Iran / IRGC / Proxies",
    flag: "🇮🇷",
    accent: "var(--accent-hot)",
    keywords: ["iran", "irgc", "quds force", "khamenei", "hezbollah", "houthi", "ansar allah", "kata'ib", "popular mobilization", "shia militia", "iranian drone", "iran missile", "iran-backed", "iranian-backed"],
    blurb: "IRGC, Quds Force, and proxy network activity — Hezbollah, Houthis, Iraqi militias.",
  },
  {
    slug: "dprk",
    label: "DPRK Launches",
    flag: "🇰🇵",
    accent: "var(--accent-warm)",
    keywords: ["north korea", "dprk", "kim jong", "pyongyang", "icbm", "hwasong", "musudan", "kn-08", "kn-23", "kn-25", "tactical nuclear", "nuclear test"],
    blurb: "Ballistic launches, nuclear posturing, leadership signaling.",
  },
];

function countMatches(blob: string, keywords: string[]): number {
  let n = 0;
  for (const k of keywords) if (blob.includes(k)) n++;
  return n;
}

export function AdversaryTracker({
  config,
  news,
  signals,
  asOf,
}: {
  config: AdversaryConfig;
  news: NewsRow[];
  signals: SignalRow[];
  /** ms-since-epoch reference time; pass from server. Defaults to a stable build-time stamp. */
  asOf?: number;
}) {
  const newsBlob = news.map((n) => `${n.title} ${n.summary ?? ""}`.toLowerCase());
  const sigBlob = signals.map((s) => `${s.title} ${s.summary ?? ""} ${s.country ?? ""}`.toLowerCase());

  const matchedNews = news.filter((_, i) => countMatches(newsBlob[i], config.keywords) > 0);
  const matchedSig = signals.filter((_, i) => countMatches(sigBlob[i], config.signalKeywords ?? config.keywords) > 0);
  const ref = asOf ?? 0;
  const last24h = ref > 0
    ? matchedNews.filter((n) => ref - new Date(n.publishedAt).getTime() < 24 * 60 * 60 * 1000).length
    : matchedNews.length;

  return (
    <div className="wm-glass" style={{ padding: 0, display: "flex", flexDirection: "column", minHeight: 220 }}>
      <div style={{ padding: "10px 14px", borderBottom: "1px solid var(--line)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
          <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
            <span style={{ fontSize: 16 }}>{config.flag}</span>
            <div>
              <div className="wm-mono" style={{ fontSize: 9, color: "var(--ink-3)", letterSpacing: "0.22em" }}>ADVERSARY TRACKER</div>
              <div style={{ fontSize: 16, color: "var(--ink-0)", fontWeight: 500 }}>{config.label}</div>
            </div>
          </div>
          <span className="wm-mono" style={{ fontSize: 9, color: config.accent, letterSpacing: "0.18em" }}>
            +{last24h} · 24H
          </span>
        </div>
        <p style={{ fontSize: 11, color: "var(--ink-2)", marginTop: 6 }}>{config.blurb}</p>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", borderBottom: "1px solid var(--line)" }}>
        <Stat label="NEWS · 48H" value={matchedNews.length} />
        <Stat label="SIGNALS" value={matchedSig.length} accent="var(--accent-warm)" />
        <Stat label="ESCALATIONS" value={matchedSig.filter((s) => s.severity === "high" || s.severity === "critical").length} accent={config.accent} />
      </div>
      <div style={{ overflow: "auto", padding: 2, maxHeight: 280 }}>
        {matchedNews.length === 0 ? (
          <div style={{ padding: 16, color: "var(--ink-3)", fontSize: 11, textAlign: "center" }} className="wm-mono">NO MATCHES · 48H</div>
        ) : (
          <ul style={{ listStyle: "none", margin: 0, padding: 0 }}>
            {matchedNews.slice(0, 10).map((n) => (
              <li key={n.id} style={{ padding: "6px 12px", borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                <a href={n.link} target="_blank" rel="noopener noreferrer">
                  <div className="wm-mono" style={{ fontSize: 9, color: config.accent, letterSpacing: "0.16em" }}>{n.sourceName}</div>
                  <div style={{ marginTop: 2, color: "var(--ink-0)", fontSize: 11, lineHeight: 1.4 }}>{n.title}</div>
                </a>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

function Stat({ label, value, accent = "var(--accent)" }: { label: string; value: number; accent?: string }) {
  return (
    <div style={{ padding: "8px 10px", borderRight: "1px solid var(--line)" }}>
      <div className="wm-mono" style={{ fontSize: 9, color: "var(--ink-3)", letterSpacing: "0.18em" }}>{label}</div>
      <div className="wm-display" style={{ fontSize: 20, marginTop: 2, color: accent }}>{value}</div>
    </div>
  );
}
