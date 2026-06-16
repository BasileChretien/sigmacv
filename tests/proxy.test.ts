import { afterEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { proxy } from "@/proxy";
import { THEME_INIT_SHA256 } from "@/lib/themeInit";

/**
 * Guards the app-shell Content-Security-Policy. A regression here is exactly
 * what produces a "very old looking, no images, nothing renders" page: if
 * style-src loses 'unsafe-inline', or img-src loses data:, or the dev
 * script-src is tightened, the browser blocks the styles/JS/images and the
 * app renders as raw unstyled HTML.
 *
 * (Next 16 renamed the `middleware` file convention to `proxy`; the exported
 * function is `proxy` and the behaviour is identical.)
 */
function cspFor(): string {
  const res = proxy(new NextRequest("http://localhost:3000/"));
  return res.headers.get("content-security-policy") ?? "";
}

describe("app-shell CSP proxy", () => {
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
    // nonce + the static theme-init script's sha256 (allow-listed under
    // strict-dynamic so the no-flash bootstrap runs without a nonce).
    expect(csp).toMatch(
      /script-src 'self' 'nonce-[A-Za-z0-9+/=]+' 'sha256-[A-Za-z0-9+/=]+' 'strict-dynamic'/,
    );
    expect(csp).toContain(`'sha256-${THEME_INIT_SHA256}'`);
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
