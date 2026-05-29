// Auth/access middleware.
//
//   /api/v1/*       → requires a valid supporter API key (X-API-Key or ?api_key=),
//                     UNLESS API_PUBLIC_READ=1 (default off).
//                     Always lets public endpoints through if explicitly listed.
//   /api/auth/*     → public (BetterAuth handles its own routes)
//   /api/cron/*     → guarded server-side by CRON_SECRET
//   /api/webhooks/* → guarded server-side by HMAC
//   everything else → public (pages are not gated)
//
// IMPORTANT: the api-key check has to hit the DB. Next.js middleware runs on
// the Edge runtime by default, but we need Node (Postgres driver). The
// middleware delegates the actual key lookup to the route handler itself via
// a 401 fallback — middleware here just enforces the *presence* of a key in
// /api/v1/*, while the route handler can verify via verifyApiKey(). That keeps
// middleware edge-safe.

import { NextResponse, type NextRequest } from "next/server";

export const config = {
  matcher: ["/((?!_next|favicon\\.ico|robots\\.txt|sitemap\\.xml|icon|public).*)"],
};

const PUBLIC_V1_PREFIXES = [
  // Endpoints that stay open (so existing consumers don't break):
  "/api/v1/news.rss",
  "/api/v1/signals.rss",
];

export function middleware(req: NextRequest): NextResponse | undefined {
  const url = new URL(req.url);
  const path = url.pathname;

  if (path.startsWith("/api/auth")) return;
  if (path.startsWith("/api/cron")) return;
  if (path.startsWith("/api/webhooks")) return;

  if (path.startsWith("/api/v1")) {
    if (process.env.API_PUBLIC_READ === "1") return; // global override
    if (PUBLIC_V1_PREFIXES.some((p) => path.startsWith(p))) return;
    const got = req.headers.get("x-api-key") || url.searchParams.get("api_key");
    if (!got) {
      return NextResponse.json(
        {
          error: "api_key_required",
          message: "Pass X-API-Key header (or ?api_key=). Get a key by supporting the project at https://buymeacoffee.com.",
          docs: "/api-docs",
        },
        { status: 401, headers: { "access-control-allow-origin": "*", "www-authenticate": 'ApiKey realm="watchcomman", charset="UTF-8"' } },
      );
    }
    return;
  }

  // Optional UI gate (kept for back-compat; usually off).
  const user = process.env.BASIC_AUTH_USER;
  const pass = process.env.BASIC_AUTH_PASSWORD;
  if (!user || !pass) return;
  const header = req.headers.get("authorization");
  if (!header?.startsWith("Basic ")) {
    return new NextResponse("Authentication required", {
      status: 401, headers: { "WWW-Authenticate": 'Basic realm="World Monitor", charset="UTF-8"' },
    });
  }
  try {
    const decoded = atob(header.slice(6));
    const idx = decoded.indexOf(":");
    if (decoded.slice(0, idx) === user && decoded.slice(idx + 1) === pass) return;
  } catch {}
  return new NextResponse("Authentication required", {
    status: 401, headers: { "WWW-Authenticate": 'Basic realm="World Monitor", charset="UTF-8"' },
  });
}
