import { createHash } from "node:crypto";
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { logger } from "@/lib/log";
import {
  createPrerenderedScriptLookup,
  inlineScriptHashes,
} from "@/lib/security/prerenderedScripts";

const sha256 = (text: string): string => createHash("sha256").update(text, "utf8").digest("base64");

/** The bootstrap Next puts first on every App Router page. */
const NEXT_BOOTSTRAP = "(self.__next_f=self.__next_f||[]).push([0])";

describe("inlineScriptHashes", () => {
  it("matches a hash a browser accepted", () => {
    // Read off a production build's CSP header on 2026-10-07: Chromium ran the
    // bootstrap under it, so this is what a browser computes for that text.
    expect(inlineScriptHashes(`<script>${NEXT_BOOTSTRAP}</script>`)).toEqual([
      "OBTN3RiyCV4Bq7dFqZ5a2pAXjnCcCYeTJMO2I/LYKeo=",
    ]);
  });

  it("hashes each inline script, in document order", () => {
    const html = `<html><body><script>var a=1</script><p>x</p><script>self.__next_f.push([1,"é"])</script></body></html>`;
    expect(inlineScriptHashes(html)).toEqual([
      sha256("var a=1"),
      sha256('self.__next_f.push([1,"é"])'),
    ]);
  });

  it("skips what CSP never hashes: external scripts, data blocks, empty elements", () => {
    const html = [
      `<script src="/_next/static/chunks/a.js" async=""></script>`,
      `<script async="" src="/_next/static/chunks/b.js" id="_R_"></script>`,
      `<script type="application/ld+json">{"@type":"WebPage"}</script>`,
      `<script type="application/json">{"a":1}</script>`,
      `<script></script>`,
      `<script type="module">import("/x.js")</script>`,
      `<script type="text/javascript">var b=2</script>`,
    ].join("");
    expect(inlineScriptHashes(html)).toEqual([sha256('import("/x.js")'), sha256("var b=2")]);
  });

  it("lists a script that appears twice once", () => {
    expect(inlineScriptHashes("<script>a()</script><script>a()</script>")).toEqual([sha256("a()")]);
  });

  it("hashes the text as the parser hands it to the browser: newlines normalised to LF", () => {
    expect(inlineScriptHashes("<script>a()\r\nb()\rc()</script>")).toEqual([
      sha256("a()\nb()\nc()"),
    ]);
  });

  it("is not thrown off by `>` inside an attribute value, or by tag case", () => {
    expect(inlineScriptHashes(`<SCRIPT data-x="a>b" data-y='c>d'>run()</SCRIPT >`)).toEqual([
      sha256("run()"),
    ]);
  });

  it("ends a script where the browser does: at any `</script` end tag", () => {
    // A browser closes the element at each of these, so each is its own script.
    // Missing one would hash two scripts as one text that never runs.
    const html = [
      "<script>a()</script\t\n bar>",
      "<script>b()</script/>",
      `<script>c()</script data-x="1>2">`,
      "<script>d()</script>",
    ].join("<p>between</p>");
    expect(inlineScriptHashes(html)).toEqual([
      sha256("a()"),
      sha256("b()"),
      sha256("c()"),
      sha256("d()"),
    ]);
  });

  it("does not take a longer tag name for a script", () => {
    // `</scripts>` does not close a script, so it is part of the text.
    expect(inlineScriptHashes("<script>a('</scripts>')</script>")).toEqual([
      sha256("a('</scripts>')"),
    ]);
    // A custom element is not a script at all.
    expect(inlineScriptHashes("<script-loader>b()</script-loader>")).toEqual([]);
    expect(inlineScriptHashes("<scripted>c()</scripted>")).toEqual([]);
  });

  it("reads a start tag written with a trailing slash", () => {
    expect(inlineScriptHashes("<script/>e()</script>")).toEqual([sha256("e()")]);
  });

  it("returns nothing for a page without scripts", () => {
    expect(inlineScriptHashes("<html><body><p>hello</p></body></html>")).toEqual([]);
  });
});

describe("createPrerenderedScriptLookup", () => {
  let root: string;
  let distDir: string;
  let logError: ReturnType<typeof vi.spyOn>;

  function writePage(route: string, html: string): void {
    const file = path.join(distDir, "server", "app", `${route}.html`);
    mkdirSync(path.dirname(file), { recursive: true });
    writeFileSync(file, html);
  }

  function writeManifest(routes: unknown): void {
    writeFileSync(path.join(distDir, "prerender-manifest.json"), JSON.stringify({ routes }));
  }

  beforeEach(() => {
    root = mkdtempSync(path.join(tmpdir(), "sigmacv-csp-"));
    distDir = path.join(root, ".next");
    mkdirSync(distDir);
    logError = vi.spyOn(logger, "error").mockImplementation(() => {});

    // `srcRoute` is the route file a page was built from, as Next writes it.
    writeManifest({
      "/": { initialRevalidateSeconds: false, srcRoute: "/" },
      "/about": { initialRevalidateSeconds: false, srcRoute: "/about" },
      "/fr/about": { initialRevalidateSeconds: false, srcRoute: "/[locale]/about" },
      "/guides/how-to": { initialRevalidateSeconds: false, srcRoute: "/guides/[slug]" },
      "/fr/guides/how-to": {
        initialRevalidateSeconds: false,
        srcRoute: "/[locale]/guides/[slug]",
      },
      "/legacy": { initialRevalidateSeconds: false },
      "/revalidated": { initialRevalidateSeconds: 60, srcRoute: "/revalidated" },
      "/robots.txt": { initialRevalidateSeconds: false, srcRoute: "/robots.txt" },
      "/broken": { initialRevalidateSeconds: false, srcRoute: "/broken" },
      "/nothing": null,
    });
    writePage("index", "<script>home()</script>");
    writePage("about", `<script src="/a.js"></script><script>about()</script>`);
    writePage("fr/about", "<script>apropos()</script>");
    writePage("guides/how-to", "<script>guide()</script>");
    writePage("fr/guides/how-to", "<script>guideFr()</script>");
    writePage("legacy", "<script>legacy()</script>");
    writePage("revalidated", "<script>later()</script>");
    // A directory where the page should be: unreadable, and not merely absent.
    mkdirSync(path.join(distDir, "server", "app", "broken.html"));
    // Outside `server/app`, where `..` segments would land: nothing may read these.
    writeFileSync(path.join(distDir, "secret.html"), "<script>secret()</script>");
    writeFileSync(path.join(root, "secret.html"), "<script>secret()</script>");
  });

  afterEach(() => {
    logError.mockRestore();
    rmSync(root, { recursive: true, force: true });
  });

  it("returns the inline-script hashes of a prerendered page", () => {
    const lookup = createPrerenderedScriptLookup(distDir);
    expect(lookup("/about")).toEqual([sha256("about()")]);
    expect(lookup("/fr/about")).toEqual([sha256("apropos()")]);
    expect(lookup("/")).toEqual([sha256("home()")]);
    expect(logError).not.toHaveBeenCalled();
  });

  it("returns null for a route that is not prerendered", () => {
    const lookup = createPrerenderedScriptLookup(distDir);
    expect(lookup("/cv")).toBeNull();
    expect(lookup("/about/")).toBeNull();
    expect(lookup("/nothing")).toBeNull();
  });

  it("returns null for a page revalidated at runtime: its HTML will change", () => {
    expect(createPrerenderedScriptLookup(distDir)("/revalidated")).toBeNull();
  });

  it("returns null, quietly, for a prerendered route that is not a page", () => {
    expect(createPrerenderedScriptLookup(distDir)("/robots.txt")).toBeNull();
    expect(logError).not.toHaveBeenCalled();
  });

  // What Next 16.3.8 does, observed on a production build: a segment it reads as
  // a parameter is percent-decoded before the prerendered page is looked up, and
  // a fixed segment has to be written as it is (`/%61bout` is a 404).
  it("counts a percent-encoded spelling only in a segment Next fills from a parameter", () => {
    const lookup = createPrerenderedScriptLookup(distDir);
    expect(lookup("/guides/how%2Dto")).toEqual([sha256("guide()")]);
    expect(lookup("/%66r/about")).toEqual([sha256("apropos()")]);
    expect(lookup("/%66r/guides/h%6Fw-to")).toEqual([sha256("guideFr()")]);
    // The same page as the plain spelling, read once.
    expect(lookup("/guides/how%2Dto")).toBe(lookup("/guides/how-to"));

    // A fixed segment, encoded: not the prerendered page.
    expect(lookup("/%61bout")).toBeNull();
    expect(lookup("/fr/%61bout")).toBeNull();
    expect(lookup("/%67uides/how-to")).toBeNull();
    expect(lookup("/fr/%67uides/how-to")).toBeNull();
    expect(lookup("/%2F")).toBeNull();
  });

  it("decodes a parameter once, and never into another path", () => {
    const lookup = createPrerenderedScriptLookup(distDir);
    // `%252D` is the text `%2D`, not a hyphen.
    expect(lookup("/guides/how%252Dto")).toBeNull();
    // A slash out of an escape would name another route, or add a segment.
    expect(lookup("/guides%2Fhow-to")).toBeNull();
    expect(lookup("/fr%2Fguides/how-to")).toBeNull();
    expect(lookup("/guides/how-to%2F")).toBeNull();
    // Malformed escapes are refused, not thrown on.
    expect(lookup("/%E0%A4%A")).toBeNull();
    expect(lookup("/guides/%E0%A4%A")).toBeNull();
    expect(lookup("/guides/%")).toBeNull();
    expect(logError).not.toHaveBeenCalled();
  });

  it("takes only the exact path when the manifest does not say which route built the page", () => {
    const lookup = createPrerenderedScriptLookup(distDir);
    expect(lookup("/legacy")).toEqual([sha256("legacy()")]);
    expect(lookup("/%6Cegacy")).toBeNull();
  });

  it("cannot be steered outside the build by the request path", () => {
    const lookup = createPrerenderedScriptLookup(distDir);
    // The first two would resolve to `<distDir>/secret.html`, the third to
    // `<root>/secret.html`, were the path joined without the manifest check.
    for (const pathname of [
      "/../../secret",
      "/about/../../../secret",
      "/../../../secret",
      "/..%2F..%2Fsecret",
      "/%2E%2E/%2E%2E/secret",
      "\\..\\..\\secret",
    ]) {
      expect(lookup(pathname)).toBeNull();
    }
    expect(logError).not.toHaveBeenCalled();
  });

  it("reads the manifest and each page once", () => {
    const lookup = createPrerenderedScriptLookup(distDir);
    const first = lookup("/about");
    expect(lookup("/robots.txt")).toBeNull();
    rmSync(distDir, { recursive: true, force: true });
    expect(lookup("/about")).toBe(first);
    // "No HTML for this route" is kept too: it would not have changed.
    writePage("robots.txt", "<script>late()</script>");
    expect(lookup("/robots.txt")).toBeNull();
  });

  it("logs once, and returns null, while a prerendered page cannot be read", () => {
    const lookup = createPrerenderedScriptLookup(distDir);
    expect(lookup("/broken")).toBeNull();
    expect(lookup("/broken")).toBeNull();
    expect(logError).toHaveBeenCalledTimes(1);
    expect(logError).toHaveBeenCalledWith(
      "csp.prerendered_page_unreadable",
      expect.objectContaining({ route: "/broken" }),
    );
  });

  it("tries an unreadable page again: a failure is not kept", () => {
    const lookup = createPrerenderedScriptLookup(distDir);
    expect(lookup("/broken")).toBeNull();
    rmSync(path.join(distDir, "server", "app", "broken.html"), { recursive: true });
    writePage("broken", "<script>mended()</script>");
    expect(lookup("/broken")).toEqual([sha256("mended()")]);
  });

  it("fails closed, logging once, while there is no manifest", () => {
    const lookup = createPrerenderedScriptLookup(path.join(root, "no-build-here"));
    expect(lookup("/about")).toBeNull();
    expect(lookup("/fr/about")).toBeNull();
    expect(logError).toHaveBeenCalledTimes(1);
    expect(logError).toHaveBeenCalledWith("csp.prerender_manifest_unreadable", expect.anything());
  });

  it("tries an unreadable manifest again: a failure is not kept", () => {
    const manifest = path.join(distDir, "prerender-manifest.json");
    const good = readFileSync(manifest, "utf8");
    writeFileSync(manifest, good.slice(0, 20)); // caught half-written
    const lookup = createPrerenderedScriptLookup(distDir);
    expect(lookup("/about")).toBeNull();
    writeFileSync(manifest, good);
    expect(lookup("/about")).toEqual([sha256("about()")]);
    expect(logError).toHaveBeenCalledTimes(1);
  });

  it("fails closed on a manifest that is not what Next writes", () => {
    for (const content of ["{ not json", "null", "{}", JSON.stringify({ routes: "nope" })]) {
      writeFileSync(path.join(distDir, "prerender-manifest.json"), content);
      expect(createPrerenderedScriptLookup(distDir)("/about")).toBeNull();
    }
    expect(logError).toHaveBeenCalledTimes(4);
  });
});
