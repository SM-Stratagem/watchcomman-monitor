// BetterAuth route handler — exposes /api/auth/sign-in, /sign-up, /sign-out, etc.
import { getAuth } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  return getAuth().handler(req);
}
export async function POST(req: Request) {
  return getAuth().handler(req);
}
