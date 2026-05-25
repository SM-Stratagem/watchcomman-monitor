import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = process.env.SITE_URL?.replace(/\/+$/, "") ?? "https://watchcomman.app";
  const lastModified = new Date();
  return [
    { url: `${base}/`, lastModified, changeFrequency: "hourly", priority: 1 },
    { url: `${base}/about`, lastModified, changeFrequency: "monthly", priority: 0.6 },
    { url: `${base}/privacy`, lastModified, changeFrequency: "yearly", priority: 0.3 },
  ];
}
