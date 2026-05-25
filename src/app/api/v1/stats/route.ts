import { NextResponse } from "next/server";
import { getDashboardSnapshot } from "@/lib/dashboard";

export const dynamic = "force-dynamic";

export async function GET() {
  const snap = await getDashboardSnapshot(500);
  return NextResponse.json(
    {
      version: "v1",
      generated: new Date().toISOString(),
      totals: snap.totals,
      regions: snap.regions,
      countries: snap.countries,
      categories: snap.categories,
    },
    {
      headers: {
        "cache-control": "public, max-age=60, s-maxage=60",
        "access-control-allow-origin": "*",
      },
    },
  );
}
