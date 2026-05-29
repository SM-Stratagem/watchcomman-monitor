import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { THEATERS } from "@/lib/theaters";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Theater Dashboards — World Monitor",
  description: "Curated geopolitical theater dashboards: Ukraine, Taiwan, Red Sea, Korea, Levant.",
};

export default function Page() {
  return (
    <>
      <Header />
      <main>
        <section style={{ padding: "30px 28px 14px" }}>
          <div className="wm-shell">
            <div className="wm-mono" style={{ fontSize: 10, color: "var(--accent)", letterSpacing: "0.22em" }}>● THEATERS</div>
            <h1 className="wm-display" style={{ fontSize: "clamp(28px, 4vw, 44px)", margin: "8px 0 0" }}>Theater Dashboards</h1>
            <p style={{ color: "var(--ink-2)", marginTop: 8, fontSize: 13, maxWidth: 800, lineHeight: 1.6 }}>
              Curated views over the world&apos;s most active flashpoints — each with a focused source set, signal filter, AI brief, and adversary tracker.
            </p>
          </div>
        </section>
        <section style={{ padding: "0 28px 32px" }}>
          <div className="wm-shell" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: 14 }}>
            {THEATERS.map((t) => (
              <a key={t.slug} href={`/theater/${t.slug}`} className="wm-glass" style={{ padding: 16, display: "block" }}>
                <div className="wm-mono" style={{ fontSize: 9, color: t.accent, letterSpacing: "0.22em" }}>{t.shortName.toUpperCase()}</div>
                <h2 style={{ fontSize: 18, color: "var(--ink-0)", margin: "6px 0 4px" }}>{t.label}</h2>
                <p style={{ fontSize: 12, color: "var(--ink-2)", lineHeight: 1.5 }}>{t.description}</p>
                <div className="wm-mono" style={{ marginTop: 8, fontSize: 9, color: "var(--ink-3)", letterSpacing: "0.16em" }}>
                  {t.sourceSlugs.length} CURATED SOURCES · {t.countries.length} COUNTRIES
                </div>
              </a>
            ))}
          </div>
        </section>
        <Footer />
      </main>
    </>
  );
}
