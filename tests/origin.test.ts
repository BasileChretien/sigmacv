import { describe, expect, it } from "vitest";
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

  it("is permissive when no canonical origin is configured (dev)", () => {
    expect(isSameOrigin(req({ origin: "https://anything.example" }), undefined)).toBe(true);
  });

  it("does not hard-fail on a misconfigured AUTH_URL", () => {
    expect(isSameOrigin(req({ origin: APP }), "not-a-url")).toBe(true);
  });
});
