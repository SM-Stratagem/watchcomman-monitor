import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { TimelineClient } from "./TimelineClient";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Time Machine — World Monitor",
  description: "Scrub through the last 24h–30d of signals and news. Hover any bar to inspect that hour's intensity.",
};

export default function Page() {
  return (
    <>
      <Header />
      <main>
        <section style={{ padding: "30px 28px 14px" }}>
          <div className="wm-shell">
            <div className="wm-mono" style={{ fontSize: 10, color: "var(--accent)", letterSpacing: "0.22em" }}>● TIME MACHINE</div>
            <h1 className="wm-display" style={{ fontSize: "clamp(28px, 4vw, 44px)", margin: "8px 0 0" }}>Time Machine</h1>
            <p style={{ color: "var(--ink-2)", marginTop: 8, fontSize: 13, maxWidth: 800, lineHeight: 1.6 }}>
              Scrub through the last 24 hours to 30 days of signals + news. Each bar is one hour; red bars contain high/critical signals.
            </p>
          </div>
        </section>
        <section style={{ padding: "0 28px 32px" }}>
          <div className="wm-shell"><TimelineClient /></div>
        </section>
        <Footer />
      </main>
    </>
  );
}
