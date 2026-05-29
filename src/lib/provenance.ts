// Provenance metadata for news sources.
// For each known source slug we map:
//   - country (ISO-2)
//   - language (ISO-639-1, lowercase)
//   - affiliation: wire | mainstream | state-media | advocacy | think-tank | gov | opaque
//   - bias: left | center-left | center | center-right | right | mixed | none
// Defense customers care about "is this state media", "is this an independent outlet"
// and "does this stand alone, or is it just one of N copies of the same wire".

export type Affiliation = "wire" | "mainstream" | "state-media" | "advocacy" | "think-tank" | "gov" | "opaque";
export type Bias = "left" | "center-left" | "center" | "center-right" | "right" | "mixed" | "none";

export type Provenance = {
  country: string;       // ISO-2 uppercase (or "INT" for international)
  language: string;      // ISO-639-1 lowercase
  affiliation: Affiliation;
  bias: Bias;
};

const M: Record<string, Provenance> = {
  // ── Global wires
  "ap-news":             { country: "US", language: "en", affiliation: "wire",        bias: "center" },
  "reuters-world":       { country: "GB", language: "en", affiliation: "wire",        bias: "center" },
  "reuters-us":          { country: "GB", language: "en", affiliation: "wire",        bias: "center" },
  "reuters-business":    { country: "GB", language: "en", affiliation: "wire",        bias: "center" },
  "reuters-asia":        { country: "GB", language: "en", affiliation: "wire",        bias: "center" },
  "reuters-energy":      { country: "GB", language: "en", affiliation: "wire",        bias: "center" },
  "reuters-latam":       { country: "GB", language: "en", affiliation: "wire",        bias: "center" },
  "bbc-world":           { country: "GB", language: "en", affiliation: "mainstream",  bias: "center-left" },
  "bbc-africa":          { country: "GB", language: "en", affiliation: "mainstream",  bias: "center-left" },
  "bbc-asia":            { country: "GB", language: "en", affiliation: "mainstream",  bias: "center-left" },
  "bbc-middle-east":     { country: "GB", language: "en", affiliation: "mainstream",  bias: "center-left" },
  "bbc-latin-america":   { country: "GB", language: "en", affiliation: "mainstream",  bias: "center-left" },
  "bbc-afrique":         { country: "GB", language: "fr", affiliation: "mainstream",  bias: "center-left" },
  "bbc-mundo":           { country: "GB", language: "es", affiliation: "mainstream",  bias: "center-left" },
  "bbc-persian":         { country: "GB", language: "fa", affiliation: "mainstream",  bias: "center-left" },
  "bbc-russian":         { country: "GB", language: "ru", affiliation: "mainstream",  bias: "center-left" },
  "bbc-turkce":          { country: "GB", language: "tr", affiliation: "mainstream",  bias: "center-left" },
  "guardian-world":      { country: "GB", language: "en", affiliation: "mainstream",  bias: "left" },
  "guardian-me":         { country: "GB", language: "en", affiliation: "mainstream",  bias: "left" },
  "guardian-americas":   { country: "GB", language: "en", affiliation: "mainstream",  bias: "left" },
  "guardian-australia":  { country: "AU", language: "en", affiliation: "mainstream",  bias: "left" },
  "cnn-world":           { country: "US", language: "en", affiliation: "mainstream",  bias: "left" },
  "al-jazeera":          { country: "QA", language: "en", affiliation: "state-media", bias: "mixed" },
  "al-arabiya":          { country: "SA", language: "en", affiliation: "state-media", bias: "mixed" },
  "france-24":           { country: "FR", language: "en", affiliation: "state-media", bias: "center" },
  "france-24-latam":     { country: "FR", language: "es", affiliation: "state-media", bias: "center" },
  "dw-news":             { country: "DE", language: "en", affiliation: "state-media", bias: "center" },
  "dw-turkish":          { country: "DE", language: "tr", affiliation: "state-media", bias: "center" },

  // ── US
  "abc-news":            { country: "US", language: "en", affiliation: "mainstream",  bias: "center-left" },
  "cbs-news":            { country: "US", language: "en", affiliation: "mainstream",  bias: "center-left" },
  "nbc-news":            { country: "US", language: "en", affiliation: "mainstream",  bias: "center-left" },
  "fox-news":            { country: "US", language: "en", affiliation: "mainstream",  bias: "right" },
  "npr-news":            { country: "US", language: "en", affiliation: "mainstream",  bias: "center-left" },
  "pbs-newshour":        { country: "US", language: "en", affiliation: "mainstream",  bias: "center-left" },
  "the-hill":            { country: "US", language: "en", affiliation: "mainstream",  bias: "center" },
  "politico":            { country: "US", language: "en", affiliation: "mainstream",  bias: "center-left" },
  "axios":               { country: "US", language: "en", affiliation: "mainstream",  bias: "center" },
  "wsj":                 { country: "US", language: "en", affiliation: "mainstream",  bias: "center-right" },
  "marketwatch":         { country: "US", language: "en", affiliation: "mainstream",  bias: "center" },
  "yahoo-finance":       { country: "US", language: "en", affiliation: "mainstream",  bias: "center" },
  "cnbc":                { country: "US", language: "en", affiliation: "mainstream",  bias: "center" },

  // ── US Government / Defense / Policy
  "state-dept":          { country: "US", language: "en", affiliation: "gov",         bias: "none" },
  "doj":                 { country: "US", language: "en", affiliation: "gov",         bias: "none" },
  "treasury":            { country: "US", language: "en", affiliation: "gov",         bias: "none" },
  "white-house":         { country: "US", language: "en", affiliation: "gov",         bias: "none" },
  "pentagon":            { country: "US", language: "en", affiliation: "gov",         bias: "none" },
  "uk-mod":              { country: "GB", language: "en", affiliation: "gov",         bias: "none" },
  "cisa":                { country: "US", language: "en", affiliation: "gov",         bias: "none" },
  "dhs":                 { country: "US", language: "en", affiliation: "gov",         bias: "none" },
  "sec":                 { country: "US", language: "en", affiliation: "gov",         bias: "none" },
  "cdc":                 { country: "US", language: "en", affiliation: "gov",         bias: "none" },
  "who":                 { country: "INT", language: "en", affiliation: "gov",         bias: "none" },
  "unhcr":               { country: "INT", language: "en", affiliation: "gov",         bias: "none" },
  "un-news":             { country: "INT", language: "en", affiliation: "gov",         bias: "none" },
  "iaea":                { country: "INT", language: "en", affiliation: "gov",         bias: "none" },

  // ── Europe (selected — others fall to default per-region)
  "tagesschau":          { country: "DE", language: "de", affiliation: "state-media", bias: "center-left" },
  "der-spiegel":         { country: "DE", language: "en", affiliation: "mainstream",  bias: "center-left" },
  "die-zeit":            { country: "DE", language: "de", affiliation: "mainstream",  bias: "center-left" },
  "bild":                { country: "DE", language: "de", affiliation: "mainstream",  bias: "right" },
  "le-monde":            { country: "FR", language: "fr", affiliation: "mainstream",  bias: "center-left" },
  "el-pais":             { country: "ES", language: "es", affiliation: "mainstream",  bias: "center-left" },
  "el-mundo":            { country: "ES", language: "es", affiliation: "mainstream",  bias: "center-right" },
  "corriere-della-sera": { country: "IT", language: "it", affiliation: "mainstream",  bias: "center" },
  "ansa":                { country: "IT", language: "it", affiliation: "wire",        bias: "center" },
  "de-telegraaf":        { country: "NL", language: "nl", affiliation: "mainstream",  bias: "center-right" },
  "nrc":                 { country: "NL", language: "nl", affiliation: "mainstream",  bias: "center" },
  "nos-nieuws":          { country: "NL", language: "nl", affiliation: "state-media", bias: "center" },
  "svenska-dagbladet":   { country: "SE", language: "sv", affiliation: "mainstream",  bias: "center-right" },
  "svt-nyheter":         { country: "SE", language: "sv", affiliation: "state-media", bias: "center-left" },
  "dagens-nyheter":      { country: "SE", language: "sv", affiliation: "mainstream",  bias: "center" },
  "kathimerini":         { country: "GR", language: "en", affiliation: "mainstream",  bias: "center-right" },
  "iefimerida":          { country: "GR", language: "el", affiliation: "mainstream",  bias: "center" },
  "in-gr":               { country: "GR", language: "el", affiliation: "mainstream",  bias: "center" },
  "proto-thema":         { country: "GR", language: "el", affiliation: "mainstream",  bias: "center" },
  "tvn24":               { country: "PL", language: "pl", affiliation: "mainstream",  bias: "center" },

  // ── State media (commonly flagged for OSINT)
  "rt":                  { country: "RU", language: "en", affiliation: "state-media", bias: "right" },
  "tass":                { country: "RU", language: "en", affiliation: "state-media", bias: "mixed" },
  "sputnik":             { country: "RU", language: "en", affiliation: "state-media", bias: "right" },
  "xinhua":              { country: "CN", language: "en", affiliation: "state-media", bias: "mixed" },
  "global-times":        { country: "CN", language: "en", affiliation: "state-media", bias: "mixed" },
  "cgtn":                { country: "CN", language: "en", affiliation: "state-media", bias: "mixed" },
  "people-daily":        { country: "CN", language: "en", affiliation: "state-media", bias: "mixed" },
  "scmp":                { country: "HK", language: "en", affiliation: "mainstream",  bias: "center" },
  "press-tv":            { country: "IR", language: "en", affiliation: "state-media", bias: "mixed" },
  "irna":                { country: "IR", language: "en", affiliation: "state-media", bias: "mixed" },
  "kcna":                { country: "KP", language: "en", affiliation: "state-media", bias: "mixed" },
  "nk-news":             { country: "KR", language: "en", affiliation: "mainstream",  bias: "center" },
  "yonhap":              { country: "KR", language: "en", affiliation: "wire",        bias: "center" },
  "korea-herald":        { country: "KR", language: "en", affiliation: "mainstream",  bias: "center-right" },
  "korea-times":         { country: "KR", language: "en", affiliation: "mainstream",  bias: "center" },
  "jpost":               { country: "IL", language: "en", affiliation: "mainstream",  bias: "center-right" },
  "haaretz":             { country: "IL", language: "en", affiliation: "mainstream",  bias: "left" },
  "times-of-israel":     { country: "IL", language: "en", affiliation: "mainstream",  bias: "center" },
  "ynet":                { country: "IL", language: "en", affiliation: "mainstream",  bias: "center" },
  "ndtv":                { country: "IN", language: "en", affiliation: "mainstream",  bias: "center" },
  "hindustan-times":     { country: "IN", language: "en", affiliation: "mainstream",  bias: "center" },
  "times-of-india":      { country: "IN", language: "en", affiliation: "mainstream",  bias: "center" },
  "the-hindu":           { country: "IN", language: "en", affiliation: "mainstream",  bias: "center-left" },
  "indian-express":      { country: "IN", language: "en", affiliation: "mainstream",  bias: "center" },
  "ukrinform":           { country: "UA", language: "en", affiliation: "state-media", bias: "center" },
  "kyiv-independent":    { country: "UA", language: "en", affiliation: "mainstream",  bias: "center" },
  "ukrayinska-pravda":   { country: "UA", language: "en", affiliation: "mainstream",  bias: "center" },
  "moscow-times":        { country: "RU", language: "en", affiliation: "mainstream",  bias: "center" },
  "meduza":              { country: "LV", language: "en", affiliation: "mainstream",  bias: "center" },
  "nyt":                 { country: "US", language: "en", affiliation: "mainstream",  bias: "center-left" },
  "wapo":                { country: "US", language: "en", affiliation: "mainstream",  bias: "center-left" },
  "bloomberg":           { country: "US", language: "en", affiliation: "mainstream",  bias: "center" },
  "ft":                  { country: "GB", language: "en", affiliation: "mainstream",  bias: "center-right" },
  "economist":           { country: "GB", language: "en", affiliation: "mainstream",  bias: "center-right" },

  // ── Think-tanks / analyst commentary (Tier 1+2)
  "cipher-brief":        { country: "US", language: "en", affiliation: "think-tank",  bias: "center" },
  "recorded-future":     { country: "US", language: "en", affiliation: "think-tank",  bias: "center" },
  "csis":                { country: "US", language: "en", affiliation: "think-tank",  bias: "center" },
  "rand":                { country: "US", language: "en", affiliation: "think-tank",  bias: "center" },
  "brookings":           { country: "US", language: "en", affiliation: "think-tank",  bias: "center-left" },
  "cfr":                 { country: "US", language: "en", affiliation: "think-tank",  bias: "center" },
  "atlantic-council":    { country: "US", language: "en", affiliation: "think-tank",  bias: "center" },
  "iiss":                { country: "GB", language: "en", affiliation: "think-tank",  bias: "center" },
  "sipri":               { country: "SE", language: "en", affiliation: "think-tank",  bias: "center" },
  "rusi":                { country: "GB", language: "en", affiliation: "think-tank",  bias: "center" },
  "carnegie":            { country: "US", language: "en", affiliation: "think-tank",  bias: "center" },
  "opcw":                { country: "INT", language: "en", affiliation: "gov",         bias: "none" },
};

// Heuristics fallback by source slug prefix / region — used when no explicit mapping.
const REGION_DEFAULTS: Record<string, Provenance> = {
  worldwide:       { country: "INT", language: "en", affiliation: "mainstream", bias: "center" },
  us:              { country: "US",  language: "en", affiliation: "mainstream", bias: "center" },
  europe:          { country: "EU",  language: "en", affiliation: "mainstream", bias: "center" },
  "middle-east":   { country: "INT", language: "en", affiliation: "mainstream", bias: "center" },
  africa:          { country: "INT", language: "en", affiliation: "mainstream", bias: "center" },
  "latin-america": { country: "INT", language: "es", affiliation: "mainstream", bias: "center" },
  asia:            { country: "INT", language: "en", affiliation: "mainstream", bias: "center" },
  oceania:         { country: "AU",  language: "en", affiliation: "mainstream", bias: "center" },
  russia:          { country: "RU",  language: "en", affiliation: "mainstream", bias: "mixed" },
  defense:         { country: "INT", language: "en", affiliation: "mainstream", bias: "center" },
  policy:          { country: "US",  language: "en", affiliation: "gov",        bias: "none" },
  energy:          { country: "INT", language: "en", affiliation: "mainstream", bias: "center" },
  finance:         { country: "US",  language: "en", affiliation: "mainstream", bias: "center" },
  tech:            { country: "US",  language: "en", affiliation: "mainstream", bias: "center" },
  health:          { country: "INT", language: "en", affiliation: "mainstream", bias: "center" },
  climate:         { country: "INT", language: "en", affiliation: "mainstream", bias: "center" },
};

export function getProvenance(slug: string | undefined | null, region?: string): Provenance {
  if (slug && M[slug]) return M[slug];
  if (region && REGION_DEFAULTS[region]) return REGION_DEFAULTS[region];
  return { country: "INT", language: "en", affiliation: "mainstream", bias: "center" };
}

// Flag emoji from ISO-2 (returns earth emoji for INT/EU).
export function flagEmoji(country: string): string {
  if (country === "INT") return "🌐";
  if (country === "EU") return "🇪🇺";
  if (country.length !== 2) return "🌐";
  const base = 0x1f1e6;
  const A = "A".charCodeAt(0);
  return String.fromCodePoint(base + country.charCodeAt(0) - A, base + country.charCodeAt(1) - A);
}

export function affiliationLabel(a: Affiliation): string {
  return a.replace("-", " ").toUpperCase();
}

// Color hint for UI chips — keeps state-media visually distinct.
export function affiliationColor(a: Affiliation): string {
  switch (a) {
    case "state-media": return "var(--accent-hot, #d54c4c)";
    case "wire":        return "var(--accent-cool, #5a9cff)";
    case "gov":         return "var(--accent-cool, #5a9cff)";
    case "think-tank":  return "var(--accent, #c9a86a)";
    case "advocacy":    return "var(--accent-warm, #d8995a)";
    case "opaque":      return "var(--ink-3, #8c8a87)";
    case "mainstream":
    default:            return "var(--ink-2, #a3a09b)";
  }
}

// Quick predicates for cross-source corroboration counters.
export function isStateMedia(slug: string | undefined | null, region?: string): boolean {
  return getProvenance(slug, region).affiliation === "state-media";
}
export function isIndependent(slug: string | undefined | null, region?: string): boolean {
  const a = getProvenance(slug, region).affiliation;
  return a === "mainstream" || a === "wire" || a === "think-tank";
}
