import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { isSameOrigin } from "@/lib/security/origin";

const APP = "https://cv.example.org";

function req(headers: Record<string, string>): Request {
  return new Request("https://cv.example.org/api/cv", { method: "PATCH", headers });
}

describe("isSameOrigin", () => {
  it("accepts a matching Origin", () => {
    expect(isSameOrigin(req({ origin: APP }), APP)).toBe(true);
  });

  it("rejects a foreign Origin (cross-site CSRF attempt)", () => {
    expect(isSameOrigin(req({ origin: "https://evil.example" }), APP)).toBe(false);
  });

  it("falls back to Referer when Origin is absent", () => {
    expect(isSameOrigin(req({ referer: `${APP}/cv` }), APP)).toBe(true);
    expect(isSameOrigin(req({ referer: "https://evil.example/x" }), APP)).toBe(false);
  });

  it("allows when neither Origin nor Referer is present (non-browser/same-origin)", () => {
    expect(isSameOrigin(req({}), APP)).toBe(true);
  });

  it("is permissive (dev) when no canonical origin is configured", () => {
    expect(isSameOrigin(req({ origin: "https://anything.example" }), undefined)).toBe(true);
  });

  it("is permissive (dev) on a misconfigured AUTH_URL", () => {
    expect(isSameOrigin(req({ origin: APP }), "not-a-url")).toBe(true);
  });
});

describe("isSameOrigin — production fail-closed", () => {
  const original = process.env.NODE_ENV;
  beforeEach(() => {
    (process.env as Record<string, string | undefined>).NODE_ENV = "production";
  });
  afterEach(() => {
    (process.env as Record<string, string | undefined>).NODE_ENV = original;
  });

  it("rejects when no canonical origin resolves (misconfigured AUTH_URL)", () => {
    expect(isSameOrigin(req({ origin: APP }), undefined)).toBe(false);
    expect(isSameOrigin(req({ origin: APP }), "not-a-url")).toBe(false);
  });

  it("rejects a request carrying neither Origin nor Referer", () => {
    expect(isSameOrigin(req({}), APP)).toBe(false);
  });

  it("still accepts a matching Origin and rejects a foreign one", () => {
    expect(isSameOrigin(req({ origin: APP }), APP)).toBe(true);
    expect(isSameOrigin(req({ origin: "https://evil.example" }), APP)).toBe(false);
  });
});
