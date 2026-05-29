import {
  index,
  integer,
  numeric,
  pgTable,
  serial,
  text,
  timestamp,
  uniqueIndex,
  varchar,
} from "drizzle-orm/pg-core";

// Atomic monitoring event surfaced from an upstream monitor or public feed.
export const signals = pgTable(
  "wm_signals",
  {
    id: serial("id").primaryKey(),
    externalKey: varchar("external_key", { length: 200 }).notNull(),
    source: varchar("source", { length: 64 }).notNull(),
    // category groups: outbreak | advisory | logistics | environment | earthquake | wildfire | storm | flood | disaster
    category: varchar("category", { length: 48 }).notNull(),
    subcategory: varchar("subcategory", { length: 64 }),
    severity: varchar("severity", { length: 16 }).notNull(),
    title: text("title").notNull(),
    summary: text("summary"),
    region: text("region"),
    country: text("country"),
    latitude: numeric("latitude", { precision: 9, scale: 4 }),
    longitude: numeric("longitude", { precision: 9, scale: 4 }),
    magnitude: numeric("magnitude", { precision: 8, scale: 2 }),
    affected: integer("affected"),
    occurredAt: timestamp("occurred_at", { withTimezone: true }).notNull(),
    sourceUrl: text("source_url"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex("wm_signals_external_key_idx").on(table.externalKey),
    index("wm_signals_occurred_at_idx").on(table.occurredAt),
    index("wm_signals_category_idx").on(table.category),
    index("wm_signals_country_idx").on(table.country),
    index("wm_signals_source_idx").on(table.source),
  ],
);

export const regionStats = pgTable(
  "wm_region_stats",
  {
    id: serial("id").primaryKey(),
    region: text("region").notNull(),
    activeSignals: integer("active_signals").notNull().default(0),
    severityScore: numeric("severity_score", { precision: 6, scale: 2 }).notNull().default("0"),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [uniqueIndex("wm_region_stats_region_idx").on(table.region)],
);

export const countryStats = pgTable(
  "wm_country_stats",
  {
    id: serial("id").primaryKey(),
    country: text("country").notNull(),
    activeSignals: integer("active_signals").notNull().default(0),
    severityScore: numeric("severity_score", { precision: 6, scale: 2 }).notNull().default("0"),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [uniqueIndex("wm_country_stats_country_idx").on(table.country)],
);

export const categoryStats = pgTable(
  "wm_category_stats",
  {
    id: serial("id").primaryKey(),
    category: varchar("category", { length: 48 }).notNull(),
    activeSignals: integer("active_signals").notNull().default(0),
    severityScore: numeric("severity_score", { precision: 6, scale: 2 }).notNull().default("0"),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [uniqueIndex("wm_category_stats_category_idx").on(table.category)],
);

// News article — one row per article surfaced from an RSS feed.
export const news = pgTable(
  "wm_news",
  {
    id: serial("id").primaryKey(),
    externalKey: varchar("external_key", { length: 400 }).notNull(),
    sourceSlug: varchar("source_slug", { length: 80 }).notNull(),
    sourceName: varchar("source_name", { length: 120 }).notNull(),
    region: varchar("region", { length: 32 }).notNull(),
    title: text("title").notNull(),
    summary: text("summary"),
    link: text("link").notNull(),
    author: varchar("author", { length: 200 }),
    publishedAt: timestamp("published_at", { withTimezone: true }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex("wm_news_external_key_idx").on(table.externalKey),
    index("wm_news_region_idx").on(table.region),
    index("wm_news_source_idx").on(table.sourceSlug),
    index("wm_news_published_idx").on(table.publishedAt),
  ],
);

export const ingestRuns = pgTable("wm_ingest_runs", {
  id: serial("id").primaryKey(),
  startedAt: timestamp("started_at", { withTimezone: true }).defaultNow().notNull(),
  endedAt: timestamp("ended_at", { withTimezone: true }),
  inserted: integer("inserted").notNull().default(0),
  updated: integer("updated").notNull().default(0),
  total: integer("total").notNull().default(0),
  errors: integer("errors").notNull().default(0),
  notes: text("notes"),
});

// Sanctions entries — OFAC SDN, EU consolidated, UK OFSI, BIS Entity List.
export const sanctionsEntries = pgTable(
  "wm_sanctions_entries",
  {
    id: serial("id").primaryKey(),
    externalKey: varchar("external_key", { length: 400 }).notNull(),
    jurisdiction: varchar("jurisdiction", { length: 16 }).notNull(),
    listName: varchar("list_name", { length: 80 }).notNull(),
    entityName: text("entity_name").notNull(),
    entityType: varchar("entity_type", { length: 40 }),
    program: varchar("program", { length: 120 }),
    addressCountry: varchar("address_country", { length: 80 }),
    remarks: text("remarks"),
    rawJson: text("raw_json"),
    listedAt: timestamp("listed_at", { withTimezone: true }),
    firstSeenAt: timestamp("first_seen_at", { withTimezone: true }).defaultNow().notNull(),
    lastSeenAt: timestamp("last_seen_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex("wm_sanctions_external_key_idx").on(table.externalKey),
    index("wm_sanctions_jurisdiction_idx").on(table.jurisdiction),
    index("wm_sanctions_first_seen_idx").on(table.firstSeenAt),
    index("wm_sanctions_last_seen_idx").on(table.lastSeenAt),
  ],
);

// Cyber advisories — CISA KEV, NIST NVD CVE, HaveIBeenPwned breaches, ICS-CERT.
export const cyberAdvisories = pgTable(
  "wm_cyber_advisories",
  {
    id: serial("id").primaryKey(),
    externalKey: varchar("external_key", { length: 400 }).notNull(),
    source: varchar("source", { length: 32 }).notNull(),
    cve: varchar("cve", { length: 40 }),
    title: text("title").notNull(),
    summary: text("summary"),
    severity: varchar("severity", { length: 16 }),
    cvss: numeric("cvss", { precision: 4, scale: 1 }),
    vendor: varchar("vendor", { length: 120 }),
    product: varchar("product", { length: 120 }),
    link: text("link"),
    publishedAt: timestamp("published_at", { withTimezone: true }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex("wm_cyber_external_key_idx").on(table.externalKey),
    index("wm_cyber_source_idx").on(table.source),
    index("wm_cyber_published_idx").on(table.publishedAt),
    index("wm_cyber_cve_idx").on(table.cve),
  ],
);

// Defense procurement contracts — SAM.gov, EU TED, UK gov, DSCA Foreign Military Sales.
export const contracts = pgTable(
  "wm_contracts",
  {
    id: serial("id").primaryKey(),
    externalKey: varchar("external_key", { length: 400 }).notNull(),
    jurisdiction: varchar("jurisdiction", { length: 16 }).notNull(),
    title: text("title").notNull(),
    agency: varchar("agency", { length: 200 }),
    naics: varchar("naics", { length: 40 }),
    valueUsd: numeric("value_usd", { precision: 14, scale: 2 }),
    country: varchar("country", { length: 80 }),
    summary: text("summary"),
    link: text("link"),
    publishedAt: timestamp("published_at", { withTimezone: true }).notNull(),
    deadlineAt: timestamp("deadline_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex("wm_contracts_external_key_idx").on(table.externalKey),
    index("wm_contracts_jurisdiction_idx").on(table.jurisdiction),
    index("wm_contracts_published_idx").on(table.publishedAt),
  ],
);

// GPS jamming snapshots (gpsjam.org daily).
export const gpsJamming = pgTable(
  "wm_gps_jamming",
  {
    id: serial("id").primaryKey(),
    externalKey: varchar("external_key", { length: 120 }).notNull(),
    snapshotDate: varchar("snapshot_date", { length: 10 }).notNull(),
    regionKey: varchar("region_key", { length: 40 }).notNull(),
    intensity: numeric("intensity", { precision: 5, scale: 2 }).notNull(),
    latitude: numeric("latitude", { precision: 9, scale: 4 }),
    longitude: numeric("longitude", { precision: 9, scale: 4 }),
    rawJson: text("raw_json"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex("wm_gps_external_key_idx").on(table.externalKey),
    index("wm_gps_snapshot_date_idx").on(table.snapshotDate),
  ],
);
