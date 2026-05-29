import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { getSupporterByUnsub, getApiKeyForSupporter } from "@/lib/supporters";
import { AccountClient } from "./AccountClient";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Your account — World Monitor",
  description: "Manage your supporter status, API key, and daily brief preferences.",
};

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

export default async function Page({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const token = typeof params.token === "string" ? params.token : null;
  const supporter = token ? await getSupporterByUnsub(token) : null;
  const apiKey = supporter ? await getApiKeyForSupporter(supporter.id) : null;

  return (
    <>
      <Header />
      <main>
        <section style={{ padding: "30px 28px 14px" }}>
          <div className="wm-shell">
            <div className="wm-mono" style={{ fontSize: 10, color: "var(--accent)", letterSpacing: "0.22em" }}>● ACCOUNT</div>
            <h1 className="wm-display" style={{ fontSize: "clamp(28px, 4vw, 44px)", margin: "8px 0 0" }}>Your account</h1>
            <p style={{ color: "var(--ink-2)", marginTop: 8, fontSize: 13, maxWidth: 800, lineHeight: 1.6 }}>
              Find your <a href="?token=YOUR_TOKEN" style={{ color: "var(--accent)" }}>account token</a> in the link at the bottom of any daily brief email.
            </p>
          </div>
        </section>

        <section style={{ padding: "0 28px 32px" }}>
          <div className="wm-shell" style={{ display: "grid", gap: 14, maxWidth: 720 }}>
            {!supporter ? (
              <div className="wm-glass" style={{ padding: 20 }}>
                <h2 style={{ fontSize: 16, margin: "0 0 8px" }}>Sign in via your email link</h2>
                <p style={{ color: "var(--ink-2)", fontSize: 13 }}>
                  Add <code>?token=…</code> to the URL with the unsubscribe token from your welcome email. If you&apos;ve lost it, donate again at <a href="https://buymeacoffee.com" style={{ color: "var(--accent)" }}>Buy Me a Coffee</a> with the same email — we&apos;ll merge your record and resend the welcome.
                </p>
              </div>
            ) : (
              <AccountClient
                email={supporter.email}
                name={supporter.name}
                tier={supporter.tier}
                amountTotalCents={supporter.amountTotalCents}
                currency={supporter.currency}
                firstDonationAt={supporter.firstDonationAt.toISOString()}
                lastDonationAt={supporter.lastDonationAt.toISOString()}
                active={supporter.active}
                token={token!}
                apiKeyPrefix={apiKey?.prefix ?? null}
              />
            )}
          </div>
        </section>
        <Footer />
      </main>
    </>
  );
}
