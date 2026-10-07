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

  it("rewrites `/preview/` in a parameter's value too, with the parameters behind it", () => {
    const transform = boot().o!.transformRequest!;
    const sent = (u: string) => transform({ u }).u;
    // The rule is not tied to the path, and `&` does not end what it takes: the
    // campaign parameter goes. Held here so that it is changed on purpose.
    expect(sent("https://sigmacv.org/about?next=/preview/abc&utm_source=nl")).toBe(
      "https://sigmacv.org/about?next=/preview/_",
    );
    // What ends it is the next `/`, `?` or `#`, left where it stood.
    expect(sent("https://sigmacv.org/about?next=/preview/abc&a=1/b&c=2")).toBe(
      "https://sigmacv.org/about?next=/preview/_/b&c=2",
    );
    expect(sent("https://sigmacv.org/about?next=/preview/abc&a=1?b=2")).toBe(
      "https://sigmacv.org/about?next=/preview/_?b=2",
    );
    expect(sent("https://sigmacv.org/about?next=/preview/abc&a=1#top")).toBe(
      "https://sigmacv.org/about?next=/preview/_#top",
    );
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

  it("takes an X or x that ends a cut run with it, whatever follows the letter", () => {
    // It is the check character when the run is an iD's, and an iD that ends in
    // X can have a letter right behind it. Without its X that run is fifteen
    // digits, no iD, and is put back whole.
    expect(sentPath("/x/0000-0002-1694-233Xml")).toBe("/x/_ml");
    // So the letter goes whatever follows it, and an x that only happens to
    // follow an iD goes too, because it stands where that check character
    // would: `xml` is left as `ml`. Held here so that it is not tidied into
    // "leave the x when a letter follows": the iD above would go out whole.
    expect(sentPath("/x/0000-0002-1825-0097xml")).toBe("/x/_ml");
    expect(sentPath("/img/0000-0002-1825-0097x200.png")).toBe("/img/_200.png");
    // A run with no iD in it is put back whole, its x included.
    expect(sentPath("/x/1920x1080")).toBe("/x/1920x1080");
    // Nor into "an x only when nothing follows it": the first iD below would
    // then be fifteen digits, put back as they are, with its X behind them.
    expect(sentPath("/x/0000-0002-1694-233X0000-0002-1825-0097")).toBe("/x/__");
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

  /** Every way the table below joins an iD's groups, and what an iD separator is. */
  const SEPARATORS = /-|[+]|%2D|%20|%E2%80%9[0-5]|%E2%88%92/gi;
  const GROUPS = ["0000", "0002", "1825", "0097"];
  const TABLE_IDS = [GROUPS.join(""), "0000000151093700"];

  /**
   * Where the table puts an iD and what stands around it (`cell`): the address
   * `put` builds around it, and the field of the payload that address is sent in.
   */
  const POSITIONS: { where: string; field: "u" | "r"; put: (cell: string) => string }[] = [
    { where: "in a query value", field: "u", put: (cell) => `https://sigmacv.org/x?v=${cell}` },
    { where: "in a path segment", field: "u", put: (cell) => `https://sigmacv.org/x/${cell}` },
    { where: "as the first segment", field: "u", put: (cell) => `https://sigmacv.org/${cell}` },
    { where: "in a fragment", field: "u", put: (cell) => `https://sigmacv.org/x#${cell}` },
    { where: "in a referrer's path", field: "r", put: (cell) => `https://example.org/a/${cell}` },
    { where: "at the start of the address", field: "u", put: (cell) => cell },
  ];

  /** What the collector is sent for an address, in the field of the payload it is put in. */
  function sender(field: "u" | "r"): (address: string) => string {
    const transform = boot().o!.transformRequest!;
    return (address) =>
      transform(field === "r" ? { u: "https://sigmacv.org/", r: address } : { u: address })[field]!;
  }

  /** What stands in front of an iD x how it is spelled x what stands behind: 588 addresses. */
  function addressTable(put: (cell: string) => string): string[] {
    const spellings = ["-", "", "%2D", "%E2%80%93", "%E2%88%92", "%20", "+"].map((separator) =>
      GROUPS.join(separator),
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
    const table: string[] = [];
    for (const b of before) {
      for (const spelling of spellings) {
        for (const a of after) table.push(put(`${b}${spelling}${a}`));
      }
    }
    return table;
  }

  /** The longest stretch of an iD's digits, in order, that can still be read in `sent`. */
  function readable(sent: string): number {
    const digits = sent.replace(SEPARATORS, "");
    let longest = 0;
    for (const iD of TABLE_IDS) {
      for (let i = 0; i < iD.length; i++) {
        for (let j = iD.length; j > i + longest; j--) {
          if (digits.includes(iD.slice(i, j))) {
            longest = j - i;
            break;
          }
        }
      }
    }
    return longest;
  }

  it.each(POSITIONS)(
    "leaves no two digits of an iD in a row $where, whatever stands around it and however it is spelled",
    ({ field, put }) => {
      const sent = sender(field);
      const table = addressTable(put);
      expect(table).toHaveLength(588);
      // Two, not one: a single digit can be the table's own (the `1` of `&a=1`
      // behind the iD, the `2` and the `0` of `%C2%A0` in front), and an iD has
      // those digits too.
      expect(table.filter((row) => readable(sent(row)) >= 2)).toEqual([]);
    },
  );

  it.each(POSITIONS)(
    "never leaves more of an iD $where than the rule it replaces did",
    ({ field, put }) => {
      // That rule, as it stood: the leftmost sixteen digits shaped like an iD, and
      // on from there. Nothing else in the stub touches the table's addresses.
      const sent = sender(field);
      const d = "(?:-|[+]|%2D|%20|%E2%80%9[0-5])?";
      const replaced = new RegExp(`[0-9]{4}${d}[0-9]{4}${d}[0-9]{4}${d}[0-9]{3}[0-9X]`, "gi");
      const worse: string[] = [];
      let itLeftSomething = 0;
      for (const row of addressTable(put)) {
        const then = readable(row.replace(replaced, "_"));
        if (then >= 4) itLeftSomething++;
        if (readable(sent(row)) > then) worse.push(row);
      }
      expect(worse).toEqual([]);
      // The comparison means something only if the old rule did leave digits.
      expect(itLeftSomething).toBeGreaterThan(100);
    },
  );

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
    // Not the lookup: a longer word that starts the same way keeps its path.
    expect(transform({ u: "https://sigmacv.org/searching/for/x" }).u).toBe(
      "https://sigmacv.org/searching/for/x",
    );
  });

  it("leaves `/search/` as it is, wherever it stands: the rule needs `/search?`", () => {
    const transform = boot().o!.transformRequest!;
    // `/search/` inside a parameter's value is not the lookup, and Plausible
    // reads `utm_*`, `ref` and `source` off this same query. (A rule that cut a
    // path under /search was tried: it took these parameters with it.)
    for (const u of [
      "https://sigmacv.org/about?next=/search/&utm_source=nl&utm_campaign=x",
      "https://sigmacv.org/guides/how-to-write-an-academic-cv?ref=reddit.com/r/AskAcademia/search/&utm_medium=social&utm_source=reddit",
      "https://sigmacv.org/about?ref=https://example.org/search/abc&utm_source=nl",
      "https://sigmacv.org/about#/search/Jane",
      // A known limit, held here so that it is changed on purpose: a name written
      // as a path is a 404, and a 404 is sent with its path as typed.
      "https://sigmacv.org/search/Jane%20Doe",
    ]) {
      expect(transform({ u }).u, u).toBe(u);
    }
    expect(transform({ u: "https://sigmacv.org/", r: "https://example.org/search/x/y" }).r).toBe(
      "https://example.org/search/x/y",
    );
  });

  it("cuts from `/search?` wherever it stands, a parameter's value included, up to the `#`", () => {
    const transform = boot().o!.transformRequest!;
    // The rule is not tied to the lookup's own address. In a value, the campaign
    // parameters behind it go with the rest: a cost, held here so that it is
    // changed on purpose.
    expect(
      transform({ u: "https://sigmacv.org/about?next=/search?&utm_source=nl&utm_campaign=x" }).u,
    ).toBe("https://sigmacv.org/about?next=/search");
    // What the same reach is kept for: a lookup address that another address
    // carries unencoded loses the name. What stands in front of it stays, and
    // so does the fragment.
    expect(
      transform({
        u: "https://sigmacv.org/about?utm_source=nl&callbackUrl=/search?q=Jane%20Doe#top",
      }).u,
    ).toBe("https://sigmacv.org/about?utm_source=nl&callbackUrl=/search#top");
  });

  it("cuts at the first `/search?` only, and only at one written unencoded", () => {
    const transform = boot().o!.transformRequest!;
    // Two known limits, held here so that they are changed on purpose. A lookup
    // address percent-encoded into a parameter is not seen: it is sent as it
    // is, name included.
    const encoded = "https://sigmacv.org/about?next=%2Fsearch%3Fq%3DJane%20Doe&utm_source=nl";
    expect(transform({ u: encoded }).u).toBe(encoded);
    // And of two, the second stays. It can only stand behind the `#` that ends
    // the first cut.
    expect(transform({ u: "https://sigmacv.org/search?q=Jane#/search?q=John" }).u).toBe(
      "https://sigmacv.org/search#/search?q=John",
    );
  });

  it("finds the lookup's query past a host or a segment that only starts like it", () => {
    const transform = boot().o!.transformRequest!;
    const referred = (r: string) => transform({ u: "https://sigmacv.org/", r }).r;
    // `//search.` in a search engine's own host is not `/search?`: the rule has
    // to reach the real one, or the query stays in the referrer.
    expect(referred("https://search.brave.com/search?q=jane+doe&source=web")).toBe(
      "https://search.brave.com/search",
    );
    expect(referred("https://search.yahoo.co.jp/search?p=Jane+Doe")).toBe(
      "https://search.yahoo.co.jp/search",
    );
    expect(referred("http://search/search?q=Jane+Doe")).toBe("http://search/search");
    expect(transform({ u: "https://sigmacv.org/searching/search?q=Jane%20Doe" }).u).toBe(
      "https://sigmacv.org/searching/search",
    );
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
    // With `who` gone, a query left empty goes with its `?`: no lone `?` is left
    // behind. One empty segment beside `who` is an empty query…
    expect(transform({ u: "https://sigmacv.org/guides?who=x&" }).u).toBe(
      "https://sigmacv.org/guides",
    );
    expect(transform({ u: "https://sigmacv.org/guides?&who=x#top" }).u).toBe(
      "https://sigmacv.org/guides#top",
    );
    // …and beside another parameter it stays where it was.
    expect(transform({ u: "https://sigmacv.org/guides?a=1&who=x&" }).u).toBe(
      "https://sigmacv.org/guides?a=1&",
    );
    // Two empty segments are not an empty query: they stay as they stood in the
    // address, with the `&` between them, so `?who=x&&` is sent as `?&`. Held
    // here so that it is tidied on purpose.
    expect(transform({ u: "https://sigmacv.org/guides?who=x&&" }).u).toBe(
      "https://sigmacv.org/guides?&",
    );
    expect(transform({ u: "https://sigmacv.org/guides?&&who=x" }).u).toBe(
      "https://sigmacv.org/guides?&",
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
