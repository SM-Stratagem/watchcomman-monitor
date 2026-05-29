// EU Consolidated Financial Sanctions list.
// Public download URL (no token required):
//   https://webgate.ec.europa.eu/fsd/fsf/public/files/csvFullSanctionsList_1_1/content
// Columns include FileGenerationDate, EntityLogicalId, Entity_LogicalId, name lines, etc.
// We use a defensive parser that keys by Entity_LogicalId + first name appearance.

import { parseCsv, safeFetchText, type SanctionEntry } from "./types";

const URL = "https://webgate.ec.europa.eu/fsd/fsf/public/files/csvFullSanctionsList_1_1/content";

export async function fetchEuConsolidated(): Promise<SanctionEntry[]> {
  const text = await safeFetchText(URL, 45_000);
  if (!text) return [];
  const rows = parseCsv(text);
  if (rows.length < 2) return [];
  const header = rows[0].map((h) => h.trim());
  const idx = (key: string): number => header.findIndex((h) => h.toLowerCase().includes(key.toLowerCase()));

  const iLogical = idx("Entity_LogicalId");
  const iWholeName = idx("NameAlias_WholeName");
  const iRegulation = idx("Regulation_PublicationDate");
  const iProgram = idx("Regulation_NumberTitle");
  const iCountry = idx("Address_CountryDescription");
  const iSubject = idx("Entity_SubjectType");

  const seen = new Set<string>();
  const out: SanctionEntry[] = [];
  for (let r = 1; r < rows.length; r++) {
    const row = rows[r];
    if (row.length < header.length / 2) continue;
    const logical = iLogical >= 0 ? row[iLogical] : null;
    const name = iWholeName >= 0 ? row[iWholeName] : null;
    if (!logical || !name) continue;
    const key = `eu:cfsp:${logical}`;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push({
      externalKey: key,
      jurisdiction: "eu",
      listName: "CFSP",
      entityName: name.trim(),
      entityType: iSubject >= 0 ? row[iSubject] || null : null,
      program: iProgram >= 0 ? row[iProgram] || null : null,
      addressCountry: iCountry >= 0 ? row[iCountry] || null : null,
      remarks: null,
      listedAt: iRegulation >= 0 && row[iRegulation] ? row[iRegulation] : null,
      raw: null,
    });
  }
  return out;
}
