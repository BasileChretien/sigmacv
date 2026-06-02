import { defineConfig } from "prisma/config";

/**
 * Prisma 7 configuration (replaces the deprecated `package.json#prisma` block).
 *
 * `url` is what the Prisma CLI uses for `migrate` / `db push`. The RUNTIME
 * client connects via a driver adapter instead (see src/lib/db.ts) — Prisma 7
 * ships a Rust-free client that requires an adapter.
 *
 * We read `process.env` directly (not the throwing `env()` helper) with a
 * never-connected placeholder fallback, so `prisma generate` works without a
 * DATABASE_URL (it doesn't connect) — important for `postinstall` and the
 * Docker build. Real DB operations get the actual value from the environment:
 *   • locally, the `db:*` npm scripts inject `.env` via dotenv-cli;
 *   • in Docker, the container provides DATABASE_URL.
 * This keeps the config portable (no dotenv dependency at runtime).
 */
const PLACEHOLDER_URL = "postgresql://placeholder:placeholder@localhost:5432/placeholder";

export default defineConfig({
  schema: "prisma/schema.prisma",
  datasource: {
    url: process.env.DATABASE_URL ?? PLACEHOLDER_URL,
  },
});
