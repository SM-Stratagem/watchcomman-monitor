// ACLED (Armed Conflict Location & Event Data) — modern OAuth2 password-grant flow.
//
// ACLED migrated from the legacy `?key=KEY&email=EMAIL` query-string auth to
// OAuth Bearer tokens. Per https://acleddata.com/api-documentation/getting-started:
//   1. POST username/password to /oauth/token to get a 24h access token
//   2. Send GET /api/acled/read?_format=json&… with Authorization: Bearer <token>
//
// ⚠ API access requires Research tier or above. The free Open tier returns
//   403 "Access denied" on every request. To enable: contact access@acleddata.com
//   from your registered email and request the Research tier (free for
//   researchers / non-profit OSINT use).
//
// Env:
//   ACLED_USERNAME  (the email you registered with)
//   ACLED_PASSWORD  (your account password)
// Optional fallback for very old accounts:
//   ACLED_API_KEY + ACLED_EMAIL (legacy query-string auth — still works on
//   pre-migration accounts)

import { safeFetchJson } from "../types";
import type { NormalizedSignal } from "../types";

type AcledRow = {
  event_id_cnty?: string;
  event_date?: string;
  event_type?: string;
  sub_event_type?: string;
  actor1?: string;
  actor2?: string;
  country?: string;
  region?: string;
  admin1?: string;
  admin2?: string;
  location?: string;
  latitude?: string;
  longitude?: string;
  fatalities?: string;
  notes?: string;
  source?: string;
};
type AcledResponse = { success?: boolean; status?: number; count?: number; data?: AcledRow[]; message?: string };

const ACLED_REGION_TO_DASHBOARD: Record<string, NormalizedSignal["region"]> = {
  "Western Africa":      "West & Central Africa",
  "Middle Africa":       "West & Central Africa",
  "Eastern Africa":      "East Africa",
  "Southern Africa":     "Southern Africa",
  "Northern Africa":     "North Africa & Middle East",
  "Middle East":         "North Africa & Middle East",
  "Caucasus and Central Asia": "Asia",
  "Central Asia":        "Asia",
  "South Asia":          "Asia",
  "Southeast Asia":      "Southeast Asia",
  "East Asia":           "Asia",
  "Europe":              "Europe",
  "Caribbean":           "Central America & Caribbean",
  "Central America":     "Central America & Caribbean",
  "South America":       "South America",
};

function severity(fat: number, type: string): NormalizedSignal["severity"] {
  if (fat >= 50) return "critical";
  if (fat >= 10) return "high";
  if (fat >= 1) return "elevated";
  if (type.toLowerCase().includes("battles") || type.toLowerCase().includes("explosions")) return "moderate";
  return "low";
}

// In-memory token cache. Refreshes ~5 min before the 24h expiry.
type TokenCache = { token: string; expiresAt: number };
let tokenCache: TokenCache | null = null;

async function getAccessToken(): Promise<string | null> {
  if (tokenCache && tokenCache.expiresAt > Date.now() + 5 * 60 * 1000) return tokenCache.token;
  const username = process.env.ACLED_USERNAME || process.env.ACLED_EMAIL;
  const password = process.env.ACLED_PASSWORD;
  if (!username || !password) return null;
  try {
    const controller = new AbortController();
    const t = setTimeout(() => controller.abort(), 15_000);
    const res = await fetch("https://acleddata.com/oauth/token", {
      method: "POST",
      headers: { "content-type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        username,
        password,
        grant_type: "password",
        client_id: "acled",
        scope: "authenticated",
      }).toString(),
      signal: controller.signal,
    });
    clearTimeout(t);
    if (!res.ok) return null;
    const d = (await res.json()) as { access_token?: string; expires_in?: number };
    if (!d.access_token) return null;
    tokenCache = {
      token: d.access_token,
      expiresAt: Date.now() + (d.expires_in ?? 86400) * 1000,
    };
    return d.access_token;
  } catch {
    return null;
  }
}

// OAuth-based fetch (modern). Returns [] on any failure (incl. 403 from Open-tier
// accounts), so the rest of the ingest pipeline isn't disturbed.
async function fetchAcledOAuth(): Promise<NormalizedSignal[]> {
  const token = await getAccessToken();
  if (!token) return [];
  const today = new Date();
  const start = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
  const fmt = (d: Date): string => d.toISOString().slice(0, 10);
  const url = `https://acleddata.com/api/acled/read?_format=json&event_date=${fmt(start)}%7C${fmt(today)}&event_date_where=BETWEEN&limit=500&fields=event_id_cnty%7Cevent_date%7Cevent_type%7Csub_event_type%7Cactor1%7Cactor2%7Ccountry%7Cregion%7Clocation%7Clatitude%7Clongitude%7Cfatalities%7Cnotes%7Csource`;

  try {
    const controller = new AbortController();
    const t = setTimeout(() => controller.abort(), 25_000);
    const res = await fetch(url, {
      headers: {
        authorization: `Bearer ${token}`,
        accept: "application/json",
        "user-agent": "watchcomman-monitor/1.0",
      },
      signal: controller.signal,
    });
    clearTimeout(t);
    if (!res.ok) return [];
    const j = (await res.json()) as AcledResponse;
    if (!j?.data?.length) return [];
    return mapRows(j.data);
  } catch {
    return [];
  }
}

// Legacy fetch using the old key+email query-string auth. Kept for pre-migration
// accounts. Many newer keys return "Access denied" here too.
async function fetchAcledLegacy(): Promise<NormalizedSignal[]> {
  const key = process.env.ACLED_API_KEY;
  const email = process.env.ACLED_EMAIL;
  if (!key || !email) return [];
  const today = new Date();
  const start = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
  const fmt = (d: Date): string => d.toISOString().slice(0, 10);
  const url = `https://acleddata.com/api/acled/read?_format=json&key=${key}&email=${encodeURIComponent(email)}&event_date=${fmt(start)}%7C${fmt(today)}&event_date_where=BETWEEN&limit=500&fields=event_id_cnty%7Cevent_date%7Cevent_type%7Csub_event_type%7Cactor1%7Cactor2%7Ccountry%7Cregion%7Clocation%7Clatitude%7Clongitude%7Cfatalities%7Cnotes%7Csource`;
  const j = (await safeFetchJson(url, { timeoutMs: 25_000 })) as AcledResponse | null;
  if (!j?.data?.length) return [];
  return mapRows(j.data);
}

function mapRows(rows: AcledRow[]): NormalizedSignal[] {
  const out: NormalizedSignal[] = [];
  for (const r of rows) {
    if (!r.event_id_cnty) continue;
    const lat = r.latitude ? Number(r.latitude) : null;
    const lng = r.longitude ? Number(r.longitude) : null;
    const fat = r.fatalities ? Number(r.fatalities) : 0;
    const sev = severity(fat, r.event_type ?? "");
    const region = ACLED_REGION_TO_DASHBOARD[r.region ?? ""] ?? "Global";
    const actors = [r.actor1, r.actor2].filter(Boolean).join(" vs. ");
    const title = `${r.event_type ?? "Conflict"}${r.sub_event_type ? ` — ${r.sub_event_type}` : ""}${r.location ? ` · ${r.location}` : ""}${fat > 0 ? ` · ${fat} killed` : ""}`;
    out.push({
      externalKey: `acled:${r.event_id_cnty}`,
      source: "acled",
      category: "conflict",
      subcategory: r.sub_event_type ?? r.event_type ?? null,
      severity: sev,
      title,
      summary: [actors, r.notes].filter(Boolean).join(" — ").slice(0, 360) || null,
      region,
      country: r.country ?? null,
      latitude: Number.isFinite(lat) ? (lat as number) : null,
      longitude: Number.isFinite(lng) ? (lng as number) : null,
      magnitude: null,
      affected: Number.isFinite(fat) ? fat : null,
      occurredAt: r.event_date ? new Date(r.event_date).toISOString() : new Date().toISOString(),
      sourceUrl: null,
    });
  }
  return out;
}

export async function fetchAcled(): Promise<NormalizedSignal[]> {
  // Try OAuth first (modern), fall back to legacy key/email auth if not configured.
  const oauth = await fetchAcledOAuth();
  if (oauth.length > 0) return oauth;
  return fetchAcledLegacy();
}
