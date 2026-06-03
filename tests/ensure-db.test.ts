import { describe, expect, it } from "vitest";
import {
  isUsableDatabaseUrl,
  needsSync,
  parseDatabaseUrl,
  schemaHash,
} from "../scripts/ensure-db.mjs";

/**
 * Guards the predev DB auto-sync (scripts/ensure-db.mjs). The class of bug this
 * prevents: a Prisma schema change that isn't pushed to the dev DB, which then
 * surfaces as an opaque Auth "server configuration" error on the first
 * authenticated request.
 */
describe("ensure-db: isUsableDatabaseUrl", () => {
  it("accepts a real postgres URL", () => {
    expect(
      isUsableDatabaseUrl(
        "postgresql://u:p@ep-x.eu-central-1.aws.neon.tech/neondb?sslmode=require",
      ),
    ).toBe(true);
    expect(isUsableDatabaseUrl("postgres://u:p@localhost:5432/db")).toBe(true);
  });

  it("rejects empty, non-postgres, and the placeholder URL", () => {
    expect(isUsableDatabaseUrl("")).toBe(false);
    expect(isUsableDatabaseUrl(undefined as unknown as string)).toBe(false);
    expect(isUsableDatabaseUrl("mysql://u:p@host/db")).toBe(false);
    expect(
      isUsableDatabaseUrl(
        "postgresql://placeholder:placeholder@localhost:5432/placeholder",
      ),
    ).toBe(false);
  });
});

describe("ensure-db: parseDatabaseUrl", () => {
  it("reads quoted, single-quoted, and bare values", () => {
    expect(parseDatabaseUrl('DATABASE_URL="postgresql://a/b"')).toBe(
      "postgresql://a/b",
    );
    expect(parseDatabaseUrl("DATABASE_URL=postgresql://a/b")).toBe(
      "postgresql://a/b",
    );
    expect(parseDatabaseUrl("X=1\nDATABASE_URL='postgres://x'\nY=2")).toBe(
      "postgres://x",
    );
  });

  it("returns null when absent or empty", () => {
    expect(parseDatabaseUrl("OTHER=1")).toBeNull();
    expect(parseDatabaseUrl("")).toBeNull();
    expect(parseDatabaseUrl(null as unknown as string)).toBeNull();
  });
});

describe("ensure-db: schemaHash + needsSync", () => {
  it("is stable for identical schema text", () => {
    expect(schemaHash("model A {}")).toBe(schemaHash("model A {}"));
  });

  it("detects a changed schema (and a missing cache)", () => {
    const h = schemaHash("model A {}");
    expect(needsSync(h, h)).toBe(false);
    expect(needsSync(h, schemaHash("model B {}"))).toBe(true);
    expect(needsSync(h, null)).toBe(true);
  });
});
