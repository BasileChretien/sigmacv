import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { __resetEnvForTests, getEnv, getRateLimitEnv } from "@/lib/env";

/**
 * The anonymous rate limits an event can raise for a day without a code change
 * (a workshop room shares one public IP). Unset must mean exactly the limits
 * that shipped before they became configurable.
 */
const ORIGINAL = { ...process.env };

/** Today's limits, as they were hard-coded before the overrides existed. */
const TODAY = {
  PREVIEW_MAX_PER_IP: 30,
  PREVIEW_MAX_GLOBAL: 600,
  PREVIEW_RENDER_MAX_PER_IP: 240,
  PREVIEW_RENDER_MAX_GLOBAL: 6_000,
  PREVIEW_THUMBNAILS_MAX_PER_IP: 30,
  SEARCH_MAX_PER_IP: 20,
  SEARCH_MAX_GLOBAL_PER_MINUTE: 300,
  SEARCH_MAX_GLOBAL_PER_HOUR: 3_000,
} as const;
type LimitName = keyof typeof TODAY;
const NAMES = Object.keys(TODAY) as LimitName[];

const REQUIRED_APP_ENV: Record<string, string> = {
  DATABASE_URL: "postgresql://u:p@localhost:5432/db",
  AUTH_SECRET: "x".repeat(40),
  ORCID_CLIENT_ID: "APP-1",
  ORCID_CLIENT_SECRET: "secret",
  OPENALEX_MAILTO: "hello@example.org",
};

function setEnv(values: Record<string, string | undefined>): void {
  const env = process.env as Record<string, string | undefined>;
  for (const k of [...NAMES, ...Object.keys(REQUIRED_APP_ENV)]) delete env[k];
  for (const [k, v] of Object.entries(values)) {
    if (v === undefined) delete env[k];
    else env[k] = v;
  }
  __resetEnvForTests();
}

beforeEach(() => setEnv({}));
afterEach(() => {
  process.env = { ...ORIGINAL };
  __resetEnvForTests();
});

describe("getRateLimitEnv defaults", () => {
  it("returns today's limits when no override is set", () => {
    expect(getRateLimitEnv()).toEqual(TODAY);
  });

  it("does not need the app's required variables (only its own)", () => {
    // No DATABASE_URL, AUTH_SECRET, ORCID_*: getEnv() would throw here.
    expect(() => getEnv()).toThrow(/environment/i);
    expect(getRateLimitEnv().PREVIEW_MAX_PER_IP).toBe(30);
  });

  it("treats a blank value as unset (a compose `${VAR:-}` passthrough)", () => {
    setEnv(Object.fromEntries(NAMES.map((n) => [n, ""])));
    expect(getRateLimitEnv()).toEqual(TODAY);
  });
});

describe("getRateLimitEnv overrides", () => {
  it("reads every override as a whole number", () => {
    const raised = Object.fromEntries(NAMES.map((n) => [n, String(TODAY[n] * 10)]));
    setEnv(raised);
    const limits = getRateLimitEnv();
    for (const n of NAMES) expect(limits[n]).toBe(TODAY[n] * 10);
  });

  it("keeps today's value for the limits that are not overridden", () => {
    setEnv({ PREVIEW_MAX_PER_IP: "1000" });
    expect(getRateLimitEnv()).toEqual({ ...TODAY, PREVIEW_MAX_PER_IP: 1000 });
  });

  it("accepts a lower limit too, down to 1", () => {
    setEnv({ SEARCH_MAX_PER_IP: "1" });
    expect(getRateLimitEnv().SEARCH_MAX_PER_IP).toBe(1);
  });

  it.each(NAMES)("accepts %s at exactly 100 times today's value", (name) => {
    setEnv({ [name]: String(TODAY[name] * 100) });
    expect(getRateLimitEnv()[name]).toBe(TODAY[name] * 100);
  });

  it("is read once, then cached until the env is reset", () => {
    setEnv({ PREVIEW_MAX_GLOBAL: "2000" });
    expect(getRateLimitEnv().PREVIEW_MAX_GLOBAL).toBe(2000);
    process.env.PREVIEW_MAX_GLOBAL = "3000";
    expect(getRateLimitEnv().PREVIEW_MAX_GLOBAL).toBe(2000);
    __resetEnvForTests();
    expect(getRateLimitEnv().PREVIEW_MAX_GLOBAL).toBe(3000);
  });
});

describe("getRateLimitEnv invalid values", () => {
  it.each([
    ["zero", "0"],
    ["negative", "-5"],
    ["a decimal", "1.5"],
    ["a word", "lots"],
    ["exponent notation", "1e3"],
    ["a thousands separator", "1,000"],
    ["surrounding spaces", " 40 "],
    ["a unit", "40/h"],
  ])("refuses %s and names the variable", (_label, value) => {
    setEnv({ PREVIEW_MAX_PER_IP: value });
    expect(() => getRateLimitEnv()).toThrow(/PREVIEW_MAX_PER_IP/);
  });

  it.each(NAMES)("refuses %s above 100 times today's value", (name) => {
    setEnv({ [name]: String(TODAY[name] * 100 + 1) });
    expect(() => getRateLimitEnv()).toThrow(new RegExp(name));
  });

  it("lists every bad variable at once, and says how to go back", () => {
    setEnv({ SEARCH_MAX_PER_IP: "0", PREVIEW_RENDER_MAX_GLOBAL: "x" });
    let message = "";
    try {
      getRateLimitEnv();
    } catch (e) {
      message = (e as Error).message;
    }
    expect(message).toMatch(/SEARCH_MAX_PER_IP/);
    expect(message).toMatch(/PREVIEW_RENDER_MAX_GLOBAL/);
    expect(message).toMatch(/unset/i);
  });

  it("keeps a bad limit away from getEnv(), so sign-in and the editor keep working", () => {
    setEnv({ ...REQUIRED_APP_ENV, PREVIEW_MAX_PER_IP: "lots" });
    expect(() => getEnv()).not.toThrow();
    expect(() => getRateLimitEnv()).toThrow(/PREVIEW_MAX_PER_IP/);
  });

  it("does not cache a failed parse", () => {
    setEnv({ PREVIEW_MAX_PER_IP: "lots" });
    expect(() => getRateLimitEnv()).toThrow();
    process.env.PREVIEW_MAX_PER_IP = "50";
    expect(getRateLimitEnv().PREVIEW_MAX_PER_IP).toBe(50);
  });
});
