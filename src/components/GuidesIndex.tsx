import Link from "next/link";
import DocJsonLd from "@/components/DocJsonLd";
import { type Guide, guideReadingMinutes, listGuides } from "@/lib/guides/guides";
import { guidesIndexBreadcrumbJsonLd, guidesItemListJsonLd } from "@/lib/guides/jsonLd";
import { localeLanguageCode } from "@/lib/i18n";
import { guidesChrome } from "@/lib/i18n/guidesChrome";
import { localeGuidePath, localeGuidesIndexPath, localeHomePath } from "@/lib/seo";
import SiteFooter from "./SiteFooter";
import SiteHeader from "./SiteHeader";

/**
 * The /guides index — a localized hub listing the cornerstone guides. Emits a
 * WebPage (DocJsonLd) + BreadcrumbList + ItemList for discovery, and links to
 * each guide and back to the homepage.
 */
function formatDate(iso: string, locale: string): string {
  return new Date(`${iso}T00:00:00Z`).toLocaleDateString(locale, {
    year: "numeric",
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  });
}

export default function GuidesIndex({ locale = "en-US" }: { locale?: string }) {
  const chrome = guidesChrome(locale);
  const guides: Guide[] = listGuides(locale);
  return (
    <div className="site-shell" lang={localeLanguageCode(locale)}>
      <SiteHeader locale={locale} />
      <main className="doc-page" id="site-main">
        <DocJsonLd
          path={localeGuidesIndexPath(locale)}
          name={chrome.guidesIndexTitle}
          description={chrome.guidesIndexDescription}
          locale={locale}
        />
        <script
          type="application/ld+json"
          // Server-rendered from static, non-user data — safe to inline.
          dangerouslySetInnerHTML={{ __html: guidesIndexBreadcrumbJsonLd(locale) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: guidesItemListJsonLd(guides, locale) }}
        />

        <nav className="breadcrumbs" aria-label="Breadcrumb">
          <Link href="/">SigmaCV</Link> <span aria-hidden="true">›</span> {chrome.guidesIndexTitle}
        </nav>

        <h1>{chrome.guidesIndexTitle}</h1>
        <p className="doc-lede">{chrome.guidesIndexDescription}</p>

        <ul className="guide-list">
          {guides.map((g) => (
            <li key={g.slug} className="guide-list-item card">
              <h2 className="guide-list-title">
                <Link href={localeGuidePath(g.slug, locale)}>{g.title}</Link>
              </h2>
              <p className="guide-list-desc muted">{g.description}</p>
              <p className="guide-list-meta muted">
                <time dateTime={g.datePublished}>{formatDate(g.datePublished, locale)}</time> ·{" "}
                {guideReadingMinutes(g)} {chrome.minRead}
              </p>
            </li>
          ))}
        </ul>

        <p className="doc-back muted">
          <Link href={localeHomePath(locale)}>← {chrome.backToHome}</Link>
        </p>
      </main>
      <SiteFooter locale={locale} />
    </div>
  );
}
