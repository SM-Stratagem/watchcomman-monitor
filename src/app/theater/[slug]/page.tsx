import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { OsintMap } from "@/components/OsintMap";
import { NewsPanel } from "@/components/NewsPanel";
import { AiBriefPanel } from "@/components/AiBriefPanel";
import { CrossSourceAggregator } from "@/components/CrossSourceAggregator";
import { CountryInstability } from "@/components/CountryInstability";
import { CyberPanel } from "@/components/CyberPanel";
import { SanctionsPanel } from "@/components/SanctionsPanel";
import { THEATERS, THEATERS_BY_SLUG, type Theater, isSignalInTheater, isNewsInTheater } from "@/lib/theaters";
import { getDashboardSnapshot, getNews } from "@/lib/dashboard";
import { getAiBrief } from "@/lib/ai";
import { getCyberPanel } from "@/lib/cyber";
import { getSanctionsDelta } from "@/lib/sanctions-diff";

export const dynamic = "force-dynamic";
export const revalidate = 60;

export async function generateStaticParams(): Promise<Array<{ slug: string }>> {
  return THEATERS.map((t) => ({ slug: t.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const t = THEATERS_BY_SLUG[slug];
  if (!t) return { title: "Theater not found — World Monitor" };
  return {
    title: `${t.label} — World Monitor Theater Dashboard`,
    description: t.description,
  };
}

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const theater: Theater | undefined = THEATERS_BY_SLUG[slug];
  if (!theater) notFound();

  const [snap, allNews, cyber, sanctions] = await Promise.all([
    getDashboardSnapshot(500),
    getNews({ sinceHours: 48, limit: 400, sources: theater.sourceSlugs }),
    getCyberPanel(),
    getSanctionsDelta(24),
  ]);

  // Filter signals + news to theater
  const sigs = snap.signals.filter((s) => isSignalInTheater(theater, s));
  const news = allNews.filter((n) => isNewsInTheater(theater, n));
  const brief = await getAiBrief(news, sigs);

  const theaterCountries = snap.countries.filter((c) =>
    theater.countries.some((tc) => tc.toLowerCase() === c.key.toLowerCase()),
  );

  return (
    <>
      <Header />
      <main>
        <section style={{ padding: "30px 28px 14px" }}>
          <div className="wm-shell">
            <div style={{ display: "flex", gap: 14, alignItems: "baseline", flexWrap: "wrap" }}>
              <div className="wm-mono" style={{ fontSize: 10, color: theater.accent, letterSpacing: "0.22em" }}>● THEATER · {theater.shortName.toUpperCase()}</div>
              <nav style={{ display: "inline-flex", gap: 6, fontSize: 10 }}>
                {THEATERS.map((t) => (
                  <a key={t.slug} href={`/theater/${t.slug}`} className="wm-mono" style={{
                    color: t.slug === theater.slug ? "var(--ink-0)" : "var(--ink-3)",
                    padding: "2px 8px", borderRadius: 4, border: "1px solid var(--line)",
                    letterSpacing: "0.16em",
                  }}>{t.shortName.toUpperCase()}</a>
                ))}
              </nav>
            </div>
            <h1 className="wm-display" style={{ fontSize: "clamp(28px, 4vw, 44px)", margin: "8px 0 0" }}>{theater.label}</h1>
            <p style={{ color: "var(--ink-2)", marginTop: 8, fontSize: 13, maxWidth: 800, lineHeight: 1.6 }}>{theater.description}</p>
            <div className="wm-mono" style={{ marginTop: 8, fontSize: 10, color: "var(--ink-3)", letterSpacing: "0.18em" }}>
              {sigs.length} SIGNALS · {news.length} NEWS · {theaterCountries.length} COUNTRIES · {theater.sourceSlugs.length} CURATED SOURCES
            </div>
          </div>
        </section>

        <section style={{ padding: "0 28px 22px" }}>
          <div className="wm-shell"><OsintMap signals={sigs} /></div>
        </section>

        <section style={{ padding: "0 28px 22px" }}>
          <div className="wm-shell" style={{ display: "grid", gridTemplateColumns: "minmax(0, 1fr) minmax(0, 1.4fr) minmax(0, 1fr)", gap: 14 }}>
            <AiBriefPanel brief={brief} />
            <CrossSourceAggregator items={news.slice(0, 80)} />
            <CountryInstability countries={theaterCountries} />
          </div>
        </section>

        <section style={{ padding: "0 28px 22px" }}>
          <div className="wm-shell" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: 14 }}>
            <SanctionsPanel delta={sanctions} compact />
            <CyberPanel data={cyber} compact />
          </div>
        </section>

        <section style={{ padding: "0 28px 32px" }}>
          <div className="wm-shell">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 14 }}>
              <div>
                <div className="wm-eyebrow">Live news · {theater.shortName}</div>
                <h2 style={{ fontFamily: "var(--font-display)", fontWeight: 300, fontSize: 24, margin: "6px 0 0" }}>Curated sources · 48h</h2>
              </div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: 14 }}>
              <NewsPanel title="Top of feed" accent={theater.accent} items={news.slice(0, 18)} badge={`${news.length} · LIVE`} height={420} />
              <NewsPanel title="Wire / Mainstream" accent="var(--accent)" items={news.filter((n) => ["ap-news","reuters-world","bbc-world","guardian-world","afp"].includes(n.sourceSlug)).slice(0, 18)} />
              <NewsPanel title="Analyst / Think-tank" accent="var(--accent-cool)" items={news.filter((n) => ["csis","iiss","rusi","rand","atlantic-council","cipher-brief","recorded-future","brookings","cfr","lawfare-blog"].includes(n.sourceSlug)).slice(0, 18)} />
              <NewsPanel title="Gov / Defense" accent="var(--accent-warm)" items={news.filter((n) => ["pentagon","uk-mod","state-dept","cisa","white-house","treasury","dhs"].includes(n.sourceSlug)).slice(0, 18)} />
              <NewsPanel title="Regional native" accent={theater.accent} items={news.filter((n) => !["ap-news","reuters-world","bbc-world","guardian-world","afp","csis","iiss","rusi","rand","atlantic-council","cipher-brief","recorded-future","brookings","cfr","lawfare-blog","pentagon","uk-mod","state-dept","cisa","white-house","treasury","dhs"].includes(n.sourceSlug)).slice(0, 18)} />
              <NewsPanel title="State media (flagged)" accent="var(--accent-hot)" items={news.filter((n) => ["rt","tass","sputnik","xinhua","global-times","cgtn","people-daily","press-tv","irna","kcna"].includes(n.sourceSlug)).slice(0, 18)} />
            </div>
          </div>
        </section>

        <Footer />
      </main>
    </>
  );
}
