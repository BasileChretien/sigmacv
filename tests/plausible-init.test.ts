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

  it("drops what was typed into the see-it-first box when the form fell back to a GET (?who=)", () => {
    // Submitted before the page's script runs, the box reloads its own page as
    // `…?who=<name or iD>`; that URL also sits in histories from the months the
    // box had no script at all. It must not reach the collector from any page.
    const transform = boot().o!.transformRequest!;
    const out = transform({
      u: "https://sigmacv.org/guides/how-to-write-an-academic-cv?who=Jane+Doe#top",
      r: "https://sigmacv.org/fr/orcid-to-cv?who=0000-0002-1825-0097",
    });
    expect(out.u).toBe("https://sigmacv.org/guides/how-to-write-an-academic-cv#top");
    expect(out.r).toBe("https://sigmacv.org/fr/orcid-to-cv");
    expect(transform({ u: "https://sigmacv.org/?who=Jane%20Doe" }).u).toBe("https://sigmacv.org/");

    // The campaign parameters Plausible reads stay, wherever `who` sits.
    expect(transform({ u: "https://sigmacv.org/guides?who=x&utm_source=nl&ref=a" }).u).toBe(
      "https://sigmacv.org/guides?utm_source=nl&ref=a",
    );
    expect(transform({ u: "https://sigmacv.org/guides?utm_source=nl&who=x&ref=a" }).u).toBe(
      "https://sigmacv.org/guides?utm_source=nl&ref=a",
    );
    expect(transform({ u: "https://sigmacv.org/guides?utm_source=nl&who=x#top" }).u).toBe(
      "https://sigmacv.org/guides?utm_source=nl#top",
    );
    expect(transform({ u: "https://sigmacv.org/guides?who=a&who=b" }).u).toBe(
      "https://sigmacv.org/guides",
    );
    // An empty value, and a parameter that merely starts or ends with "who".
    expect(transform({ u: "https://sigmacv.org/guides?who=" }).u).toBe(
      "https://sigmacv.org/guides",
    );
    expect(transform({ u: "https://sigmacv.org/guides?whoever=1&xwho=2" }).u).toBe(
      "https://sigmacv.org/guides?whoever=1&xwho=2",
    );
    // A path segment is not a parameter.
    expect(transform({ u: "https://sigmacv.org/glossary/who=x" }).u).toBe(
      "https://sigmacv.org/glossary/who=x",
    );
  });

  it("removes `who` from the query string only, never from a path or a fragment", () => {
    // `/about&who=x` is an address that does not exist (a 404 that still counts
    // a pageview). Cut there, it would be filed as a view of the real /about.
    const transform = boot().o!.transformRequest!;
    for (const url of [
      "https://sigmacv.org/about&who=x",
      "https://sigmacv.org/i/02abc&who=Jane+Doe",
      "https://sigmacv.org/guides/x&who=y?utm_source=nl",
      "https://sigmacv.org/guides#a&who=x",
      "https://sigmacv.org/guides#a?who=x",
      "https://sigmacv.org/guides?utm_source=nl#a&who=x",
    ]) {
      expect(transform({ u: url, r: url })).toEqual({ u: url, r: url });
    }
    // In the query it still goes, whatever follows in the fragment.
    expect(transform({ u: "https://sigmacv.org/guides?who=x#a&who=y" }).u).toBe(
      "https://sigmacv.org/guides#a&who=y",
    );
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
