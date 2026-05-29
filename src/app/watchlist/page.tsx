import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { WatchlistManager } from "@/components/WatchlistManager";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Watchlist — World Monitor",
  description: "Track entities, regions, and keywords across global OSINT feeds — saved locally, instant matching.",
};

export default function Page() {
  return (
    <>
      <Header />
      <main>
        <section style={{ padding: "30px 28px 14px" }}>
          <div className="wm-shell">
            <div className="wm-mono" style={{ fontSize: 10, color: "var(--accent)", letterSpacing: "0.22em" }}>● WATCHLIST</div>
            <h1 className="wm-display" style={{ fontSize: "clamp(28px, 4vw, 44px)", margin: "8px 0 0" }}>Watchlist</h1>
            <p style={{ color: "var(--ink-2)", marginTop: 8, fontSize: 13, maxWidth: 800, lineHeight: 1.6 }}>
              Track entities, regions, technologies, or any keyword across 280+ live OSINT sources, sanctions feeds, and active signals. Terms are stored only in your browser.
            </p>
          </div>
        </section>
        <section style={{ padding: "0 28px 32px" }}>
          <div className="wm-shell"><WatchlistManager /></div>
        </section>
        <Footer />
      </main>
    </>
  );
}
