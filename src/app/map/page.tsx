import Link from "next/link";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { WorldMap } from "@/components/WorldMap";
import { getDashboardSnapshot } from "@/lib/dashboard";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";
export const revalidate = 60;

export const metadata: Metadata = {
  title: "Live world map — Watchcomman Monitor",
  description: "Equirectangular live map of every active disease, disaster, earthquake, wildfire and environmental signal tracked by Watchcomman Monitor.",
};

export default async function Page() {
  const snap = await getDashboardSnapshot(500);
  return (
    <>
      <Header />
      <main style={{ paddingTop: 72, paddingBottom: 40 }}>
        <div className="wm-shell">
          <div className="wm-eyebrow">Atlas</div>
          <h1 className="wm-display" style={{ fontSize: "clamp(36px, 5vw, 64px)", margin: "8px 0 18px" }}>Live world map</h1>
          <p style={{ color: "var(--ink-2)", fontSize: 14, maxWidth: 640, lineHeight: 1.6, marginBottom: 28 }}>
            Every geolocated signal in the rolling window. Hover any marker for detail; filter by severity or category.
            Prefer the 3D atlas? <Link href="/#globe" style={{ color: "var(--accent)" }}>Open the globe →</Link>
          </p>
          <WorldMap signals={snap.signals} />
        </div>
      </main>
      <Footer lastIngestAt={snap.totals.lastIngestAt} />
    </>
  );
}
