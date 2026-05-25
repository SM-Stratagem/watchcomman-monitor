// A deterministic seed set used both when no upstream monitor data is available
// and as a baseline that the ingest job augments. These represent realistic
// monitoring signals across known monitor regions; replace with live feeds
// from the Ebola and Hantavirus monitor APIs by extending `ingest.ts`.

export type SeedSignal = {
  externalKey: string;
  source: string;
  category: string;
  subcategory?: string | null;
  severity: "low" | "moderate" | "elevated" | "high" | "critical";
  title: string;
  summary: string;
  region: string;
  country: string;
  latitude: number;
  longitude: number;
  magnitude?: number | null;
  affected?: number | null;
  occurredAt: string;
  sourceUrl?: string | null;
};

const HOUR = 60 * 60 * 1000;

export function buildSeedSignals(now: Date = new Date()): SeedSignal[] {
  const t = now.getTime();
  const at = (h: number) => new Date(t - h * HOUR).toISOString();

  return [
    {
      externalKey: "seed:ebola-equateur-cluster",
      source: "ebola",
      category: "outbreak",
      severity: "high",
      title: "Suspected EVD cluster — Équateur Province",
      summary:
        "Provincial surveillance flagged a small cluster of hemorrhagic illness pending laboratory confirmation.",
      region: "Central Africa",
      country: "Democratic Republic of the Congo",
      latitude: -0.046,
      longitude: 18.265,
      occurredAt: at(2),
      sourceUrl: "https://www.ebolamonitorapp.com",
    },
    {
      externalKey: "seed:ebola-uganda-advisory",
      source: "ebola",
      category: "advisory",
      severity: "moderate",
      title: "Travel advisory updated — Uganda border districts",
      summary: "Enhanced screening posted at Kasese and Bundibugyo border crossings.",
      region: "East Africa",
      country: "Uganda",
      latitude: 1.373,
      longitude: 32.290,
      occurredAt: at(6),
      sourceUrl: "https://www.ebolamonitorapp.com",
    },
    {
      externalKey: "seed:hanta-yosemite-monitoring",
      source: "hantavirus",
      category: "environment",
      severity: "elevated",
      title: "Sin Nombre virus detection in deer mice — Sierra Nevada",
      summary: "Routine rodent surveillance returned positive results in three sampling sites.",
      region: "North America",
      country: "United States",
      latitude: 37.865,
      longitude: -119.538,
      occurredAt: at(9),
      sourceUrl: "https://hantavirus-monitor.up.railway.app",
    },
    {
      externalKey: "seed:hanta-patagonia-cluster",
      source: "hantavirus",
      category: "outbreak",
      severity: "high",
      title: "Andes virus cluster — Aysén Region",
      summary: "Four laboratory-confirmed HPS cases reported across two communities.",
      region: "South America",
      country: "Chile",
      latitude: -45.571,
      longitude: -72.068,
      occurredAt: at(14),
      sourceUrl: "https://hantavirus-monitor.up.railway.app",
    },
    {
      externalKey: "seed:hanta-argentina-watch",
      source: "hantavirus",
      category: "advisory",
      severity: "moderate",
      title: "Watch posted — Neuquén Province",
      summary: "Provincial health ministry posted a hantavirus watch ahead of peak rodent season.",
      region: "South America",
      country: "Argentina",
      latitude: -38.951,
      longitude: -68.060,
      occurredAt: at(18),
    },
    {
      externalKey: "seed:logistics-airbridge-kinshasa",
      source: "seed",
      category: "logistics",
      severity: "low",
      title: "Medical airbridge maintained — Kinshasa N'djili",
      summary: "Regional cargo capacity for cold-chain payloads holding above baseline.",
      region: "Central Africa",
      country: "Democratic Republic of the Congo",
      latitude: -4.385,
      longitude: 15.444,
      occurredAt: at(22),
    },
    {
      externalKey: "seed:env-rodent-surge-nm",
      source: "seed",
      category: "environment",
      severity: "elevated",
      title: "Peromyscus surge index above seasonal baseline — New Mexico",
      summary: "Trapping indices in the Four Corners area trended above 18-month median.",
      region: "North America",
      country: "United States",
      latitude: 36.300,
      longitude: -108.460,
      occurredAt: at(30),
    },
    {
      externalKey: "seed:ebola-guinea-watch",
      source: "ebola",
      category: "advisory",
      severity: "moderate",
      title: "Forest-region rumour log updated — Nzérékoré",
      summary: "Field teams investigating two unverified community reports.",
      region: "West Africa",
      country: "Guinea",
      latitude: 7.749,
      longitude: -8.819,
      occurredAt: at(40),
    },
    {
      externalKey: "seed:env-monsoon-shift-india",
      source: "seed",
      category: "environment",
      severity: "low",
      title: "Late-season monsoon residual — Western Ghats",
      summary:
        "Persistent moisture conditions noted; vector and rodent activity being monitored.",
      region: "South Asia",
      country: "India",
      latitude: 12.290,
      longitude: 75.260,
      occurredAt: at(50),
    },
    {
      externalKey: "seed:ebola-sierra-leone-readiness",
      source: "ebola",
      category: "logistics",
      severity: "low",
      title: "Readiness exercise concluded — Freetown",
      summary: "Cross-agency tabletop exercise reviewing isolation-unit standby protocols.",
      region: "West Africa",
      country: "Sierra Leone",
      latitude: 8.484,
      longitude: -13.234,
      occurredAt: at(60),
    },
    {
      externalKey: "seed:hanta-canada-yukon",
      source: "hantavirus",
      category: "environment",
      severity: "low",
      title: "Subarctic surveillance routine — Yukon",
      summary: "Seasonal trapping completed; no anomalous detections.",
      region: "North America",
      country: "Canada",
      latitude: 64.282,
      longitude: -135.000,
      occurredAt: at(72),
    },
    {
      externalKey: "seed:advisory-eu-ecdc",
      source: "seed",
      category: "advisory",
      severity: "low",
      title: "ECDC weekly threat assessment published",
      summary: "European Centre advisory cycle completed; no new high-severity actions.",
      region: "Europe",
      country: "Sweden",
      latitude: 59.329,
      longitude: 18.068,
      occurredAt: at(80),
    },
  ];
}
