import { describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { SUPPORTED_LOCALES } from "@/lib/i18n";
import { NOT_FOUND_DOCUMENT_TITLE, notFoundStrings } from "@/lib/i18n/notFound";
import { withdrawnStrings } from "@/lib/i18n/withdrawn";

const mocks = vi.hoisted(() => ({ pathname: "/" as string | null }));
vi.mock("next/navigation", () => ({ usePathname: () => mocks.pathname }));

import NotFoundPage, { dynamic, metadata } from "@/app/not-found";
import * as notFoundRoute from "@/app/not-found";
import NotFound from "@/components/NotFound";

function renderAt(pathname: string | null): string {
  mocks.pathname = pathname;
  return renderToStaticMarkup(<NotFound />);
}

describe("notFoundStrings", () => {
  it("has every field non-empty for all 10 locales and falls back to English", () => {
    expect(SUPPORTED_LOCALES).toHaveLength(10);
    for (const loc of SUPPORTED_LOCALES) {
      for (const [key, value] of Object.entries(notFoundStrings(loc))) {
        expect(value.length, `${loc}.${key}`).toBeGreaterThan(0);
      }
    }
    expect(notFoundStrings("xx-XX")).toEqual(notFoundStrings("en-US"));
  });

  it("names the status code, and actually translates non-English locales", () => {
    const en = notFoundStrings("en-US");
    for (const loc of SUPPORTED_LOCALES) {
      const s = notFoundStrings(loc);
      expect(s.body, loc).toContain("404");
      if (loc === "en-US") continue;
      expect(s.title, loc).not.toBe(en.title);
      expect(s.body, loc).not.toBe(en.body);
    }
  });

  it("words the link home as the tombstone page does", () => {
    for (const loc of SUPPORTED_LOCALES) {
      expect(notFoundStrings(loc).backLink, loc).toBe(withdrawnStrings(loc).backLink);
    }
  });
});

describe("the 404 page", () => {
  it("is rendered per request: a prerendered 404 carries no nonce, so no script of it runs", () => {
    expect(dynamic).toBe("force-dynamic");
  });

  it("never reads the request: Next renders it into every page, and they would all turn dynamic", () => {
    // Synchronous, no generateMetadata: nothing in the route file can await
    // headers(), cookies() or connection(). `npm run e2e:prod` checks the
    // outcome on a build (prerendered pages are still served as files).
    expect(Object.keys(notFoundRoute).sort()).toEqual(["default", "dynamic", "metadata"]);
    expect(NotFoundPage()).not.toBeInstanceOf(Promise);
  });

  it("has one tab title, in no language: the address is not known where the route sets it", () => {
    expect(metadata.title).toEqual({ absolute: NOT_FOUND_DOCUMENT_TITLE });
    // The page repeats it: Next drops the route's title when a page calls notFound().
    for (const pathname of ["/a/b", "/fr/a/b"]) {
      expect(renderAt(pathname)).toContain(`<title>${NOT_FOUND_DOCUMENT_TITLE}</title>`);
    }
  });

  it("takes its language from the first segment of the address", () => {
    const html = renderAt("/ja/guides/no-such-guide");
    expect(html).toContain('lang="ja-JP"');
    expect(html).toContain(`<h1>${notFoundStrings("ja-JP").title}</h1>`);
    expect(html).toContain(notFoundStrings("ja-JP").body);
    // The brand and the link both lead to that language's home page.
    expect(html.match(/href="\/ja"/g)).toHaveLength(2);
  });

  it("is in English for an address under no locale", () => {
    for (const pathname of ["/a/b", "/french/guides", "/FR/guides", "/", null]) {
      const html = renderAt(pathname);
      expect(html, String(pathname)).toContain('lang="en-US"');
      expect(html, String(pathname)).toContain(`<h1>${notFoundStrings("en-US").title}</h1>`);
      expect(html.match(/href="\/"/g), String(pathname)).toHaveLength(2);
    }
  });

  it("never echoes the address it was asked for", () => {
    const html = renderAt('/fr/"><script>alert(1)</script>');
    expect(html).not.toContain("alert(1)");
    expect(html).toContain(`<h1>${notFoundStrings("fr-FR").title}</h1>`);
  });
});
