import "dotenv/config";
import { ingestSignals } from "./ingest";
import { closeDb } from "./db";

let exitCode = 0;
try {
  const result = await ingestSignals();
  console.log(JSON.stringify(result, null, 2));
} catch (err) {
  exitCode = 1;
  const message = err instanceof Error ? err.message : String(err);
  console.error(`[ingest:once] failed: ${message}`);
} finally {
  await closeDb();
  process.exit(exitCode);
}
