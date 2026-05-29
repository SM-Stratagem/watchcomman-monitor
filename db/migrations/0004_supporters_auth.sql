-- ───────────────────────── Supporters (Buy Me a Coffee) ─────────────────────────
CREATE TABLE IF NOT EXISTS "wm_supporters" (
  "id" serial PRIMARY KEY NOT NULL,
  "email" varchar(320) NOT NULL,
  "name" varchar(200),
  "bmc_supporter_id" varchar(80),
  "tier" varchar(40) NOT NULL DEFAULT 'one-off',  -- one-off | monthly-3 | monthly-10 | monthly-25
  "amount_total_cents" integer NOT NULL DEFAULT 0,
  "currency" varchar(8) NOT NULL DEFAULT 'USD',
  "active" boolean NOT NULL DEFAULT true,
  "unsub_token" varchar(64) NOT NULL,
  "first_donation_at" timestamp with time zone NOT NULL,
  "last_donation_at" timestamp with time zone NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);
CREATE UNIQUE INDEX IF NOT EXISTS "wm_supporters_email_idx" ON "wm_supporters" ("email");
CREATE UNIQUE INDEX IF NOT EXISTS "wm_supporters_unsub_idx" ON "wm_supporters" ("unsub_token");
CREATE INDEX IF NOT EXISTS "wm_supporters_active_idx" ON "wm_supporters" ("active");

-- ───────────────────────── API keys (one per supporter or BetterAuth user) ─────────────────────────
CREATE TABLE IF NOT EXISTS "wm_api_keys" (
  "id" serial PRIMARY KEY NOT NULL,
  "key_hash" varchar(80) NOT NULL,        -- sha256 hex of plaintext key
  "key_prefix" varchar(12) NOT NULL,      -- first 8 chars of plaintext (for UI display)
  "supporter_id" integer REFERENCES "wm_supporters"("id") ON DELETE CASCADE,
  "user_id" varchar(64),                  -- BetterAuth user id if linked through auth
  "label" varchar(120),
  "scopes" varchar(120) NOT NULL DEFAULT 'read',
  "last_used_at" timestamp with time zone,
  "revoked_at" timestamp with time zone,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);
CREATE UNIQUE INDEX IF NOT EXISTS "wm_api_keys_hash_idx" ON "wm_api_keys" ("key_hash");
CREATE INDEX IF NOT EXISTS "wm_api_keys_supporter_idx" ON "wm_api_keys" ("supporter_id");
CREATE INDEX IF NOT EXISTS "wm_api_keys_user_idx" ON "wm_api_keys" ("user_id");

-- ───────────────────────── Email log (delivery + idempotency) ─────────────────────────
CREATE TABLE IF NOT EXISTS "wm_email_log" (
  "id" serial PRIMARY KEY NOT NULL,
  "supporter_id" integer REFERENCES "wm_supporters"("id") ON DELETE CASCADE,
  "kind" varchar(40) NOT NULL,    -- welcome | daily-brief | alert | other
  "to_email" varchar(320) NOT NULL,
  "subject" varchar(280) NOT NULL,
  "external_key" varchar(120),    -- de-dup key for daily-brief: kind:YYYY-MM-DD:supporter
  "resend_id" varchar(120),       -- Resend response id
  "status" varchar(32) NOT NULL DEFAULT 'sent',  -- sent | failed | skipped
  "error" text,
  "sent_at" timestamp with time zone DEFAULT now() NOT NULL
);
CREATE UNIQUE INDEX IF NOT EXISTS "wm_email_log_external_idx" ON "wm_email_log" ("external_key");
CREATE INDEX IF NOT EXISTS "wm_email_log_supporter_idx" ON "wm_email_log" ("supporter_id");
CREATE INDEX IF NOT EXISTS "wm_email_log_sent_idx" ON "wm_email_log" ("sent_at");

-- ───────────────────────── Per-source feed health snapshot ─────────────────────────
CREATE TABLE IF NOT EXISTS "wm_feed_status" (
  "id" serial PRIMARY KEY NOT NULL,
  "source_slug" varchar(80) NOT NULL,
  "kind" varchar(24) NOT NULL DEFAULT 'rss',  -- rss | signal | sanctions | cyber | contracts | flights
  "ok" boolean NOT NULL,
  "items_returned" integer NOT NULL DEFAULT 0,
  "duration_ms" integer NOT NULL DEFAULT 0,
  "error" text,
  "last_success_at" timestamp with time zone,
  "last_failure_at" timestamp with time zone,
  "checked_at" timestamp with time zone DEFAULT now() NOT NULL
);
CREATE UNIQUE INDEX IF NOT EXISTS "wm_feed_status_slug_idx" ON "wm_feed_status" ("source_slug");
CREATE INDEX IF NOT EXISTS "wm_feed_status_kind_idx" ON "wm_feed_status" ("kind");
CREATE INDEX IF NOT EXISTS "wm_feed_status_ok_idx" ON "wm_feed_status" ("ok");

-- ───────────────────────── BetterAuth tables (default schema) ─────────────────────────
CREATE TABLE IF NOT EXISTS "wm_auth_user" (
  "id" varchar(64) PRIMARY KEY NOT NULL,
  "email" varchar(320) NOT NULL,
  "emailVerified" boolean NOT NULL DEFAULT false,
  "name" varchar(200),
  "image" text,
  "createdAt" timestamp with time zone DEFAULT now() NOT NULL,
  "updatedAt" timestamp with time zone DEFAULT now() NOT NULL
);
CREATE UNIQUE INDEX IF NOT EXISTS "wm_auth_user_email_idx" ON "wm_auth_user" ("email");

CREATE TABLE IF NOT EXISTS "wm_auth_session" (
  "id" varchar(64) PRIMARY KEY NOT NULL,
  "userId" varchar(64) NOT NULL REFERENCES "wm_auth_user"("id") ON DELETE CASCADE,
  "token" varchar(128) NOT NULL,
  "expiresAt" timestamp with time zone NOT NULL,
  "ipAddress" varchar(64),
  "userAgent" text,
  "createdAt" timestamp with time zone DEFAULT now() NOT NULL,
  "updatedAt" timestamp with time zone DEFAULT now() NOT NULL
);
CREATE UNIQUE INDEX IF NOT EXISTS "wm_auth_session_token_idx" ON "wm_auth_session" ("token");

CREATE TABLE IF NOT EXISTS "wm_auth_account" (
  "id" varchar(64) PRIMARY KEY NOT NULL,
  "userId" varchar(64) NOT NULL REFERENCES "wm_auth_user"("id") ON DELETE CASCADE,
  "accountId" varchar(200) NOT NULL,
  "providerId" varchar(80) NOT NULL,
  "accessToken" text,
  "refreshToken" text,
  "idToken" text,
  "accessTokenExpiresAt" timestamp with time zone,
  "refreshTokenExpiresAt" timestamp with time zone,
  "scope" text,
  "password" text,
  "createdAt" timestamp with time zone DEFAULT now() NOT NULL,
  "updatedAt" timestamp with time zone DEFAULT now() NOT NULL
);
CREATE INDEX IF NOT EXISTS "wm_auth_account_userId_idx" ON "wm_auth_account" ("userId");

CREATE TABLE IF NOT EXISTS "wm_auth_verification" (
  "id" varchar(64) PRIMARY KEY NOT NULL,
  "identifier" varchar(320) NOT NULL,
  "value" varchar(200) NOT NULL,
  "expiresAt" timestamp with time zone NOT NULL,
  "createdAt" timestamp with time zone DEFAULT now() NOT NULL,
  "updatedAt" timestamp with time zone DEFAULT now() NOT NULL
);
CREATE INDEX IF NOT EXISTS "wm_auth_verification_identifier_idx" ON "wm_auth_verification" ("identifier");

-- ───────────────────────── Signal snapshots for time-machine ─────────────────────────
-- We don't need a new table — wm_signals already has occurredAt for time-travel queries.
