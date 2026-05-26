import type { MetadataRoute } from "next";
import { CATEGORY_LABELS, slugify } from "@/lib/format";
import { getDashboardSnapshot } from "@/lib/dashboard";

const KNOWN_REGIONS = [
  "Europe", "Asia", "Southeast Asia", "Oceania",
  "North Africa & Middle East", "West & Central Africa", "Southern Africa", "East Africa",
  "North America", "Central America & Caribbean", "South America",
  "Central Africa", "West Africa", "South Asia",
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = process.env.SITE_URL?.replace(/\/+$/, "") ?? "https://watchcomman.app";
  const lastModified = new Date();

  const fixed: MetadataRoute.Sitemap = [
    { url: `${base}/`, lastModified, changeFrequency: "hourly", priority: 1 },
    { url: `${base}/dashboard`, lastModified, changeFrequency: "hourly", priority: 0.95 },
    { url: `${base}/signals`, lastModified, changeFrequency: "hourly", priority: 0.9 },
    { url: `${base}/sources`, lastModified, changeFrequency: "weekly", priority: 0.7 },
    { url: `${base}/map`, lastModified, changeFrequency: "hourly", priority: 0.9 },
    { url: `${base}/countries`, lastModified, changeFrequency: "daily", priority: 0.7 },
    { url: `${base}/api-docs`, lastModified, changeFrequency: "monthly", priority: 0.6 },
    { url: `${base}/about`, lastModified, changeFrequency: "monthly", priority: 0.5 },
    { url: `${base}/privacy`, lastModified, changeFrequency: "yearly", priority: 0.3 },
  ];

  const diseases = Object.keys(CATEGORY_LABELS).map((c) => ({
    url: `${base}/disease/${c}`,
    lastModified,
    changeFrequency: "daily" as const,
    priority: 0.7,
  }));

  const regions = KNOWN_REGIONS.map((r) => ({
    url: `${base}/region/${slugify(r)}`,
    lastModified,
    changeFrequency: "daily" as const,
    priority: 0.6,
  }));

  let countries: MetadataRoute.Sitemap = [];
  try {
    const snap = await getDashboardSnapshot(500);
    countries = snap.countries.map((c) => ({
      url: `${base}/country/${slugify(c.key)}`,
      lastModified,
      changeFrequency: "daily" as const,
      priority: 0.5,
    }));
  } catch {}

  return [...fixed, ...diseases, ...regions, ...countries];
}
