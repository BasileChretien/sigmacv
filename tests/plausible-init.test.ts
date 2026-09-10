import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import vm from "node:vm";
import { PLAUSIBLE_INIT_SCRIPT } from "@/lib/analytics/plausibleInit";

type Payload = { u?: string; r?: string; n?: string };
type Stub = {
  q?: unknown[];
  o?: { transformRequest?: (p: Payload) => Payload };
  (...args: unknown[]): void;
};

/** Run the inline stub the way a browser would: `window` is the global. */
function boot(): Stub {
  const win: Record<string, unknown> = {};
  win.window = win;
  vm.runInNewContext(PLAUSIBLE_INIT_SCRIPT, win);
  return win.plausible as Stub;
}

describe("root layout", () => {
  it("inlines PLAUSIBLE_INIT_SCRIPT rather than a hand-written init snippet", () => {
    const layout = readFileSync("src/app/layout.tsx", "utf8");
    expect(layout).toContain("{PLAUSIBLE_INIT_SCRIPT}");
    // A revert to the old literal `plausible.init()` would drop the scrub silently.
    expect(layout).not.toMatch(/plausible\.init\(/);
  });
});

describe("PLAUSIBLE_INIT_SCRIPT", () => {
  it("contains no backslash (it is inlined into a JSX template literal)", () => {
    expect(PLAUSIBLE_INIT_SCRIPT).not.toContain("\\");
  });

  it("queues events fired before the real script loads", () => {
    const plausible = boot();
    plausible("Export", { props: { format: "pdf" } });
    expect(plausible.q).toHaveLength(1);
  });

  it("registers a transformRequest that scrubs the ORCID out of /preview paths", () => {
    const plausible = boot();
    const transform = plausible.o?.transformRequest;
    expect(typeof transform).toBe("function");
    const out = transform!({
      u: "https://sigmacv.org/preview/0000-0002-7483-2489?utm_source=x#top",
      r: "https://sigmacv.org/preview/0000-0002-1825-0097",
      n: "pageview",
    });
    expect(out.u).toBe("https://sigmacv.org/preview/_?utm_source=x#top");
    expect(out.r).toBe("https://sigmacv.org/preview/_");
    expect(out.n).toBe("pageview");
  });

  it("drops the typed name from /search?q= (bare and localized), keeping the fragment", () => {
    const transform = boot().o!.transformRequest!;
    const out = transform({
      u: "https://sigmacv.org/search?q=Basile%20Chr%C3%A9tien#top",
      r: "https://sigmacv.org/fr/search?q=chr%C3%A9tien",
    });
    expect(out.u).toBe("https://sigmacv.org/search#top");
    expect(out.r).toBe("https://sigmacv.org/fr/search");
    // Not a lookup: a page whose path merely contains "search" keeps its query.
    expect(transform({ u: "https://sigmacv.org/research?x=1" }).u).toBe(
      "https://sigmacv.org/research?x=1",
    );
    expect(transform({ u: "https://sigmacv.org/search" }).u).toBe("https://sigmacv.org/search");
  });

  it("leaves every other path, and a missing/odd payload, untouched", () => {
    const transform = boot().o!.transformRequest!;
    expect(transform({ u: "https://sigmacv.org/p/abc", r: "" })).toEqual({
      u: "https://sigmacv.org/p/abc",
      r: "",
    });
    expect(transform({ u: "https://sigmacv.org/preview" }).u).toBe("https://sigmacv.org/preview");
    expect(transform({})).toEqual({});
    expect(transform(null as unknown as Payload)).toBeNull();
  });
});
