import "dotenv/config";
import { drizzle } from "drizzle-orm/node-postgres";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import pg from "pg";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error("DATABASE_URL is required. Set it in .env before running db:migrate.");
}

const lower = connectionString.toLowerCase();
const useSsl =
  process.env.PGSSLMODE === "require" ||
  process.env.PGSSL === "true" ||
  lower.includes("sslmode=require") ||
  lower.includes("ssl=true");

const pool = new pg.Pool({
  connectionString,
  ssl: useSsl ? { rejectUnauthorized: false } : undefined,
});
const db = drizzle(pool);

await migrate(db, { migrationsFolder: "db/migrations" });
await pool.end();
