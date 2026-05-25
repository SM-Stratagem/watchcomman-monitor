-- Expand wm_signals with subcategory, magnitude, affected
ALTER TABLE "wm_signals" ADD COLUMN IF NOT EXISTS "subcategory" varchar(64);
ALTER TABLE "wm_signals" ADD COLUMN IF NOT EXISTS "magnitude" numeric(8,2);
ALTER TABLE "wm_signals" ADD COLUMN IF NOT EXISTS "affected" integer;

CREATE INDEX IF NOT EXISTS "wm_signals_country_idx" ON "wm_signals" ("country");
CREATE INDEX IF NOT EXISTS "wm_signals_source_idx" ON "wm_signals" ("source");

-- Widen region_stats.severity_score precision
ALTER TABLE "wm_region_stats" ALTER COLUMN "severity_score" TYPE numeric(6,2);

-- Country rollup
CREATE TABLE IF NOT EXISTS "wm_country_stats" (
  "id" serial PRIMARY KEY NOT NULL,
  "country" text NOT NULL,
  "active_signals" integer DEFAULT 0 NOT NULL,
  "severity_score" numeric(6,2) DEFAULT '0' NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
CREATE UNIQUE INDEX IF NOT EXISTS "wm_country_stats_country_idx" ON "wm_country_stats" ("country");

-- Category rollup
CREATE TABLE IF NOT EXISTS "wm_category_stats" (
  "id" serial PRIMARY KEY NOT NULL,
  "category" varchar(48) NOT NULL,
  "active_signals" integer DEFAULT 0 NOT NULL,
  "severity_score" numeric(6,2) DEFAULT '0' NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
CREATE UNIQUE INDEX IF NOT EXISTS "wm_category_stats_category_idx" ON "wm_category_stats" ("category");
