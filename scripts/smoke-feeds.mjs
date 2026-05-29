// Quick smoke for new data sources. No DB. Just confirms upstream returns data.
import "dotenv/config";
import { fetchKev } from "../src/lib/feeds/cyber/kev.ts";
import { fetchNvdRecent } from "../src/lib/feeds/cyber/nvd.ts";
import { fetchHibpRecent } from "../src/lib/feeds/cyber/hibp.ts";
import { fetchOfacSdn } from "../src/lib/feeds/sanctions/ofac.ts";
import { fetchEuConsolidated } from "../src/lib/feeds/sanctions/eu.ts";
import { fetchUkOfsi } from "../src/lib/feeds/sanctions/uk.ts";
import { fetchBisEntityList } from "../src/lib/feeds/sanctions/bis.ts";
import { fetchDsca } from "../src/lib/feeds/contracts/dsca.ts";
import { fetchUkContracts } from "../src/lib/feeds/contracts/uk.ts";
import { fetchEuTed } from "../src/lib/feeds/contracts/ted.ts";
import { fetchGpsJamming } from "../src/lib/feeds/gpsjam.ts";

const tests = [
  ["KEV (CISA)", fetchKev],
  ["NVD recent CVEs", fetchNvdRecent],
  ["HIBP breaches", fetchHibpRecent],
  ["OFAC SDN", fetchOfacSdn],
  ["EU sanctions", fetchEuConsolidated],
  ["UK OFSI", fetchUkOfsi],
  ["BIS Entity List", fetchBisEntityList],
  ["DSCA FMS", fetchDsca],
  ["UK Contracts (MOD)", fetchUkContracts],
  ["EU TED", fetchEuTed],
  ["GPSjam", fetchGpsJamming],
];

for (const [label, fn] of tests) {
  const t0 = Date.now();
  try {
    const items = await fn();
    console.log(String(items.length).padStart(5), `${(Date.now() - t0)}ms`.padEnd(8), label);
  } catch (e) {
    console.log("ERR  ", `${(Date.now() - t0)}ms`.padEnd(8), label, "—", e.message);
  }
}
