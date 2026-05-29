import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { MilitaryAirPanel } from "@/components/MilitaryAirPanel";
import { getMilitaryFlights } from "@/lib/military-flights";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";
export const revalidate = 120;

export const metadata: Metadata = {
  title: "Military Aviation Tracker — World Monitor",
  description: "Live military aircraft positions from ADSB.lol — global view with regional breakdown, emergency squawks, country-of-origin from ICAO hex.",
};

export default async function Page() {
  const flights = await getMilitaryFlights();
  return (
    <>
      <Header />
      <main>
        <section style={{ padding: "30px 28px 14px" }}>
          <div className="wm-shell">
            <div className="wm-mono" style={{ fontSize: 10, color: "var(--accent)", letterSpacing: "0.22em" }}>● MILITARY AVIATION</div>
            <h1 className="wm-display" style={{ fontSize: "clamp(28px, 4vw, 44px)", margin: "8px 0 0" }}>Military Air Tracker</h1>
            <p style={{ color: "var(--ink-2)", marginTop: 8, fontSize: 13, maxWidth: 800, lineHeight: 1.6 }}>
              Every aircraft currently flagged as military in ADSB.lol&apos;s open database — live, refreshed every 2 minutes. Country derived from ICAO 24-bit hex.
            </p>
          </div>
        </section>
        <section style={{ padding: "0 28px 32px" }}>
          <div className="wm-shell"><MilitaryAirPanel flights={flights} /></div>
        </section>
        <Footer />
      </main>
    </>
  );
}
