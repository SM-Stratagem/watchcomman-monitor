// Resend email integration + daily-brief composition.
// Set RESEND_API_KEY in env to enable.

import { Resend } from "resend";
import type { Supporter } from "./supporters";
import { logEmail } from "./supporters";
import { getDashboardSnapshot, getNews } from "./dashboard";
import { getAiBrief } from "./ai";
import { getSanctionsDelta } from "./sanctions-diff";
import { getCyberPanel } from "./cyber";
import { computeChokepointStatus } from "./maritime";

const FROM = process.env.RESEND_FROM || "Watchcomman Monitor <brief@monitor-info.app>";

let _resend: Resend | null = null;
function getResend(): Resend | null {
  const key = process.env.RESEND_API_KEY;
  if (!key) return null;
  if (!_resend) _resend = new Resend(key);
  return _resend;
}

function siteUrl(): string {
  return process.env.SITE_URL?.replace(/\/$/, "") || "https://www.monitor-info.app";
}

function escapeHtml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#039;");
}

export async function sendWelcomeEmail(s: Supporter, apiKeyPlain: string): Promise<void> {
  const r = getResend();
  if (!r) return;
  const url = siteUrl();
  const subject = "Welcome to Watchcomman Monitor — your first brief is on the way";
  const html = `
<div style="font-family:Inter,system-ui,sans-serif;max-width:640px;margin:0 auto;color:#111;line-height:1.55">
  <div style="background:#04060c;color:#f5f7ff;padding:24px;border-radius:10px 10px 0 0">
    <div style="font-family:Menlo,monospace;font-size:10px;letter-spacing:0.22em;color:#7df0c2">● WATCHCOMMAN MONITOR</div>
    <h1 style="margin:8px 0 0;font-weight:500;font-size:24px">Thank you${s.name ? `, ${escapeHtml(s.name)}` : ""}.</h1>
  </div>
  <div style="padding:24px;background:#fff;border:1px solid #eee;border-radius:0 0 10px 10px">
    <p>Your support keeps the lights on. As thanks, you'll get the daily OSINT brief in this inbox every morning UTC and unlimited API access while your support is active.</p>
    <h2 style="font-size:14px;color:#444;margin-top:24px">Your API key</h2>
    <pre style="background:#0a0e18;color:#7df0c2;padding:12px 14px;border-radius:6px;font-size:12px;overflow:auto">${escapeHtml(apiKeyPlain)}</pre>
    <p style="font-size:12px;color:#666">Use it as <code>X-API-Key</code> header (or <code>?api_key=</code>) on <code>${url}/api/v1/*</code>.<br/>Store it somewhere safe — we won't show it again. You can rotate it any time at <a href="${url}/account?token=${encodeURIComponent(s.unsubToken)}">your account page</a>.</p>
    <h2 style="font-size:14px;color:#444;margin-top:24px">Quick links</h2>
    <ul style="font-size:13px;padding-left:18px">
      <li><a href="${url}/dashboard">Live dashboard</a></li>
      <li><a href="${url}/theater">Theater dashboards</a></li>
      <li><a href="${url}/briefing.pdf?token=${encodeURIComponent(s.unsubToken)}">Download today's PDF brief</a></li>
      <li><a href="${url}/account?token=${encodeURIComponent(s.unsubToken)}">Manage your subscription</a></li>
    </ul>
    <p style="font-size:11px;color:#999;margin-top:32px">You're receiving this because you supported Watchcomman Monitor on Buy Me a Coffee. <a href="${url}/api/email/unsubscribe?token=${encodeURIComponent(s.unsubToken)}">Unsubscribe</a>.</p>
  </div>
</div>`;
  try {
    const res = await r.emails.send({ from: FROM, to: s.email, subject, html });
    await logEmail({ supporterId: s.id, toEmail: s.email, kind: "welcome", subject, resendId: res.data?.id ?? null });
  } catch (e) {
    await logEmail({ supporterId: s.id, toEmail: s.email, kind: "welcome", subject, status: "failed", error: e instanceof Error ? e.message : String(e) });
  }
}

export async function sendDailyBrief(s: Supporter, date: Date): Promise<{ sent: boolean; reason?: string }> {
  const r = getResend();
  if (!r) return { sent: false, reason: "resend_not_configured" };
  const url = siteUrl();
  const ymd = date.toISOString().slice(0, 10);
  const externalKey = `daily-brief:${ymd}:${s.id}`;

  const [snap, news, sanctions, cyber] = await Promise.all([
    getDashboardSnapshot(300),
    getNews({ sinceHours: 24, limit: 60 }),
    getSanctionsDelta(24).catch(() => null),
    getCyberPanel().catch(() => null),
  ]);
  const brief = await getAiBrief(news, snap.signals);
  const chokepoints = computeChokepointStatus(news, snap.signals).filter((c) => c.risk !== "low").slice(0, 4);

  const subject = brief.headline.length > 0
    ? `[Daily Brief · ${ymd}] ${brief.headline.slice(0, 100)}`
    : `[Daily Brief · ${ymd}] Global situation report`;

  const theaterRows = brief.theaters.map((t) => `<tr><td style="padding:6px 4px;font-weight:600;width:140px">${escapeHtml(t.name)}</td><td style="padding:6px 4px;color:#888;font-size:11px;width:70px">${escapeHtml(t.level)}</td><td style="padding:6px 4px;color:#444">${escapeHtml(t.note)}</td></tr>`).join("");
  const bullets = brief.bullets.map((b) => `<li style="margin-bottom:6px">${escapeHtml(b)}</li>`).join("");
  const newsItems = news.slice(0, 12).map((n) => `<li style="margin-bottom:4px;font-size:12px"><a href="${escapeHtml(n.link)}" style="color:#111">${escapeHtml(n.sourceName)}</a> — ${escapeHtml(n.title)}</li>`).join("");
  const sanctionsCount = sanctions ? Object.values(sanctions.totals).reduce((a, t) => a + t.added24h, 0) : 0;
  const cyberCount = cyber?.totals?.critical7d ?? 0;
  const chokeRows = chokepoints.map((c) => `<tr><td style="padding:4px 4px;font-weight:600;width:140px">${escapeHtml(c.name)}</td><td style="padding:4px 4px;color:#a23;width:70px">${escapeHtml(c.risk.toUpperCase())}</td><td style="padding:4px 4px;color:#444">${escapeHtml(c.topHeadline ?? "")}</td></tr>`).join("");

  const html = `
<div style="font-family:Inter,system-ui,sans-serif;max-width:680px;margin:0 auto;color:#111;line-height:1.55">
  <div style="background:#04060c;color:#f5f7ff;padding:22px 24px;border-radius:10px 10px 0 0">
    <div style="font-family:Menlo,monospace;font-size:10px;letter-spacing:0.22em;color:#7df0c2">● DAILY BRIEF · ${ymd}</div>
    <h1 style="margin:8px 0 0;font-weight:500;font-size:20px;line-height:1.35">${escapeHtml(brief.headline)}</h1>
    <p style="margin:8px 0 0;font-size:11px;color:#aaa">${brief.credibility ? `${brief.credibility.confidence.toUpperCase()} CONFIDENCE · ${brief.credibility.sourcesAnalyzed} sources · ${brief.credibility.independentSources} independent${brief.credibility.stateMediaSources > 0 ? ` · ${brief.credibility.stateMediaSources} state-media` : ""}` : ""}</p>
  </div>
  <div style="padding:18px 24px;background:#fff;border:1px solid #eee;border-radius:0 0 10px 10px">
    <h2 style="font-size:11px;color:#888;letter-spacing:0.22em;margin:14px 0 6px">KEY DEVELOPMENTS</h2>
    <ul style="padding-left:18px;font-size:13px">${bullets}</ul>

    <h2 style="font-size:11px;color:#888;letter-spacing:0.22em;margin:18px 0 6px">STRATEGIC POSTURE</h2>
    <table style="width:100%;font-size:12px;border-collapse:collapse">${theaterRows}</table>

    ${chokeRows ? `<h2 style="font-size:11px;color:#888;letter-spacing:0.22em;margin:18px 0 6px">MARITIME CHOKEPOINTS · ELEVATED+</h2><table style="width:100%;font-size:12px;border-collapse:collapse">${chokeRows}</table>` : ""}

    <h2 style="font-size:11px;color:#888;letter-spacing:0.22em;margin:18px 0 6px">SUMMARY · LAST 24H</h2>
    <table style="width:100%;font-size:12px;color:#555">
      <tr><td>Active signals</td><td style="text-align:right;font-weight:600">${snap.signals.length}</td></tr>
      <tr><td>High / critical</td><td style="text-align:right;font-weight:600">${snap.totals.highSeverity}</td></tr>
      <tr><td>New sanctions listings</td><td style="text-align:right;font-weight:600">${sanctionsCount}</td></tr>
      <tr><td>Critical cyber advisories (7d)</td><td style="text-align:right;font-weight:600">${cyberCount}</td></tr>
    </table>

    <h2 style="font-size:11px;color:#888;letter-spacing:0.22em;margin:18px 0 6px">TOP HEADLINES</h2>
    <ul style="padding-left:18px">${newsItems}</ul>

    <p style="text-align:center;margin:28px 0">
      <a href="${url}/briefing.pdf?token=${encodeURIComponent(s.unsubToken)}&date=${ymd}" style="background:#04060c;color:#f5f7ff;padding:12px 22px;text-decoration:none;border-radius:6px;font-size:12px;letter-spacing:0.16em">DOWNLOAD FULL PDF ↗</a>
    </p>

    <p style="font-size:11px;color:#999;margin-top:24px">Generated by ${brief.model ?? "fallback"} · ${new Date(brief.generated).toUTCString()}.<br/>
    You're getting this because you support Watchcomman Monitor. <a href="${url}/api/email/unsubscribe?token=${encodeURIComponent(s.unsubToken)}">Unsubscribe</a> · <a href="${url}/account?token=${encodeURIComponent(s.unsubToken)}">Manage</a></p>
  </div>
</div>`;

  try {
    const res = await r.emails.send({ from: FROM, to: s.email, subject, html });
    const ok = await logEmail({ supporterId: s.id, toEmail: s.email, kind: "daily-brief", subject, externalKey, resendId: res.data?.id ?? null });
    return ok ? { sent: true } : { sent: false, reason: "already_sent" };
  } catch (e) {
    await logEmail({ supporterId: s.id, toEmail: s.email, kind: "daily-brief", subject, externalKey, status: "failed", error: e instanceof Error ? e.message : String(e) });
    return { sent: false, reason: e instanceof Error ? e.message : "error" };
  }
}
