import { spawn } from "node:child_process";

function log(message) {
  // eslint-disable-next-line no-console
  console.log(`[railway-entry] ${message}`);
}

function run(cmd, args, { env = process.env } = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(cmd, args, { stdio: "inherit", env });
    child.on("error", reject);
    child.on("exit", (code) => {
      if (code === 0) resolve();
      else reject(new Error(`${cmd} exited with code ${code}`));
    });
  });
}

function isCronMode() {
  const mode = (process.env.RAILWAY_RUN_MODE || "").toLowerCase().trim();
  return mode === "cron" || mode === "ingest" || mode === "ingest-cron";
}

if (isCronMode()) {
  log("Starting one-off ingest job (cron mode)...");
  await run("npm", ["run", "ingest:once"]);
  log("Ingest job finished; exiting.");
  process.exit(0);
} else {
  log("Starting web service...");
  await run("node", ["scripts/railway-start.mjs"]);
}
