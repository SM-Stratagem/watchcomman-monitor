import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { ContractsPanel } from "@/components/ContractsPanel";
import { getContracts } from "@/lib/contracts";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";
export const revalidate = 300;

export const metadata: Metadata = {
  title: "Defense Contracts — World Monitor",
  description: "Live defense procurement opportunities from SAM.gov, EU TED, UK MOD, and DSCA Foreign Military Sales notifications.",
};

export default async function Page() {
  const data = await getContracts(200);
  return (
    <>
      <Header />
      <main>
        <section style={{ padding: "30px 28px 14px" }}>
          <div className="wm-shell">
            <div className="wm-mono" style={{ fontSize: 10, color: "var(--accent)", letterSpacing: "0.22em" }}>● DEFENSE PROCUREMENT</div>
            <h1 className="wm-display" style={{ fontSize: "clamp(28px, 4vw, 44px)", margin: "8px 0 0" }}>Defense Contracts</h1>
            <p style={{ color: "var(--ink-2)", marginTop: 8, fontSize: 13, maxWidth: 800, lineHeight: 1.6 }}>
              Live procurement opportunities — SAM.gov (US federal, defense NAICS only), EU TED (CPV 35*), UK Contracts Finder MOD/DSTL/DASA, and DSCA Foreign Military Sales notifications to Congress.
            </p>
          </div>
        </section>
        <section style={{ padding: "0 28px 32px" }}>
          <div className="wm-shell"><ContractsPanel data={data} /></div>
        </section>
        <Footer />
      </main>
    </>
  );
}
