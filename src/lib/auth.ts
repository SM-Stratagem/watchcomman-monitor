// BetterAuth instance. Email/password sign-in backed by Postgres via our Drizzle schema.
// Used only for the (optional) human-facing auth UI; the API is protected by API keys.

import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { getDb } from "./db";
import * as schema from "../../db/schema";

// Use a loose type for the cached instance — better-auth's exported generics
// are awkward to reuse, and we only need the .handler shape.
type AnyAuth = { handler: (req: Request) => Response | Promise<Response> };
let _auth: AnyAuth | null = null;

export function getAuth(): AnyAuth {
  if (_auth) return _auth;
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL is required for auth");
  }
  const baseURL = process.env.SITE_URL || process.env.BETTER_AUTH_URL || "http://localhost:3000";
  const secret = process.env.BETTER_AUTH_SECRET || process.env.CRON_SECRET || "dev-secret-replace-me";
  const instance = betterAuth({
    baseURL,
    secret,
    database: drizzleAdapter(getDb(), {
      provider: "pg",
      schema: {
        user: schema.authUser,
        session: schema.authSession,
        account: schema.authAccount,
        verification: schema.authVerification,
      },
    }),
    emailAndPassword: {
      enabled: true,
      autoSignIn: true,
      minPasswordLength: 8,
    },
    session: {
      cookieCache: { enabled: true, maxAge: 60 * 60 },
      expiresIn: 60 * 60 * 24 * 30,
    },
    advanced: {
      crossSubDomainCookies: { enabled: false },
    },
  });
  _auth = instance as unknown as AnyAuth;
  return _auth;
}
