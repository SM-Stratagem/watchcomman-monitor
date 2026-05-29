import { NextResponse } from "next/server";
import { deactivateSupporter, getSupporterByUnsub } from "@/lib/supporters";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const token = url.searchParams.get("token");
  if (!token) return NextResponse.json({ error: "missing token" }, { status: 400 });
  const s = await getSupporterByUnsub(token);
  if (!s) return NextResponse.json({ error: "invalid token" }, { status: 404 });
  await deactivateSupporter(token);
  return new Response(
    `<!doctype html><html><head><meta charset="utf-8"><title>Unsubscribed</title></head><body style="font-family:system-ui;padding:48px;background:#04060c;color:#f5f7ff;text-align:center">
      <h1 style="font-weight:300">You're unsubscribed.</h1>
      <p>${s.email} won't receive any more daily briefs. Your API key remains active. Resubscribe by donating again at <a href="https://buymeacoffee.com/" style="color:#7df0c2">Buy Me a Coffee</a>.</p>
    </body></html>`,
    { headers: { "content-type": "text/html; charset=utf-8" } },
  );
}
