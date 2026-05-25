import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";

let _db: ReturnType<typeof drizzle> | null = null;
let _pool: pg.Pool | null = null;

function shouldUseSsl(connectionString: string) {
  if (process.env.PGSSLMODE === "require") return true;
  if (process.env.PGSSL === "true") return true;
  const lower = connectionString.toLowerCase();
  return lower.includes("sslmode=require") || lower.includes("ssl=true");
}

export function getDb() {
  if (_db) return _db;
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("DATABASE_URL is required");
  }
  _pool = new pg.Pool({
    connectionString,
    ssl: shouldUseSsl(connectionString) ? { rejectUnauthorized: false } : undefined,
    allowExitOnIdle: true,
  });
  _db = drizzle(_pool);
  return _db;
}

export async function closeDb() {
  const pool = _pool;
  _pool = null;
  _db = null;
  if (pool) {
    await pool.end();
  }
}
