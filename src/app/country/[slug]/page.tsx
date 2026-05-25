import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { SignalRowItem } from "@/components/SignalRow";
import { Sparkline } from "@/components/Sparkline";
import { getDashboardSnapshot, getSignalsFiltered } from "@/lib/dashboard";
import { severityColor, slugify, unslugify } from "@/lib/format";
import { notFound } from "next/navigation";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";
export const revalidate = 60;

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const snap = await getDashboardSnapshot(500);
  const country = unslugify(slug, snap.countries.map((c) => c.key)) ?? slug.replace(/-/g, " ");
  return {
    title: `${country} — Country signals — Watchcomman Monitor`,
    description: `Live signals tracked for ${country} by Watchcomman Monitor: outbreaks, disasters, earthquakes, wildfires, and environmental events.`,
  };
}

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const snap = await getDashboardSnapshot(500);
  const country = unslugify(slug, snap.countries.map((c) => c.key));
  if (!country) notFound();

  const rows = await getSignalsFiltered({ country, sinceHours: 24 * 60, limit: 200 });

  const days = 21;
  const start = new Date();
  start.setUTCHours(0, 0, 0, 0);
  const buckets: Array<{ date: string; count: number }> = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(start.getTime() - i * 24 * 60 * 60 * 1000);
    const next = d.getTime() + 24 * 60 * 60 * 1000;
    buckets.push({
      date: d.toISOString().slice(0, 10),
      count: rows.filter((s) => {
        const t = new Date(s.occurredAt).getTime();
        return t >= d.getTime() && t < next;
      }).length,
    });
  }
  const highCount = rows.filter((r) => r.severity === "high" || r.severity === "critical").length;
  const cats = new Map<string, number>();
  for (const s of rows) cats.set(s.category, (cats.get(s.category) ?? 0) + 1);

  return (
    <>
      <Header />
      <main style={{ paddingTop: 72, paddingBottom: 40 }}>
        <div className="wm-shell">
          <a href="/signals" className="wm-mono" style={{ fontSize: 11, color: "var(--ink-2)", letterSpacing: "0.2em" }}>
            ← BACK TO STREAM
          </a>
          <div className="wm-eyebrow" style={{ marginTop: 18 }}>Country</div>
          <h1 className="wm-display" style={{ fontSize: "clamp(36px, 5vw, 64px)", margin: "8px 0 18px" }}>{country}</h1>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 18, marginTop: 24 }}>
            <div className="wm-glass" style={{ padding: 18 }}>
              <div className="wm-eyebrow">Active (60d)</div>
              <div className="wm-display" style={{ fontSize: 40, marginTop: 8 }}>{rows.length}</div>
            </div>
            <div className="wm-glass" style={{ padding: 18 }}>
              <div className="wm-eyebrow">High / critical</div>
              <div className="wm-display" style={{ fontSize: 40, marginTop: 8, color: severityColor("high") }}>{highCount}</div>
            </div>
            <div className="wm-glass" style={{ padding: 18 }}>
              <div className="wm-eyebrow">Trend · 21d</div>
              <div style={{ marginTop: 8 }}>
                <Sparkline data={buckets} width={260} height={50} color="var(--accent-warm)" />
              </div>
            </div>
            <div className="wm-glass" style={{ padding: 18 }}>
              <div className="wm-eyebrow">By category</div>
              <div style={{ marginTop: 10, display: "flex", flexWrap: "wrap", gap: 6 }}>
                {Array.from(cats.entries()).sort((a, b) => b[1] - a[1]).map(([c, n]) => (
                  <a key={c} href={`/disease/${c}`} className="wm-mono" style={{ fontSize: 10, padding: "4px 10px", borderRadius: 999, border: "1px solid var(--line-strong)", color: "var(--ink-1)" }}>
                    {c} · {n}
                  </a>
                ))}
              </div>
            </div>
          </div>

          <section style={{ marginTop: 40 }}>
            <div className="wm-eyebrow">Recent signals · {country}</div>
            <ul style={{ listStyle: "none", margin: "14px 0 0", padding: 0, borderTop: "1px solid var(--line)" }}>
              {rows.slice(0, 50).map((s) => <SignalRowItem key={s.id} s={s} showCountry={false} />)}
            </ul>
          </section>
        </div>
      </main>
      <Footer lastIngestAt={snap.totals.lastIngestAt} />
    </>
  );
}

export function generateStaticParams() {
  // Common countries we may have data for; static list is fine — dynamic countries resolve via on-demand routing.
  return [].map((c: string) => ({ slug: slugify(c) }));
}
