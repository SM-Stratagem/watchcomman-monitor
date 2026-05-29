// SAM.gov contract opportunities — public API with optional SAM_API_KEY for higher quotas.
// Defense NAICS codes filtered: 336411 (aircraft), 336412 (engines), 336413 (parts), 336414 (missiles),
// 336992 (mil vehicles), 541330/541715 (R&D), 928110 (national security).
// Without a key the public search is heavily rate limited; gracefully degrade.

import { safeFetchJson } from "../types";
import type { ContractEntry } from "./types";

const DEFENSE_NAICS = ["336411","336412","336413","336414","336992","541330","541715","928110"];

type SamOpp = {
  noticeId?: string;
  title?: string;
  fullParentPathName?: string;
  classificationCode?: string;
  naicsCode?: string;
  postedDate?: string;
  responseDeadLine?: string;
  awardAmount?: string;
  description?: string;
  uiLink?: string;
  placeOfPerformance?: { country?: { name?: string } };
};
type SamResponse = { opportunitiesData?: SamOpp[]; totalRecords?: number };

export async function fetchSamGov(): Promise<ContractEntry[]> {
  const key = process.env.SAM_API_KEY;
  if (!key) return []; // SAM.gov public endpoint requires API key for any meaningful query
  const out: ContractEntry[] = [];
  const today = new Date();
  const posted = new Date(today.getTime() - 14 * 24 * 60 * 60 * 1000);
  const fmt = (d: Date): string => `${(d.getMonth() + 1).toString().padStart(2, "0")}/${d.getDate().toString().padStart(2, "0")}/${d.getFullYear()}`;
  for (const naics of DEFENSE_NAICS) {
    const url = `https://api.sam.gov/opportunities/v2/search?api_key=${key}&limit=100&postedFrom=${fmt(posted)}&postedTo=${fmt(today)}&ncode=${naics}`;
    const j = (await safeFetchJson(url, { timeoutMs: 25_000 })) as SamResponse | null;
    if (!j?.opportunitiesData?.length) continue;
    for (const o of j.opportunitiesData) {
      if (!o.noticeId || !o.title) continue;
      const valueUsd = o.awardAmount ? Number(o.awardAmount.replace(/[^\d.]/g, "")) || null : null;
      out.push({
        externalKey: `sam:${o.noticeId}`,
        jurisdiction: "us-sam",
        title: o.title,
        agency: o.fullParentPathName ?? null,
        naics: o.naicsCode ?? naics,
        valueUsd,
        country: o.placeOfPerformance?.country?.name ?? "United States",
        summary: o.description ? o.description.slice(0, 400) : null,
        link: o.uiLink ?? null,
        publishedAt: o.postedDate ? new Date(o.postedDate).toISOString() : new Date().toISOString(),
        deadlineAt: o.responseDeadLine ? new Date(o.responseDeadLine).toISOString() : null,
      });
    }
  }
  return out;
}
