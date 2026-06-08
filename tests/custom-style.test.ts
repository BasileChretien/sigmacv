import { afterEach, describe, expect, it, vi } from "vitest";
import { buildCanonicalCv } from "@/lib/canonical/build";
import {
  DEFAULT_STYLE,
  getStyleXml,
  isBundledStyle,
  listAvailableStyles,
  registerStyleXml,
} from "@/lib/citeproc/assets";
import { validateStyleXml } from "@/lib/citeproc/engine";
import { CustomStyleError, resolveCslStyle } from "@/lib/citeproc/customStyle";
import { CSL_STYLE_CATALOG } from "@/lib/citeproc/styleCatalog";
import { renderCvHtml } from "@/lib/render/html";
import type { ResolvedAuthor } from "@/lib/openalex/resolveAuthor";
import type { OpenAlexWork } from "@/lib/openalex/types";
import worksFixture from "./fixtures/openalex-works.json";

const hasApa = listAvailableStyles().includes("apa");

// A minimal but valid INDEPENDENT CSL style. Its bibliography emits a literal
// "MINISTYLE" marker so we can prove a render actually used it.
const MINI_XML = `<?xml version="1.0" encoding="utf-8"?>
<style xmlns="http://purl.org/net/xbiblio/csl" class="in-text" version="1.0" default-locale="en-US">
  <info><title>Mini Test Style</title><id>http://www.zotero.org/styles/mini-test</id></info>
  <citation><layout><text variable="title"/></layout></citation>
  <bibliography><layout><group delimiter=" "><text value="MINISTYLE"/><text variable="title"/></group></layout></bibliography>
</style>`;

// A DEPENDENT style that points at the mini style as its independent parent.
const DEP_XML = `<?xml version="1.0" encoding="utf-8"?>
<style xmlns="http://purl.org/net/xbiblio/csl" class="in-text" version="1.0" default-locale="en-US">
  <info><title>Dependent Test</title><id>http://www.zotero.org/styles/dependent-test</id>
  <link href="http://www.zotero.org/styles/mini-test" rel="independent-parent"/></info>
</style>`;

// A note-only style (no <bibliography>) — citeproc can't make a bibliography.
const NOTE_XML = `<?xml version="1.0" encoding="utf-8"?>
<style xmlns="http://purl.org/net/xbiblio/csl" class="note" version="1.0" default-locale="en-US">
  <info><title>Note Only</title><id>http://www.zotero.org/styles/note-only</id></info>
  <citation><layout><text variable="title"/></layout></citation>
</style>`;

function mockResponse(body: string, status = 200): Response {
  return {
    ok: status >= 200 && status < 300,
    status,
    headers: new Headers(),
    text: async () => body,
  } as unknown as Response;
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("CSL_STYLE_CATALOG", () => {
  it("is a non-empty list of unique ids, each with a title", () => {
    expect(CSL_STYLE_CATALOG.length).toBeGreaterThan(20);
    const ids = CSL_STYLE_CATALOG.map((s) => s.id);
    expect(new Set(ids).size).toBe(ids.length); // ids are unique
    expect(CSL_STYLE_CATALOG.every((s) => s.id.length > 0 && s.title.length > 0)).toBe(true);
    expect(ids).toContain("apa");
    expect(ids).toContain("nature-medicine");
  });
});

describe.skipIf(!hasApa)("validateStyleXml", () => {
  it("accepts a well-formed independent style", () => {
    expect(validateStyleXml(MINI_XML)).toEqual({ ok: true });
  });

  it("rejects malformed XML with a reason", () => {
    const v = validateStyleXml("<not-a-style>");
    expect(v.ok).toBe(false);
    if (!v.ok) expect(v.reason).toMatch(/citeproc rejected/i);
  });

  it("rejects a note-only style (no bibliography)", () => {
    const v = validateStyleXml(NOTE_XML);
    expect(v.ok).toBe(false);
    if (!v.ok) expect(v.reason).toMatch(/bibliography|note-only/i);
  });
});

describe("registerStyleXml / getStyleXml", () => {
  it("resolves a registered custom style by id", () => {
    registerStyleXml("zzz-unit-custom", MINI_XML);
    expect(getStyleXml("zzz-unit-custom")).toBe(MINI_XML);
  });

  it.skipIf(!hasApa)("never lets a custom style shadow a bundled one", () => {
    const before = getStyleXml("apa");
    registerStyleXml("apa", "<evil/>");
    const after = getStyleXml("apa");
    expect(after).toBe(before);
    expect(after).not.toBe("<evil/>");
    expect(after).toContain("purl.org/net/xbiblio/csl");
  });

  it("ignores a registration with an empty id or empty xml", () => {
    // No key (sanitises to "") or no body → no-op, nothing cached.
    registerStyleXml("", MINI_XML);
    registerStyleXml("!!!", MINI_XML); // sanitises to empty
    registerStyleXml("zzz-empty-body", "");
    expect(() => getStyleXml("zzz-empty-body")).not.toThrow();
    // An unregistered, non-bundled key falls back to the default style.
    expect(getStyleXml("zzz-empty-body")).toBe(getStyleXml(DEFAULT_STYLE));
  });

  it.skipIf(!hasApa)("falls back to the default style for an unknown key", () => {
    expect(getStyleXml("totally-unknown-style-xyz")).toBe(getStyleXml(DEFAULT_STYLE));
  });
});

describe.skipIf(!hasApa)("resolveCslStyle", () => {
  it("resolves a bare independent style id", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => mockResponse(MINI_XML)),
    );
    const style = await resolveCslStyle("mini-test");
    expect(style).toMatchObject({ id: "mini-test", title: "Mini Test Style" });
    expect(style.xml).toContain("MINISTYLE");
  });

  it("follows a dependent style to its independent parent", async () => {
    const fetchMock = vi.fn(async (url: URL | string) => {
      const u = url.toString();
      if (u.includes("dependent-test")) return mockResponse(DEP_XML);
      if (u.includes("mini-test")) return mockResponse(MINI_XML);
      return mockResponse("nope", 404);
    });
    vi.stubGlobal("fetch", fetchMock);
    const style = await resolveCslStyle("dependent-test");
    // Resolved to the PARENT's content + id.
    expect(style.id).toBe("mini-test");
    expect(style.xml).toContain("MINISTYLE");
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("rejects URLs outside the allowed style hosts (SSRF guard)", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    await expect(resolveCslStyle("https://evil.example.com/x.csl")).rejects.toBeInstanceOf(
      CustomStyleError,
    );
    expect(fetchMock).not.toHaveBeenCalled(); // rejected before any fetch
  });

  it("normalises a friendly name to a slug", async () => {
    const fetchMock = vi.fn(async (_url: URL | string) => mockResponse(MINI_XML));
    vi.stubGlobal("fetch", fetchMock);
    const style = await resolveCslStyle("Nature Medicine");
    // "Nature Medicine" → fetched as the slug "nature-medicine".
    expect(String(fetchMock.mock.calls[0]?.[0])).toContain("nature-medicine");
    expect(style.id).toBe("mini-test"); // from MINI_XML's <id>
  });

  it("rejects an input that normalises to an empty slug", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    await expect(resolveCslStyle("!!!")).rejects.toThrow(/citation style name, id, or URL/i);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("surfaces a 404 as a friendly error", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => mockResponse("", 404)),
    );
    await expect(resolveCslStyle("does-not-exist")).rejects.toThrow(/no style found/i);
  });

  it("rejects content that isn't a CSL style", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => mockResponse("<html></html>")),
    );
    await expect(resolveCslStyle("nature")).rejects.toThrow(/CSL style/i);
  });

  it("rejects a redirect to a disallowed host WITHOUT issuing the request to it (SSRF)", async () => {
    const headers = new Headers();
    headers.set("location", "http://169.254.169.254/latest/meta-data/");
    const redirect = {
      ok: false,
      status: 302,
      headers,
      text: async () => "",
    } as unknown as Response;
    const fetchMock = vi.fn(async () => redirect);
    vi.stubGlobal("fetch", fetchMock);
    await expect(resolveCslStyle("nature")).rejects.toThrow(/disallowed host/i);
    // The internal host was NEVER fetched — only the initial allow-listed request.
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("follows a redirect that stays on an allowed host", async () => {
    const headers = new Headers();
    headers.set("location", "https://www.zotero.org/styles/nature-medicine");
    const fetchMock = vi.fn(async (u: URL | string) => {
      return u.toString().endsWith("/styles/nature")
        ? ({ ok: false, status: 301, headers, text: async () => "" } as unknown as Response)
        : mockResponse(MINI_XML); // the redirect target serves the style
    });
    vi.stubGlobal("fetch", fetchMock);
    const style = await resolveCslStyle("nature");
    expect(style.id).toBe("mini-test");
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("rejects an endless redirect loop (hop limit)", async () => {
    const headers = new Headers();
    headers.set("location", "https://www.zotero.org/styles/loop");
    const fetchMock = vi.fn(
      async () =>
        ({ ok: false, status: 302, headers, text: async () => "" }) as unknown as Response,
    );
    vi.stubGlobal("fetch", fetchMock);
    await expect(resolveCslStyle("nature")).rejects.toThrow(/too many/i);
  });

  it("rejects a redirect to an unparseable Location", async () => {
    const headers = new Headers();
    headers.set("location", "https://exa mple.org/x"); // space → invalid URL
    const fetchMock = vi.fn(
      async () =>
        ({ ok: false, status: 302, headers, text: async () => "" }) as unknown as Response,
    );
    vi.stubGlobal("fetch", fetchMock);
    await expect(resolveCslStyle("nature")).rejects.toThrow(/invalid location/i);
  });

  it("rejects a note-only style via citeproc validation", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => mockResponse(NOTE_XML)),
    );
    await expect(resolveCslStyle("note-only")).rejects.toBeInstanceOf(CustomStyleError);
  });

  it("derives the id from the input when the style has no <id>", async () => {
    const noId = MINI_XML.replace(/<id>[\s\S]*?<\/id>/, "");
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => mockResponse(noId)),
    );
    const style = await resolveCslStyle("from-input-slug");
    expect(style.id).toBe("from-input-slug");
  });
});

describe("resolveCslStyle — error handling (no citeproc needed)", () => {
  it("reports a network failure", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => {
        throw new Error("boom");
      }),
    );
    await expect(resolveCslStyle("nature")).rejects.toThrow(/failed/i);
  });

  it("reports a timeout (aborted fetch)", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => {
        const err = new Error("aborted");
        err.name = "AbortError";
        throw err;
      }),
    );
    await expect(resolveCslStyle("nature")).rejects.toThrow(/timed out/i);
  });

  it("reports a non-404 server error", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => mockResponse("", 500)),
    );
    await expect(resolveCslStyle("nature")).rejects.toThrow(/returned 500/i);
  });

  it("rejects a too-large declared content-length", async () => {
    const res = {
      ok: true,
      status: 200,
      headers: new Headers({ "content-length": "700000" }),
      text: async () => "",
    } as unknown as Response;
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => res),
    );
    await expect(resolveCslStyle("nature")).rejects.toThrow(/too large/i);
  });

  it("rejects a too-large body", async () => {
    const big = "x".repeat(600_001);
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => mockResponse(big)),
    );
    await expect(resolveCslStyle("nature")).rejects.toThrow(/too large/i);
  });

  it("rejects an invalid input URL", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    await expect(resolveCslStyle("http://[")).rejects.toThrow(/valid URL/i);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("rejects a dependent style with a malformed parent URL", async () => {
    const dep = DEP_XML.replace("http://www.zotero.org/styles/mini-test", "::::");
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => mockResponse(dep)),
    );
    await expect(resolveCslStyle("dependent-test")).rejects.toThrow(/invalid parent/i);
  });

  it("rejects a dependent style whose parent is on a disallowed host", async () => {
    const dep = DEP_XML.replace(
      "http://www.zotero.org/styles/mini-test",
      "https://evil.example.com/parent",
    );
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => mockResponse(dep)),
    );
    await expect(resolveCslStyle("dependent-test")).rejects.toThrow(/Zotero\/CSL repository/i);
  });

  it("rejects when the parent doesn't resolve to a CSL style", async () => {
    const fetchMock = vi.fn(async (url: URL | string) => {
      const u = url.toString();
      if (u.includes("dependent-test")) return mockResponse(DEP_XML);
      return mockResponse("<html>not csl</html>"); // parent fetch
    });
    vi.stubGlobal("fetch", fetchMock);
    await expect(resolveCslStyle("dependent-test")).rejects.toThrow(/parent style/i);
  });
});

describe.skipIf(!hasApa)("rendering with a custom style", () => {
  const resolved: ResolvedAuthor = {
    orcid: "0000-0002-7483-2489",
    authorIds: ["A5001069481"],
    displayName: "Basile Chrétien",
  };
  const works = worksFixture as unknown as OpenAlexWork[];

  it("uses display.customStyle.xml when cslStyle matches its id", () => {
    const cv = buildCanonicalCv({
      id: "cs",
      resolved,
      works,
      now: "2026-06-02T00:00:00.000Z",
    });
    const html = renderCvHtml({
      ...cv,
      display: {
        ...cv.display,
        cslStyle: "mini-test-render",
        customStyle: {
          id: "mini-test-render",
          title: "Mini Test Style",
          xml: MINI_XML,
        },
      },
    });
    // The custom style's literal marker proves it was the style used.
    expect(html).toContain("MINISTYLE");
  });

  it("does NOT resolve a custom cslStyle id from the shared cache without a payload", () => {
    // Simulate another user having registered a custom style under this id.
    registerStyleXml("shared-id-render", MINI_XML);
    const cv = buildCanonicalCv({
      id: "cs2",
      resolved,
      works,
      now: "2026-06-02T00:00:00.000Z",
    });
    // This document references the id but carries NO customStyle payload — it must
    // fall back to the default bundled style, not the cross-user cached one.
    const html = renderCvHtml({
      ...cv,
      display: { ...cv.display, cslStyle: "shared-id-render" },
    });
    expect(html).not.toContain("MINISTYLE"); // the other user's style was NOT used
    expect(html).toContain("Publications"); // rendered fine with the default style
  });
});

describe.skipIf(!hasApa)("isBundledStyle", () => {
  it("is true for a vendored style, false for a custom/unknown id", () => {
    expect(isBundledStyle("apa")).toBe(true);
    expect(isBundledStyle("definitely-not-bundled-xyz")).toBe(false);
    expect(isBundledStyle("")).toBe(false);
  });
});
