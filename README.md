# Watchcomman Monitor

A premium, editorial monitoring surface that aggregates live disease intelligence from the sibling
`Ebola Monitor` and `Hantavirus Monitor` projects into a single, cinematic dashboard with a
WebGL globe centrepiece.

This service is part of the `Monitors` monorepo and follows the same Railway + Next.js + Drizzle
+ Postgres deployment pattern as the other monitor apps.

## Stack

- Next.js 16 (App Router, standalone output)
- React 19
- three.js (custom WebGL globe; no heavy globe library)
- Drizzle ORM + node-postgres
- Railway (web service + cron-driven ingest)
- Inter / Fraunces / JetBrains Mono (CDN-loaded fonts)

## Local development

```bash
cd watchcomman-monitor
npm install
cp .env.example .env       # add DATABASE_URL
npm run db:migrate         # apply schema
npm run ingest:once        # seed the database with the baseline signals
npm run dev                # http://localhost:3000
```

Even without a database, the dashboard renders against the deterministic seed so the UI is never
empty.

### Environment variables

| Name                       | Required | Notes                                                                 |
| -------------------------- | -------- | --------------------------------------------------------------------- |
| `DATABASE_URL`             | yes      | Railway Postgres connection string (shared with the other monitors).  |
| `CRON_SECRET`              | yes      | Shared secret enforced on `/api/ingest`. Cron job sends `x-cron-key`. |
| `SITE_URL`                 | no       | Canonical URL used in sitemap and robots. Defaults to `watchcomman.app`. |
| `EBOLA_MONITOR_FEED_URL`   | no       | Optional JSON feed URL to merge live Ebola signals into ingest.       |
| `HANTA_MONITOR_FEED_URL`   | no       | Optional JSON feed URL to merge live hantavirus signals into ingest.  |
| `RAILWAY_RUN_MODE`         | no       | Set to `cron` on the cron service so the entry script runs the ingest only. |
| `PGSSL` / `PGSSLMODE`      | no       | Set `PGSSL=true` if your DB host requires SSL.                        |
| `RUN_MIGRATIONS`           | no       | Set `0` to skip migrations on web boot.                               |

## Database

`db/schema.ts` defines three tables, all prefixed `wm_` so they coexist with the other monitors in
the shared Postgres instance:

- `wm_signals` — atomic monitoring records (powers the globe and the editorial feed).
- `wm_region_stats` — per-region rollups (powers the regional ranking panel).
- `wm_ingest_runs` — last ingest summary (powers the `last ingest` indicator).

A SQL migration is checked in at `db/migrations/0000_initial_schema.sql` so deployments do not
need `drizzle-kit generate` to run remotely.

## Ingestion

The ingest job is `src/lib/ingest.ts`. It always merges a deterministic seed set
(`src/lib/seed-signals.ts`) so the surface never looks empty, and optionally pulls JSON from the
two sibling monitors when `EBOLA_MONITOR_FEED_URL` / `HANTA_MONITOR_FEED_URL` are set. Adding new
upstream sources is purely additive — drop a normaliser into `ingest.ts`.

Run manually:

```bash
npm run ingest:once
```

Or via HTTP (production):

```bash
curl -H "x-cron-key: $CRON_SECRET" https://$RAILWAY_PUBLIC_DOMAIN/api/ingest
```

## Railway deployment

Two Railway services from the same repo, both pointing at `watchcomman-monitor/` as root:

1. **Web service**
   - Start command: `node scripts/railway-entry.mjs`
   - Healthcheck: `/api/health`
   - Connect the existing Postgres plugin → `DATABASE_URL` provided automatically.
   - Set `CRON_SECRET` to a random string.
   - `RAILWAY_RUN_MODE` should be **unset** or `web`.

2. **Cron / ingest service** (optional — `railway.toml` already configures Railway's HTTP cron
   to hit `/api/ingest` every 30 minutes against the web service; the separate service is only
   needed if you prefer container-based cron):
   - Same repo / same root directory.
   - Set `RAILWAY_RUN_MODE=cron`.
   - Start command: `node scripts/railway-entry.mjs` — the entry script detects the mode and runs
     `npm run ingest:once` instead of booting Next.

The `railway.toml` includes both the HTTP healthcheck and an HTTP-style cron block:

```toml
[[cron]]
schedule = "*/30 * * * *"
command = "curl -sf -H \"x-cron-key: $CRON_SECRET\" https://$RAILWAY_PUBLIC_DOMAIN/api/ingest"
```

If you prefer a container-cron, delete the `[[cron]]` block and run a second Railway service with
`RAILWAY_RUN_MODE=cron` and a Railway-side schedule.

## Public endpoints

- `GET /` — landing experience with the globe and editorial feed.
- `GET /about`, `/privacy` — supporting publisher pages for SEO/legal weight.
- `GET /api/health` — Railway healthcheck.
- `GET /api/dashboard` — JSON snapshot of the current rolling window.
- `GET|POST /api/ingest` — protected ingest trigger (requires `x-cron-key` header or `?key=`).
- `GET /ads.txt` — publisher manifest at the root.
- `GET /sitemap.xml`, `GET /robots.txt` — SEO endpoints.

## Notes

- The globe is a hand-rolled three.js component (`src/components/Globe.tsx`) — no third-party
  globe library. It renders custom shaders for the planet body and atmosphere, point markers with
  severity-coloured haloes, decorative orbital arcs, and a starfield.
- All UI is rendered server-side; only the globe component is client-only via `next/dynamic` with
  `ssr: false`.
- The page does not import any copyrighted assets from third-party reference sites. Typography,
  colours, layout, and motion are original.



