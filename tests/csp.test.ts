import { createHash } from "node:crypto";
import { describe, expect, it } from "vitest";
import { PLAUSIBLE_INIT_SCRIPT } from "@/lib/analytics/plausibleInit";
import { contentSecurityPolicy } from "@/lib/security/csp";
import { THEME_INIT_SHA256 } from "@/lib/themeInit";

const NONCE = "AAAAAAAAAAAAAAAAAAAAAA==";
const PLAUSIBLE = "https://plausible.example.org/js/pa-abc123.js";
const PLAUSIBLE_INIT_HASH = createHash("sha256")
  .update(PLAUSIBLE_INIT_SCRIPT, "utf8")
  .digest("base64");

function directive(csp: string, name: string): string {
  const found = csp.split("; ").find((d) => d.startsWith(`${name} `));
  if (!found) throw new Error(`no ${name} directive in: ${csp}`);
  return found.slice(name.length + 1);
}

describe("contentSecurityPolicy", () => {
  it("always permits the assets the rendered app needs", () => {
    for (const isDev of [true, false]) {
      const csp = contentSecurityPolicy({ isDev, nonce: NONCE });
      expect(csp).toContain("style-src 'self' 'unsafe-inline'");
      expect(csp).toContain("img-src 'self' data:");
      expect(csp).toContain("font-src 'self'");
      expect(csp).toContain("default-src 'self'");
      expect(csp).toContain("object-src 'none'");
      expect(csp).toContain("frame-ancestors 'none'");
      expect(csp).toContain("frame-src 'self'");
      expect(csp).toContain("base-uri 'self'");
      expect(csp).toContain("form-action 'self'");
    }
  });

  it("relaxes script-src and connect-src in development, whatever else is passed", () => {
    const csp = contentSecurityPolicy({
      isDev: true,
      nonce: NONCE,
      analyticsSrc: PLAUSIBLE,
      prerenderedScriptHashes: ["abc="],
    });
    expect(directive(csp, "script-src")).toBe("'self' 'unsafe-eval' 'unsafe-inline'");
    expect(directive(csp, "connect-src")).toBe("'self' ws: wss:");
  });

  describe("a route rendered per request", () => {
    it("gets the nonce, the theme-bootstrap hash and strict-dynamic", () => {
      for (const prerenderedScriptHashes of [null, undefined]) {
        const csp = contentSecurityPolicy({ isDev: false, nonce: NONCE, prerenderedScriptHashes });
        expect(directive(csp, "script-src")).toBe(
          `'self' 'nonce-${NONCE}' 'sha256-${THEME_INIT_SHA256}' 'strict-dynamic'`,
        );
      }
    });

    it("does not list the analytics script: strict-dynamic lets next/script load it", () => {
      const csp = contentSecurityPolicy({ isDev: false, nonce: NONCE, analyticsSrc: PLAUSIBLE });
      expect(directive(csp, "script-src")).not.toContain("plausible.example.org");
      expect(directive(csp, "connect-src")).toBe("'self' https://plausible.example.org");
    });
  });

  describe("a prerendered route", () => {
    const hashes = ["aaaa=", "bbbb="];
    const prerendered = (analyticsSrc?: string) =>
      contentSecurityPolicy({
        isDev: false,
        nonce: NONCE,
        analyticsSrc,
        prerenderedScriptHashes: hashes,
      });

    it("lists the page's inline-script hashes and drops strict-dynamic, so 'self' applies", () => {
      expect(directive(prerendered(), "script-src")).toBe(
        `'self' 'nonce-${NONCE}' 'sha256-aaaa=' 'sha256-bbbb='`,
      );
    });

    it("never falls back to unsafe-inline or unsafe-eval", () => {
      for (const csp of [prerendered(), prerendered(PLAUSIBLE)]) {
        expect(directive(csp, "script-src")).not.toMatch(
          /unsafe-inline|unsafe-eval|strict-dynamic/,
        );
      }
    });

    it("allows the analytics script by its exact URL, and its init stub by hash", () => {
      const scriptSrc = directive(prerendered(`${PLAUSIBLE}?v=2#x`), "script-src");
      expect(scriptSrc).toBe(
        `'self' 'nonce-${NONCE}' 'sha256-aaaa=' 'sha256-bbbb=' 'sha256-${PLAUSIBLE_INIT_HASH}' ${PLAUSIBLE}`,
      );
      expect(directive(prerendered(PLAUSIBLE), "connect-src")).toBe(
        "'self' https://plausible.example.org",
      );
    });

    it("widens to the analytics origin when the script path cannot be written in a CSP", () => {
      const scriptSrc = directive(
        prerendered("https://plausible.example.org/js/a;b,c.js"),
        "script-src",
      );
      expect(scriptSrc.endsWith(" https://plausible.example.org")).toBe(true);
      expect(scriptSrc).not.toMatch(/[;,]/);
    });

    it("an empty hash list is still the prerendered shape (a page with no inline script)", () => {
      const csp = contentSecurityPolicy({
        isDev: false,
        nonce: NONCE,
        prerenderedScriptHashes: [],
      });
      expect(directive(csp, "script-src")).toBe(`'self' 'nonce-${NONCE}'`);
    });
  });

  it("leaves analytics out when the configured URL is blank, malformed or not http(s)", () => {
    for (const analyticsSrc of [
      undefined,
      "",
      "not a url",
      "javascript:alert(1)",
      "data:text/javascript,1",
    ]) {
      const csp = contentSecurityPolicy({
        isDev: false,
        nonce: NONCE,
        analyticsSrc,
        prerenderedScriptHashes: [],
      });
      expect(directive(csp, "connect-src")).toBe("'self'");
      expect(directive(csp, "script-src")).toBe(`'self' 'nonce-${NONCE}'`);
    }
  });

  it("leaves analytics out when its host would add tokens or directives of its own", () => {
    // The URL parser accepts `;`, `,` and `'` in a host, and `origin` repeats them.
    for (const analyticsSrc of [
      "https://x.example;sandbox/js/pa.js",
      "https://x.example,default-src/js/pa.js",
      "https://x.example'unsafe-inline'/js/pa.js",
    ]) {
      for (const prerenderedScriptHashes of [null, []]) {
        const csp = contentSecurityPolicy({
          isDev: false,
          nonce: NONCE,
          analyticsSrc,
          prerenderedScriptHashes,
        });
        expect(csp).not.toMatch(/x\.example|sandbox/);
        expect(csp.split("; ")).toHaveLength(11);
        expect(directive(csp, "connect-src")).toBe("'self'");
        expect(directive(csp, "script-src")).not.toContain("unsafe-inline");
      }
    }
  });

  it("accepts a plain-http analytics URL (local stub)", () => {
    const csp = contentSecurityPolicy({
      isDev: false,
      nonce: NONCE,
      analyticsSrc: "http://localhost:3299/js/pa-test.js",
      prerenderedScriptHashes: [],
    });
    expect(directive(csp, "connect-src")).toBe("'self' http://localhost:3299");
    expect(directive(csp, "script-src")).toContain(" http://localhost:3299/js/pa-test.js");
  });
});
