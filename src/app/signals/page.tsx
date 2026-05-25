import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { SignalRowItem } from "@/components/SignalRow";
import { getDashboardSnapshot, getSignalsFiltered } from "@/lib/dashboard";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";
export const revalidate = 60;

export const metadata: Metadata = {
  title: "Live signals — Watchcomman Monitor",
  description:
    "Browse and filter the live stream of disease outbreaks, disasters, earthquakes, wildfires, and environmental signals aggregated by Watchcomman Monitor.",
};

const CATEGORIES = ["outbreak", "advisory", "environment", "earthquake", "wildfire", "storm", "flood", "disaster", "logistics"];
const SEVERITIES = ["critical", "high", "elevated", "moderate", "low"];
const RANGES = [
  { v: "6", label: "6h" },
  { v: "24", label: "24h" },
  { v: "72", label: "3d" },
  { v: "168", label: "7d" },
  { v: "720", label: "30d" },
];

type Search = { [k: string]: string | string[] | undefined };

function val(s: Search, k: string): string | undefined {
  const v = s[k];
  return typeof v === "string" && v ? v : undefined;
}

export default async function Page({ searchParams }: { searchParams: Promise<Search> }) {
  const sp = await searchParams;
  const category = val(sp, "category");
  const severity = val(sp, "severity");
  const country = val(sp, "country");
  const region = val(sp, "region");
  const sinceHours = Number(val(sp, "since") ?? "168");

  const [rows, snap] = await Promise.all([
    getSignalsFiltered({ category, severity, country, region, sinceHours, limit: 200 }),
    getDashboardSnapshot(500),
  ]);

  const link = (overrides: Record<string, string | undefined>): string => {
    const base = { category, severity, country, region, since: String(sinceHours) };
    const merged: Record<string, string | undefined> = { ...base, ...overrides };
    const sp = new URLSearchParams();
    for (const [k, v] of Object.entries(merged)) if (v) sp.set(k, v);
    const s = sp.toString();
    return s ? `/signals?${s}` : "/signals";
  };

  const pill = (label: string, href: string, active: boolean) => (
    <a
      href={href}
      key={`${label}-${href}`}
      className="wm-mono"
      style={{
        padding: "6px 12px",
        borderRadius: 999,
        border: `1px solid ${active ? "var(--accent)" : "var(--line-strong)"}`,
        background: active ? "rgba(125,240,194,0.08)" : "transparent",
        color: active ? "var(--accent)" : "var(--ink-1)",
        fontSize: 11,
        letterSpacing: "0.18em",
        textTransform: "uppercase",
      }}
    >
      {label}
    </a>
  );

  return (
    <>
      <Header />
      <main style={{ paddingTop: 72, paddingBottom: 40 }}>
        <div className="wm-shell">
          <div className="wm-eyebrow">Live stream</div>
          <h1 className="wm-display" style={{ fontSize: "clamp(36px, 5vw, 64px)", margin: "8px 0 24px" }}>
            All signals
          </h1>
          <p style={{ color: "var(--ink-2)", fontSize: 14, maxWidth: 640, lineHeight: 1.6 }}>
            Every signal currently in the rolling window — filterable by category, severity, country, region, and recency.
            All entries are sourced from public-health and disaster feeds; click a row to read the underlying source.
          </p>

          <div style={{ display: "grid", gap: 14, marginTop: 28 }}>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              <span className="wm-eyebrow" style={{ alignSelf: "center", marginRight: 6 }}>Category</span>
              {pill("All", link({ category: undefined }), !category)}
              {CATEGORIES.map((c) => pill(c, link({ category: c }), category === c))}
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              <span className="wm-eyebrow" style={{ alignSelf: "center", marginRight: 6 }}>Severity</span>
              {pill("All", link({ severity: undefined }), !severity)}
              {SEVERITIES.map((c) => pill(c, link({ severity: c }), severity === c))}
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              <span className="wm-eyebrow" style={{ alignSelf: "center", marginRight: 6 }}>Range</span>
              {RANGES.map((r) => pill(r.label, link({ since: r.v }), String(sinceHours) === r.v))}
            </div>
          </div>

          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginTop: 32, marginBottom: 6 }}>
            <span className="wm-mono" style={{ fontSize: 11, color: "var(--ink-3)", letterSpacing: "0.2em" }}>
              {rows.length} SIGNALS · {snap.totals.activeSignals} TOTAL ACTIVE
            </span>
            <a href={`/api/v1/signals.rss${category ? `?category=${category}` : ""}`} className="wm-mono" style={{ fontSize: 11, color: "var(--accent)", letterSpacing: "0.2em" }}>
              RSS ↗
            </a>
          </div>

          <ul style={{ listStyle: "none", margin: 0, padding: 0, borderTop: "1px solid var(--line)" }}>
            {rows.length === 0 ? (
              <li style={{ padding: 32, color: "var(--ink-2)", textAlign: "center" }}>No signals match these filters in the selected window.</li>
            ) : (
              rows.map((s) => <SignalRowItem key={s.id} s={s} />)
            )}
          </ul>
        </div>
      </main>
      <Footer lastIngestAt={snap.totals.lastIngestAt} />
    </>
  );
}
