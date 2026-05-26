// Static GIS reference layers for the OSINT map.
// All entries are public, widely documented locations. Subset only — focus on
// strategic/headline-relevant nodes. Coordinates: [lng, lat].

export type MapMarker = {
  id: string;
  name: string;
  country?: string;
  coords: [number, number];
  note?: string;
};

export type LayerDef = {
  slug: string;
  label: string;
  color: string;
  glyph: string;
  description: string;
  defaultOn: boolean;
  data: MapMarker[];
};

// Major military bases (illustrative subset, US + allies + adversaries)
const MILITARY_BASES: MapMarker[] = [
  { id: "ramstein", name: "Ramstein AB", country: "Germany", coords: [7.6, 49.4] },
  { id: "incirlik", name: "Incirlik AB", country: "Turkey", coords: [35.4, 37.0] },
  { id: "diego-garcia", name: "Diego Garcia", country: "BIOT", coords: [72.4, -7.3] },
  { id: "guam-andersen", name: "Andersen AFB", country: "Guam", coords: [144.9, 13.6] },
  { id: "okinawa-kadena", name: "Kadena AB", country: "Japan", coords: [127.8, 26.4] },
  { id: "yokota", name: "Yokota AB", country: "Japan", coords: [139.3, 35.7] },
  { id: "osan", name: "Osan AB", country: "South Korea", coords: [127.0, 37.1] },
  { id: "al-udeid", name: "Al Udeid AB", country: "Qatar", coords: [51.3, 25.1] },
  { id: "al-dhafra", name: "Al Dhafra AB", country: "UAE", coords: [54.5, 24.2] },
  { id: "bahrain-nsa", name: "NSA Bahrain (5th Fleet)", country: "Bahrain", coords: [50.6, 26.2] },
  { id: "djibouti-lemonnier", name: "Camp Lemonnier", country: "Djibouti", coords: [43.2, 11.5] },
  { id: "rota", name: "NS Rota", country: "Spain", coords: [-6.4, 36.6] },
  { id: "souda-bay", name: "Souda Bay", country: "Greece", coords: [24.1, 35.5] },
  { id: "thule", name: "Pituffik (Thule)", country: "Greenland", coords: [-68.7, 76.5] },
  { id: "fairford", name: "RAF Fairford", country: "UK", coords: [-1.8, 51.7] },
  { id: "alconbury", name: "RAF Alconbury", country: "UK", coords: [-0.2, 52.4] },
  { id: "vandenberg", name: "Vandenberg SFB", country: "United States", coords: [-120.6, 34.7] },
  { id: "norfolk", name: "Naval Station Norfolk", country: "United States", coords: [-76.3, 36.9] },
  { id: "pearl-harbor", name: "Pearl Harbor", country: "United States", coords: [-157.9, 21.3] },
  { id: "khmeimim", name: "Khmeimim AB", country: "Syria (RU)", coords: [35.9, 35.4] },
  { id: "kaliningrad-baltiysk", name: "Baltiysk Naval Base", country: "Russia", coords: [19.9, 54.6] },
  { id: "severomorsk", name: "Severomorsk", country: "Russia", coords: [33.4, 69.1] },
  { id: "vladivostok", name: "Vladivostok Pacific Fleet", country: "Russia", coords: [131.9, 43.1] },
  { id: "yulin", name: "Yulin Naval Base", country: "China", coords: [109.6, 18.2] },
  { id: "djibouti-cn", name: "PLA Support Base Djibouti", country: "Djibouti (CN)", coords: [43.0, 11.6] },
  { id: "natanz", name: "Natanz (military adj.)", country: "Iran", coords: [51.7, 33.7] },
];

// Nuclear facilities (research, power, fuel cycle, weapons)
const NUCLEAR_SITES: MapMarker[] = [
  { id: "natanz-n", name: "Natanz Enrichment", country: "Iran", coords: [51.72, 33.72] },
  { id: "fordow", name: "Fordow Enrichment", country: "Iran", coords: [50.99, 34.88] },
  { id: "bushehr", name: "Bushehr NPP", country: "Iran", coords: [50.89, 28.83] },
  { id: "arak", name: "Arak Heavy Water", country: "Iran", coords: [49.69, 34.39] },
  { id: "dimona", name: "Negev Nuclear (Dimona)", country: "Israel", coords: [35.14, 31.0] },
  { id: "yongbyon", name: "Yongbyon", country: "North Korea", coords: [125.75, 39.8] },
  { id: "lanyu", name: "Lanyu Storage", country: "Taiwan", coords: [121.55, 22.03] },
  { id: "kahuta", name: "Kahuta", country: "Pakistan", coords: [73.3, 33.6] },
  { id: "trombay", name: "Trombay (BARC)", country: "India", coords: [72.93, 19.02] },
  { id: "los-alamos", name: "Los Alamos", country: "United States", coords: [-106.3, 35.9] },
  { id: "oak-ridge", name: "Oak Ridge", country: "United States", coords: [-84.3, 36.0] },
  { id: "savannah-river", name: "Savannah River Site", country: "United States", coords: [-81.7, 33.3] },
  { id: "hanford", name: "Hanford", country: "United States", coords: [-119.5, 46.6] },
  { id: "sellafield", name: "Sellafield", country: "UK", coords: [-3.5, 54.4] },
  { id: "la-hague", name: "La Hague", country: "France", coords: [-1.9, 49.7] },
  { id: "mayak", name: "Mayak", country: "Russia", coords: [60.8, 55.7] },
  { id: "novaya-zemlya", name: "Novaya Zemlya Test Range", country: "Russia", coords: [54.5, 73.4] },
  { id: "lop-nur", name: "Lop Nur", country: "China", coords: [88.3, 40.2] },
  { id: "zaporizhzhia", name: "Zaporizhzhia NPP", country: "Ukraine", coords: [34.59, 47.51] },
  { id: "chernobyl", name: "Chernobyl Zone", country: "Ukraine", coords: [30.10, 51.39] },
  { id: "fukushima", name: "Fukushima Daiichi", country: "Japan", coords: [141.03, 37.42] },
];

// Spaceports / major launch facilities
const SPACEPORTS: MapMarker[] = [
  { id: "kennedy", name: "Kennedy / Cape Canaveral", country: "United States", coords: [-80.6, 28.5] },
  { id: "vandenberg-sp", name: "Vandenberg SFB", country: "United States", coords: [-120.6, 34.7] },
  { id: "boca-chica", name: "Starbase Boca Chica", country: "United States", coords: [-97.2, 25.99] },
  { id: "wallops", name: "Wallops", country: "United States", coords: [-75.5, 37.9] },
  { id: "kourou", name: "Guiana Space Centre", country: "French Guiana", coords: [-52.8, 5.2] },
  { id: "baikonur", name: "Baikonur", country: "Kazakhstan", coords: [63.3, 45.97] },
  { id: "plesetsk", name: "Plesetsk", country: "Russia", coords: [40.4, 62.95] },
  { id: "vostochny", name: "Vostochny", country: "Russia", coords: [128.4, 51.88] },
  { id: "jiuquan", name: "Jiuquan", country: "China", coords: [100.3, 40.96] },
  { id: "wenchang", name: "Wenchang", country: "China", coords: [110.95, 19.6] },
  { id: "xichang", name: "Xichang", country: "China", coords: [102.0, 28.25] },
  { id: "taiyuan", name: "Taiyuan", country: "China", coords: [111.6, 38.85] },
  { id: "tanegashima", name: "Tanegashima", country: "Japan", coords: [130.97, 30.4] },
  { id: "uchinoura", name: "Uchinoura", country: "Japan", coords: [131.1, 31.25] },
  { id: "sriharikota", name: "Satish Dhawan (SHAR)", country: "India", coords: [80.23, 13.72] },
  { id: "naro", name: "Naro Space Center", country: "South Korea", coords: [127.5, 34.4] },
  { id: "alcantara", name: "Alcântara", country: "Brazil", coords: [-44.4, -2.3] },
  { id: "rocket-lab-mahia", name: "Rocket Lab LC-1", country: "New Zealand", coords: [177.86, -39.26] },
  { id: "esrange", name: "Esrange", country: "Sweden", coords: [21.07, 67.88] },
];

// Undersea cable chokepoints / major landings (illustrative subset)
const UNDERSEA_CABLES: MapMarker[] = [
  { id: "luzon-strait", name: "Luzon Strait corridor", coords: [121.0, 20.0], note: "Asia–US Pacific cables" },
  { id: "red-sea", name: "Red Sea cable cluster", coords: [38.5, 21.0], note: "Asia–Europe cables" },
  { id: "suez", name: "Suez (Egypt landings)", coords: [32.3, 30.6] },
  { id: "marseille", name: "Marseille (Europe hub)", coords: [5.4, 43.3] },
  { id: "porthcurno", name: "Porthcurno (UK)", coords: [-5.65, 50.05] },
  { id: "fortaleza", name: "Fortaleza (Brazil hub)", coords: [-38.5, -3.7] },
  { id: "manhattan-beach", name: "Manhattan Beach landing", coords: [-118.4, 33.88] },
  { id: "virginia-beach", name: "Virginia Beach landing", coords: [-75.98, 36.85] },
  { id: "lagos", name: "Lagos (W.Africa hub)", coords: [3.4, 6.45] },
  { id: "djibouti-cable", name: "Djibouti landings", coords: [43.15, 11.6] },
  { id: "mumbai-cable", name: "Mumbai landings", coords: [72.83, 19.07] },
  { id: "singapore-cable", name: "Singapore landings", coords: [103.85, 1.29] },
  { id: "hong-kong-cable", name: "Hong Kong landings", coords: [114.16, 22.32] },
  { id: "guam-cable", name: "Guam Piti landings", coords: [144.7, 13.46] },
  { id: "alaska-cable", name: "Seward (AK) landing", coords: [-149.4, 60.1] },
];

// Active conflict / hotspot zones (centroids; large radius indicators)
const CONFLICT_ZONES: MapMarker[] = [
  { id: "ukraine", name: "Ukraine war zone", country: "Ukraine", coords: [37.6, 48.0] },
  { id: "gaza", name: "Gaza", country: "Palestine", coords: [34.45, 31.5] },
  { id: "south-lebanon", name: "South Lebanon", country: "Lebanon", coords: [35.5, 33.3] },
  { id: "yemen", name: "Yemen / Bab el-Mandeb", country: "Yemen", coords: [44.2, 15.4] },
  { id: "syria-northwest", name: "NW Syria", country: "Syria", coords: [36.7, 36.2] },
  { id: "sudan", name: "Sudan (RSF/SAF)", country: "Sudan", coords: [31.6, 14.5] },
  { id: "sahel", name: "Sahel belt", coords: [3.0, 16.0] },
  { id: "drc-east", name: "Eastern DRC", country: "DRC", coords: [29.2, -1.7] },
  { id: "myanmar", name: "Myanmar", country: "Myanmar", coords: [96.0, 21.0] },
  { id: "haiti", name: "Haiti", country: "Haiti", coords: [-72.3, 18.9] },
  { id: "south-china-sea", name: "South China Sea", coords: [115.0, 12.0] },
  { id: "taiwan-strait", name: "Taiwan Strait", coords: [120.0, 24.0] },
  { id: "korea-dmz", name: "Korean DMZ", coords: [127.7, 38.32] },
  { id: "kashmir-loc", name: "Kashmir LoC", coords: [74.5, 34.0] },
  { id: "balochistan", name: "Balochistan", country: "Pakistan", coords: [65.0, 28.0] },
];

// Radiation monitoring nodes (research / IAEA / public dosimeters, illustrative)
const RADIATION_WATCH: MapMarker[] = [
  { id: "fukushima-r", name: "Fukushima monitoring ring", country: "Japan", coords: [141.03, 37.42] },
  { id: "chernobyl-r", name: "Chernobyl exclusion", country: "Ukraine", coords: [30.10, 51.39] },
  { id: "zaporizhzhia-r", name: "Zaporizhzhia perimeter", country: "Ukraine", coords: [34.59, 47.51] },
  { id: "natanz-r", name: "Natanz perimeter", country: "Iran", coords: [51.72, 33.72] },
  { id: "fordow-r", name: "Fordow perimeter", country: "Iran", coords: [50.99, 34.88] },
  { id: "ringhals-r", name: "Ringhals", country: "Sweden", coords: [12.11, 57.26] },
  { id: "olkiluoto-r", name: "Olkiluoto", country: "Finland", coords: [21.44, 61.24] },
  { id: "hanford-r", name: "Hanford", country: "United States", coords: [-119.5, 46.6] },
];

// Gamma irradiators (mostly used for food/sterilization but flagged in OSINT)
const GAMMA_IRRADIATORS: MapMarker[] = [
  { id: "gam-india", name: "Mumbai Gamma Center", country: "India", coords: [72.93, 19.02] },
  { id: "gam-russia", name: "Khlopin Radium Inst.", country: "Russia", coords: [30.34, 59.94] },
  { id: "gam-canada", name: "Chalk River", country: "Canada", coords: [-77.4, 46.05] },
  { id: "gam-france", name: "Saclay", country: "France", coords: [2.17, 48.71] },
];

const INTEL_HOTSPOTS: MapMarker[] = [
  { id: "tehran", name: "Tehran", country: "Iran", coords: [51.42, 35.69] },
  { id: "moscow", name: "Moscow", country: "Russia", coords: [37.62, 55.75] },
  { id: "beijing", name: "Beijing", country: "China", coords: [116.40, 39.90] },
  { id: "pyongyang", name: "Pyongyang", country: "North Korea", coords: [125.76, 39.04] },
  { id: "damascus", name: "Damascus", country: "Syria", coords: [36.30, 33.51] },
  { id: "caracas", name: "Caracas", country: "Venezuela", coords: [-66.92, 10.49] },
  { id: "khartoum", name: "Khartoum", country: "Sudan", coords: [32.56, 15.5] },
  { id: "kyiv", name: "Kyiv", country: "Ukraine", coords: [30.52, 50.45] },
];

export const LAYERS: LayerDef[] = [
  { slug: "conflicts", label: "Conflict zones", color: "#ff6b81", glyph: "■", description: "Active war / instability zones", defaultOn: true, data: CONFLICT_ZONES },
  { slug: "intel", label: "Intel hotspots", color: "#ff9266", glyph: "◆", description: "Adversary capital intelligence focus areas", defaultOn: true, data: INTEL_HOTSPOTS },
  { slug: "bases", label: "Military bases", color: "#7ab8ff", glyph: "▲", description: "Major military installations (subset)", defaultOn: false, data: MILITARY_BASES },
  { slug: "nuclear", label: "Nuclear sites", color: "#f6c177", glyph: "☢", description: "Reactors, fuel-cycle, weapons, research", defaultOn: false, data: NUCLEAR_SITES },
  { slug: "spaceports", label: "Spaceports", color: "#a8e6ff", glyph: "⌬", description: "Active launch facilities", defaultOn: false, data: SPACEPORTS },
  { slug: "cables", label: "Undersea cables", color: "#7df0c2", glyph: "≈", description: "Submarine cable landings & chokepoints", defaultOn: false, data: UNDERSEA_CABLES },
  { slug: "radiation", label: "Radiation watch", color: "#c4ff80", glyph: "◎", description: "Radiation monitoring nodes & exclusion zones", defaultOn: false, data: RADIATION_WATCH },
  { slug: "gamma", label: "Gamma irradiators", color: "#ffd166", glyph: "⊛", description: "Industrial gamma sources", defaultOn: false, data: GAMMA_IRRADIATORS },
];

export const LAYERS_BY_SLUG: Record<string, LayerDef> = Object.fromEntries(LAYERS.map((l) => [l.slug, l]));
