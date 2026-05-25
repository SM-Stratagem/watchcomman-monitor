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

// A signal is an atomic monitoring event surfaced from an upstream monitor or feed.
// It powers the globe (latitude/longitude), the live ticker, and category aggregates.
export const signals = pgTable(
  "wm_signals",
  {
    id: serial("id").primaryKey(),
    // External de-duplication key, e.g. `${source}:${externalId}`.
    externalKey: varchar("external_key", { length: 200 }).notNull(),
    source: varchar("source", { length: 64 }).notNull(), // ebola | hantavirus | seed
    category: varchar("category", { length: 48 }).notNull(), // outbreak | advisory | logistics | environment
    severity: varchar("severity", { length: 16 }).notNull(), // low | moderate | elevated | high | critical
    title: text("title").notNull(),
    summary: text("summary"),
    region: text("region"),
    country: text("country"),
    latitude: numeric("latitude", { precision: 9, scale: 4 }),
    longitude: numeric("longitude", { precision: 9, scale: 4 }),
    occurredAt: timestamp("occurred_at", { withTimezone: true }).notNull(),
    sourceUrl: text("source_url"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex("wm_signals_external_key_idx").on(table.externalKey),
    index("wm_signals_occurred_at_idx").on(table.occurredAt),
    index("wm_signals_category_idx").on(table.category),
  ],
);

// Per-region rollups computed by the ingest job (used by metric cards on the dashboard).
export const regionStats = pgTable(
  "wm_region_stats",
  {
    id: serial("id").primaryKey(),
    region: text("region").notNull(),
    activeSignals: integer("active_signals").notNull().default(0),
    severityScore: numeric("severity_score", { precision: 5, scale: 2 }).notNull().default("0"),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [uniqueIndex("wm_region_stats_region_idx").on(table.region)],
);

// One row per ingest run — last row drives the "last ingest" indicator in the UI.
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
