import { ingestSignals } from "@/lib/ingest";

export const dynamic = "force-dynamic";

function unauthorized(reason: string) {
  return new Response(JSON.stringify({ ok: false, error: reason }), {
    status: 401,
    headers: { "content-type": "application/json" },
  });
}

async function handle(request: Request) {
  const cronKey = process.env.CRON_SECRET;
  if (cronKey) {
    const header = request.headers.get("x-cron-key") ?? "";
    const url = new URL(request.url);
    const query = url.searchParams.get("key") ?? "";
    if (header !== cronKey && query !== cronKey) {
      return unauthorized("invalid or missing x-cron-key");
    }
  }

  try {
    const result = await ingestSignals();
    return new Response(JSON.stringify({ ok: true, result }), {
      status: 200,
      headers: { "content-type": "application/json", "cache-control": "no-store" },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return new Response(JSON.stringify({ ok: false, error: message }), {
      status: 500,
      headers: { "content-type": "application/json" },
    });
  }
}

export async function GET(request: Request) {
  return handle(request);
}

export async function POST(request: Request) {
  return handle(request);
}
