/**
 * Shared by `playwright.prod.config.ts` (which builds and starts the server
 * with these) and the specs (which need to know what the build was given).
 */

const PORT = 3101;
export const BASE_URL = `http://localhost:${PORT}`;

/**
 * The analytics script URL baked into the build (`NEXT_PUBLIC_*` is inlined at
 * build time). Nothing answers at this host: the specs fulfil its requests
 * themselves, which is enough to see whether the policy lets them out.
 */
export const PLAUSIBLE_SRC =
  process.env.NEXT_PUBLIC_PLAUSIBLE_SRC || "https://plausible.e2e.test/js/pa-e2e.js";

/**
 * Build-time and run-time env of the server under test. No database is touched:
 * the specs open prerendered pages and anonymous dynamic ones, and the URL
 * points at a port nothing listens on, so a developer's local Postgres is never
 * dialled either. One spec counts on that: it opens a page that reads the
 * database to see what a failing render is answered with.
 */
export const SERVER_ENV: Record<string, string> = {
  NODE_ENV: "production",
  NEXT_TELEMETRY_DISABLED: "1",
  PORT: String(PORT),
  HOSTNAME: "localhost",
  DATABASE_URL: "postgresql://e2e:e2e@127.0.0.1:1/not_used",
  AUTH_SECRET: "e2e-production-build-not-a-real-secret",
  AUTH_URL: BASE_URL,
  ORCID_CLIENT_ID: "e2e",
  ORCID_CLIENT_SECRET: "e2e",
  ORCID_ENVIRONMENT: "sandbox",
  OPENALEX_MAILTO: "e2e@example.com",
  NEXT_PUBLIC_PLAUSIBLE_SRC: PLAUSIBLE_SRC,
};
