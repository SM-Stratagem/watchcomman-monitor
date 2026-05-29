"use client";
import { useState } from "react";

type Props = {
  email: string;
  name: string | null;
  tier: string;
  amountTotalCents: number;
  currency: string;
  firstDonationAt: string;
  lastDonationAt: string;
  active: boolean;
  token: string;
  apiKeyPrefix: string | null;
};

function fmtMoney(cents: number, ccy: string): string {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: ccy.toUpperCase() }).format(cents / 100);
}

export function AccountClient(p: Props) {
  const [newKey, setNewKey] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const reissue = async () => {
    if (!confirm("Reissue API key? Your current key will stop working immediately.")) return;
    setLoading(true);
    try {
      const r = await fetch(`/api/account/reissue?token=${encodeURIComponent(p.token)}`, { method: "POST" });
      const d = await r.json();
      if (d.apiKey) setNewKey(d.apiKey);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="wm-glass" style={{ padding: 20 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
          <h2 style={{ fontSize: 18, margin: 0 }}>{p.name ?? p.email}</h2>
          <span className="wm-mono" style={{ fontSize: 9, color: p.active ? "var(--accent)" : "var(--ink-3)", letterSpacing: "0.18em", padding: "2px 8px", border: `1px solid ${p.active ? "var(--accent)" : "var(--line-strong)"}`, borderRadius: 999 }}>
            {p.active ? "ACTIVE" : "UNSUBSCRIBED"}
          </span>
        </div>
        <p style={{ color: "var(--ink-2)", fontSize: 12, marginTop: 4 }}>{p.email}</p>
        <table style={{ width: "100%", marginTop: 12, fontSize: 13 }}>
          <tbody>
            <Row label="Tier" value={p.tier.toUpperCase()} />
            <Row label="Total contributed" value={fmtMoney(p.amountTotalCents, p.currency)} />
            <Row label="Supporter since" value={new Date(p.firstDonationAt).toUTCString().slice(0, 17)} />
            <Row label="Last donation" value={new Date(p.lastDonationAt).toUTCString().slice(0, 17)} />
          </tbody>
        </table>
      </div>

      <div className="wm-glass" style={{ padding: 20 }}>
        <div className="wm-mono" style={{ fontSize: 9, color: "var(--ink-3)", letterSpacing: "0.22em" }}>API KEY</div>
        {newKey ? (
          <>
            <p style={{ color: "var(--accent-warm)", fontSize: 12, marginTop: 8 }}>
              ⚠ Save this now — it won&apos;t be shown again.
            </p>
            <pre style={{ background: "#04060c", color: "var(--accent)", padding: 12, borderRadius: 6, fontSize: 12, overflow: "auto" }}>{newKey}</pre>
          </>
        ) : (
          <p style={{ color: "var(--ink-2)", fontSize: 12, marginTop: 8 }}>
            Current key prefix: <code style={{ color: "var(--accent)" }}>{p.apiKeyPrefix ?? "—"}…</code> (full key was sent to your email on first donation).
          </p>
        )}
        <button
          onClick={reissue}
          disabled={loading}
          className="wm-mono"
          style={{ marginTop: 12, padding: "8px 14px", background: "transparent", border: "1px solid var(--accent-warm)", color: "var(--accent-warm)", borderRadius: 6, fontSize: 10, letterSpacing: "0.18em", cursor: "pointer" }}
        >
          {loading ? "REISSUING…" : "REISSUE KEY"}
        </button>
        <p style={{ marginTop: 14, fontSize: 11, color: "var(--ink-3)" }}>
          Use as <code>X-API-Key</code> header or <code>?api_key=</code> query param on <code>/api/v1/*</code>.
        </p>
      </div>

      <div className="wm-glass" style={{ padding: 20 }}>
        <div className="wm-mono" style={{ fontSize: 9, color: "var(--ink-3)", letterSpacing: "0.22em" }}>SUBSCRIPTION</div>
        {p.active ? (
          <>
            <p style={{ color: "var(--ink-2)", fontSize: 12, marginTop: 8 }}>You receive the daily brief every morning UTC.</p>
            <a href={`/api/email/unsubscribe?token=${encodeURIComponent(p.token)}`} className="wm-mono" style={{ display: "inline-block", marginTop: 12, padding: "8px 14px", border: "1px solid var(--line-strong)", color: "var(--ink-3)", borderRadius: 6, fontSize: 10, letterSpacing: "0.18em" }}>
              UNSUBSCRIBE
            </a>
          </>
        ) : (
          <p style={{ color: "var(--ink-2)", fontSize: 12, marginTop: 8 }}>You&apos;re currently unsubscribed. Donate again at <a href="https://buymeacoffee.com" style={{ color: "var(--accent)" }}>Buy Me a Coffee</a> to resubscribe.</p>
        )}
      </div>
    </>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <tr><td style={{ padding: "4px 0", color: "var(--ink-3)" }}>{label}</td><td style={{ padding: "4px 0", textAlign: "right", color: "var(--ink-0)" }}><strong>{value}</strong></td></tr>
  );
}
