import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const ORIGINAL = { ...process.env };

const VALID: Record<string, string> = {
  DATABASE_URL: "postgresql://u:p@localhost:5432/db",
  AUTH_SECRET: "x".repeat(40), // >= 32 so it passes the production strength check
  ORCID_CLIENT_ID: "APP-1",
  ORCID_CLIENT_SECRET: "secret",
  OPENALEX_MAILTO: "hello@example.org",
};

function setEnv(overrides: Record<string, string | undefined>) {
  // Start from a clean slate of our known keys.
  for (const k of [
    ...Object.keys(VALID),
    "AUTH_URL",
    "ORCID_ENVIRONMENT",
    "NODE_ENV",
    "RESYNC_SECRET",
  ]) {
    delete (process.env as Record<string, string | undefined>)[k];
  }
  Object.assign(process.env, overrides);
}

async function loadEnv() {
  vi.resetModules();
  return import("@/lib/env");
}

beforeEach(() => {
  vi.resetModules();
});
afterEach(() => {
  process.env = { ...ORIGINAL };
});

describe("getEnv", () => {
  it("parses a valid environment and defaults ORCID_ENVIRONMENT to sandbox", async () => {
    setEnv({ ...VALID, NODE_ENV: "test" });
    const { getEnv } = await loadEnv();
    expect(getEnv().ORCID_ENVIRONMENT).toBe("sandbox");
    expect(getEnv().OPENALEX_MAILTO).toBe("hello@example.org");
  });

  it("throws when a required variable is missing", async () => {
    setEnv({ ...VALID, OPENALEX_MAILTO: undefined, NODE_ENV: "test" });
    const { getEnv } = await loadEnv();
    expect(() => getEnv()).toThrow(/environment/i);
  });

  it("throws when OPENALEX_MAILTO is not an email", async () => {
    setEnv({ ...VALID, OPENALEX_MAILTO: "not-an-email", NODE_ENV: "test" });
    const { getEnv } = await loadEnv();
    expect(() => getEnv()).toThrow();
  });

  it("requires AUTH_URL in production", async () => {
    setEnv({ ...VALID, NODE_ENV: "production", ORCID_ENVIRONMENT: "production" });
    const { getEnv } = await loadEnv();
    expect(() => getEnv()).toThrow(/AUTH_URL/);
  });

  it("requires an explicit ORCID_ENVIRONMENT in production", async () => {
    setEnv({ ...VALID, NODE_ENV: "production", AUTH_URL: "https://cv.example.org" });
    const { getEnv } = await loadEnv();
    expect(() => getEnv()).toThrow(/ORCID_ENVIRONMENT/);
  });

  it("requires AUTH_SECRET of at least 32 chars in production", async () => {
    setEnv({
      ...VALID,
      AUTH_SECRET: "tooshort",
      NODE_ENV: "production",
      AUTH_URL: "https://cv.example.org",
      ORCID_ENVIRONMENT: "production",
    });
    const { getEnv } = await loadEnv();
    expect(() => getEnv()).toThrow(/AUTH_SECRET/);
  });

  it("accepts a complete production environment", async () => {
    setEnv({
      ...VALID,
      NODE_ENV: "production",
      AUTH_URL: "https://cv.example.org",
      ORCID_ENVIRONMENT: "production",
    });
    const { getEnv } = await loadEnv();
    expect(getEnv().ORCID_ENVIRONMENT).toBe("production");
  });

  it("caches the parsed result", async () => {
    setEnv({ ...VALID, NODE_ENV: "test" });
    const { getEnv } = await loadEnv();
    expect(getEnv()).toBe(getEnv());
  });
});
