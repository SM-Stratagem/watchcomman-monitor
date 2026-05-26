import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { SourceManager } from "@/components/SourceManager";
import { REGIONS, SOURCES } from "@/lib/sources";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Sources — Watchcomman Monitor",
  description: "Browse and toggle all 216 OSINT news sources monitored by Watchcomman Monitor — by region.",
};

export default function Page() {
  return (
    <>
      <Header />
      <main style={{ paddingTop: 72, paddingBottom: 40 }}>
        <div className="wm-shell" style={{ maxWidth: 1100 }}>
          <div className="wm-eyebrow">Sources</div>
          <h1 className="wm-display" style={{ fontSize: "clamp(36px, 5vw, 64px)", margin: "8px 0 18px" }}>News source library</h1>
          <p style={{ color: "var(--ink-2)", fontSize: 14, lineHeight: 1.6, maxWidth: 720, marginBottom: 22 }}>
            We monitor {SOURCES.length} sources across {REGIONS.length} regional/topic buckets. Toggle the ones you care
            about — your selection is saved locally and applied to dashboard panels. Sources without a public RSS endpoint
            are listed for transparency but greyed out.
          </p>
          <SourceManager sources={SOURCES} regions={REGIONS} />
        </div>
      </main>
      <Footer lastIngestAt={null} />
    </>
  );
}
