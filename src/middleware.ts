// Optional defensive middleware:
//  - BASIC_AUTH_USER + BASIC_AUTH_PASSWORD env → HTTP basic auth gate on entire app
//  - API_KEY env → required as X-API-Key (or ?api_key=) on /api/v1/* routes
// Unset env → no gate (public behavior preserved).
//
// Always allows /api/cron/* (already CRON_SECRET-gated server-side).

import { NextResponse, type NextRequest } from "next/server";

export const config = {
  matcher: ["/((?!_next|favicon\\.ico|robots\\.txt|sitemap\\.xml|icon|public).*)"],
};

function basicUnauthorized(): NextResponse {
  return new NextResponse("Authentication required", {
    status: 401,
    headers: { "WWW-Authenticate": 'Basic realm="World Monitor", charset="UTF-8"' },
  });
}

function apiKeyUnauthorized(reason: string): NextResponse {
  return NextResponse.json({ error: "unauthorized", reason }, { status: 401, headers: { "access-control-allow-origin": "*" } });
}

export function middleware(req: NextRequest): NextResponse | undefined {
  const url = new URL(req.url);
  const path = url.pathname;

  // Skip cron internals.
  if (path.startsWith("/api/cron")) return;

  // API key gate for /api/v1/*.
  if (path.startsWith("/api/v1")) {
    const required = process.env.API_KEY;
    if (required) {
      const got = req.headers.get("x-api-key") || url.searchParams.get("api_key");
      if (got !== required) return apiKeyUnauthorized("missing or invalid api key");
    }
    return;
  }

  // Basic auth gate for everything else (UI), only if both vars are set.
  const user = process.env.BASIC_AUTH_USER;
  const pass = process.env.BASIC_AUTH_PASSWORD;
  if (!user || !pass) return;

  const header = req.headers.get("authorization");
  if (!header?.startsWith("Basic ")) return basicUnauthorized();
  try {
    const decoded = atob(header.slice(6));
    const idx = decoded.indexOf(":");
    const u = decoded.slice(0, idx);
    const p = decoded.slice(idx + 1);
    if (u === user && p === pass) return;
  } catch {}
  return basicUnauthorized();
}
