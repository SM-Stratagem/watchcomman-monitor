import { drizzle } from "drizzle-orm/node-postgres";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import pg from "pg";

function shouldUseSsl(connectionString) {
  if (process.env.PGSSLMODE === "require") return true;
  if (process.env.PGSSL === "true") return true;
  const lower = String(connectionString).toLowerCase();
  return lower.includes("sslmode=require") || lower.includes("ssl=true");
}

export async function runMigrations({ migrationsFolder = "db/migrations" } = {}) {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("DATABASE_URL is required to run migrations");
  }

  const pool = new pg.Pool({
    connectionString,
    ssl: shouldUseSsl(connectionString) ? { rejectUnauthorized: false } : undefined,
    max: 2,
  });

  try {
    const db = drizzle(pool);
    await migrate(db, { migrationsFolder });
  } finally {
    await pool.end();
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  await runMigrations();
}
