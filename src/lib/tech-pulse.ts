// Tech pulse: HN Algolia (free) + GitHub trending via HN top "show github" filter.

import { safeFetchJson } from "./feeds/types";

export type TechItem = {
  id: string;
  title: string;
  url: string;
  points: number;
  comments: number;
  author: string;
  source: "hn" | "github";
  createdAt: string;
};

type HnHit = {
  objectID: string;
  title: string;
  url?: string;
  points?: number;
  num_comments?: number;
  author?: string;
  created_at: string;
};

export async function getHnTop(): Promise<TechItem[]> {
  const data = (await safeFetchJson(
    "https://hn.algolia.com/api/v1/search?tags=front_page&hitsPerPage=20",
  )) as { hits?: HnHit[] } | null;
  if (!data?.hits) return [];
  return data.hits.slice(0, 15).map((h) => ({
    id: `hn:${h.objectID}`,
    title: h.title,
    url: h.url || `https://news.ycombinator.com/item?id=${h.objectID}`,
    points: h.points ?? 0,
    comments: h.num_comments ?? 0,
    author: h.author ?? "—",
    source: "hn",
    createdAt: h.created_at,
  }));
}

type GhRepo = {
  full_name: string;
  description: string | null;
  html_url: string;
  stargazers_count: number;
  language: string | null;
  pushed_at: string;
};

export async function getGithubTrending(): Promise<TechItem[]> {
  // Use GitHub search for repos created in the last 7 days, sorted by stars
  const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
  const url = `https://api.github.com/search/repositories?q=created:>${since}&sort=stars&order=desc&per_page=15`;
  const headers: Record<string, string> = { accept: "application/vnd.github+json", "user-agent": "watchcomman-monitor/1.0" };
  if (process.env.GITHUB_TOKEN) headers.authorization = `Bearer ${process.env.GITHUB_TOKEN}`;
  const data = (await safeFetchJson(url, { headers })) as { items?: GhRepo[] } | null;
  if (!data?.items) return [];
  return data.items.slice(0, 12).map((r) => ({
    id: `gh:${r.full_name}`,
    title: `${r.full_name}${r.language ? ` · ${r.language}` : ""}${r.description ? ` — ${r.description.slice(0, 80)}` : ""}`,
    url: r.html_url,
    points: r.stargazers_count,
    comments: 0,
    author: r.full_name.split("/")[0],
    source: "github",
    createdAt: r.pushed_at,
  }));
}

let cache: { hn: TechItem[]; gh: TechItem[]; expiresAt: number } | null = null;
const TTL = 5 * 60 * 1000;

export async function getTechPulse(): Promise<{ hn: TechItem[]; gh: TechItem[] }> {
  if (cache && cache.expiresAt > Date.now()) return cache;
  const [hn, gh] = await Promise.all([getHnTop(), getGithubTrending()]);
  cache = { hn, gh, expiresAt: Date.now() + TTL };
  return cache;
}
