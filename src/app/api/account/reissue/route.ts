import { NextResponse } from "next/server";
import { getSupporterByUnsub, reissueApiKey } from "@/lib/supporters";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const url = new URL(req.url);
  const token = url.searchParams.get("token");
  if (!token) return NextResponse.json({ error: "missing token" }, { status: 400 });
  const s = await getSupporterByUnsub(token);
  if (!s) return NextResponse.json({ error: "invalid token" }, { status: 404 });
  const plain = await reissueApiKey(s.id);
  return NextResponse.json({ apiKey: plain });
}
