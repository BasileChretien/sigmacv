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

  it("cuts an ORCID iD out of any other address, so a 404 on a mistyped one is not stored with it", () => {
    const transform = boot().o!.transformRequest!;
    const sent = (u: string) => transform({ u }).u;
    // Not the preview route: another case, another path, no path at all.
    expect(sent("https://sigmacv.org/Preview/0000-0002-1825-0097")).toBe(
      "https://sigmacv.org/Preview/_",
    );
    expect(sent("https://sigmacv.org/cv/0000-0002-1825-0097")).toBe("https://sigmacv.org/cv/_");
    expect(sent("https://sigmacv.org/0000-0002-1694-233X")).toBe("https://sigmacv.org/_");
    // Every occurrence, in the query and the fragment too, and a lower-case check digit.
    expect(
      sent(
        "https://sigmacv.org/a/0000-0002-1694-233x/b?id=0000-0002-1825-0097#0000-0001-5109-3700",
      ),
    ).toBe("https://sigmacv.org/a/_/b?id=_#_");
    // Inside an encoded ORCID URL.
    expect(sent("https://sigmacv.org/x/https%3A%2F%2Forcid.org%2F0000-0002-1825-0097")).toBe(
      "https://sigmacv.org/x/https%3A%2F%2Forcid.org%2F_",
    );
    // The referrer as well: a page named after an iD, here or elsewhere.
    const out = transform({
      u: "https://sigmacv.org/",
      r: "https://example.org/people/0000-0002-1825-0097",
    });
    expect(out).toEqual({ u: "https://sigmacv.org/", r: "https://example.org/people/_" });
  });

  it("cuts an iD however an address joins its four groups", () => {
    const sent = (path: string) =>
      boot().o!.transformRequest!({ u: `https://sigmacv.org/x/${path}` }).u;
    for (const path of [
      // Typed without hyphens.
      "0000000218250097",
      "000000021694233X",
      // The hyphen percent-encoded, in either case of the escape.
      "0000%2D0002%2D1825%2D0097",
      "0000%2d0002%2d1825%2d0097",
      // Copied from a PDF or a word processor: an en dash, a non-breaking hyphen.
      "0000%E2%80%930002%E2%80%931825%E2%80%930097",
      "0000%e2%80%910002%e2%80%911825%e2%80%910097",
      // Spaces, as a path encodes them and as a form does.
      "0000%200002%201825%200097",
      "0000+0002+1825+0097",
    ]) {
      expect(sent(path), path).toBe("https://sigmacv.org/x/_");
    }
  });

  it("goes by shape alone: it cuts too much rather than too little, and leaves shorter numbers", () => {
    const sent = (u: string) => boot().o!.transformRequest!({ u }).u;
    // No checksum: four groups of four that are not an iD go too.
    expect(sent("https://sigmacv.org/guides/2024-2025-2026-2027")).toBe(
      "https://sigmacv.org/guides/_",
    );
    // No word boundary: an iD glued to other digits is still cut out of them.
    expect(sent("https://sigmacv.org/x/90000-0002-1825-00971")).toBe("https://sigmacv.org/x/9_1");
    // Other numbers stay: three groups, a slug, a ROR id, a millisecond timestamp.
    for (const u of [
      "https://sigmacv.org/guides/2024-2025-2026-cv",
      "https://sigmacv.org/p/jane-doe-1234",
      "https://sigmacv.org/i/02feahw73",
      "https://sigmacv.org/x?t=1728300000000",
    ]) {
      expect(sent(u), u).toBe(u);
    }
  });

  it("drops the typed name from /search?q= (bare and localized), keeping the fragment", () => {
    const transform = boot().o!.transformRequest!;
    const out = transform({
      u: "https://sigmacv.org/search?q=Basile%20Chr%C3%A9tien#top",
      r: "https://sigmacv.org/fr/search?q=chr%C3%A9tien",
    });
    expect(out.u).toBe("https://sigmacv.org/search#top");
    expect(out.r).toBe("https://sigmacv.org/fr/search");
    // Another case is a 404, and a 404 is counted too: the name goes all the same.
    expect(transform({ u: "https://sigmacv.org/Search?q=Jane%20Doe" }).u).toBe(
      "https://sigmacv.org/Search",
    );
    // Not a lookup: a page whose path merely contains "search" keeps its query.
    expect(transform({ u: "https://sigmacv.org/research?x=1" }).u).toBe(
      "https://sigmacv.org/research?x=1",
    );
    expect(transform({ u: "https://sigmacv.org/search" }).u).toBe("https://sigmacv.org/search");
  });

  it("keeps only the origin of an outbound-link event's URL, so no identifier in a path reaches the collector", () => {
    const transform = boot().o!.transformRequest!;
    type Event = Payload & { p?: Record<string, string> };
    const outbound = (url: string) =>
      (
        transform({
          n: "Outbound Link: Click",
          u: "https://sigmacv.org/cv",
          p: { url },
        } as Event) as Event
      ).p!.url;
    expect(outbound("https://shareyourpaper.org/10.1002/pds.5000")).toBe(
      "https://shareyourpaper.org",
    );
    expect(outbound("https://doi.org/10.1234/(SICI)1?x=1#frag")).toBe("https://doi.org");
    expect(outbound("https://orcid.org/0000-0002-7483-2489")).toBe("https://orcid.org");
    expect(outbound("https://hal.science/submit")).toBe("https://hal.science");
    // Forms a URL parser would also normalise: user info, a port, a trailing dot, a bare host.
    expect(outbound("https://x:y@doi.org/10.1234/x")).toBe("https://doi.org");
    expect(outbound("https://doi.org:443/10.1234/x")).toBe("https://doi.org:443");
    expect(outbound("https://doi.org./10.1234/x")).toBe("https://doi.org.");
    expect(outbound("https://doi.org")).toBe("https://doi.org");
    // A query-only DOI URL (no path): the query goes too.
    expect(outbound("https://doi.org?doi=10.1234/x#frag")).toBe("https://doi.org");
    // Not an absolute URL: left as it was.
    expect(outbound("mailto:someone@example.org")).toBe("mailto:someone@example.org");
    // A custom event's own props are not touched.
    const custom = transform({
      n: "Deposit route",
      p: { kind: "shareyourpaper" },
    } as Event) as Event;
    expect(custom.p).toEqual({ kind: "shareyourpaper" });
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
