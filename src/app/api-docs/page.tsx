import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Public API — Watchcomman Monitor",
  description: "Free public JSON & RSS API for live disease, disaster, and environmental signals tracked by Watchcomman Monitor.",
};

const Box = ({ children }: { children: React.ReactNode }) => (
  <pre className="wm-mono" style={{
    background: "rgba(255,255,255,0.03)", padding: 14, borderRadius: 10,
    border: "1px solid var(--line)", fontSize: 12, color: "var(--ink-1)", overflow: "auto",
  }}>{children}</pre>
);

export default function Page() {
  return (
    <>
      <Header />
      <main style={{ paddingTop: 72, paddingBottom: 40 }}>
        <div className="wm-shell" style={{ maxWidth: 880 }}>
          <div className="wm-eyebrow">Developers</div>
          <h1 className="wm-display" style={{ fontSize: "clamp(36px, 5vw, 64px)", margin: "8px 0 18px" }}>Public API</h1>
          <p style={{ color: "var(--ink-2)", fontSize: 14, lineHeight: 1.7 }}>
            Watchcomman Monitor exposes a free, no-key JSON and RSS surface so researchers, journalists, and other
            dashboards can re-use the normalised signal stream. CORS is open. Be kind — keep cached responses for at least
            60 seconds.
          </p>

          <h2 className="wm-headline" style={{ fontSize: 22, marginTop: 36 }}>GET /api/v1/signals</h2>
          <p style={{ color: "var(--ink-2)", fontSize: 13, lineHeight: 1.6 }}>
            Returns the latest signals in the rolling window, optionally filtered.
          </p>
          <Box>
{`# Optional query params
?category=earthquake     # outbreak | advisory | environment | earthquake | wildfire | storm | flood | disaster | logistics
?severity=high           # low | moderate | elevated | high | critical
?source=usgs             # usgs | nasa-eonet | reliefweb | gdacs | who | ebola | hantavirus | seed
?country=Chile
?region=South+America
?since=24                # hours
?limit=50                # 1-500, default 50

GET https://watchcomman-monitor-production.up.railway.app/api/v1/signals?category=earthquake&since=24`}
          </Box>

          <h2 className="wm-headline" style={{ fontSize: 22, marginTop: 36 }}>GET /api/v1/stats</h2>
          <p style={{ color: "var(--ink-2)", fontSize: 13, lineHeight: 1.6 }}>
            Aggregate totals plus per-region, per-country, and per-category rollups.
          </p>
          <Box>{`GET /api/v1/stats`}</Box>

          <h2 className="wm-headline" style={{ fontSize: 22, marginTop: 36 }}>GET /api/v1/signals.rss</h2>
          <p style={{ color: "var(--ink-2)", fontSize: 13, lineHeight: 1.6 }}>
            RSS 2.0 feed of the past 72 hours of signals. Same filter parameters as JSON.
          </p>
          <Box>{`GET /api/v1/signals.rss?category=outbreak`}</Box>

          <h2 className="wm-headline" style={{ fontSize: 22, marginTop: 36 }}>Embed widget</h2>
          <p style={{ color: "var(--ink-2)", fontSize: 13, lineHeight: 1.6 }}>
            Drop the live world map into your own page:
          </p>
          <Box>
{`<iframe src="https://watchcomman-monitor-production.up.railway.app/embed/map"
        width="100%" height="540"
        style="border:0; border-radius:14px"
        loading="lazy"></iframe>`}
          </Box>

          <h2 className="wm-headline" style={{ fontSize: 22, marginTop: 36 }}>Attribution</h2>
          <p style={{ color: "var(--ink-2)", fontSize: 13, lineHeight: 1.6 }}>
            Underlying data: USGS, NASA EONET, ReliefWeb (OCHA), GDACS, WHO Disease Outbreak News, and our sibling
            monitors. Please credit each underlying source when re-publishing. A &quot;Powered by Watchcomman Monitor&quot;
            link back is appreciated.
          </p>
        </div>
      </main>
      <Footer lastIngestAt={null} />
    </>
  );
}
