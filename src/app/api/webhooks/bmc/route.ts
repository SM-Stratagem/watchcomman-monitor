// Buy Me a Coffee webhook endpoint.
// Configure at https://buymeacoffee.com/dashboard/integrations
// Set the webhook URL to: https://<your-domain>/api/webhooks/bmc
// Set the BMC_WEBHOOK_SECRET env to match the secret BMC shows.
//
// Verifies the HMAC SHA-256 signature on incoming events, then upserts the
// supporter, generates an API key (if new), and fires a welcome email.

import { createHmac, timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import { upsertSupporter } from "@/lib/supporters";
import { sendWelcomeEmail } from "@/lib/email";

export const dynamic = "force-dynamic";

function verifySignature(rawBody: string, headerSig: string | null, secret: string): boolean {
  if (!headerSig) return false;
  const computed = createHmac("sha256", secret).update(rawBody).digest("hex");
  const a = Buffer.from(computed, "hex");
  const b = Buffer.from(headerSig.replace(/^sha256=/, ""), "hex");
  if (a.length !== b.length) return false;
  try { return timingSafeEqual(a, b); } catch { return false; }
}

type BmcPayload = {
  type?: string;
  live_mode?: boolean;
  data?: {
    id?: number;
    supporter_email?: string;
    supporter_name?: string;
    support_coffee_price?: string;
    support_coffees?: number;
    support_currency?: string;
    transaction_id?: string;
    support_created_on?: string;
    is_first?: boolean;
    is_refunded?: boolean;
    psp?: string;
  };
};

export async function POST(req: Request) {
  const rawBody = await req.text();
  const secret = process.env.BMC_WEBHOOK_SECRET;
  if (!secret) {
    return NextResponse.json({ error: "BMC webhook not configured" }, { status: 503 });
  }
  const sig = req.headers.get("x-signature-sha256") || req.headers.get("x-signature");
  if (!verifySignature(rawBody, sig, secret)) {
    return NextResponse.json({ error: "invalid signature" }, { status: 401 });
  }

  let payload: BmcPayload;
  try { payload = JSON.parse(rawBody); } catch { return NextResponse.json({ error: "invalid json" }, { status: 400 }); }

  const data = payload?.data;
  if (!data?.supporter_email) return NextResponse.json({ ok: true, skipped: "no_email" });
  if (data.is_refunded) return NextResponse.json({ ok: true, skipped: "refunded" });

  // BMC sends per-coffee price; total = price * count.
  const unitDollars = Number(data.support_coffee_price ?? 0);
  const count = Number(data.support_coffees ?? 1);
  const amountCents = Math.round(unitDollars * count * 100);
  const eventType = payload.type ?? "donation.received";

  try {
    const res = await upsertSupporter({
      email: data.supporter_email,
      name: data.supporter_name ?? null,
      bmcSupporterId: data.id ? String(data.id) : null,
      amountCents,
      currency: data.support_currency || "USD",
      donationAt: data.support_created_on ? new Date(data.support_created_on) : new Date(),
    });
    if (res.isNew && res.apiKeyPlain) {
      await sendWelcomeEmail(res.supporter, res.apiKeyPlain).catch(() => undefined);
    }
    return NextResponse.json({ ok: true, supporter: res.supporter.email, new: res.isNew, type: eventType });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "internal" }, { status: 500 });
  }
}

// Health check
export async function GET() {
  return NextResponse.json({ configured: !!process.env.BMC_WEBHOOK_SECRET });
}
