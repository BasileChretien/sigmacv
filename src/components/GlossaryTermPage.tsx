import Link from "next/link";
import { faqPageJsonLd } from "@/lib/faqJsonLd";
import { type GlossaryTerm, getTerm } from "@/lib/glossary/glossary";
import { definedTermJsonLd, glossaryTermBreadcrumbJsonLd } from "@/lib/glossary/jsonLd";
import { getGuide } from "@/lib/guides/guides";
import { localeLanguageCode } from "@/lib/i18n";
import { guidesChrome } from "@/lib/i18n/guidesChrome";
import { glossaryNavLabel } from "@/lib/i18n/guidesNav";
import { landingPageStrings } from "@/lib/i18n/landingPages";
import {
  localeGlossaryIndexPath,
  localeGlossaryTermPath,
  localeGuidePath,
  localeLandingPagePath,
} from "@/lib/seo";
import { renderContentBlock } from "./contentBlocks";

/**
 * Renders one glossary term in `locale` with the `doc-page` chrome. Emits
 * DefinedTerm + BreadcrumbList + (optional) FAQPage JSON-LD, a one-line
 * definition lede, the structured body, and hub-and-spoke links to related
 * terms, guides and landing pages.
 */
export default function GlossaryTermPage({
  term,
  locale = "en-US",
}: {
  term: GlossaryTerm;
  locale?: string;
}) {
  const chrome = guidesChrome(locale);
  const relatedTerms = (term.relatedTerms ?? [])
    .map((slug) => getTerm(slug, locale))
    .filter((t): t is GlossaryTerm => Boolean(t));
  const relatedGuides = (term.relatedGuides ?? [])
    .map((slug) => getGuide(slug, locale))
    .filter((g): g is NonNullable<ReturnType<typeof getGuide>> => Boolean(g));
  const relatedPages = term.relatedPages ?? [];
  const hasRelated = relatedTerms.length + relatedGuides.length + relatedPages.length > 0;

  return (
    <main className="doc-page" lang={localeLanguageCode(locale)}>
      <script
        type="application/ld+json"
        // Server-rendered from static, non-user data — safe to inline.
        dangerouslySetInnerHTML={{ __html: definedTermJsonLd(term, locale) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: glossaryTermBreadcrumbJsonLd(term, locale) }}
      />
      {term.faq ? <div dangerouslySetInnerHTML={{ __html: faqPageJsonLd(term.faq) }} /> : null}

      <nav className="breadcrumbs" aria-label="Breadcrumb">
        <Link href="/">SigmaCV</Link> <span aria-hidden="true">›</span>{" "}
        <Link href={localeGlossaryIndexPath(locale)}>{glossaryNavLabel(locale)}</Link>
      </nav>

      <h1>{term.title}</h1>
      <p className="doc-lede">{term.short}</p>

      {term.blocks.map((b) => renderContentBlock(b, locale))}

      {term.faq && term.faq.length > 0 ? (
        <section className="guide-faq">
          <h2 id="faq">{chrome.faqHeading}</h2>
          {term.faq.map((item) => (
            <section key={item.q}>
              <h3>{item.q}</h3>
              <p>{item.a}</p>
            </section>
          ))}
        </section>
      ) : null}

      {hasRelated ? (
        <section className="landing-related">
          <h2>{chrome.relatedHeading}</h2>
          <ul>
            {relatedTerms.map((t) => (
              <li key={t.slug}>
                <Link href={localeGlossaryTermPath(t.slug, locale)}>{t.term}</Link>
              </li>
            ))}
            {relatedGuides.map((g) => (
              <li key={g.slug}>
                <Link href={localeGuidePath(g.slug, locale)}>{g.title}</Link>
              </li>
            ))}
            {relatedPages.map((id) => (
              <li key={id}>
                <Link href={localeLandingPagePath(id, locale)}>
                  {landingPageStrings(id, locale).navLabel}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <p className="doc-back muted">
        <Link href={localeGlossaryIndexPath(locale)}>← {chrome.allTerms}</Link>
      </p>
    </main>
  );
}
