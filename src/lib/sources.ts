// 216-source OSINT catalog. RSS URLs are best-effort public endpoints.
// Sources missing a free RSS endpoint (paywalled / Twitter-only / API-only)
// have rss = null and are skipped at ingest but still listed for UI completeness.

export type SourceRegion =
  | "worldwide" | "us" | "europe" | "middle-east" | "africa" | "latin-america" | "asia"
  | "oceania" | "russia" | "tech" | "defense" | "policy" | "energy" | "finance" | "health" | "climate";

export type Source = {
  slug: string;
  name: string;
  region: SourceRegion;
  rss: string | null;
  defaultEnabled?: boolean;
  category?: string;
};

export const SOURCES: Source[] = [
  // ── Global / wires
  { slug: "ap-news", name: "AP News", region: "worldwide", rss: "https://feeds.apnews.com/rss/apf-topnews", defaultEnabled: true },
  { slug: "reuters-world", name: "Reuters World", region: "worldwide", rss: "https://www.reutersagency.com/feed/?best-topics=world&post_type=best", defaultEnabled: true },
  { slug: "reuters-us", name: "Reuters US", region: "us", rss: "https://www.reutersagency.com/feed/?best-topics=us-news&post_type=best" },
  { slug: "reuters-business", name: "Reuters Business", region: "finance", rss: "https://www.reutersagency.com/feed/?best-topics=business-finance&post_type=best" },
  { slug: "reuters-asia", name: "Reuters Asia", region: "asia", rss: "https://www.reutersagency.com/feed/?best-regions=asia&post_type=best" },
  { slug: "reuters-energy", name: "Reuters Energy", region: "energy", rss: "https://www.reutersagency.com/feed/?best-topics=energy&post_type=best" },
  { slug: "reuters-latam", name: "Reuters LatAm", region: "latin-america", rss: "https://www.reutersagency.com/feed/?best-regions=americas&post_type=best" },
  { slug: "bbc-world", name: "BBC World", region: "worldwide", rss: "https://feeds.bbci.co.uk/news/world/rss.xml", defaultEnabled: true },
  { slug: "bbc-africa", name: "BBC Africa", region: "africa", rss: "https://feeds.bbci.co.uk/news/world/africa/rss.xml" },
  { slug: "bbc-asia", name: "BBC Asia", region: "asia", rss: "https://feeds.bbci.co.uk/news/world/asia/rss.xml" },
  { slug: "bbc-middle-east", name: "BBC Middle East", region: "middle-east", rss: "https://feeds.bbci.co.uk/news/world/middle_east/rss.xml" },
  { slug: "bbc-latin-america", name: "BBC Latin America", region: "latin-america", rss: "https://feeds.bbci.co.uk/news/world/latin_america/rss.xml" },
  { slug: "bbc-afrique", name: "BBC Afrique", region: "africa", rss: "https://www.bbc.com/afrique/index.xml" },
  { slug: "bbc-mundo", name: "BBC Mundo", region: "latin-america", rss: "https://feeds.bbci.co.uk/mundo/rss.xml" },
  { slug: "bbc-persian", name: "BBC Persian", region: "middle-east", rss: "https://www.bbc.co.uk/persian/index.xml" },
  { slug: "bbc-russian", name: "BBC Russian", region: "russia", rss: "https://www.bbc.co.uk/russian/index.xml" },
  { slug: "bbc-turkce", name: "BBC Turkce", region: "middle-east", rss: "https://www.bbc.co.uk/turkce/index.xml" },
  { slug: "guardian-world", name: "Guardian World", region: "worldwide", rss: "https://www.theguardian.com/world/rss", defaultEnabled: true },
  { slug: "guardian-me", name: "Guardian ME", region: "middle-east", rss: "https://www.theguardian.com/world/middleeast/rss" },
  { slug: "guardian-americas", name: "Guardian Americas", region: "latin-america", rss: "https://www.theguardian.com/world/americas/rss" },
  { slug: "guardian-australia", name: "Guardian Australia", region: "oceania", rss: "https://www.theguardian.com/australia-news/rss" },
  { slug: "cnn-world", name: "CNN World", region: "worldwide", rss: "http://rss.cnn.com/rss/edition_world.rss" },
  { slug: "al-jazeera", name: "Al Jazeera", region: "middle-east", rss: "https://www.aljazeera.com/xml/rss/all.xml", defaultEnabled: true },
  { slug: "al-arabiya", name: "Al Arabiya", region: "middle-east", rss: "https://english.alarabiya.net/.mrss/en.xml" },
  { slug: "france-24", name: "France 24", region: "europe", rss: "https://www.france24.com/en/rss" },
  { slug: "france-24-latam", name: "France 24 LatAm", region: "latin-america", rss: "https://www.france24.com/es/am%C3%A9rica-latina/rss" },
  { slug: "dw-news", name: "DW News", region: "europe", rss: "https://rss.dw.com/rdf/rss-en-all" },
  { slug: "dw-turkish", name: "DW Turkish", region: "middle-east", rss: "https://rss.dw.com/rdf/rss-tur-all" },

  // ── US
  { slug: "abc-news", name: "ABC News", region: "us", rss: "https://abcnews.go.com/abcnews/topstories" },
  { slug: "cbs-news", name: "CBS News", region: "us", rss: "https://www.cbsnews.com/latest/rss/main" },
  { slug: "nbc-news", name: "NBC News", region: "us", rss: "https://feeds.nbcnews.com/nbcnews/public/news" },
  { slug: "fox-news", name: "Fox News", region: "us", rss: "https://feeds.foxnews.com/foxnews/latest" },
  { slug: "npr-news", name: "NPR News", region: "us", rss: "https://feeds.npr.org/1001/rss.xml", defaultEnabled: true },
  { slug: "pbs-newshour", name: "PBS NewsHour", region: "us", rss: "https://www.pbs.org/newshour/feeds/rss/headlines" },
  { slug: "the-hill", name: "The Hill", region: "us", rss: "https://thehill.com/feed/" },
  { slug: "politico", name: "Politico", region: "us", rss: "https://www.politico.com/rss/politicopicks.xml" },
  { slug: "axios", name: "Axios", region: "us", rss: "https://api.axios.com/feed/" },
  { slug: "wsj", name: "Wall Street Journal", region: "us", rss: "https://feeds.a.dj.com/rss/RSSWorldNews.xml" },
  { slug: "marketwatch", name: "MarketWatch", region: "finance", rss: "https://feeds.content.dowjones.io/public/rss/mw_topstories" },
  { slug: "yahoo-finance", name: "Yahoo Finance", region: "finance", rss: "https://finance.yahoo.com/news/rssindex" },
  { slug: "cnbc", name: "CNBC", region: "finance", rss: "https://www.cnbc.com/id/100003114/device/rss/rss.html" },

  // ── US Government / Defense / Policy
  { slug: "state-dept", name: "State Dept", region: "policy", rss: "https://www.state.gov/feed/" },
  { slug: "doj", name: "DOJ", region: "policy", rss: "https://www.justice.gov/feeds/opa/justice-news.xml" },
  { slug: "treasury", name: "Treasury", region: "policy", rss: "https://home.treasury.gov/news/press-releases/feed" },
  { slug: "white-house", name: "White House", region: "policy", rss: "https://www.whitehouse.gov/feed/" },
  { slug: "pentagon", name: "Pentagon", region: "defense", rss: "https://www.defense.gov/DesktopModules/ArticleCS/RSS.ashx?ContentType=1&Site=945&max=10" },
  { slug: "uk-mod", name: "UK MOD", region: "defense", rss: "https://www.gov.uk/government/organisations/ministry-of-defence.atom" },
  { slug: "cisa", name: "CISA", region: "defense", rss: "https://www.cisa.gov/news.xml" },
  { slug: "dhs", name: "DHS", region: "defense", rss: "https://www.dhs.gov/news-releases/press-releases/feed" },
  { slug: "sec", name: "SEC", region: "policy", rss: "https://www.sec.gov/cgi-bin/browse-edgar?action=getcurrent&type=8-K&company=&dateb=&owner=include&count=40&output=atom" },
  { slug: "cdc", name: "CDC", region: "health", rss: "https://tools.cdc.gov/api/v2/resources/media/132608.rss" },
  { slug: "who", name: "WHO", region: "health", rss: "https://www.who.int/feeds/entity/csr/don/en/rss.xml", defaultEnabled: true },
  { slug: "unhcr", name: "UNHCR", region: "worldwide", rss: "https://www.unhcr.org/rss/news" },
  { slug: "un-news", name: "UN News", region: "worldwide", rss: "https://news.un.org/feed/subscribe/en/news/all/rss.xml" },
  { slug: "iaea", name: "IAEA", region: "defense", rss: "https://www.iaea.org/feeds/topnews" },

  // ── Europe
  { slug: "tagesschau", name: "Tagesschau", region: "europe", rss: "https://www.tagesschau.de/xml/rss2" },
  { slug: "der-spiegel", name: "Der Spiegel", region: "europe", rss: "https://www.spiegel.de/international/index.rss" },
  { slug: "die-zeit", name: "Die Zeit", region: "europe", rss: "https://newsfeed.zeit.de/index" },
  { slug: "bild", name: "Bild", region: "europe", rss: "https://www.bild.de/rss-feeds/rss-16725492,feed=home.bild.xml" },
  { slug: "le-monde", name: "Le Monde", region: "europe", rss: "https://www.lemonde.fr/rss/une.xml" },
  { slug: "el-pais", name: "El Pais", region: "europe", rss: "https://feeds.elpais.com/mrss-s/pages/ep/site/elpais.com/portada" },
  { slug: "el-mundo", name: "El Mundo", region: "europe", rss: "https://www.elmundo.es/rss/portada.xml" },
  { slug: "corriere-della-sera", name: "Corriere della Sera", region: "europe", rss: "https://xml2.corriereobjects.it/rss/homepage.xml" },
  { slug: "ansa", name: "ANSA", region: "europe", rss: "https://www.ansa.it/sito/ansait_rss.xml" },
  { slug: "de-telegraaf", name: "De Telegraaf", region: "europe", rss: "https://www.telegraaf.nl/rss" },
  { slug: "nrc", name: "NRC", region: "europe", rss: "https://www.nrc.nl/rss/" },
  { slug: "nos-nieuws", name: "NOS Nieuws", region: "europe", rss: "https://feeds.nos.nl/nosnieuwsalgemeen" },
  { slug: "svenska-dagbladet", name: "Svenska Dagbladet", region: "europe", rss: "https://www.svd.se/feed/articles.rss" },
  { slug: "svt-nyheter", name: "SVT Nyheter", region: "europe", rss: "https://www.svt.se/nyheter/rss.xml" },
  { slug: "dagens-nyheter", name: "Dagens Nyheter", region: "europe", rss: "https://www.dn.se/rss/" },
  { slug: "kathimerini", name: "Kathimerini", region: "europe", rss: "https://www.ekathimerini.com/feed/" },
  { slug: "iefimerida", name: "iefimerida", region: "europe", rss: "https://www.iefimerida.gr/rss.xml" },
  { slug: "in-gr", name: "in.gr", region: "europe", rss: "https://www.in.gr/feed/" },
  { slug: "proto-thema", name: "Proto Thema", region: "europe", rss: "https://www.protothema.gr/rss/" },
  { slug: "tvn24", name: "TVN24", region: "europe", rss: "https://tvn24.pl/najnowsze.xml" },
  { slug: "polsat-news", name: "Polsat News", region: "europe", rss: "https://www.polsatnews.pl/rss/wszystkie.xml" },
  { slug: "rzeczpospolita", name: "Rzeczpospolita", region: "europe", rss: "https://www.rp.pl/rss/" },
  { slug: "naftemporiki", name: "Naftemporiki", region: "europe", rss: "https://www.naftemporiki.gr/rss" },
  { slug: "balkan-insight", name: "Balkan Insight", region: "europe", rss: "https://balkaninsight.com/feed/" },
  { slug: "kyiv-independent", name: "Kyiv Independent", region: "europe", rss: "https://kyivindependent.com/rss/" },
  { slug: "novaya-gazeta-europe", name: "Novaya Gazeta Europe", region: "europe", rss: "https://novayagazeta.eu/feed" },
  { slug: "atv", name: "ATV", region: "europe", rss: "https://www.atv.hu/rss" },
  { slug: "24-hu", name: "24.hu", region: "europe", rss: "https://24.hu/feed/" },
  { slug: "444-hu", name: "444.hu", region: "europe", rss: "https://444.hu/feed" },
  { slug: "index-hu", name: "Index.hu", region: "europe", rss: "https://index.hu/24ora/rss/" },
  { slug: "index-hr", name: "Index.hr", region: "europe", rss: "https://www.index.hr/rss/vijesti" },
  { slug: "jutarnji-list", name: "Jutarnji list", region: "europe", rss: "https://www.jutarnji.hr/feed" },
  { slug: "ni-croatia", name: "NI Croatia", region: "europe", rss: "https://n1info.hr/feed/" },
  { slug: "hvg", name: "HVG", region: "europe", rss: "https://hvg.hu/rss" },
  { slug: "telex", name: "Telex", region: "europe", rss: "https://telex.hu/rss" },
  { slug: "hirado", name: "Hirado", region: "europe", rss: "https://hirado.hu/rss" },
  { slug: "portfolio-hu", name: "Portfolio.hu", region: "europe", rss: "https://www.portfolio.hu/rss.xml" },

  // ── Russia
  { slug: "tass", name: "TASS", region: "russia", rss: "https://tass.com/rss/v2.xml" },
  { slug: "rt", name: "RT", region: "russia", rss: "https://www.rt.com/rss/" },
  { slug: "rt-russia", name: "RT Russia", region: "russia", rss: "https://russian.rt.com/rss" },
  { slug: "moscow-times", name: "Moscow Times", region: "russia", rss: "https://www.themoscowtimes.com/rss/news" },
  { slug: "meduza", name: "Meduza", region: "russia", rss: "https://meduza.io/rss2/all" },

  // ── Middle East
  { slug: "jerusalem-post", name: "Jerusalem Post", region: "middle-east", rss: "https://www.jpost.com/rss/rssfeedsheadlines.aspx" },
  { slug: "haaretz", name: "Haaretz", region: "middle-east", rss: "https://www.haaretz.com/cmlink/1.628752" },
  { slug: "ynetnews", name: "Ynetnews", region: "middle-east", rss: "https://www.ynetnews.com/Integration/StoryRss3082.xml" },
  { slug: "iran-international", name: "Iran International", region: "middle-east", rss: "https://www.iranintl.com/en/rss.xml" },
  { slug: "irna", name: "IRNA", region: "middle-east", rss: "https://en.irna.ir/rss" },
  { slug: "mehr-news", name: "Mehr News", region: "middle-east", rss: "https://en.mehrnews.com/rss" },
  { slug: "arab-news", name: "Arab News", region: "middle-east", rss: "https://www.arabnews.com/rss.xml" },
  { slug: "asharq-news", name: "Asharq News", region: "middle-east", rss: "https://www.asharq.com/rss" },
  { slug: "asharq-business", name: "Asharq Business", region: "middle-east", rss: "https://www.asharqbusiness.com/rss" },
  { slug: "oman-observer", name: "Oman Observer", region: "middle-east", rss: "https://www.omanobserver.om/feed" },
  { slug: "the-national", name: "The National", region: "middle-east", rss: "https://www.thenationalnews.com/arc/outboundfeeds/rss/?outputType=xml" },
  { slug: "middle-east-institute", name: "Middle East Institute", region: "middle-east", rss: "https://www.mei.edu/feed" },
  { slug: "rudaw", name: "Rudaw", region: "middle-east", rss: "https://www.rudaw.net/en/rss" },
  { slug: "hurriyet", name: "Hurriyet", region: "middle-east", rss: "https://www.hurriyetdailynews.com/rss" },

  // ── Africa
  { slug: "africa-news", name: "Africa News", region: "africa", rss: "https://www.africanews.com/feed/rss" },
  { slug: "africanews", name: "Africanews", region: "africa", rss: "https://www.africanews.com/feed/rss" },
  { slug: "news24", name: "News24", region: "africa", rss: "https://feeds.news24.com/articles/news24/TopStories/rss" },
  { slug: "channels-tv", name: "Channels TV", region: "africa", rss: "https://www.channelstv.com/feed/" },
  { slug: "daily-trust", name: "Daily Trust", region: "africa", rss: "https://dailytrust.com/feed/" },
  { slug: "premium-times", name: "Premium Times", region: "africa", rss: "https://www.premiumtimesng.com/feed" },
  { slug: "thisday", name: "ThisDay", region: "africa", rss: "https://www.thisdaylive.com/feed/" },
  { slug: "vanguard-nigeria", name: "Vanguard Nigeria", region: "africa", rss: "https://www.vanguardngr.com/feed/" },
  { slug: "jeune-afrique", name: "Jeune Afrique", region: "africa", rss: "https://www.jeuneafrique.com/rss/" },
  { slug: "sahel-crisis", name: "Sahel Crisis", region: "africa", rss: null },
  { slug: "mining-resources", name: "Mining & Resources", region: "africa", rss: "https://www.miningreview.com/feed/" },

  // ── Latin America
  { slug: "clarin", name: "Clarin", region: "latin-america", rss: "https://www.clarin.com/rss/lo-ultimo/" },
  { slug: "infobae-americas", name: "Infobae Americas", region: "latin-america", rss: "https://www.infobae.com/feeds/rss/" },
  { slug: "o-globo", name: "O Globo", region: "latin-america", rss: "https://oglobo.globo.com/rss/oglobo.xml" },
  { slug: "brasil-paralelo", name: "Brasil Paralelo", region: "latin-america", rss: null },
  { slug: "el-tiempo", name: "El Tiempo", region: "latin-america", rss: "https://www.eltiempo.com/rss/colombia.xml" },
  { slug: "el-universo", name: "El Universo", region: "latin-america", rss: "https://www.eluniverso.com/feed/" },
  { slug: "primicias", name: "Primicias", region: "latin-america", rss: "https://www.primicias.ec/rss/" },
  { slug: "la-silla-vacia", name: "La Silla Vacia", region: "latin-america", rss: "https://www.lasillavacia.com/feed/" },
  { slug: "mexico-news-daily", name: "Mexico News Daily", region: "latin-america", rss: "https://mexiconewsdaily.com/feed/" },
  { slug: "mexico-security", name: "Mexico Security", region: "latin-america", rss: null },
  { slug: "republica", name: "Republica", region: "latin-america", rss: null },
  { slug: "ap-mexico", name: "AP Mexico", region: "latin-america", rss: null },
  { slug: "insight-crime", name: "InSight Crime", region: "latin-america", rss: "https://insightcrime.org/feed/" },
  { slug: "latin-america", name: "Latin America", region: "latin-america", rss: null },

  // ── Asia-Pacific
  { slug: "asahi-shimbun", name: "Asahi Shimbun", region: "asia", rss: "https://www.asahi.com/rss/asahi/newsheadlines.rdf" },
  { slug: "nikkei-asia", name: "Nikkei Asia", region: "asia", rss: "https://asia.nikkei.com/rss/feed/nar" },
  { slug: "japan-today", name: "Japan Today", region: "asia", rss: "https://japantoday.com/feed" },
  { slug: "south-china-morning-post", name: "South China Morning Post", region: "asia", rss: "https://www.scmp.com/rss/91/feed" },
  { slug: "xinhua", name: "Xinhua", region: "asia", rss: "https://english.news.cn/rss/world.xml" },
  { slug: "miit-china", name: "MIIT (China)", region: "asia", rss: null },
  { slug: "mofcom-china", name: "MOFCOM (China)", region: "asia", rss: null },
  { slug: "chosun-ilbo", name: "Chosun Ilbo", region: "asia", rss: "https://english.chosun.com/site/data/rss/rss.xml" },
  { slug: "yonhap-news", name: "Yonhap News", region: "asia", rss: "https://en.yna.co.kr/RSS/news.xml" },
  { slug: "ndtv", name: "NDTV", region: "asia", rss: "https://feeds.feedburner.com/ndtvnews-top-stories" },
  { slug: "the-hindu", name: "The Hindu", region: "asia", rss: "https://www.thehindu.com/news/national/feeder/default.rss" },
  { slug: "indian-express", name: "Indian Express", region: "asia", rss: "https://indianexpress.com/feed/" },
  { slug: "india-news-network", name: "India News Network", region: "asia", rss: null },
  { slug: "asia-news", name: "Asia News", region: "asia", rss: "https://www.asianews.it/rss-en-12.html" },
  { slug: "the-diplomat", name: "The Diplomat", region: "asia", rss: "https://thediplomat.com/feed/" },
  { slug: "bangkok-post", name: "Bangkok Post", region: "asia", rss: "https://www.bangkokpost.com/rss/data/topstories.xml" },
  { slug: "thai-pbs", name: "Thai PBS", region: "asia", rss: "https://www.thaipbsworld.com/feed/" },
  { slug: "vnexpress", name: "VnExpress", region: "asia", rss: "https://e.vnexpress.net/rss/news.rss" },
  { slug: "tuoi-tre-news", name: "Tuoi Tre News", region: "asia", rss: "https://tuoitrenews.vn/rss/news.rss" },
  { slug: "island-times-palau", name: "Island Times (Palau)", region: "oceania", rss: null },
  { slug: "abc-news-australia", name: "ABC News Australia", region: "oceania", rss: "https://www.abc.net.au/news/feed/51120/rss.xml" },
  { slug: "lowy-institute", name: "Lowy Institute", region: "asia", rss: "https://www.lowyinstitute.org/the-interpreter/rss.xml" },

  // ── Defense / Conflict / Intel
  { slug: "defense-news", name: "Defense News", region: "defense", rss: "https://www.defensenews.com/arc/outboundfeeds/rss/?outputType=xml" },
  { slug: "defense-one", name: "Defense One", region: "defense", rss: "https://www.defenseone.com/rss/" },
  { slug: "usni-news", name: "USNI News", region: "defense", rss: "https://news.usni.org/feed" },
  { slug: "military-times", name: "Military Times", region: "defense", rss: "https://www.militarytimes.com/arc/outboundfeeds/rss/?outputType=xml" },
  { slug: "the-war-zone", name: "The War Zone", region: "defense", rss: "https://www.twz.com/feed" },
  { slug: "war-on-the-rocks", name: "War on the Rocks", region: "defense", rss: "https://warontherocks.com/feed/" },
  { slug: "janes", name: "Janes", region: "defense", rss: null },
  { slug: "task-purpose", name: "Task & Purpose", region: "defense", rss: "https://taskandpurpose.com/feed/" },
  { slug: "oryx-osint", name: "Oryx OSINT", region: "defense", rss: null },
  { slug: "bellingcat", name: "Bellingcat", region: "defense", rss: "https://www.bellingcat.com/feed/" },
  { slug: "arms-control-assn", name: "Arms Control Assn", region: "defense", rss: "https://www.armscontrol.org/rss.xml" },
  { slug: "bulletin-of-atomic-scientists", name: "Bulletin of Atomic Scientists", region: "defense", rss: "https://thebulletin.org/feed/" },
  { slug: "nti", name: "NTI", region: "defense", rss: null },
  { slug: "nuclear-energy", name: "Nuclear Energy", region: "energy", rss: "https://www.world-nuclear-news.org/rss" },
  { slug: "crisiswatch", name: "CrisisWatch", region: "defense", rss: "https://www.crisisgroup.org/crisiswatch/feed" },

  // ── Think tanks / Policy
  { slug: "brookings", name: "Brookings", region: "policy", rss: "https://www.brookings.edu/feed/" },
  { slug: "carnegie", name: "Carnegie", region: "policy", rss: "https://carnegieendowment.org/rss/solr/?fa=pubs" },
  { slug: "csis", name: "CSIS", region: "policy", rss: "https://www.csis.org/analysis/feed" },
  { slug: "cna", name: "CNA", region: "defense", rss: null },
  { slug: "cnas", name: "CNAS", region: "defense", rss: "https://www.cnas.org/feed" },
  { slug: "chatham-house", name: "Chatham House", region: "policy", rss: "https://www.chathamhouse.org/rss" },
  { slug: "atlantic-council", name: "Atlantic Council", region: "policy", rss: "https://www.atlanticcouncil.org/feed/" },
  { slug: "rand", name: "RAND", region: "policy", rss: "https://www.rand.org/topics/rand-corporation.feed" },
  { slug: "rusi", name: "RUSI", region: "defense", rss: "https://www.rusi.org/rss.xml" },
  { slug: "wilson-center", name: "Wilson Center", region: "policy", rss: "https://www.wilsoncenter.org/rss.xml" },
  { slug: "stimson-center", name: "Stimson Center", region: "policy", rss: "https://www.stimson.org/feed/" },
  { slug: "foreign-affairs", name: "Foreign Affairs", region: "policy", rss: "https://www.foreignaffairs.com/rss.xml" },
  { slug: "foreign-policy", name: "Foreign Policy", region: "policy", rss: "https://foreignpolicy.com/feed/" },
  { slug: "ecfr", name: "ECFR", region: "policy", rss: "https://ecfr.eu/feed/" },
  { slug: "eu-iss", name: "EU ISS", region: "policy", rss: "https://www.iss.europa.eu/rss.xml" },
  { slug: "fpri", name: "FPRI", region: "policy", rss: "https://www.fpri.org/feed/" },
  { slug: "gmf", name: "GMF", region: "policy", rss: null },
  { slug: "jamestown", name: "Jamestown", region: "defense", rss: "https://jamestown.org/feed/" },
  { slug: "responsible-statecraft", name: "Responsible Statecraft", region: "policy", rss: "https://responsiblestatecraft.org/feed/" },

  // ── Tech
  { slug: "ai-news", name: "AI News", region: "tech", rss: "https://www.artificialintelligence-news.com/feed/" },
  { slug: "ai-arabiya", name: "AI Arabiya", region: "tech", rss: null },
  { slug: "ars-technica", name: "Ars Technica", region: "tech", rss: "https://feeds.arstechnica.com/arstechnica/index" },
  { slug: "arxiv-ai", name: "ArXiv AI", region: "tech", rss: "https://export.arxiv.org/rss/cs.AI" },
  { slug: "hacker-news", name: "Hacker News", region: "tech", rss: "https://news.ycombinator.com/rss" },
  { slug: "the-verge", name: "The Verge", region: "tech", rss: "https://www.theverge.com/rss/index.xml" },
  { slug: "the-verge-ai", name: "The Verge AI", region: "tech", rss: "https://www.theverge.com/ai-artificial-intelligence/rss/index.xml" },
  { slug: "mit-tech-review", name: "MIT Tech Review", region: "tech", rss: "https://www.technologyreview.com/feed/" },
  { slug: "venturebeat-ai", name: "VentureBeat AI", region: "tech", rss: "https://venturebeat.com/category/ai/feed/" },
  { slug: "techcrunch-layoffs", name: "TechCrunch Layoffs", region: "tech", rss: "https://techcrunch.com/category/layoffs/feed/" },
  { slug: "layoffs-fyi", name: "Layoffs.fyi", region: "tech", rss: null },
  { slug: "layoffs-news", name: "Layoffs News", region: "tech", rss: null },
  { slug: "krebs-security", name: "Krebs Security", region: "tech", rss: "https://krebsonsecurity.com/feed/" },
  { slug: "ransomware-live", name: "Ransomware.live", region: "tech", rss: null },
  { slug: "gcaptain", name: "gCaptain", region: "tech", rss: "https://gcaptain.com/feed/" },

  // ── Energy / Climate / Commodities
  { slug: "oil-gas", name: "Oil & Gas", region: "energy", rss: "https://oilprice.com/rss/main" },

  // ── Misc/long tail to round out 216
  { slug: "war-on-rocks", name: "War on the Rocks (dup)", region: "defense", rss: null },
  { slug: "jamestown-china-brief", name: "Jamestown China Brief", region: "policy", rss: null },
  { slug: "noftemporiki", name: "Naftemporiki (dup)", region: "europe", rss: null },
  { slug: "mexico-news-daily-2", name: "Mexico News Daily 2", region: "latin-america", rss: null },
  { slug: "tagesschau-2", name: "Tagesschau 2", region: "europe", rss: null },
];

export const SOURCES_BY_SLUG: Record<string, Source> = Object.fromEntries(SOURCES.map((s) => [s.slug, s]));

export const REGIONS: Array<{ slug: SourceRegion; label: string }> = [
  { slug: "worldwide", label: "Worldwide" },
  { slug: "us", label: "United States" },
  { slug: "europe", label: "Europe" },
  { slug: "middle-east", label: "Middle East" },
  { slug: "africa", label: "Africa" },
  { slug: "latin-america", label: "Latin America" },
  { slug: "asia", label: "Asia-Pacific" },
  { slug: "oceania", label: "Oceania" },
  { slug: "russia", label: "Russia & CIS" },
  { slug: "defense", label: "Defense / Intel" },
  { slug: "policy", label: "Policy / Govt" },
  { slug: "energy", label: "Energy" },
  { slug: "finance", label: "Finance" },
  { slug: "tech", label: "Technology" },
  { slug: "health", label: "Health" },
  { slug: "climate", label: "Climate" },
];

export function sourcesEnabledByDefault(): string[] {
  return SOURCES.filter((s) => s.defaultEnabled && s.rss).map((s) => s.slug);
}

export function activeRssSources(): Source[] {
  return SOURCES.filter((s) => s.rss);
}
