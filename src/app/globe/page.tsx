import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { GlobeSection } from "@/components/GlobeSection";
import { getDashboardSnapshot } from "@/lib/dashboard";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";
export const revalidate = 60;

export const metadata: Metadata = {
  title: "3D Globe — World Monitor",
  description: "Interactive 3D Earth with all active signals plotted as points. Drag to rotate, hover to inspect.",
};

export default async function Page() {
  const snap = await getDashboardSnapshot(800);
  const located = snap.signals.filter((s) => s.latitude != null && s.longitude != null);

  return (
    <>
      <Header />
      <main>
        <section style={{ padding: "30px 28px 14px" }}>
          <div className="wm-shell">
            <div className="wm-mono" style={{ fontSize: 10, color: "var(--accent)", letterSpacing: "0.22em" }}>● 3D ATLAS</div>
            <h1 className="wm-display" style={{ fontSize: "clamp(28px, 4vw, 44px)", margin: "8px 0 0" }}>Globe</h1>
            <p style={{ color: "var(--ink-2)", marginTop: 8, fontSize: 13, maxWidth: 800, lineHeight: 1.6 }}>
              {located.length.toLocaleString()} active signals plotted on a hand-shaded 3D Earth. Drag to rotate · hover any point for detail.
            </p>
          </div>
        </section>
        <section style={{ padding: "0 28px 32px" }}>
          <div className="wm-shell" style={{ position: "relative", minHeight: 620 }}>
            <GlobeSection signals={snap.signals} regions={snap.regions} categories={snap.categories} />
          </div>
        </section>
        <Footer />
      </main>
    </>
  );
}
