import Link from "next/link";
import { faqPageJsonLd } from "@/lib/faqJsonLd";
import { GUIDE_AUTHOR, type Guide, getGuide, guideReadingMinutes } from "@/lib/guides/guides";
import { guideArticleJsonLd, guideBreadcrumbJsonLd } from "@/lib/guides/jsonLd";
import { localeLanguageCode } from "@/lib/i18n";
import { guidesChrome } from "@/lib/i18n/guidesChrome";
import { guidesNavLabel } from "@/lib/i18n/guidesNav";
import { landingPageStrings } from "@/lib/i18n/landingPages";
import { localeGuidePath, localeGuidesIndexPath, localeLandingPagePath } from "@/lib/seo";
import { renderContentBlock } from "./contentBlocks";

/**
 * Renders one long-form guide in `locale` with the `doc-page` chrome. Emits
 * Article + BreadcrumbList + (optional) FAQPage JSON-LD, a named-author byline
 * for E-E-A-T, the structured body blocks (via the shared `renderContentBlock`),
 * and hub-and-spoke links to related guides and landing pages.
 */
function formatDate(iso: string, locale: string): string {
  return new Date(`${iso}T00:00:00Z`).toLocaleDateString(locale, {
    year: "numeric",
    month: "long",
    day: "numeric",
    timeZone: "UTC",
  });
}

export default function GuidePage({ guide, locale = "en-US" }: { guide: Guide; locale?: string }) {
  const chrome = guidesChrome(locale);
  const minutes = guideReadingMinutes(guide);
  const relatedGuides = (guide.relatedGuides ?? [])
    .map((slug) => getGuide(slug, locale))
    .filter((g): g is Guide => Boolean(g));

  return (
    <main className="doc-page" lang={localeLanguageCode(locale)}>
      <script
        type="application/ld+json"
        // Server-rendered from static, non-user data — safe to inline.
        dangerouslySetInnerHTML={{ __html: guideArticleJsonLd(guide, locale) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: guideBreadcrumbJsonLd(guide, locale) }}
      />
      {guide.faq ? <div dangerouslySetInnerHTML={{ __html: faqPageJsonLd(guide.faq) }} /> : null}

      <nav className="breadcrumbs" aria-label="Breadcrumb">
        <Link href="/">SigmaCV</Link> <span aria-hidden="true">›</span>{" "}
        <Link href={localeGuidesIndexPath(locale)}>{guidesNavLabel(locale)}</Link>
      </nav>

      <h1>{guide.title}</h1>
      <p className="guide-byline muted">
        {chrome.byline}{" "}
        <a href={GUIDE_AUTHOR.orcid} target="_blank" rel="noopener noreferrer">
          {GUIDE_AUTHOR.name}
        </a>{" "}
        · {GUIDE_AUTHOR.credentials} ·{" "}
        <time dateTime={guide.datePublished}>{formatDate(guide.datePublished, locale)}</time> ·{" "}
        {minutes} {chrome.minRead}
      </p>
      <p className="doc-lede">{guide.description}</p>

      {guide.blocks.map((b) => renderContentBlock(b, locale))}

      {guide.faq && guide.faq.length > 0 ? (
        <section className="guide-faq">
          <h2 id="faq">{chrome.faqHeading}</h2>
          {guide.faq.map((item) => (
            <section key={item.q}>
              <h3>{item.q}</h3>
              <p>{item.a}</p>
            </section>
          ))}
        </section>
      ) : null}

      {relatedGuides.length > 0 || (guide.relatedPages && guide.relatedPages.length > 0) ? (
        <section className="landing-related">
          <h2>{chrome.relatedHeading}</h2>
          <ul>
            {relatedGuides.map((g) => (
              <li key={g.slug}>
                <Link href={localeGuidePath(g.slug, locale)}>{g.title}</Link>
              </li>
            ))}
            {(guide.relatedPages ?? []).map((id) => (
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
        <Link href={localeGuidesIndexPath(locale)}>← {chrome.allGuides}</Link>
      </p>
    </main>
  );
}
