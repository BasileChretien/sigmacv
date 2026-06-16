import Link from "next/link";
import DocJsonLd from "@/components/DocJsonLd";
import { type GlossaryTerm, listTerms } from "@/lib/glossary/glossary";
import { definedTermSetJsonLd, glossaryIndexBreadcrumbJsonLd } from "@/lib/glossary/jsonLd";
import { localeLanguageCode } from "@/lib/i18n";
import { guidesChrome } from "@/lib/i18n/guidesChrome";
import { localeGlossaryIndexPath, localeGlossaryTermPath, localeHomePath } from "@/lib/seo";
import SiteFooter from "./SiteFooter";
import SiteHeader from "./SiteHeader";

/**
 * The /glossary index — a localized hub listing every term, with a WebPage +
 * BreadcrumbList + DefinedTermSet for discovery and entity coverage.
 */
export default function GlossaryIndex({ locale = "en-US" }: { locale?: string }) {
  const chrome = guidesChrome(locale);
  const terms: GlossaryTerm[] = listTerms(locale);
  return (
    <div className="site-shell" lang={localeLanguageCode(locale)}>
      <SiteHeader locale={locale} />
      <main className="doc-page" id="site-main">
        <DocJsonLd
          path={localeGlossaryIndexPath(locale)}
          name={chrome.glossaryIndexTitle}
          description={chrome.glossaryIndexDescription}
          locale={locale}
        />
        <script
          type="application/ld+json"
          // Server-rendered from static, non-user data — safe to inline.
          dangerouslySetInnerHTML={{ __html: glossaryIndexBreadcrumbJsonLd(locale) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: definedTermSetJsonLd(terms, locale) }}
        />

        <nav className="breadcrumbs" aria-label="Breadcrumb">
          <Link href="/">SigmaCV</Link> <span aria-hidden="true">›</span>{" "}
          {chrome.glossaryIndexTitle}
        </nav>

        <h1>{chrome.glossaryIndexTitle}</h1>
        <p className="doc-lede">{chrome.glossaryIndexDescription}</p>

        <ul className="guide-list">
          {terms.map((t) => (
            <li key={t.slug} className="guide-list-item card">
              <h2 className="guide-list-title">
                <Link href={localeGlossaryTermPath(t.slug, locale)}>{t.term}</Link>
              </h2>
              <p className="guide-list-desc muted">{t.short}</p>
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
