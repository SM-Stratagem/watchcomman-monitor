// API auth helper for route handlers. Middleware enforces *presence* of a key;
// this function does the actual DB-backed verification before serving data.

import { NextResponse } from "next/server";
import { verifyApiKey } from "./supporters";

export type AuthResult = { ok: true; supporterId: number | null; userId: string | null } | { ok: false; response: Response };

export async function checkApiKey(req: Request): Promise<AuthResult> {
  // If global public-read is enabled, skip verification entirely.
  if (process.env.API_PUBLIC_READ === "1") return { ok: true, supporterId: null, userId: null };
  const url = new URL(req.url);
  const got = req.headers.get("x-api-key") || url.searchParams.get("api_key");
  if (!got) {
    return {
      ok: false,
      response: NextResponse.json(
        { error: "api_key_required", docs: "/api-docs" },
        { status: 401, headers: { "access-control-allow-origin": "*" } },
      ),
    };
  }
  const verified = await verifyApiKey(got).catch(() => null);
  if (!verified) {
    return {
      ok: false,
      response: NextResponse.json(
        { error: "invalid_api_key" },
        { status: 401, headers: { "access-control-allow-origin": "*" } },
      ),
    };
  }
  return { ok: true, supporterId: verified.supporterId, userId: verified.userId };
}
