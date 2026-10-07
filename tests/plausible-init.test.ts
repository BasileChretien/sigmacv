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
      // A minus sign, what a hyphen becomes in a PDF set in maths mode.
      "0000%E2%88%920002%E2%88%921825%E2%88%920097",
      "0000%e2%88%920002%e2%88%921825%e2%88%920097",
    ]) {
      expect(sent(path), path).toBe("https://sigmacv.org/x/_");
    }
  });

  /** What is sent for `path` on the site, without the origin. */
  const sentPath = (path: string) =>
    boot().o!.transformRequest!({ u: `https://sigmacv.org${path}` }).u!.replace(
      "https://sigmacv.org",
      "",
    );

  it("cuts the whole run of digits an iD stands in, whatever is joined to it in front or behind", () => {
    // Cutting sixteen digits out of a longer run leaves the rest to be read.
    // Digits glued to the front took the match and left the iD…
    expect(sentPath("/x/1234567890123450000-0002-1825-0097")).toBe("/x/_");
    expect(sentPath("/x/17283000000000000-0002-1825-0097")).toBe("/x/_");
    expect(sentPath("/x/90000-0002-1825-00971")).toBe("/x/_");
    expect(sentPath("/x/1234567890123450000000218250097")).toBe("/x/_");
    expect(sentPath("/x/123456789012345000000021694233X")).toBe("/x/_");
    // …and so did groups joined to it by a separator.
    expect(sentPath("/x/1234-5678-9012-0000-0002-1825-0097")).toBe("/x/_");
    expect(sentPath("/cv/2024-0000-0002-1825-0097")).toBe("/cv/_");
    // Behind it: an iD with no hyphens, or with some, followed by groups that
    // have theirs, must not be taken from its last group on.
    expect(sentPath("/x/0000000218250097-1111-2222-3333")).toBe("/x/_");
    expect(sentPath("/x/0000-0002-18250097-1111-2222-3333")).toBe("/x/_");
    expect(sentPath("/x/0000000218250097-0000-0001-5109-3700")).toBe("/x/_");
    expect(sentPath("/x?ids=0000000218250097+0000-0001-5109-3700")).toBe("/x?ids=_");
  });

  it("takes a `%` in front of an iD for an escape only when the iD cannot start inside it", () => {
    // A space, a non-breaking space or an encoded slash in front of an iD stays.
    expect(sentPath("/x%200000-0002-1825-0097")).toBe("/x%20_");
    expect(sentPath("/x%C2%A00000-0002-1825-0097")).toBe("/x%C2%A0_");
    expect(sentPath("/x%2F0000000218250097")).toBe("/x%2F_");
    // A bare `%`, or `%` and one digit, is no escape: every iD starts with
    // `00`, so reading `%00` there would let the whole iD through.
    expect(sentPath("/cv/%0000-0002-1825-0097")).toBe("/cv/%_");
    expect(sentPath("/cv/%0000000218250097")).toBe("/cv/%_");
    expect(sentPath("/cv/%0009-0001-2345-6789")).toBe("/cv/%_");
    expect(sentPath("/x?id=%0000-0002-1825-0097%")).toBe("/x?id=%_%");
    expect(sentPath("/cv/%20000-0002-1825-0097")).toBe("/cv/%_");
    // When the digits after `%` could be either, the iD wins and the escape goes.
    expect(sentPath("/x%200000000218250097")).toBe("/x%_");
    expect(sentPath("/a%2012-3456-7890-1234")).toBe("/a%_");
  });

  it("leaves no twelve digits of an iD in a row, whatever stands around it and however it is spelled", () => {
    const transform = boot().o!.transformRequest!;
    const SEPARATORS = /-|[+]|%2D|%20|%E2%80%9[0-5]|%E2%88%92/gi;
    const groups = ["0000", "0002", "1825", "0097"];
    const spellings = ["-", "", "%2D", "%E2%80%93", "%E2%88%92", "%20", "+"].map((separator) =>
      groups.join(separator),
    );
    const before = [
      "",
      "9",
      "123456789012345",
      "1234-5678-9012-",
      "2024-",
      "%",
      "%2",
      "%20",
      "%C2%A0",
      "x",
      "-",
      "=",
    ];
    const after = ["", "1", "-1111-2222-3333", "-0000-0001-5109-3700", "%20", "/x", "&a=1"];
    const iDs = [groups.join(""), "0000000151093700"];
    const leaks: string[] = [];
    for (const b of before) {
      for (const spelling of spellings) {
        for (const a of after) {
          const u = `https://sigmacv.org/x?v=${b}${spelling}${a}`;
          const digits = transform({ u }).u!.replace(SEPARATORS, "");
          for (const iD of iDs) {
            for (let i = 0; i + 12 <= iD.length; i++) {
              if (digits.includes(iD.slice(i, i + 12))) leaks.push(u);
            }
          }
        }
      }
    }
    expect([...new Set(leaks)]).toEqual([]);
  });

  it("goes by shape alone: it cuts too much rather than too little, and leaves shorter numbers", () => {
    const sent = (u: string) => boot().o!.transformRequest!({ u }).u;
    // No checksum: four groups of four that are not an iD go too.
    expect(sent("https://sigmacv.org/guides/2024-2025-2026-2027")).toBe(
      "https://sigmacv.org/guides/_",
    );
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
    // So is a name written as a path under the lookup. It is cut to `_`, not
    // away, so that the 404 is not counted as a visit to the lookup itself.
    expect(transform({ u: "https://sigmacv.org/search/Jane%20Doe" }).u).toBe(
      "https://sigmacv.org/search/_",
    );
    expect(transform({ u: "https://sigmacv.org/fr/search/Jane/Doe?q=Jane%20Doe#top" }).u).toBe(
      "https://sigmacv.org/fr/search/_#top",
    );
    // Not the lookup: a longer word that starts the same way keeps its path.
    expect(transform({ u: "https://sigmacv.org/searching/for/x" }).u).toBe(
      "https://sigmacv.org/searching/for/x",
    );
  });

  it("finds the lookup's address past a host or a segment that only starts like it", () => {
    const transform = boot().o!.transformRequest!;
    const referred = (r: string) => transform({ u: "https://sigmacv.org/", r }).r;
    // `//search.` in a search engine's own host is not `/search`: the rule has
    // to go on to the real one, or the query stays in the referrer.
    expect(referred("https://search.brave.com/search?q=jane+doe&source=web")).toBe(
      "https://search.brave.com/search",
    );
    expect(referred("https://search.yahoo.co.jp/search?p=Jane+Doe")).toBe(
      "https://search.yahoo.co.jp/search",
    );
    expect(transform({ u: "https://sigmacv.org/searching/search?q=Jane%20Doe" }).u).toBe(
      "https://sigmacv.org/searching/search",
    );
    // The path form, in a referrer, on such a host and on any other.
    expect(referred("https://search.example.org/search/Jane%20Doe")).toBe(
      "https://search.example.org/search/_",
    );
    expect(referred("https://example.org/search/x/y")).toBe("https://example.org/search/_");
    // A host that is the bare word is cut like the lookup: nothing of the name stays.
    expect(referred("http://search/search?q=Jane+Doe")).toBe("http://search/_");
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

  it("leaves the other parameters exactly as they were: inside a query only `&` separates", () => {
    const transform = boot().o!.transformRequest!;
    // A `?` after the first one is part of a value, not a separator.
    expect(
      transform({
        u: "https://sigmacv.org/guides?utm_campaign=whats-new?&utm_source=nl&who=Jane",
      }).u,
    ).toBe("https://sigmacv.org/guides?utm_campaign=whats-new?&utm_source=nl");
    expect(transform({ u: "https://sigmacv.org/guides?who=Jane&ref=whats-new?" }).u).toBe(
      "https://sigmacv.org/guides?ref=whats-new?",
    );
    expect(transform({ u: "https://sigmacv.org/guides?ref=whats-new?&who=Jane" }).u).toBe(
      "https://sigmacv.org/guides?ref=whats-new?",
    );
    // So this holds no `who` parameter at all (and the box cannot produce it).
    expect(transform({ u: "https://sigmacv.org/guides?utm_source=nl?who=Jane" }).u).toBe(
      "https://sigmacv.org/guides?utm_source=nl?who=Jane",
    );
    // What was odd before stays odd: nothing but `who` is touched.
    expect(transform({ u: "https://sigmacv.org/guides?a=1&&who=x&b=2" }).u).toBe(
      "https://sigmacv.org/guides?a=1&&b=2",
    );
    expect(transform({ u: "https://sigmacv.org/guides?a=1&&b=2&" }).u).toBe(
      "https://sigmacv.org/guides?a=1&&b=2&",
    );
    expect(transform({ u: "https://sigmacv.org/guides?" }).u).toBe("https://sigmacv.org/guides?");
    // With `who` gone and only empty segments left, no `?` is left hanging.
    expect(transform({ u: "https://sigmacv.org/guides?who=x&" }).u).toBe(
      "https://sigmacv.org/guides",
    );
    expect(transform({ u: "https://sigmacv.org/guides?&who=x#top" }).u).toBe(
      "https://sigmacv.org/guides#top",
    );
    expect(transform({ u: "https://sigmacv.org/guides?a=1&who=x&" }).u).toBe(
      "https://sigmacv.org/guides?a=1&",
    );
    // A typed value is percent-encoded by the browser; whatever it holds goes.
    expect(transform({ u: "https://sigmacv.org/guides?who=a%26b%3Dc%3Fd&ref=x" }).u).toBe(
      "https://sigmacv.org/guides?ref=x",
    );
    // Only the box's own field name: a browser writes it as `who`, never encoded,
    // and never without `=`. Hand-built look-alikes are left as they are.
    for (const url of [
      "https://sigmacv.org/guides?%77ho=Jane",
      "https://sigmacv.org/guides?WHO=Jane",
      "https://sigmacv.org/guides?who",
      "https://sigmacv.org/guides?x=who=1",
    ]) {
      expect(transform({ u: url }).u).toBe(url);
    }
  });

  it("takes `who` out first, then cuts an iD left anywhere else in the same address", () => {
    const transform = boot().o!.transformRequest!;
    // An iD typed into the box goes with the parameter, and leaves no `_` behind.
    expect(transform({ u: "https://sigmacv.org/guides/x?who=0000-0002-1825-0097" }).u).toBe(
      "https://sigmacv.org/guides/x",
    );
    // One in the path or in another parameter is cut, and the rest of the query
    // is put back as the `who` rule leaves it.
    expect(
      transform({
        u: "https://sigmacv.org/cv/0000-0002-1825-0097?utm_source=a&who=Jane%20Doe&id=0000-0002-1694-233X#top",
      }).u,
    ).toBe("https://sigmacv.org/cv/_?utm_source=a&id=_#top");
    // No `who` at all: the iD rule still runs on the address returned untouched.
    expect(transform({ u: "https://sigmacv.org/x?id=0000-0002-1825-0097&ref=a" }).u).toBe(
      "https://sigmacv.org/x?id=_&ref=a",
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
