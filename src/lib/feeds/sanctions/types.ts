export type SanctionEntry = {
  externalKey: string;
  jurisdiction: "ofac" | "eu" | "uk" | "bis";
  listName: string;
  entityName: string;
  entityType: string | null;
  program: string | null;
  addressCountry: string | null;
  remarks: string | null;
  listedAt: string | null;
  raw: Record<string, string> | null;
};

export async function safeFetchText(url: string, timeoutMs = 30_000): Promise<string | null> {
  try {
    const controller = new AbortController();
    const t = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const res = await fetch(url, {
        headers: {
          "user-agent": "watchcomman-monitor/1.0 (osint-dashboard)",
          accept: "text/csv,text/xml,application/xml,application/json,text/plain,*/*",
        },
        signal: controller.signal,
      });
      if (!res.ok) return null;
      return await res.text();
    } finally {
      clearTimeout(t);
    }
  } catch {
    return null;
  }
}

// Lightweight CSV row parser — handles quoted fields with embedded commas + newlines.
export function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let i = 0;
  let inQuote = false;
  while (i < text.length) {
    const c = text[i];
    if (inQuote) {
      if (c === '"') {
        if (text[i + 1] === '"') { field += '"'; i += 2; continue; }
        inQuote = false; i++; continue;
      }
      field += c; i++; continue;
    }
    if (c === '"') { inQuote = true; i++; continue; }
    if (c === ",") { row.push(field); field = ""; i++; continue; }
    if (c === "\r") { i++; continue; }
    if (c === "\n") {
      row.push(field); field = "";
      if (row.length > 1 || row[0] !== "") rows.push(row);
      row = []; i++; continue;
    }
    field += c; i++;
  }
  if (field.length > 0 || row.length > 0) {
    row.push(field);
    if (row.length > 1 || row[0] !== "") rows.push(row);
  }
  return rows;
}
