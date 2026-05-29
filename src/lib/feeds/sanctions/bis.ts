// BIS Entity List (US export controls), pulled via the ITA Consolidated Screening List.
// JSON snapshot: https://data.trade.gov/downloadable_consolidated_screening_list/v1/consolidated.json
// We filter source="Entity List (EL) - Bureau of Industry and Security".

import { safeFetchText } from "./types";
import type { SanctionEntry } from "./types";

const URL = "https://data.trade.gov/downloadable_consolidated_screening_list/v1/consolidated.json";

type Record = {
  id?: string;
  name?: string;
  source?: string;
  source_list_url?: string;
  source_information_url?: string;
  programs?: string[];
  type?: string;
  addresses?: Array<{ country?: string }>;
  remarks?: string;
  start_date?: string;
};

export async function fetchBisEntityList(): Promise<SanctionEntry[]> {
  // 33 MB JSON download — use plain text fetch then JSON.parse to avoid issues with default fetch parsers.
  const txt = await safeFetchText(URL, 90_000);
  if (!txt) return [];
  let parsed: { results?: Record[] } | null = null;
  try { parsed = JSON.parse(txt); } catch { return []; }
  const all = parsed?.results ?? [];
  if (!all.length) return [];

  const out: SanctionEntry[] = [];
  for (const r of all) {
    if (!r.source || !r.name || !r.id) continue;
    if (!r.source.includes("Entity List")) continue;
    const country = r.addresses?.find((a) => a.country)?.country ?? null;
    out.push({
      externalKey: `bis:el:${r.id}`,
      jurisdiction: "bis",
      listName: "ENTITY_LIST",
      entityName: r.name,
      entityType: r.type ?? null,
      program: r.programs?.join("; ") ?? null,
      addressCountry: country,
      remarks: r.remarks ?? null,
      listedAt: r.start_date ?? null,
      raw: null,
    });
  }
  return out;
}
