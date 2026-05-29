import Link from "next/link";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { THEATERS } from "@/lib/theaters";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "World Monitor for Defense — OSINT Situation Room",
  description: "Defense-grade OSINT dashboard: sanctions delta, cyber threat intel, defense procurement, theater dashboards, watchlists, briefing exports.",
};

const FEATURES = [
  { title: "Sanctions delta", body: "Daily diffs of OFAC SDN, EU CFSP, UK OFSI, and BIS Entity List — named-entity additions, programs, jurisdictions.", href: "/sanctions" },
  { title: "Cyber threat intel", body: "CISA KEV catalog, NIST NVD critical CVEs (CVSS ≥ 7.0), breach disclosures — actionable for vulnerability response.", href: "/cyber" },
  { title: "Defense contracts", body: "Live procurement opportunities from SAM.gov (defense NAICS), EU TED (CPV 35*), UK MOD, and DSCA Foreign Military Sales.", href: "/contracts" },
  { title: "Theater dashboards", body: "Curated views over Ukraine, Taiwan, Red Sea, Korea, Levant — each with focused source set, AI brief, and adversary tracker.", href: "/theater" },
  { title: "Maritime intel", body: "Eight strategic chokepoints (Hormuz, Bab el-Mandeb, Suez, Malacca, Bosporus, Taiwan, Panama, Kerch) with live risk indicators from real-time signals.", href: "/ships" },
  { title: "Military air tracker", body: "Every aircraft flagged as military in the open ADSB.lol database — global view, regional breakdown, emergency squawks, country from ICAO hex.", href: "/military" },
  { title: "Watchlists", body: "Track entities, regions, and keywords. Localstorage-only — your queries never leave the browser.", href: "/watchlist" },
  { title: "Briefing export", body: "One-page printable situation report — Save as PDF for analyst distribution. Filter by theater or watchlist.", href: "/briefing" },
];

const SOURCES = [
  "🇺🇸 OFAC SDN", "🇪🇺 EU CFSP", "🇬🇧 UK OFSI", "🇺🇸 BIS Entity List",
  "🛡 CISA KEV", "💀 NIST NVD", "🔓 HIBP", "📡 GDELT 2.0",
  "🇺🇸 SAM.gov", "🇪🇺 EU TED", "🇬🇧 UK Contracts", "🇺🇸 DSCA FMS",
  "📈 ACLED", "🌐 ReliefWeb", "🌋 USGS", "🌪 GDACS",
  "🛩 ADSB.lol", "🛸 GPSjam", "📰 Reuters / AP / AFP", "🧠 CSIS · RAND · IISS · RUSI",
];
const STATE_FLAGGED = [
  "🇷🇺 RT / TASS / Sputnik", "🇨🇳 Xinhua / Global Times / CGTN", "🇮🇷 Press TV / IRNA", "🇰🇵 KCNA",
];

export default function Page() {
  return (
    <>
      <Header />
      <main>
        <section style={{ padding: "60px 28px 28px" }}>
          <div className="wm-shell">
            <div className="wm-mono" style={{ fontSize: 10, color: "var(--accent)", letterSpacing: "0.22em" }}>● BUILT FOR DEFENSE & INTEL ANALYSTS</div>
            <h1 className="wm-display" style={{ fontSize: "clamp(36px, 5vw, 64px)", margin: "12px 0 0", lineHeight: 1.05, letterSpacing: "-0.015em" }}>
              The OSINT situation room
              <br />for the defense industry.
            </h1>
            <p style={{ color: "var(--ink-2)", marginTop: 14, fontSize: 15, maxWidth: 760, lineHeight: 1.6 }}>
              Sanctions delta. Cyber threat intel. Defense procurement. Five theater dashboards. Provenance on every source — state-media flagged, language tagged, independent corroboration counted. Briefing PDF export. Watchlists. API.
            </p>
            <div style={{ marginTop: 24, display: "flex", gap: 12, flexWrap: "wrap" }}>
              <Link href="/dashboard" className="wm-mono" style={{ padding: "12px 18px", border: "1px solid var(--accent)", color: "var(--accent)", letterSpacing: "0.2em", fontSize: 11, borderRadius: 6 }}>OPEN DASHBOARD ↗</Link>
              <Link href="/theater" className="wm-mono" style={{ padding: "12px 18px", border: "1px solid var(--line-strong)", color: "var(--ink-0)", letterSpacing: "0.2em", fontSize: 11, borderRadius: 6 }}>THEATERS</Link>
              <Link href="/briefing" className="wm-mono" style={{ padding: "12px 18px", border: "1px solid var(--line-strong)", color: "var(--ink-0)", letterSpacing: "0.2em", fontSize: 11, borderRadius: 6 }}>PRINT BRIEFING ↗</Link>
            </div>
          </div>
        </section>

        <section style={{ padding: "0 28px 32px" }}>
          <div className="wm-shell" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(290px, 1fr))", gap: 14 }}>
            {FEATURES.map((f) => (
              <Link key={f.href} href={f.href} className="wm-glass" style={{ padding: 16, display: "block" }}>
                <div className="wm-mono" style={{ fontSize: 9, color: "var(--accent)", letterSpacing: "0.22em" }}>{f.title.toUpperCase()}</div>
                <h2 style={{ fontSize: 18, color: "var(--ink-0)", margin: "6px 0 6px", fontWeight: 500 }}>{f.title}</h2>
                <p style={{ fontSize: 12, color: "var(--ink-2)", lineHeight: 1.5 }}>{f.body}</p>
              </Link>
            ))}
          </div>
        </section>

        <section style={{ padding: "0 28px 32px" }}>
          <div className="wm-shell wm-glass" style={{ padding: 20 }}>
            <div className="wm-mono" style={{ fontSize: 10, color: "var(--ink-3)", letterSpacing: "0.22em" }}>SOURCE COVERAGE</div>
            <h2 style={{ fontSize: 22, color: "var(--ink-0)", margin: "8px 0 12px", fontWeight: 400 }}>40+ structured feeds. 280+ news sources. State media flagged.</h2>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              {SOURCES.map((s) => (
                <span key={s} className="wm-mono" style={{ fontSize: 10, color: "var(--ink-1)", padding: "4px 10px", border: "1px solid var(--line)", borderRadius: 999, letterSpacing: "0.12em" }}>{s}</span>
              ))}
            </div>
            <div style={{ marginTop: 14 }}>
              <div className="wm-mono" style={{ fontSize: 9, color: "var(--accent-hot)", letterSpacing: "0.22em", marginBottom: 6 }}>STATE-MEDIA · ALWAYS FLAGGED</div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                {STATE_FLAGGED.map((s) => (
                  <span key={s} className="wm-mono" style={{ fontSize: 10, color: "var(--accent-hot)", padding: "4px 10px", border: "1px solid var(--accent-hot)", borderRadius: 999, letterSpacing: "0.12em" }}>{s}</span>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section style={{ padding: "0 28px 50px" }}>
          <div className="wm-shell" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 14 }}>
            {THEATERS.map((t) => (
              <Link key={t.slug} href={`/theater/${t.slug}`} className="wm-glass" style={{ padding: 16, display: "block" }}>
                <div className="wm-mono" style={{ fontSize: 9, color: t.accent, letterSpacing: "0.22em" }}>{t.shortName.toUpperCase()}</div>
                <h3 style={{ fontSize: 16, color: "var(--ink-0)", margin: "6px 0 6px", fontWeight: 500 }}>{t.label}</h3>
                <p style={{ fontSize: 11, color: "var(--ink-2)", lineHeight: 1.5 }}>{t.description}</p>
              </Link>
            ))}
          </div>
        </section>

        <Footer />
      </main>
    </>
  );
}
