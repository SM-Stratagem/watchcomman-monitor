import { NextResponse } from "next/server";
import { getMarketSnapshot } from "@/lib/markets";

export const dynamic = "force-dynamic";
export const revalidate = 60;

export async function GET() {
  const snap = await getMarketSnapshot();
  return NextResponse.json(snap, {
    headers: {
      "cache-control": "public, max-age=60, s-maxage=60",
      "access-control-allow-origin": "*",
    },
  });
}
