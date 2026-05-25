import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";

export const metadata = {
  title: "Privacy — Watchcomman Monitor",
  description: "Privacy and data handling notes for the Watchcomman Monitor platform.",
};

export default function PrivacyPage() {
  return (
    <>
      <Header />
      <main className="wm-shell" style={{ paddingTop: 64, paddingBottom: 80, maxWidth: 760 }}>
        <div className="wm-eyebrow">Privacy</div>
        <h1
          style={{
            fontFamily: "var(--font-display)",
            fontWeight: 300,
            fontSize: "clamp(36px, 5vw, 60px)",
            margin: "10px 0 28px",
            letterSpacing: "-0.01em",
            lineHeight: 1.05,
          }}
        >
          What we collect, and what we don&apos;t.
        </h1>
        <p style={{ color: "var(--ink-1)", fontSize: 16, lineHeight: 1.75 }}>
          Watchcomman Monitor is a publishing surface. Pages are rendered server-side and do not
          require an account. We do not collect personally identifying information from visitors.
        </p>
        <p style={{ color: "var(--ink-1)", fontSize: 16, lineHeight: 1.75, marginTop: 18 }}>
          We may aggregate anonymous request metadata (path, status, timing) for operational
          health, served by our hosting provider. Display advertising, where present, is governed
          by the publisher manifest at <a href="/ads.txt">/ads.txt</a>.
        </p>
        <p style={{ color: "var(--ink-1)", fontSize: 16, lineHeight: 1.75, marginTop: 18 }}>
          For questions, contact the operator listed in the GitHub repository hosting this
          project.
        </p>
      </main>
      <Footer lastIngestAt={null} />
    </>
  );
}
