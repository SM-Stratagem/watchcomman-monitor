-- Sanctions entries (OFAC/EU/UK/BIS)
CREATE TABLE IF NOT EXISTS "wm_sanctions_entries" (
  "id" serial PRIMARY KEY NOT NULL,
  "external_key" varchar(400) NOT NULL,
  "jurisdiction" varchar(16) NOT NULL, -- ofac | eu | uk | bis
  "list_name" varchar(80) NOT NULL,    -- SDN | CONSOLIDATED | ENTITY_LIST | etc.
  "entity_name" text NOT NULL,
  "entity_type" varchar(40),           -- individual | entity | aircraft | vessel
  "program" varchar(120),              -- e.g. SDGT, IRAN, RUSSIA-EO14024
  "address_country" varchar(80),
  "remarks" text,
  "raw_json" text,
  "listed_at" timestamp with time zone,
  "first_seen_at" timestamp with time zone DEFAULT now() NOT NULL,
  "last_seen_at" timestamp with time zone DEFAULT now() NOT NULL
);
CREATE UNIQUE INDEX IF NOT EXISTS "wm_sanctions_external_key_idx" ON "wm_sanctions_entries" ("external_key");
CREATE INDEX IF NOT EXISTS "wm_sanctions_jurisdiction_idx" ON "wm_sanctions_entries" ("jurisdiction");
CREATE INDEX IF NOT EXISTS "wm_sanctions_first_seen_idx" ON "wm_sanctions_entries" ("first_seen_at");
CREATE INDEX IF NOT EXISTS "wm_sanctions_last_seen_idx" ON "wm_sanctions_entries" ("last_seen_at");

-- Cyber advisories (KEV/NVD/HIBP)
CREATE TABLE IF NOT EXISTS "wm_cyber_advisories" (
  "id" serial PRIMARY KEY NOT NULL,
  "external_key" varchar(400) NOT NULL,
  "source" varchar(32) NOT NULL,       -- kev | nvd | hibp | ics-cert
  "cve" varchar(40),
  "title" text NOT NULL,
  "summary" text,
  "severity" varchar(16),              -- critical | high | medium | low
  "cvss" numeric(4, 1),
  "vendor" varchar(120),
  "product" varchar(120),
  "link" text,
  "published_at" timestamp with time zone NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);
CREATE UNIQUE INDEX IF NOT EXISTS "wm_cyber_external_key_idx" ON "wm_cyber_advisories" ("external_key");
CREATE INDEX IF NOT EXISTS "wm_cyber_source_idx" ON "wm_cyber_advisories" ("source");
CREATE INDEX IF NOT EXISTS "wm_cyber_published_idx" ON "wm_cyber_advisories" ("published_at");
CREATE INDEX IF NOT EXISTS "wm_cyber_cve_idx" ON "wm_cyber_advisories" ("cve");

-- Defense contracts (SAM/TED/UK/DSCA)
CREATE TABLE IF NOT EXISTS "wm_contracts" (
  "id" serial PRIMARY KEY NOT NULL,
  "external_key" varchar(400) NOT NULL,
  "jurisdiction" varchar(16) NOT NULL, -- us-sam | eu-ted | uk-gov | dsca
  "title" text NOT NULL,
  "agency" varchar(200),
  "naics" varchar(40),
  "value_usd" numeric(14, 2),
  "country" varchar(80),
  "summary" text,
  "link" text,
  "published_at" timestamp with time zone NOT NULL,
  "deadline_at" timestamp with time zone,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);
CREATE UNIQUE INDEX IF NOT EXISTS "wm_contracts_external_key_idx" ON "wm_contracts" ("external_key");
CREATE INDEX IF NOT EXISTS "wm_contracts_jurisdiction_idx" ON "wm_contracts" ("jurisdiction");
CREATE INDEX IF NOT EXISTS "wm_contracts_published_idx" ON "wm_contracts" ("published_at");

-- GPS jamming snapshots (daily, date-keyed)
CREATE TABLE IF NOT EXISTS "wm_gps_jamming" (
  "id" serial PRIMARY KEY NOT NULL,
  "external_key" varchar(120) NOT NULL,
  "snapshot_date" varchar(10) NOT NULL,  -- YYYY-MM-DD
  "region_key" varchar(40) NOT NULL,     -- bucketed bounding box id
  "intensity" numeric(5, 2) NOT NULL,
  "latitude" numeric(9, 4),
  "longitude" numeric(9, 4),
  "raw_json" text,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);
CREATE UNIQUE INDEX IF NOT EXISTS "wm_gps_external_key_idx" ON "wm_gps_jamming" ("external_key");
CREATE INDEX IF NOT EXISTS "wm_gps_snapshot_date_idx" ON "wm_gps_jamming" ("snapshot_date");
