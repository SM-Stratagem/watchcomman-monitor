// UK OFSI Consolidated List of financial sanctions targets.
// Public CSV: https://ofsistorage.blob.core.windows.net/publishlive/2022format/ConList.csv
// Columns vary by row type (Individual/Entity/Vessel). We treat each Group ID row as one entry.

import { parseCsv, safeFetchText, type SanctionEntry } from "./types";

const URL = "https://ofsistorage.blob.core.windows.net/publishlive/2022format/ConList.csv";

export async function fetchUkOfsi(): Promise<SanctionEntry[]> {
  const text = await safeFetchText(URL, 45_000);
  if (!text) return [];
  const rows = parseCsv(text);
  if (rows.length < 3) return [];
  // OFSI CSV begins with a "Last Updated,<date>" meta row, then the header row.
  // Skip until we find a row that looks like headers (contains "Group Type" or "Group ID").
  let headerIdx = 0;
  for (let i = 0; i < Math.min(rows.length, 5); i++) {
    const joined = rows[i].join(" ").toLowerCase();
    if (joined.includes("group id") || joined.includes("group type")) { headerIdx = i; break; }
  }
  const header = rows[headerIdx].map((h) => h.trim());
  const find = (...keys: string[]): number => {
    for (const k of keys) {
      const i = header.findIndex((h) => h.toLowerCase().includes(k.toLowerCase()));
      if (i >= 0) return i;
    }
    return -1;
  };

  const iGroup = find("Group ID");
  const iName1 = find("Name 6", "Organisation Name");
  const iName2 = find("Name 1");
  const iType = find("Group Type");
  const iRegime = find("Regime");
  const iCountry = find("Country");
  const iDate = find("Listed On");

  const seen = new Set<string>();
  const out: SanctionEntry[] = [];
  for (let r = headerIdx + 1; r < rows.length; r++) {
    const row = rows[r];
    if (!row || row.length === 0) continue;
    const group = iGroup >= 0 ? row[iGroup] : null;
    if (!group) continue;
    const key = `uk:ofsi:${group}`;
    if (seen.has(key)) continue;
    const name = [iName2 >= 0 ? row[iName2] : "", iName1 >= 0 ? row[iName1] : ""].filter(Boolean).join(" ").trim();
    if (!name) continue;
    seen.add(key);
    out.push({
      externalKey: key,
      jurisdiction: "uk",
      listName: "OFSI",
      entityName: name,
      entityType: iType >= 0 ? row[iType] || null : null,
      program: iRegime >= 0 ? row[iRegime] || null : null,
      addressCountry: iCountry >= 0 ? row[iCountry] || null : null,
      remarks: null,
      listedAt: iDate >= 0 ? row[iDate] || null : null,
      raw: null,
    });
  }
  return out;
}
