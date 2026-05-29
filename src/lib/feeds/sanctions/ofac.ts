// OFAC Specially Designated Nationals (SDN) list.
// Source: https://sanctionslistservice.ofac.treas.gov/api/PublicationPreview/exports/SDN.CSV
// Format: legacy CSV, no header — columns:
//   ent_num, SDN_Name, SDN_Type, Program, Title, Call_Sign, Vessel_Type,
//   Tonnage, GRT, Vessel_Flag, Vessel_Owner, Remarks
// We dedupe on ent_num + name; each SDN row becomes one entry.

import { parseCsv, safeFetchText, type SanctionEntry } from "./types";

const URL = "https://sanctionslistservice.ofac.treas.gov/api/PublicationPreview/exports/SDN.CSV";

function unwrap(s: string | undefined): string | null {
  if (!s) return null;
  const t = s.replace(/^-0-$/, "").trim();
  return t.length ? t : null;
}

export async function fetchOfacSdn(): Promise<SanctionEntry[]> {
  const text = await safeFetchText(URL, 45_000);
  if (!text) return [];
  const rows = parseCsv(text);
  const out: SanctionEntry[] = [];
  for (const r of rows) {
    if (r.length < 4) continue;
    const entNum = unwrap(r[0]);
    const name = unwrap(r[1]);
    const type = unwrap(r[2]);
    const program = unwrap(r[3]);
    const remarks = unwrap(r[11]);
    if (!entNum || !name) continue;
    out.push({
      externalKey: `ofac:sdn:${entNum}`,
      jurisdiction: "ofac",
      listName: "SDN",
      entityName: name,
      entityType: type,
      program,
      addressCountry: null,
      remarks,
      listedAt: null,
      raw: { entNum, name, type: type ?? "", program: program ?? "" },
    });
  }
  return out;
}
