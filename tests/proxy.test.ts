import path from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { THEME_INIT_SHA256 } from "@/lib/themeInit";

// The proxy reads the prerendered pages' script hashes off `.next`. A build may
// or may not exist where the tests run, so the lookup is replaced: by default no
// route is prerendered.
const mocks = vi.hoisted(() => ({
  lookup: vi.fn<(pathname: string) => readonly string[] | null>(() => null),
  distDirs: [] as string[],
}));
vi.mock("@/lib/security/prerenderedScripts", () => ({
  createPrerenderedScriptLookup: (distDir: string) => {
    mocks.distDirs.push(distDir);
    return mocks.lookup;
  },
}));

import { proxy } from "@/proxy";

/**
 * Guards the app-shell Content-Security-Policy. A regression here is exactly
 * what produces a "very old looking, no images, nothing renders" page: if
 * style-src loses 'unsafe-inline', or img-src loses data:, or the dev
 * script-src is tightened, the browser blocks the styles/JS/images and the
 * app renders as raw unstyled HTML.
 *
 * This checks the header STRING only. Whether a browser actually runs a page's
 * scripts under it is checked against a production build, in
 * `e2e/production/csp.spec.ts`: a string test passed for four months while every
 * prerendered page was script-less.
 *
 * (Next 16 renamed the `middleware` file convention to `proxy`; the exported
 * function is `proxy` and the behaviour is identical.)
 */
function cspFor(pathname = "/"): string {
  const res = proxy(new NextRequest(`http://localhost:3000${pathname}`));
  return res.headers.get("content-security-policy") ?? "";
}

describe("app-shell CSP proxy", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    mocks.lookup.mockReset().mockReturnValue(null);
  });

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
    const csp = cspFor("/about");
    expect(csp).toContain("script-src 'self' 'unsafe-eval' 'unsafe-inline'");
    expect(csp).toMatch(/connect-src[^;]*\bws:/);
    // `next dev` prerenders nothing: the build output is not consulted.
    expect(mocks.lookup).not.toHaveBeenCalled();
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

  it("gives a prerendered route its inline-script hashes instead of strict-dynamic", () => {
    vi.stubEnv("NODE_ENV", "production");
    mocks.lookup.mockImplementation((pathname) =>
      pathname === "/about" ? ["aaaa=", "bbbb="] : null,
    );

    const prerendered = cspFor("/about?utm_source=x");
    expect(mocks.lookup).toHaveBeenLastCalledWith("/about");
    expect(prerendered).toMatch(
      /script-src 'self' 'nonce-[A-Za-z0-9+/=]+' 'sha256-aaaa=' 'sha256-bbbb=';/,
    );
    expect(prerendered).not.toContain("'strict-dynamic'");
    expect(prerendered).not.toMatch(/script-src[^;]*'unsafe-(inline|eval)'/);

    // A route rendered per request keeps the nonce policy.
    expect(cspFor("/cv")).toContain("'strict-dynamic'");
  });

  it("adds the analytics origin to connect-src when analytics is configured", () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("NEXT_PUBLIC_PLAUSIBLE_SRC", "https://plausible.example.org/js/pa-abc.js");
    expect(cspFor()).toContain("connect-src 'self' https://plausible.example.org;");
  });

  it("hands Next the same policy on the request, so it stamps the same nonce", () => {
    vi.stubEnv("NODE_ENV", "production");
    const res = proxy(new NextRequest("http://localhost:3000/cv"));
    const csp = res.headers.get("content-security-policy");
    expect(res.headers.get("x-middleware-request-content-security-policy")).toBe(csp);
    expect(csp).toContain(`'nonce-${res.headers.get("x-middleware-request-x-nonce")}'`);
  });

  it("reads the build that sits in the server's working directory", () => {
    expect(mocks.distDirs).toEqual([path.join(process.cwd(), ".next")]);
  });
});
