import { NextResponse } from "next/server";
import { getFlights } from "@/lib/flights";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const debug = url.searchParams.get("debug") === "1";

  let probe: { status?: number; error?: string } | null = null;
  if (debug) {
    try {
      const user = process.env.OPENSKY_API_KEY || process.env.OPENSKY_USERNAME;
      const pass = process.env.OPENSKY_PASSWORD ?? "";
      const headers: Record<string, string> = { "user-agent": "watchcomman-monitor/1.0" };
      if (user) headers.authorization = "Basic " + Buffer.from(`${user}:${pass}`).toString("base64");
      const controller = new AbortController();
      const t = setTimeout(() => controller.abort(), 15_000);
      const r = await fetch("https://opensky-network.org/api/states/all?lamin=40&lomin=-10&lamax=50&lomax=10", { headers, signal: controller.signal });
      clearTimeout(t);
      probe = { status: r.status };
    } catch (e) {
      probe = { error: e instanceof Error ? e.message : String(e) };
    }
  }

  const items = await getFlights();
  const authed = !!(process.env.OPENSKY_API_KEY || process.env.OPENSKY_USERNAME);
  return NextResponse.json(
    { count: items.length, authed, probe, generated: new Date().toISOString(), flights: items },
    { headers: { "cache-control": "no-store", "access-control-allow-origin": "*" } },
  );
}
