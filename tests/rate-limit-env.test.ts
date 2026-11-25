import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  RATE_LIMIT_DEFAULTS,
  __resetEnvForTests,
  getCallerRateLimit,
  getEnv,
  getRateLimit,
} from "@/lib/env";

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

function allLimits(): Record<LimitName, number> {
  return Object.fromEntries(NAMES.map((n) => [n, getRateLimit(n)])) as Record<LimitName, number>;
}

beforeEach(() => setEnv({}));
afterEach(() => {
  process.env = { ...ORIGINAL };
  __resetEnvForTests();
});

describe("getRateLimit defaults", () => {
  it("returns today's limits when no override is set", () => {
    expect(allLimits()).toEqual(TODAY);
  });

  it("exports today's limits as the defaults", () => {
    expect(RATE_LIMIT_DEFAULTS).toEqual(TODAY);
  });

  it("does not need the app's required variables (only its own)", () => {
    // No DATABASE_URL, AUTH_SECRET, ORCID_*: getEnv() would throw here.
    expect(() => getEnv()).toThrow(/environment/i);
    expect(getRateLimit("PREVIEW_MAX_PER_IP")).toBe(30);
  });

  it("treats a blank value as unset (a compose `${VAR:-}` passthrough)", () => {
    setEnv(Object.fromEntries(NAMES.map((n) => [n, ""])));
    expect(allLimits()).toEqual(TODAY);
  });
});

describe("getRateLimit overrides", () => {
  it("reads every override as a whole number", () => {
    const raised = Object.fromEntries(NAMES.map((n) => [n, String(TODAY[n] * 10)]));
    setEnv(raised);
    for (const n of NAMES) expect(getRateLimit(n)).toBe(TODAY[n] * 10);
  });

  it("keeps today's value for the limits that are not overridden", () => {
    setEnv({ PREVIEW_MAX_PER_IP: "1000" });
    expect(allLimits()).toEqual({ ...TODAY, PREVIEW_MAX_PER_IP: 1000 });
  });

  it("accepts a lower limit too, down to 1", () => {
    setEnv({ SEARCH_MAX_PER_IP: "1" });
    expect(getRateLimit("SEARCH_MAX_PER_IP")).toBe(1);
  });

  it.each(NAMES)("accepts %s at exactly 100 times today's value", (name) => {
    setEnv({ [name]: String(TODAY[name] * 100) });
    expect(getRateLimit(name)).toBe(TODAY[name] * 100);
  });

  it("is read once, then cached until the env is reset", () => {
    setEnv({ PREVIEW_MAX_GLOBAL: "2000" });
    expect(getRateLimit("PREVIEW_MAX_GLOBAL")).toBe(2000);
    process.env.PREVIEW_MAX_GLOBAL = "3000";
    expect(getRateLimit("PREVIEW_MAX_GLOBAL")).toBe(2000);
    __resetEnvForTests();
    expect(getRateLimit("PREVIEW_MAX_GLOBAL")).toBe(3000);
  });
});

describe("getRateLimit invalid values", () => {
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
    expect(() => getRateLimit("PREVIEW_MAX_PER_IP")).toThrow(/PREVIEW_MAX_PER_IP/);
  });

  it.each(NAMES)("refuses %s above 100 times today's value", (name) => {
    setEnv({ [name]: String(TODAY[name] * 100 + 1) });
    expect(() => getRateLimit(name)).toThrow(new RegExp(name));
  });

  it("says how to go back, with the default the variable returns to", () => {
    setEnv({ SEARCH_MAX_PER_IP: "0" });
    expect(() => getRateLimit("SEARCH_MAX_PER_IP")).toThrow(/unset.*\b20\b/i);
  });

  it.each(NAMES)("a bad %s fails only that variable: the seven others keep working", (bad) => {
    setEnv({ [bad]: "300/min" });
    expect(() => getRateLimit(bad)).toThrow(new RegExp(bad));
    for (const n of NAMES.filter((x) => x !== bad)) expect(getRateLimit(n)).toBe(TODAY[n]);
  });

  it("keeps a bad limit away from getEnv(), so sign-in and the editor keep working", () => {
    setEnv({ ...REQUIRED_APP_ENV, PREVIEW_MAX_PER_IP: "lots" });
    expect(() => getEnv()).not.toThrow();
    expect(() => getRateLimit("PREVIEW_MAX_PER_IP")).toThrow(/PREVIEW_MAX_PER_IP/);
  });

  it("does not cache a failed parse", () => {
    setEnv({ PREVIEW_MAX_PER_IP: "lots" });
    expect(() => getRateLimit("PREVIEW_MAX_PER_IP")).toThrow();
    process.env.PREVIEW_MAX_PER_IP = "50";
    expect(getRateLimit("PREVIEW_MAX_PER_IP")).toBe(50);
  });
});

describe("getCallerRateLimit (the per-caller preview buckets)", () => {
  it("gives an anonymous caller the event's override", () => {
    setEnv({ PREVIEW_THUMBNAILS_MAX_PER_IP: "900" });
    expect(getCallerRateLimit("PREVIEW_THUMBNAILS_MAX_PER_IP", false)).toBe(900);
  });

  it("keeps today's limit for a signed-in account, whatever the override", () => {
    setEnv({ PREVIEW_THUMBNAILS_MAX_PER_IP: "3000", PREVIEW_RENDER_MAX_PER_IP: "24000" });
    expect(getCallerRateLimit("PREVIEW_THUMBNAILS_MAX_PER_IP", true)).toBe(30);
    expect(getCallerRateLimit("PREVIEW_RENDER_MAX_PER_IP", true)).toBe(240);
  });

  it("never reads the override for a signed-in account, so a bad value cannot reach it", () => {
    setEnv({ PREVIEW_THUMBNAILS_MAX_PER_IP: "lots" });
    expect(getCallerRateLimit("PREVIEW_THUMBNAILS_MAX_PER_IP", true)).toBe(30);
    expect(() => getCallerRateLimit("PREVIEW_THUMBNAILS_MAX_PER_IP", false)).toThrow(
      /PREVIEW_THUMBNAILS_MAX_PER_IP/,
    );
  });
});
