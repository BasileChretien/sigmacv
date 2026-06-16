import { createHash } from "node:crypto";
import { describe, expect, it } from "vitest";
import { THEME_INIT_SCRIPT, THEME_INIT_SHA256 } from "@/lib/themeInit";

describe("theme init script", () => {
  it("THEME_INIT_SHA256 matches the script's actual sha256 (CSP allow-list guard)", () => {
    // The browser allows the inline script only if its sha256 is in script-src.
    // If the script changes without updating the hash, dark mode breaks in prod
    // (the strict-dynamic CSP blocks it) — fail here instead.
    const actual = createHash("sha256").update(THEME_INIT_SCRIPT, "utf8").digest("base64");
    expect(actual).toBe(THEME_INIT_SHA256);
  });

  it("resolves stored light/dark, else falls back to the OS preference", () => {
    // Exercise the script's logic against a tiny DOM/localStorage/matchMedia stub.
    const run = (stored: string | null, osDark: boolean): string => {
      let attr = "";
      const root = { setAttribute: (_k: string, v: string) => (attr = v) };
      const ctx = {
        localStorage: { getItem: () => stored },
        matchMedia: () => ({ matches: osDark, addEventListener: () => {} }),
        document: { documentElement: root },
      };
      new Function("localStorage", "matchMedia", "document", THEME_INIT_SCRIPT)(
        ctx.localStorage,
        ctx.matchMedia,
        ctx.document,
      );
      return attr;
    };
    expect(run("dark", false)).toBe("dark");
    expect(run("light", true)).toBe("light");
    expect(run("system", true)).toBe("dark"); // system → follow OS
    expect(run(null, true)).toBe("dark"); // unset → follow OS
    expect(run(null, false)).toBe("light");
  });
});
