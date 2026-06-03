#!/usr/bin/env node
/**
 * Auto-sync the DEV database to prisma/schema.prisma before `next dev`.
 *
 * Why: when the Prisma schema gains a column but the (push-managed Neon) dev DB
 * isn't synced, every authenticated query selects a column the DB lacks and the
 * app fails with an opaque "server configuration" error. This keeps the dev DB
 * in step automatically.
 *
 * Behaviour (safe + fast):
 *   • Fingerprints schema.prisma; runs `prisma db push` ONLY when it changed
 *     (cached in .prisma-pushed) — otherwise an instant no-op on every dev start.
 *   • Skips entirely when there's no usable DATABASE_URL (e.g. the placeholder),
 *     so it never blocks offline / CI starts.
 *   • Non-fatal: if the push fails (DB down, or a data-loss change needing a
 *     manual decision) it prints a clear warning and lets dev start anyway.
 *
 * Wired as `predev` / `predev:public`. Production/Docker use migrations instead.
 */
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { createHash } from "node:crypto";
import { spawnSync } from "node:child_process";
import { pathToFileURL } from "node:url";

const SCHEMA_PATH = "prisma/schema.prisma";
const ENV_PATH = ".env";
const CACHE_PATH = ".prisma-pushed";

/** A DATABASE_URL we can actually push to (not empty, not the placeholder). */
export function isUsableDatabaseUrl(url) {
  if (!url || typeof url !== "string") return false;
  if (!/^postgres(ql)?:\/\//i.test(url)) return false;
  if (url.includes("placeholder")) return false;
  return true;
}

/** Extract DATABASE_URL from .env file text (quoted or bare). */
export function parseDatabaseUrl(envText) {
  if (!envText) return null;
  const m = envText.match(/^\s*DATABASE_URL\s*=\s*(.+?)\s*$/m);
  if (!m) return null;
  let v = m[1].trim();
  if (
    (v.startsWith('"') && v.endsWith('"')) ||
    (v.startsWith("'") && v.endsWith("'"))
  ) {
    v = v.slice(1, -1);
  }
  return v || null;
}

/** Stable SHA-256 fingerprint of the schema text. */
export function schemaHash(text) {
  return createHash("sha256")
    .update(text ?? "", "utf8")
    .digest("hex");
}

/** A push is needed when the schema fingerprint differs from the cached one. */
export function needsSync(currentHash, cachedHash) {
  return currentHash !== cachedHash;
}

function readFileSafe(path) {
  try {
    return existsSync(path) ? readFileSync(path, "utf8") : null;
  } catch {
    return null;
  }
}

function main() {
  const dbUrl =
    process.env.DATABASE_URL ?? parseDatabaseUrl(readFileSafe(ENV_PATH));
  if (!isUsableDatabaseUrl(dbUrl)) {
    console.log("[ensure-db] No usable DATABASE_URL — skipping DB sync.");
    return;
  }

  const schema = readFileSafe(SCHEMA_PATH);
  if (!schema) {
    console.log("[ensure-db] No prisma schema found — skipping.");
    return;
  }

  const hash = schemaHash(schema);
  if (!needsSync(hash, readFileSafe(CACHE_PATH))) {
    return; // schema unchanged since the last successful push → fast no-op
  }

  console.log(
    "[ensure-db] Prisma schema changed — syncing the database (prisma db push)…",
  );
  // `prisma db push` syncs the schema AND regenerates the client (Prisma 7 has
  // no `--skip-generate` flag), so no separate generate step is needed.
  const res = spawnSync(
    "npx",
    ["dotenv", "-e", ENV_PATH, "--", "prisma", "db", "push"],
    { stdio: "inherit", shell: true },
  );
  if (res.status === 0) {
    try {
      writeFileSync(CACHE_PATH, hash, "utf8");
    } catch {
      /* cache is best-effort */
    }
    console.log("[ensure-db] Database in sync.");
  } else {
    console.warn(
      "\n[ensure-db] ⚠ Could not sync the database automatically.\n" +
        "  Run `npm run db:push` manually (check for a data-loss change first).\n" +
        "  Starting the dev server anyway.\n",
    );
  }
}

const invokedDirectly =
  Boolean(process.argv[1]) &&
  import.meta.url === pathToFileURL(process.argv[1]).href;
if (invokedDirectly) main();
