export function slugify(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^\w\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .slice(0, 80);
}

export function unslugify(slug: string, dict: string[]): string | null {
  const norm = slug.toLowerCase();
  for (const v of dict) if (slugify(v) === norm) return v;
  return null;
}

export function formatRelative(iso: string | null | undefined): string {
  if (!iso) return "—";
  const t = new Date(iso).getTime();
  const diff = Date.now() - t;
  if (!Number.isFinite(diff)) return "—";
  const min = Math.max(1, Math.round(diff / 60_000));
  if (min < 60) return `${min}m ago`;
  const hr = Math.round(min / 60);
  if (hr < 24) return `${hr}h ago`;
  const d = Math.round(hr / 24);
  return `${d}d ago`;
}

export function severityColor(sev: string): string {
  switch (sev) {
    case "critical": return "var(--accent-hot)";
    case "high": return "#ff9266";
    case "elevated": return "var(--accent-warm)";
    case "moderate": return "var(--accent-cool)";
    case "low": return "var(--accent)";
    default: return "var(--ink-2)";
  }
}

export const CATEGORY_LABELS: Record<string, string> = {
  outbreak: "Outbreaks",
  advisory: "Advisories",
  logistics: "Logistics",
  environment: "Environment",
  earthquake: "Earthquakes",
  wildfire: "Wildfires",
  storm: "Storms",
  flood: "Floods",
  disaster: "Disasters",
};
