import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { MaritimePanel } from "@/components/MaritimePanel";
import { NewsItem } from "@/components/NewsItem";
import { getDashboardSnapshot, getNews } from "@/lib/dashboard";
import { computeChokepointStatus, maritimeNewsFilter } from "@/lib/maritime";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";
export const revalidate = 120;

export const metadata: Metadata = {
  title: "Maritime Intel — World Monitor",
  description: "Live status of global maritime chokepoints (Hormuz, Bab el-Mandeb, Suez, Malacca, Bosporus, Taiwan, Panama, Kerch) plus filtered maritime incident headlines.",
};

export default async function Page() {
  const [snap, news] = await Promise.all([
    getDashboardSnapshot(300),
    getNews({ sinceHours: 72, limit: 600 }),
  ]);
  const points = computeChokepointStatus(news, snap.signals);
  const incidents = maritimeNewsFilter(news).slice(0, 60);
  const totalMentions = points.reduce((a, p) => a + p.mentionsLast48h, 0);

  return (
    <>
      <Header />
      <main>
        <section style={{ padding: "30px 28px 14px" }}>
          <div className="wm-shell">
            <div className="wm-mono" style={{ fontSize: 10, color: "var(--accent)", letterSpacing: "0.22em" }}>● MARITIME · GLOBAL TRADE</div>
            <h1 className="wm-display" style={{ fontSize: "clamp(28px, 4vw, 44px)", margin: "8px 0 0" }}>Maritime Intel</h1>
            <p style={{ color: "var(--ink-2)", marginTop: 8, fontSize: 13, maxWidth: 800, lineHeight: 1.6 }}>
              Live risk indicators on 8 strategic narrows — derived from real-time news + signals mentioning each chokepoint. {totalMentions.toLocaleString()} mentions across the last 48h.
            </p>
            <p className="wm-mono" style={{ marginTop: 10, fontSize: 9.5, color: "var(--ink-3)", letterSpacing: "0.18em" }}>
              FOR LIVE VESSEL POSITIONS · OPTIONAL AISSTREAM_API_KEY ENV · BROWSER-SIDE WEBSOCKET
            </p>
          </div>
        </section>

        <section style={{ padding: "0 28px 22px" }}>
          <div className="wm-shell" style={{ display: "grid", gridTemplateColumns: "minmax(0, 1.1fr) minmax(0, 1.4fr)", gap: 14 }}>
            <MaritimePanel items={points} />
            <div className="wm-glass" style={{ padding: 0, display: "flex", flexDirection: "column", minHeight: 320 }}>
              <div style={{ padding: "10px 14px", borderBottom: "1px solid var(--line)" }}>
                <div className="wm-mono" style={{ fontSize: 9, color: "var(--ink-3)", letterSpacing: "0.22em" }}>MARITIME INCIDENTS · 72H</div>
                <div style={{ fontSize: 14, color: "var(--ink-0)", marginTop: 2 }}>{incidents.length} headlines flagged maritime</div>
              </div>
              {incidents.length === 0 ? (
                <div className="wm-mono" style={{ padding: 16, color: "var(--ink-3)", fontSize: 11, textAlign: "center" }}>NO MARITIME INCIDENTS · 72H</div>
              ) : (
                <ul style={{ listStyle: "none", margin: 0, padding: 0, overflow: "auto" }}>
                  {incidents.map((n) => <NewsItem key={n.id} item={n} />)}
                </ul>
              )}
            </div>
          </div>
        </section>

        <Footer />
      </main>
    </>
  );
}
