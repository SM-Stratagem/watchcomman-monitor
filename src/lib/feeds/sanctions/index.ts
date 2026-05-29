import type { SanctionEntry } from "./types";
import { fetchOfacSdn } from "./ofac";
import { fetchEuConsolidated } from "./eu";
import { fetchUkOfsi } from "./uk";
import { fetchBisEntityList } from "./bis";

export type { SanctionEntry } from "./types";

export async function fetchAllSanctions(): Promise<{ items: SanctionEntry[]; byJurisdiction: Record<string, number> }> {
  const [ofac, eu, uk, bis] = await Promise.all([
    fetchOfacSdn().catch(() => [] as SanctionEntry[]),
    fetchEuConsolidated().catch(() => [] as SanctionEntry[]),
    fetchUkOfsi().catch(() => [] as SanctionEntry[]),
    fetchBisEntityList().catch(() => [] as SanctionEntry[]),
  ]);
  const items = [...ofac, ...eu, ...uk, ...bis];
  const byJurisdiction: Record<string, number> = {
    ofac: ofac.length, eu: eu.length, uk: uk.length, bis: bis.length,
  };
  return { items, byJurisdiction };
}
