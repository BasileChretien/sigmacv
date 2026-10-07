"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { localeForPathname } from "@/lib/i18n";
import { NOT_FOUND_DOCUMENT_TITLE, notFoundStrings } from "@/lib/i18n/notFound";
import { localeHomePath } from "@/lib/seo";

/**
 * The 404 page body (`src/app/not-found.tsx` says why it is a client component
 * and why it is this small).
 *
 * Its language is the one the address is written under: the first segment when
 * that is a locale slug (`/fr/…`), English otherwise. An unknown path has no
 * params to say more, and the address is all a 404 has. `lang` is set on the
 * subtree, as on the other pages, since the single root <html> stays en.
 *
 * Not the shared SiteHeader/SiteFooter: they are server components that need
 * the locale on the server, and as client code they would ship every page's
 * strings in ten languages. The brand and the link lead home, where the full
 * navigation is. Neither is prefetched: a 404 should cost the server one render.
 *
 * No theme switch either. When a page calls `notFound()`, Next sends an empty
 * body and renders the document in the browser, where the root layout's inline
 * theme bootstrap does not run: the page follows the system setting (the CSS
 * fallback), and a switch would highlight a choice that is not applied.
 */
export default function NotFound() {
  const loc = localeForPathname(usePathname());
  const s = notFoundStrings(loc);
  const home = localeHomePath(loc);
  return (
    <div className="site-shell" lang={loc}>
      {/* The route's metadata gives the 404 its title. When a page calls
          `notFound()` that title is in the HTML Next sends, but once the browser
          has rendered the document the tab shows the page's own again (seen on
          `/foo`, Next 16.3.6). Next's built-in 404 renders a <title> as well. */}
      <title>{NOT_FOUND_DOCUMENT_TITLE}</title>
      <header className="site-header">
        <Link href={home} prefetch={false} className="site-brand" aria-label="SigmaCV — home">
          <span className="site-brand-mark" aria-hidden="true">
            Σ
          </span>
          SigmaCV
        </Link>
      </header>
      <main className="doc-page" id="site-main">
        <h1>{s.title}</h1>
        <p>{s.body}</p>
        <p className="doc-back muted">
          <Link href={home} prefetch={false}>
            {s.backLink}
          </Link>
        </p>
      </main>
    </div>
  );
}
