import type { CyberAdvisory } from "./types";
import { fetchKev } from "./kev";
import { fetchNvdRecent } from "./nvd";
import { fetchHibpRecent } from "./hibp";

export type { CyberAdvisory } from "./types";

export async function fetchAllCyber(): Promise<{ items: CyberAdvisory[]; bySource: Record<string, number> }> {
  const [kev, nvd, hibp] = await Promise.all([
    fetchKev().catch(() => [] as CyberAdvisory[]),
    fetchNvdRecent().catch(() => [] as CyberAdvisory[]),
    fetchHibpRecent().catch(() => [] as CyberAdvisory[]),
  ]);
  return {
    items: [...kev, ...nvd, ...hibp],
    bySource: { kev: kev.length, nvd: nvd.length, hibp: hibp.length },
  };
}
