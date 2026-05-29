# Defense-Grade Monitor Build-out — Design

**Date:** 2026-05-28
**Approved scope:** Tier 1 + Tier 2 sources + 8 feature upgrades (from 2026-05-28 strategy memo)
**Build target:** raise the monitor from "generic OSINT dashboard" to "defense-analyst grade situation room"

---

## 1 — Objectives

Make every signal/news item show *who said it, in what language, with what bias, corroborated by whom*; add the specific feeds defense analysts actually want (sanctions, CVE, conflict events, defense contracts); add 5 theater dashboards + 4 adversary panels; add user workflow primitives (watchlists, alerts, export) usable without sign-in.

Non-goals: full SSO, FedRAMP/SOC2 cert work, on-prem packaging, email/SMS alerting infra, paid feeds (Janes, Maxar, Recorded Future, MarineTraffic full API).

---

## 2 — Scope (what gets built)

### 2a. Tier 1 data sources (12)
| Source | Endpoint | Format | Purpose |
| ------ | -------- | ------ | ------- |
| OFAC SDN List | sanctionslistservice.ofac.treas.gov | CSV/XML | US sanctions, daily diff |
| EU consolidated sanctions | webgate.ec.europa.eu/fsd/fsf | XML | EU sanctions |
| UK OFSI consolidated list | gov.uk/government/publications/financial-sanctions-consolidated-list-of-targets | CSV | UK sanctions |
| BIS Entity List | bis.doc.gov/index.php/policy-guidance/lists-of-parties-of-concern/entity-list | CSV | US export controls |
| CISA KEV | cisa.gov/sites/default/files/feeds/known_exploited_vulnerabilities.json | JSON | actively exploited CVEs |
| NIST NVD CVE | services.nvd.nist.gov/rest/json/cves/2.0 | JSON | newly published CVEs |
| ACLED | api.acleddata.com (free tier) | JSON | armed conflict events |
| SAM.gov opportunities | sam.gov/api/prod/sgs/v1/search | JSON RSS-style | US fed contract opps |
| EU TED | ted.europa.eu/api | RSS | EU procurement |
| UK Contracts Finder | gov.uk/contracts-finder | atom | UK MOD contracts |
| DSCA FMS notifications | dsca.mil/press-media/major-arms-sales | scrape | foreign military sales |
| State Dept country reports | various RSS | RSS | already partly covered, extend |

### 2b. Tier 2 data sources (8)
| Source | Endpoint | Purpose |
| ------ | -------- | ------- |
| GPSjam | gpsjam.org/data/{date}.json | GPS interference daily heatmap |
| HIBP breaches | haveibeenpwned.com/api/v3/breaches | public-facing breach disclosures |
| Cipher Brief | thecipherbrief.com/feed | analyst commentary |
| Recorded Future blog | recordedfuture.com/feed/ | threat intel |
| CSIS analysis | csis.org/analysis/feed | think-tank coverage |
| SIPRI | sipri.org/rss.xml | arms transfers |
| OPCW | opcw.org/media-centre/news.xml | chem weapons watch |
| ADSBexchange military | globe.adsbexchange.com (mil filter via api) | military flight tracking |

### 2c. Eight feature upgrades

**F1. Provenance & credibility layer** *(highest leverage)*
- Each source in `sources.ts` gains `country`, `language`, `affiliation` (`state-media` | `wire` | `mainstream` | `advocacy` | `opaque`), `bias` (`left` | `center-left` | `center` | `center-right` | `right` | `none`/`mixed`)
- `<NewsItem>` UI: flag emoji + 2-letter language code + colored affiliation chip
- Cross-source aggregator counts independent vs state-media corroboration

**F2. Theater dashboards** at `/theater/{ukraine,taiwan,red-sea,korea,levant}`
- Each: curated source subset, theater-clipped map, theater-specific signal filter, dedicated news grid, AI brief scoped to theater

**F3. Adversary force-tracker panels**
- PLA activity (Taiwan ADIZ incursions counter, SCMP/Taiwan MND scrape if possible, fall back to public RSS)
- Russian aviation activity (UK MOD daily intel update RSS already in catalog)
- Iranian missile/proxy (Times of Israel + Reuters Iran filter)
- DPRK launch log (NK News open RSS)

**F4. Sanctions & export-control delta feed**
- Daily ingestion → store as `wm_sanctions_entries` table → diff against previous day → "23 entities added today" panel on dashboard
- Per-jurisdiction breakdown (US/EU/UK)

**F5. Cyber threat intel panel**
- CISA KEV new additions in last 7d
- Critical NVD CVEs (CVSS ≥ 9.0)
- Recent HIBP breaches
- ICS-CERT advisories (RSS already in CISA feed)

**F6. Workflow features** *(no auth required, localStorage based)*
- Watchlists: user maintains list of strings (entities/keywords); panel shows every news + signal matching any entry
- Saved searches: bookmark of current filter combination
- Visual alerts: any watchlist hit on high-severity flashes a banner
- Export: PDF brief generator (server-rendered HTML → printer-friendly route), CSV signals export
- Audit log: in-memory ingest run history (already partially exists, extend visibility)

**F7. Credibility scoring of AI brief**
- AI brief now annotates with `independentSources` and `stateMediaSources` counts
- Citations footnoted under each bullet

**F8. Auth & enterprise surface**
- Optional `BASIC_AUTH_USER` / `BASIC_AUTH_PASSWORD` env-gated middleware (no auth → public)
- Optional `API_KEY` env required for `/api/v1/*` access (no key set → open)
- Per-route 5xx logging hook (in-memory)

---

## 3 — Architecture additions

### New files
```
src/lib/feeds/
  sanctions/{ofac,eu,uk,bis}.ts   ← daily ingest into wm_sanctions_entries
  cyber/{kev,nvd,hibp}.ts         ← CVE/breach ingest into wm_cyber_advisories
  conflict/{acled}.ts             ← conflict event ingest into wm_signals (category=conflict)
  contracts/{sam,ted,uk,dsca}.ts  ← defense contract feed into wm_contracts
  intel/{cipher,recordedfuture,csis,sipri,opcw}.ts  ← RSS into wm_news
  gpsjam.ts                       ← daily into wm_gps_jamming (date-keyed)

src/lib/
  provenance.ts                   ← source metadata (country/language/affiliation/bias) — table lookup
  watchlist.ts                    ← parsing + matching, no persistence (client-side)
  theaters.ts                     ← theater configs (sources, lat/lng bbox, keywords)
  sanctions-diff.ts               ← compute today vs yesterday entries
  cyber.ts                        ← read helpers for CVE/KEV panel
  contracts.ts                    ← read helpers for contracts panel
  export-pdf.ts                   ← stub: provides /briefing route serving printable HTML
  middleware-auth.ts              ← basic-auth/api-key gate

src/components/
  NewsItem.tsx                    ← extracted/upgraded from NewsPanel: shows flag + lang + affiliation chip
  SanctionsPanel.tsx
  CyberPanel.tsx
  ContractsPanel.tsx
  PlaTracker.tsx
  RussianAirTracker.tsx
  IranTracker.tsx
  DprkTracker.tsx
  WatchlistManager.tsx            ← localStorage CRUD + filter UI
  WatchlistResults.tsx            ← matches across signals+news
  GpsJammingLayer.tsx             ← map overlay
  TheaterDashboard.tsx            ← shared component used by 5 routes
  EnterpriseStrip.tsx             ← marketing strip on /defense landing

src/app/
  theater/[slug]/page.tsx         ← single dynamic route for all 5 theaters
  cyber/page.tsx                  ← cyber threat intel page
  sanctions/page.tsx              ← sanctions delta page
  contracts/page.tsx              ← defense contracts page
  watchlist/page.tsx              ← watchlist manager UI
  briefing/page.tsx               ← printable PDF-style brief (server-rendered)
  defense/page.tsx                ← defense-audience landing/positioning

db/migrations/
  0003_defense_layer.sql          ← wm_sanctions_entries, wm_cyber_advisories, wm_contracts, wm_gps_jamming
```

### DB schema additions
- `wm_sanctions_entries` (jurisdiction, name, type, listed_at, raw_json, externalKey unique)
- `wm_cyber_advisories` (source: kev|nvd|hibp, externalKey, title, cve, severity, summary, published_at)
- `wm_contracts` (jurisdiction, externalKey, title, agency, value, deadline, published_at, link)
- `wm_gps_jamming` (date, region_key, intensity, raw_geojson) — date-keyed, prune > 14 days

### Ingest pipeline changes
- `ingest.ts` runs three new groups in parallel: `fetchSanctions()`, `fetchCyber()`, `fetchContracts()`, `fetchConflict()` — each with same `.catch(() => [])` pattern
- Sanctions diff computed at end of ingest, exposed via `getSanctionsDiff()` (today vs yesterday)
- Contracts pruned > 90 days

---

## 4 — Tradeoffs & decisions

- **Sanctions storage**: store full row per entry (not just hash), so we can compute deltas and show entity detail. ~40k OFAC rows × ~500 bytes = 20MB. Acceptable.
- **ACLED API**: requires email registration; document in `.env.example` as `ACLED_EMAIL` / `ACLED_API_KEY` — gracefully degrade if missing.
- **GPS jamming**: gpsjam.org publishes daily GeoJSON; we render as a toggleable map layer rather than ingesting to DB beyond today's snapshot.
- **Theater dashboards**: one dynamic route `/theater/[slug]` with config-driven setup, not 5 hand-built routes.
- **Auth**: basic-auth middleware deliberately optional — keeps public site public unless env-gated. API key separately optional.
- **Watchlists**: client-only (localStorage), zero backend. Trade-off: doesn't sync across devices. Acceptable for v1.
- **Export PDF**: server-rendered HTML at `/briefing?since=24h&theater=ukraine` styled for print. User uses browser's "Save as PDF" — avoids requiring puppeteer/playwright on Railway.
- **Provenance data**: hand-curated table for ~280 sources covering country/language/affiliation/bias. ~1-day data-entry task, encoded as TypeScript const.

---

## 5 — Testing approach

- Each new feed gets a smoke test in `scripts/smoke-feeds.mjs` (run individually, count items returned)
- Full local ingest run: `npm run ingest:once` → counts logged per source
- Dev server `npm run dev`, manual verification of each new route
- TypeScript `tsc --noEmit` passes
- ESLint passes
- Build succeeds: `npm run build`

---

## 6 — Out of scope (deferred)

- Email/SMS alerting (needs SMTP, Twilio, etc.)
- Full SSO/SAML/OIDC
- On-prem deployment packaging
- ITAR/SOC2/FedRAMP certification
- Paid integrations (Maxar, Janes, Recorded Future Universal, MarineTraffic full AIS)
- Time-machine playback / historical replay
- Server-side audit log persistence with RBAC
- Real PDF export (puppeteer) — using browser print instead

---

## 7 — Phasing (build order)

1. DB migration 0003 + provenance.ts source-metadata table
2. Tier 1 sanctions feeds (OFAC/EU/UK/BIS) + sanctions panel
3. Tier 1 cyber feeds (KEV/NVD) + cyber panel
4. Tier 1 contracts feeds (SAM/TED/UK/DSCA) + contracts panel
5. Tier 1 ACLED + conflict signals
6. Tier 1 intel/think-tank RSS (Cipher Brief, CSIS, SIPRI, OPCW, Recorded Future)
7. Tier 2 GPSjam map layer + HIBP feed
8. Provenance UI upgrade in NewsItem + NewsPanel
9. Theater dashboards (Ukraine, Taiwan, Red Sea, Korea, Levant)
10. Adversary trackers (PLA, RU, IR, DPRK)
11. Watchlists (localStorage)
12. AI brief credibility scoring
13. Auth + API key middleware
14. Briefing PDF route + /defense landing
15. End-to-end test: build, ingest run, dev server smoke

---

## 8 — Success criteria

- All Tier 1 + Tier 2 feeds compile and either return data or fail gracefully with empty array
- `npm run build` succeeds, no TS errors
- `npm run dev` loads with no console errors
- New routes return 200 and render expected content
- Existing dashboard regression-free
- Documented in `.env.example` for every new optional key
