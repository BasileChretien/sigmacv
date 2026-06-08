import { afterEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { middleware } from "@/middleware";

/**
 * Guards the app-shell Content-Security-Policy. A regression here is exactly
 * what produces a "very old looking, no images, nothing renders" page: if
 * style-src loses 'unsafe-inline', or img-src loses data:, or the dev
 * script-src is tightened, the browser blocks the styles/JS/images and the
 * app renders as raw unstyled HTML.
 */
function cspFor(): string {
  const res = middleware(new NextRequest("http://localhost:3000/"));
  return res.headers.get("content-security-policy") ?? "";
}

describe("app-shell CSP middleware", () => {
  afterEach(() => vi.unstubAllEnvs());

  it("always permits the assets the rendered app needs", () => {
    const csp = cspFor();
    // The three that, if dropped, cause the unstyled / no-images failure.
    expect(csp).toContain("style-src 'self' 'unsafe-inline'");
    expect(csp).toContain("img-src 'self' data:");
    expect(csp).toContain("font-src 'self'");
    // Baseline + hardening directives.
    expect(csp).toContain("default-src 'self'");
    expect(csp).toContain("object-src 'none'");
    expect(csp).toContain("frame-ancestors 'none'");
    expect(csp).toContain("frame-src 'self'");
  });

  it("relaxes script-src + connect-src in development (HMR needs eval + ws)", () => {
    vi.stubEnv("NODE_ENV", "development");
    const csp = cspFor();
    expect(csp).toContain("script-src 'self' 'unsafe-eval' 'unsafe-inline'");
    expect(csp).toMatch(/connect-src[^;]*\bws:/);
  });

  it("uses a per-request nonce + strict-dynamic and forbids unsafe-eval in production", () => {
    vi.stubEnv("NODE_ENV", "production");
    const csp = cspFor();
    expect(csp).toMatch(/script-src 'self' 'nonce-[A-Za-z0-9+/=]+' 'strict-dynamic'/);
    expect(csp).not.toContain("'unsafe-eval'");
    expect(csp).not.toMatch(/script-src[^;]*'unsafe-inline'/);
    // The nonce decodes to 16 random bytes (raw-bytes base64, not a UUID string).
    const nonce = csp.match(/'nonce-([A-Za-z0-9+/=]+)'/)?.[1];
    expect(nonce).toBeTruthy();
    expect(Buffer.from(nonce!, "base64").length).toBe(16);
  });

  it("generates a fresh nonce on each request", () => {
    vi.stubEnv("NODE_ENV", "production");
    const a = cspFor().match(/'nonce-([^']+)'/)?.[1];
    const b = cspFor().match(/'nonce-([^']+)'/)?.[1];
    expect(a).toBeTruthy();
    expect(a).not.toBe(b);
  });
});
