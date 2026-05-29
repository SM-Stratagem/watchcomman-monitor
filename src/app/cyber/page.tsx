import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { CyberPanel } from "@/components/CyberPanel";
import { getCyberPanel } from "@/lib/cyber";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";
export const revalidate = 300;

export const metadata: Metadata = {
  title: "Cyber Threat Intel — World Monitor",
  description: "CISA KEV catalog, critical NVD CVEs, recent breach disclosures — defense-grade vulnerability intelligence.",
};

export default async function Page() {
  const data = await getCyberPanel();
  return (
    <>
      <Header />
      <main>
        <section style={{ padding: "30px 28px 14px" }}>
          <div className="wm-shell">
            <div className="wm-mono" style={{ fontSize: 10, color: "var(--accent)", letterSpacing: "0.22em" }}>● CYBER THREAT INTEL</div>
            <h1 className="wm-display" style={{ fontSize: "clamp(28px, 4vw, 44px)", margin: "8px 0 0" }}>Cyber Threat Intel</h1>
            <p style={{ color: "var(--ink-2)", marginTop: 8, fontSize: 13, maxWidth: 800, lineHeight: 1.6 }}>
              CISA Known Exploited Vulnerabilities, NIST NVD critical CVEs (CVSS ≥ 7.0), and recent breach disclosures from HaveIBeenPwned.
            </p>
          </div>
        </section>
        <section style={{ padding: "0 28px 32px" }}>
          <div className="wm-shell"><CyberPanel data={data} /></div>
        </section>
        <Footer />
      </main>
    </>
  );
}
