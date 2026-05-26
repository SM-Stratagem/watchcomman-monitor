CREATE TABLE IF NOT EXISTS "wm_news" (
  "id" serial PRIMARY KEY NOT NULL,
  "external_key" varchar(400) NOT NULL,
  "source_slug" varchar(80) NOT NULL,
  "source_name" varchar(120) NOT NULL,
  "region" varchar(32) NOT NULL,
  "title" text NOT NULL,
  "summary" text,
  "link" text NOT NULL,
  "author" varchar(200),
  "published_at" timestamp with time zone NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS "wm_news_external_key_idx" ON "wm_news" ("external_key");
CREATE INDEX IF NOT EXISTS "wm_news_region_idx" ON "wm_news" ("region");
CREATE INDEX IF NOT EXISTS "wm_news_source_idx" ON "wm_news" ("source_slug");
CREATE INDEX IF NOT EXISTS "wm_news_published_idx" ON "wm_news" ("published_at");
