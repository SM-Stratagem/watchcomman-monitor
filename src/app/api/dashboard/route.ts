import { getDashboardSnapshot } from "@/lib/dashboard";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  const snapshot = await getDashboardSnapshot();
  return new Response(JSON.stringify(snapshot), {
    status: 200,
    headers: {
      "content-type": "application/json",
      "cache-control": "public, max-age=30, s-maxage=30, stale-while-revalidate=60",
    },
  });
}
