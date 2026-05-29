// Supporter onboarding + API key issuance + daily email targeting.
// Supporters are added when Buy Me a Coffee fires a webhook.

import { createHash, randomBytes } from "node:crypto";
import { and, eq, isNull, sql } from "drizzle-orm";
import { getDb } from "./db";
import { apiKeys, emailLog, supporters } from "../../db/schema";

export type Supporter = {
  id: number;
  email: string;
  name: string | null;
  bmcSupporterId: string | null;
  tier: string;
  amountTotalCents: number;
  currency: string;
  active: boolean;
  unsubToken: string;
  firstDonationAt: Date;
  lastDonationAt: Date;
};

const KEY_PREFIX = "wm_live_";

// Generate a new opaque API key. Plaintext returned ONCE (sent in email).
// We store only the sha256 hash in DB.
export function generateApiKey(): { plain: string; hash: string; prefix: string } {
  const random = randomBytes(24).toString("base64url"); // 32 chars
  const plain = `${KEY_PREFIX}${random}`;
  const hash = createHash("sha256").update(plain).digest("hex");
  const prefix = plain.slice(0, 12);
  return { plain, hash, prefix };
}

export function hashApiKey(plain: string): string {
  return createHash("sha256").update(plain).digest("hex");
}

export function genUnsubToken(): string {
  return randomBytes(24).toString("base64url");
}

export function tierFromCents(cents: number): string {
  if (cents >= 2500) return "monthly-25";
  if (cents >= 1000) return "monthly-10";
  if (cents >= 300) return "monthly-3";
  return "one-off";
}

export type UpsertInput = {
  email: string;
  name?: string | null;
  bmcSupporterId?: string | null;
  amountCents: number;
  currency: string;
  donationAt?: Date;
  tier?: string | null;
};

export type UpsertResult = { supporter: Supporter; apiKeyPlain: string | null; isNew: boolean };

// Upsert supporter row. Returns the supporter and (if new) the plaintext API key.
export async function upsertSupporter(input: UpsertInput): Promise<UpsertResult> {
  const db = getDb();
  const at = input.donationAt ?? new Date();
  const tier = input.tier ?? tierFromCents(input.amountCents);
  const existing = await db.select().from(supporters).where(eq(supporters.email, input.email.toLowerCase())).limit(1);
  if (existing.length > 0) {
    const cur = existing[0];
    const updated = await db.update(supporters).set({
      name: input.name ?? cur.name,
      bmcSupporterId: input.bmcSupporterId ?? cur.bmcSupporterId,
      tier,
      amountTotalCents: cur.amountTotalCents + input.amountCents,
      currency: input.currency ?? cur.currency,
      active: true,
      lastDonationAt: at,
    }).where(eq(supporters.id, cur.id)).returning();
    return { supporter: rowToSupporter(updated[0]), apiKeyPlain: null, isNew: false };
  }
  const unsubToken = genUnsubToken();
  const inserted = await db.insert(supporters).values({
    email: input.email.toLowerCase(),
    name: input.name ?? null,
    bmcSupporterId: input.bmcSupporterId ?? null,
    tier,
    amountTotalCents: input.amountCents,
    currency: input.currency,
    active: true,
    unsubToken,
    firstDonationAt: at,
    lastDonationAt: at,
  }).returning();
  const sup = rowToSupporter(inserted[0]);
  const { plain, hash, prefix } = generateApiKey();
  await db.insert(apiKeys).values({
    keyHash: hash,
    keyPrefix: prefix,
    supporterId: sup.id,
    label: "Issued on first donation",
    scopes: "read",
  });
  return { supporter: sup, apiKeyPlain: plain, isNew: true };
}

function rowToSupporter(r: typeof supporters.$inferSelect): Supporter {
  return {
    id: r.id,
    email: r.email,
    name: r.name,
    bmcSupporterId: r.bmcSupporterId,
    tier: r.tier,
    amountTotalCents: r.amountTotalCents,
    currency: r.currency,
    active: r.active,
    unsubToken: r.unsubToken,
    firstDonationAt: r.firstDonationAt,
    lastDonationAt: r.lastDonationAt,
  };
}

export async function getActiveSupporters(): Promise<Supporter[]> {
  const db = getDb();
  const rows = await db.select().from(supporters).where(eq(supporters.active, true));
  return rows.map(rowToSupporter);
}

export async function getSupporterByUnsub(token: string): Promise<Supporter | null> {
  const db = getDb();
  const rows = await db.select().from(supporters).where(eq(supporters.unsubToken, token)).limit(1);
  return rows[0] ? rowToSupporter(rows[0]) : null;
}

export async function deactivateSupporter(unsubToken: string): Promise<boolean> {
  const db = getDb();
  const res = await db.update(supporters).set({ active: false }).where(eq(supporters.unsubToken, unsubToken)).returning({ id: supporters.id });
  return res.length > 0;
}

// Check an inbound API key. Returns supporter id (or null), updates last_used_at.
export async function verifyApiKey(plain: string): Promise<{ supporterId: number | null; userId: string | null } | null> {
  if (!plain || !plain.startsWith(KEY_PREFIX)) return null;
  const hash = hashApiKey(plain);
  const db = getDb();
  const rows = await db.select().from(apiKeys).where(and(eq(apiKeys.keyHash, hash), isNull(apiKeys.revokedAt))).limit(1);
  if (rows.length === 0) return null;
  const k = rows[0];
  // Touch last_used_at, but don't await the noise.
  await db.update(apiKeys).set({ lastUsedAt: new Date() }).where(eq(apiKeys.id, k.id)).catch(() => undefined);
  return { supporterId: k.supporterId, userId: k.userId };
}

// Idempotent record of email delivery — returns true if newly sent, false if already logged.
export async function logEmail(input: {
  supporterId?: number | null;
  toEmail: string;
  kind: string;
  subject: string;
  externalKey?: string | null;
  resendId?: string | null;
  status?: "sent" | "failed" | "skipped";
  error?: string | null;
}): Promise<boolean> {
  const db = getDb();
  try {
    await db.insert(emailLog).values({
      supporterId: input.supporterId ?? null,
      toEmail: input.toEmail,
      kind: input.kind,
      subject: input.subject,
      externalKey: input.externalKey ?? null,
      resendId: input.resendId ?? null,
      status: input.status ?? "sent",
      error: input.error ?? null,
    });
    return true;
  } catch {
    return false; // unique-index conflict means already logged
  }
}

export async function getApiKeyForSupporter(supporterId: number): Promise<{ prefix: string; lastUsedAt: Date | null } | null> {
  const db = getDb();
  const rows = await db.select().from(apiKeys).where(and(eq(apiKeys.supporterId, supporterId), isNull(apiKeys.revokedAt))).limit(1);
  if (rows.length === 0) return null;
  return { prefix: rows[0].keyPrefix, lastUsedAt: rows[0].lastUsedAt };
}

// Reissue API key for a supporter (revokes existing, creates new). Returns plaintext.
export async function reissueApiKey(supporterId: number): Promise<string> {
  const db = getDb();
  await db.update(apiKeys).set({ revokedAt: new Date() }).where(and(eq(apiKeys.supporterId, supporterId), isNull(apiKeys.revokedAt)));
  const { plain, hash, prefix } = generateApiKey();
  await db.insert(apiKeys).values({
    keyHash: hash,
    keyPrefix: prefix,
    supporterId,
    label: "Reissued",
    scopes: "read",
  });
  return plain;
}

// Count active supporters / email volume — for /source-health stats.
export async function getSupporterStats(): Promise<{ active: number; sent24h: number; sent7d: number }> {
  const db = getDb();
  const res = await db.execute<{ active: number; sent24h: number; sent7d: number }>(sql`
    SELECT
      (SELECT COUNT(*)::int FROM ${supporters} WHERE active = true) as active,
      (SELECT COUNT(*)::int FROM ${emailLog} WHERE sent_at >= NOW() - INTERVAL '24 hours' AND status = 'sent') as sent24h,
      (SELECT COUNT(*)::int FROM ${emailLog} WHERE sent_at >= NOW() - INTERVAL '7 days' AND status = 'sent') as sent7d
  `);
  const rows = (Array.isArray(res) ? res : ((res as { rows?: unknown[] }).rows ?? [])) as Array<{ active: number; sent24h: number; sent7d: number }>;
  return rows[0] ?? { active: 0, sent24h: 0, sent7d: 0 };
}
