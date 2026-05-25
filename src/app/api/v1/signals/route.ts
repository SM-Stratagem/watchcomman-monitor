import { NextRequest, NextResponse } from "next/server";
import { getSignalsFiltered } from "@/lib/dashboard";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams;
  const limit = Math.min(Math.max(Number(q.get("limit") ?? 50), 1), 500);
  const sinceHours = q.get("since") ? Number(q.get("since")) : undefined;

  const rows = await getSignalsFiltered({
    category: q.get("category") || undefined,
    source: q.get("source") || undefined,
    severity: q.get("severity") || undefined,
    country: q.get("country") || undefined,
    region: q.get("region") || undefined,
    sinceHours: Number.isFinite(sinceHours) ? sinceHours : undefined,
    limit,
  });

  return NextResponse.json(
    {
      version: "v1",
      generated: new Date().toISOString(),
      count: rows.length,
      signals: rows,
    },
    {
      headers: {
        "cache-control": "public, max-age=60, s-maxage=60",
        "access-control-allow-origin": "*",
      },
    },
  );
}
