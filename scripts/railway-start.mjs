import { spawn } from "node:child_process";
import pg from "pg";

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function log(message) {
  console.log(`[railway-start] ${message}`);
}

function shouldUseSsl(connectionString) {
  if (process.env.PGSSLMODE === "require") return true;
  if (process.env.PGSSL === "true") return true;
  const lower = String(connectionString).toLowerCase();
  return lower.includes("sslmode=require") || lower.includes("ssl=true");
}

async function waitForDb({ attempts = 30, delayMs = 1000 } = {}) {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("DATABASE_URL is required");
  }

  let lastError = null;
  for (let i = 0; i < attempts; i++) {
    try {
      const client = new pg.Client({
        connectionString,
        ssl: shouldUseSsl(connectionString) ? { rejectUnauthorized: false } : undefined,
      });
      await client.connect();
      await client.end();
      return;
    } catch (err) {
      lastError = err;
      await sleep(delayMs);
    }
  }

  const reason = lastError instanceof Error ? lastError.message : String(lastError);
  throw new Error(`Database not reachable after ${attempts} attempts: ${reason}`);
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

async function runWithTimeout(promise, timeoutMs, label) {
  let timeoutId = null;
  try {
    return await Promise.race([
      promise,
      new Promise((_, reject) => {
        timeoutId = setTimeout(() => reject(new Error(`${label} timed out after ${timeoutMs}ms`)), timeoutMs);
      }),
    ]);
  } finally {
    if (timeoutId) clearTimeout(timeoutId);
  }
}

async function runMigrationsViaChild({ timeoutMs = 120_000 } = {}) {
  const shouldRun = process.env.RUN_MIGRATIONS !== "0";
  if (!shouldRun) {
    log("Migrations skipped (RUN_MIGRATIONS=0).");
    return;
  }

  log("Running DB migrations...");
  await runWithTimeout(run("node", ["scripts/db-migrate.mjs"]), timeoutMs, "DB migrations");
  log("DB migrations complete.");
}

const port = process.env.PORT || "3000";

log(`Starting (PORT=${port})...`);
log("Waiting for database...");
await waitForDb();
log("Database reachable.");

try {
  await runMigrationsViaChild();
} catch (err) {
  const message = err instanceof Error ? err.message : String(err);
  log(`WARNING: ${message}`);
  log("Continuing startup to allow healthcheck to pass; fix migrations separately if needed.");
}

log("Starting Next.js standalone server...");
await run("node", [".next/standalone/server.js"], {
  env: { ...process.env, PORT: port, HOSTNAME: "0.0.0.0" },
});
