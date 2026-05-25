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
