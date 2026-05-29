// Theater dashboard configuration — one config per geopolitical hot zone.
// Each theater curates:
//   - sources (slug subset) for news ingest
//   - keywords for filtering signals
//   - countries to highlight on the map
//   - bbox for map clipping
//   - dashboard label / accent

export type Theater = {
  slug: string;
  label: string;
  shortName: string;
  accent: string;
  description: string;
  countries: string[];
  keywords: string[];
  // bbox: [west, south, east, north]
  bbox: [number, number, number, number];
  sourceSlugs: string[];
};

export const THEATERS: Theater[] = [
  {
    slug: "ukraine",
    label: "Eastern Europe — Russia/Ukraine",
    shortName: "Ukraine",
    accent: "var(--accent-hot)",
    description: "Russia–Ukraine kinetic theater. Front-line activity, strike reporting, mobilization, and Western military aid flow.",
    countries: ["Ukraine", "Russia", "Russian Federation", "Belarus", "Poland", "Moldova", "Romania"],
    keywords: ["ukraine", "russia", "russian", "kyiv", "moscow", "donetsk", "kharkiv", "crimea", "mariupol", "putin", "zelensky", "kremlin", "drone", "missile strike"],
    bbox: [18, 42, 50, 58],
    sourceSlugs: [
      "ap-news", "reuters-world", "bbc-world", "guardian-world", "kyiv-independent", "ukrayinska-pravda",
      "ukrinform", "moscow-times", "meduza", "rferl", "european-pravda", "politico-europe",
      "rt", "tass", "sputnik", "bbc-russian", "der-spiegel", "le-monde", "iiss", "csis", "rusi", "rand", "atlantic-council",
      "modern-war-institute", "small-wars-journal", "lawfare-blog", "naval-news", "the-drive-warzone", "breaking-defense",
      "pentagon", "uk-mod", "white-house", "state-dept", "nato",
    ],
  },
  {
    slug: "taiwan",
    label: "Taiwan Strait & Indo-Pacific",
    shortName: "Taiwan",
    accent: "var(--accent-hot)",
    description: "China–Taiwan flashpoint. PLA ADIZ incursions, naval exercises, US/AUKUS posture, SCS island activity.",
    countries: ["Taiwan", "China", "Hong Kong", "Philippines", "Japan", "South Korea", "Korea, Republic of", "Korea, North"],
    keywords: ["taiwan", "china", "chinese", "pla", "pla navy", "adiz", "south china sea", "scs", "spratly", "paracel", "fujian", "tsmc", "xi", "beijing", "taipei", "aukus"],
    bbox: [105, 5, 145, 35],
    sourceSlugs: [
      "ap-news", "reuters-world", "reuters-asia", "bbc-world", "bbc-asia", "guardian-world",
      "scmp", "japan-times", "yonhap", "korea-herald", "korea-times", "nk-news",
      "xinhua", "global-times", "cgtn", "people-daily",
      "csis", "iiss", "rand", "atlantic-council", "rusi", "lawfare-blog",
      "pentagon", "state-dept", "naval-news", "the-drive-warzone", "breaking-defense", "modern-war-institute",
    ],
  },
  {
    slug: "red-sea",
    label: "Red Sea & Bab el-Mandeb",
    shortName: "Red Sea",
    accent: "var(--accent-hot)",
    description: "Bab el-Mandeb shipping chokepoint. Houthi missile/UAS interdictions, US/UK CENTCOM strikes, Suez economic exposure.",
    countries: ["Yemen", "Saudi Arabia", "Egypt", "Sudan", "Eritrea", "Djibouti", "Somalia", "Iran"],
    keywords: ["red sea", "bab el", "yemen", "houthi", "houthis", "ansar allah", "suez", "centcom", "shipping", "tanker", "merchant vessel", "uss", "hms", "drone boat"],
    bbox: [30, 8, 60, 30],
    sourceSlugs: [
      "ap-news", "reuters-world", "bbc-world", "bbc-middle-east", "guardian-me",
      "al-jazeera", "al-arabiya", "times-of-israel", "jpost", "haaretz", "ynet",
      "press-tv", "irna", "bbc-persian",
      "csis", "iiss", "rusi", "atlantic-council", "lawfare-blog",
      "pentagon", "state-dept", "uk-mod", "naval-news", "the-drive-warzone", "breaking-defense",
    ],
  },
  {
    slug: "korea",
    label: "Korean Peninsula",
    shortName: "Korea",
    accent: "var(--accent-warm)",
    description: "DPRK launch activity, ROK-US/Japan trilateral exercises, sanctions evasion, regime transitions.",
    countries: ["Korea, North", "North Korea", "Korea, South", "South Korea", "Japan", "China"],
    keywords: ["north korea", "dprk", "kim jong", "pyongyang", "rocket force", "icbm", "ihn", "south korea", "rok", "yonhap", "ulchi", "freedom shield"],
    bbox: [120, 30, 145, 45],
    sourceSlugs: [
      "ap-news", "reuters-world", "reuters-asia", "bbc-world", "bbc-asia",
      "yonhap", "korea-herald", "korea-times", "nk-news", "kcna",
      "japan-times", "scmp", "csis", "iiss", "rand", "atlantic-council",
      "pentagon", "state-dept", "treasury",
    ],
  },
  {
    slug: "levant",
    label: "Israel · Lebanon · Iran",
    shortName: "Levant",
    accent: "var(--accent-hot)",
    description: "Israel multi-front (Gaza, Lebanon, West Bank, Syria), Iran/IRGC proxy network, Hezbollah, hostage diplomacy.",
    countries: ["Israel", "Lebanon", "Iran", "Iran, Islamic Republic of", "Syria", "Jordan", "Palestine, State of", "Iraq"],
    keywords: ["israel", "idf", "hamas", "hezbollah", "lebanon", "gaza", "rafah", "tehran", "iran", "irgc", "houthi", "ayatollah", "khamenei", "netanyahu", "west bank"],
    bbox: [33, 28, 50, 38],
    sourceSlugs: [
      "ap-news", "reuters-world", "bbc-world", "bbc-middle-east", "guardian-me",
      "al-jazeera", "al-arabiya", "times-of-israel", "jpost", "haaretz", "ynet",
      "press-tv", "irna", "bbc-persian",
      "csis", "iiss", "rusi", "atlantic-council", "lawfare-blog",
      "state-dept", "pentagon",
    ],
  },
];

export const THEATERS_BY_SLUG: Record<string, Theater> = Object.fromEntries(THEATERS.map((t) => [t.slug, t]));

// Filter signals to a theater by country match OR keyword match in title/summary.
export function isSignalInTheater(t: Theater, s: { country: string | null; title: string; summary: string | null }): boolean {
  if (s.country && t.countries.some((c) => c.toLowerCase() === s.country!.toLowerCase())) return true;
  const blob = `${s.title} ${s.summary ?? ""}`.toLowerCase();
  return t.keywords.some((k) => blob.includes(k));
}

// Filter news to a theater.
export function isNewsInTheater(t: Theater, n: { sourceSlug: string; title: string; summary: string | null }): boolean {
  if (t.sourceSlugs.includes(n.sourceSlug)) return true;
  const blob = `${n.title} ${n.summary ?? ""}`.toLowerCase();
  return t.keywords.some((k) => blob.includes(k));
}
