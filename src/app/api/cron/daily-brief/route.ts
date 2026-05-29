// Daily brief cron — emails today's brief to every active supporter.
// Triggered by Railway cron (set DAILY_BRIEF_CRON=1 OR call with x-cron-key).

import { NextResponse } from "next/server";
import { getActiveSupporters } from "@/lib/supporters";
import { sendDailyBrief } from "@/lib/email";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const key = req.headers.get("x-cron-key") || url.searchParams.get("key");
  if (process.env.CRON_SECRET && key !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  if (!process.env.RESEND_API_KEY) {
    return NextResponse.json({ error: "RESEND_API_KEY not configured" }, { status: 503 });
  }
  const supporters = await getActiveSupporters();
  const date = new Date();
  let sent = 0;
  let skipped = 0;
  let failed = 0;
  // Sequential — most installs have <100 supporters and we want resilience over speed.
  for (const s of supporters) {
    try {
      const r = await sendDailyBrief(s, date);
      if (r.sent) sent++;
      else if (r.reason === "already_sent") skipped++;
      else failed++;
    } catch {
      failed++;
    }
  }
  return NextResponse.json({ supporters: supporters.length, sent, skipped, failed, at: date.toISOString() });
}
