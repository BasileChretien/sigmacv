import { describe, expect, it } from "vitest";
import { clientIp, clientIpFromHeaders } from "@/lib/security/clientIp";

describe("clientIpFromHeaders", () => {
  it("trusts the RIGHTMOST X-Forwarded-For hop (Caddy overwrites it)", () => {
    const h = new Headers({ "x-forwarded-for": "1.1.1.1, 2.2.2.2, 9.9.9.9" });
    expect(clientIpFromHeaders(h)).toBe("9.9.9.9");
  });

  it("handles a single X-Forwarded-For value", () => {
    expect(clientIpFromHeaders(new Headers({ "x-forwarded-for": "3.3.3.3" }))).toBe("3.3.3.3");
  });

  it("falls back to X-Real-IP, then 'unknown'", () => {
    expect(clientIpFromHeaders(new Headers({ "x-real-ip": "4.4.4.4" }))).toBe("4.4.4.4");
    expect(clientIpFromHeaders(new Headers())).toBe("unknown");
    // An empty X-Real-IP is treated as absent.
    expect(clientIpFromHeaders(new Headers({ "x-real-ip": "  " }))).toBe("unknown");
  });
});

describe("clientIp", () => {
  it("reads the same value from a Request's headers", () => {
    const req = new Request("https://example.org/", {
      headers: { "x-forwarded-for": "1.1.1.1, 5.5.5.5" },
    });
    expect(clientIp(req)).toBe("5.5.5.5");
  });
});
