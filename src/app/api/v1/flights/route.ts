import { NextResponse } from "next/server";
import { getFlights } from "@/lib/flights";

export const dynamic = "force-dynamic";
export const revalidate = 60;

export async function GET() {
  const items = await getFlights();
  return NextResponse.json(
    { count: items.length, generated: new Date().toISOString(), flights: items },
    { headers: { "cache-control": "public, max-age=60, s-maxage=60", "access-control-allow-origin": "*" } },
  );
}
