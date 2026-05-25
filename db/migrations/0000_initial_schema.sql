CREATE TABLE IF NOT EXISTS "wm_signals" (
  "id" serial PRIMARY KEY NOT NULL,
  "external_key" varchar(200) NOT NULL,
  "source" varchar(64) NOT NULL,
  "category" varchar(48) NOT NULL,
  "severity" varchar(16) NOT NULL,
  "title" text NOT NULL,
  "summary" text,
  "region" text,
  "country" text,
  "latitude" numeric(9,4),
  "longitude" numeric(9,4),
  "occurred_at" timestamp with time zone NOT NULL,
  "source_url" text,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS "wm_signals_external_key_idx" ON "wm_signals" ("external_key");
CREATE INDEX IF NOT EXISTS "wm_signals_occurred_at_idx" ON "wm_signals" ("occurred_at");
CREATE INDEX IF NOT EXISTS "wm_signals_category_idx" ON "wm_signals" ("category");

CREATE TABLE IF NOT EXISTS "wm_region_stats" (
  "id" serial PRIMARY KEY NOT NULL,
  "region" text NOT NULL,
  "active_signals" integer DEFAULT 0 NOT NULL,
  "severity_score" numeric(5,2) DEFAULT '0' NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS "wm_region_stats_region_idx" ON "wm_region_stats" ("region");

CREATE TABLE IF NOT EXISTS "wm_ingest_runs" (
  "id" serial PRIMARY KEY NOT NULL,
  "started_at" timestamp with time zone DEFAULT now() NOT NULL,
  "ended_at" timestamp with time zone,
  "inserted" integer DEFAULT 0 NOT NULL,
  "updated" integer DEFAULT 0 NOT NULL,
  "total" integer DEFAULT 0 NOT NULL,
  "errors" integer DEFAULT 0 NOT NULL,
  "notes" text
);
