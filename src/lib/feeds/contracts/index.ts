import type { ContractEntry } from "./types";
import { fetchSamGov } from "./sam";
import { fetchEuTed } from "./ted";
import { fetchUkContracts } from "./uk";
import { fetchDsca } from "./dsca";

export type { ContractEntry } from "./types";

export async function fetchAllContracts(): Promise<{ items: ContractEntry[]; byJurisdiction: Record<string, number> }> {
  const [sam, ted, uk, dsca] = await Promise.all([
    fetchSamGov().catch(() => [] as ContractEntry[]),
    fetchEuTed().catch(() => [] as ContractEntry[]),
    fetchUkContracts().catch(() => [] as ContractEntry[]),
    fetchDsca().catch(() => [] as ContractEntry[]),
  ]);
  return {
    items: [...sam, ...ted, ...uk, ...dsca],
    byJurisdiction: { "us-sam": sam.length, "eu-ted": ted.length, "uk-gov": uk.length, dsca: dsca.length },
  };
}
