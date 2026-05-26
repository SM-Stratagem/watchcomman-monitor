import { NextRequest, NextResponse } from "next/server";
import { getNews } from "@/lib/dashboard";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams;
  const limit = Math.min(Math.max(Number(q.get("limit") ?? 50), 1), 500);
  const sinceHours = q.get("since") ? Number(q.get("since")) : 48;
  const sourcesParam = q.get("sources");
  const sources = sourcesParam ? sourcesParam.split(",").map((s) => s.trim()).filter(Boolean) : undefined;

  const rows = await getNews({
    region: q.get("region") || undefined,
    sources,
    sinceHours: Number.isFinite(sinceHours) ? sinceHours : 48,
    limit,
  });

  return NextResponse.json(
    { version: "v1", generated: new Date().toISOString(), count: rows.length, news: rows },
    {
      headers: {
        "cache-control": "public, max-age=60, s-maxage=60",
        "access-control-allow-origin": "*",
      },
    },
  );
}
