// Printable situation report. Use browser Save as PDF to export.
// Query params:
//   ?since=24    hours back (default 24)
//   ?theater=ukraine   restrict to a theater
//   ?watchlist=...     comma-separated terms

import { getDashboardSnapshot, getNews } from "@/lib/dashboard";
import { getAiBrief } from "@/lib/ai";
import { getSanctionsDelta } from "@/lib/sanctions-diff";
import { getCyberPanel } from "@/lib/cyber";
import { THEATERS_BY_SLUG, isNewsInTheater, isSignalInTheater, type Theater } from "@/lib/theaters";
import { affiliationLabel, flagEmoji, getProvenance } from "@/lib/provenance";

export const dynamic = "force-dynamic";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

export default async function Page({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const sinceHours = Math.min(168, Math.max(1, Number(params.since ?? 24) || 24));
  const theaterSlug = typeof params.theater === "string" ? params.theater : null;
  const watchlist = typeof params.watchlist === "string" ? params.watchlist.split(",").map((t) => t.trim()).filter(Boolean) : [];
  const theater: Theater | null = theaterSlug ? THEATERS_BY_SLUG[theaterSlug] ?? null : null;

  const [snap, allNews, sanctions, cyber] = await Promise.all([
    getDashboardSnapshot(500),
    getNews({ sinceHours, limit: 400 }),
    getSanctionsDelta(sinceHours),
    getCyberPanel(),
  ]);

  let news = allNews;
  let signals = snap.signals;
  if (theater) {
    news = news.filter((n) => isNewsInTheater(theater, n));
    signals = signals.filter((s) => isSignalInTheater(theater, s));
  }
  if (watchlist.length > 0) {
    const wl = watchlist.map((t) => t.toLowerCase());
    news = news.filter((n) => {
      const blob = `${n.title} ${n.summary ?? ""}`.toLowerCase();
      return wl.some((t) => blob.includes(t));
    });
    signals = signals.filter((s) => {
      const blob = `${s.title} ${s.summary ?? ""} ${s.country ?? ""}`.toLowerCase();
      return wl.some((t) => blob.includes(t));
    });
  }
  const brief = await getAiBrief(news, signals);
  const now = new Date();

  return (
    <main style={{ background: "#fff", color: "#111", minHeight: "100vh", padding: "32px 40px", maxWidth: 1000, margin: "0 auto", fontFamily: "var(--font-sans, ui-sans-serif), system-ui, sans-serif" }}>
      <style>{`
        @media print {
          @page { size: A4; margin: 14mm; }
          body { background: #fff !important; }
          a { color: #111 !important; text-decoration: none; }
          .no-print { display: none !important; }
        }
        .briefing-h2 { font-size: 14px; letter-spacing: 0.22em; text-transform: uppercase; color: #555; margin: 28px 0 8px; border-bottom: 1px solid #ddd; padding-bottom: 4px; }
        .briefing-list { list-style: none; padding: 0; margin: 0; }
        .briefing-list li { padding: 6px 0; border-bottom: 1px solid #eee; font-size: 11px; line-height: 1.5; }
      `}</style>

      <header style={{ borderBottom: "2px solid #111", paddingBottom: 14 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
          <div>
            <div style={{ fontSize: 10, letterSpacing: "0.22em", color: "#777" }}>WORLD MONITOR · BRIEFING</div>
            <h1 style={{ fontSize: 28, fontWeight: 600, margin: "4px 0 0" }}>
              {theater ? theater.label : watchlist.length > 0 ? `Watchlist: ${watchlist.join(", ")}` : "Global Situation Report"}
            </h1>
            <div style={{ fontSize: 12, color: "#555", marginTop: 6 }}>
              {now.toISOString().slice(0, 16).replace("T", " ")} UTC · last {sinceHours}h · {news.length} news · {signals.length} signals
            </div>
          </div>
          <button className="no-print" onClick={undefined} style={{ background: "#111", color: "#fff", border: "none", padding: "10px 14px", cursor: "pointer", fontSize: 11, letterSpacing: "0.18em" }}>
            PRINT ↗
          </button>
        </div>
      </header>

      <section>
        <h2 className="briefing-h2">Executive Summary</h2>
        <p style={{ fontSize: 14, color: "#111", margin: "0 0 8px", lineHeight: 1.5 }}>{brief.headline}</p>
        {brief.bullets.length > 0 && (
          <ul style={{ paddingLeft: 20, margin: "10px 0 0", lineHeight: 1.5, fontSize: 12 }}>
            {brief.bullets.map((b, i) => <li key={i}>{b}</li>)}
          </ul>
        )}
        {brief.credibility && (
          <div style={{ marginTop: 12, fontSize: 10, color: "#555", letterSpacing: "0.16em", textTransform: "uppercase" }}>
            Confidence: {brief.credibility.confidence} · {brief.credibility.sourcesAnalyzed} sources · {brief.credibility.independentSources} independent
            {brief.credibility.stateMediaSources > 0 ? ` · ${brief.credibility.stateMediaSources} state-media` : ""}
          </div>
        )}
        <div style={{ marginTop: 10, fontSize: 10, color: "#999" }}>
          Model: {brief.model ?? "fallback"} · Generated {new Date(brief.generated).toISOString().slice(0, 16).replace("T", " ")} UTC
        </div>
      </section>

      <section>
        <h2 className="briefing-h2">Strategic Posture</h2>
        <table style={{ width: "100%", fontSize: 12, borderCollapse: "collapse" }}>
          <tbody>
            {brief.theaters.map((t) => (
              <tr key={t.name} style={{ borderBottom: "1px solid #eee" }}>
                <td style={{ padding: "6px 0", fontWeight: 600, width: 180 }}>{t.name}</td>
                <td style={{ padding: "6px 0", width: 80, color: "#777", letterSpacing: "0.12em", fontSize: 10 }}>{t.level}</td>
                <td style={{ padding: "6px 0", color: "#444" }}>{t.note}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      {signals.length > 0 && (
        <section>
          <h2 className="briefing-h2">Active Signals · top {Math.min(20, signals.length)}</h2>
          <ul className="briefing-list">
            {signals.slice(0, 20).map((s) => (
              <li key={s.id}>
                <strong>[{s.severity.toUpperCase()}]</strong> {s.title}{" "}
                <span style={{ color: "#777" }}>· {s.country ?? s.region ?? "Global"} · {new Date(s.occurredAt).toISOString().slice(0, 10)}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section>
        <h2 className="briefing-h2">News Highlights · top {Math.min(30, news.length)}</h2>
        <ul className="briefing-list">
          {news.slice(0, 30).map((n) => {
            const p = getProvenance(n.sourceSlug, n.region);
            return (
              <li key={n.id}>
                <span style={{ marginRight: 4 }}>{flagEmoji(p.country)}</span>
                <strong>{n.sourceName}</strong> <span style={{ color: "#999" }}>[{affiliationLabel(p.affiliation)}]</span> — {n.title}{" "}
                <span style={{ color: "#777" }}>· {new Date(n.publishedAt).toISOString().slice(0, 16).replace("T", " ")} UTC</span>
              </li>
            );
          })}
        </ul>
      </section>

      <section>
        <h2 className="briefing-h2">Sanctions Activity · last {sinceHours}h</h2>
        <table style={{ width: "100%", fontSize: 11, borderCollapse: "collapse" }}>
          <tbody>
            <tr>
              {(["ofac", "eu", "uk", "bis"] as const).map((j) => (
                <td key={j} style={{ padding: "6px 8px", border: "1px solid #ddd" }}>
                  <strong>{j.toUpperCase()}</strong>: +{sanctions.totals[j].added24h} (24h) · {sanctions.totals[j].total.toLocaleString()} total
                </td>
              ))}
            </tr>
          </tbody>
        </table>
        {sanctions.added.length > 0 && (
          <ul className="briefing-list" style={{ marginTop: 8 }}>
            {sanctions.added.slice(0, 15).map((s) => (
              <li key={s.externalKey}>
                <strong>{s.jurisdiction.toUpperCase()} {s.listName}</strong> — {s.entityName}
                {s.program ? <span style={{ color: "#777" }}> · {s.program}</span> : ""}
                {s.addressCountry ? <span style={{ color: "#777" }}> · {s.addressCountry}</span> : ""}
              </li>
            ))}
          </ul>
        )}
      </section>

      <section>
        <h2 className="briefing-h2">Cyber Threat Intelligence · last 14d</h2>
        <ul className="briefing-list">
          {cyber.recent.slice(0, 15).map((c) => (
            <li key={c.externalKey}>
              <strong>{c.source.toUpperCase()}</strong>{c.cve ? ` · ${c.cve}` : ""}{c.cvss ? ` · CVSS ${Number(c.cvss).toFixed(1)}` : ""}{c.severity ? ` · ${c.severity.toUpperCase()}` : ""} — {c.title}
            </li>
          ))}
        </ul>
      </section>

      <footer style={{ marginTop: 32, paddingTop: 12, borderTop: "1px solid #ddd", fontSize: 10, color: "#777", display: "flex", justifyContent: "space-between" }}>
        <span>watchcomman-monitor / world-monitor</span>
        <span>UNCLASSIFIED · FOR ANALYST USE</span>
      </footer>
    </main>
  );
}
