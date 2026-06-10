import Link from "next/link";
import { faqPageJsonLd } from "@/lib/faqJsonLd";
import { GUIDE_AUTHOR, type Guide, getGuide, guideReadingMinutes } from "@/lib/guides/guides";
import { guideArticleJsonLd, guideBreadcrumbJsonLd } from "@/lib/guides/jsonLd";
import { landingPageStrings } from "@/lib/i18n/landingPages";
import { localeLandingPagePath } from "@/lib/seo";
import { renderContentBlock } from "./contentBlocks";

/**
 * Renders one long-form guide (English-only) with the `doc-page` chrome. Emits
 * Article + BreadcrumbList + (optional) FAQPage JSON-LD, a named-author byline
 * for E-E-A-T, the structured body blocks (via the shared `renderContentBlock`),
 * and hub-and-spoke links to related guides and landing pages.
 */
const LOCALE = "en-US";

function formatDate(iso: string): string {
  return new Date(`${iso}T00:00:00Z`).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
    timeZone: "UTC",
  });
}

export default function GuidePage({ guide }: { guide: Guide }) {
  const minutes = guideReadingMinutes(guide);
  const relatedGuides = (guide.relatedGuides ?? [])
    .map((slug) => getGuide(slug))
    .filter((g): g is Guide => Boolean(g));

  return (
    <main className="doc-page" lang="en">
      <script
        type="application/ld+json"
        // Server-rendered from static, non-user data — safe to inline.
        dangerouslySetInnerHTML={{ __html: guideArticleJsonLd(guide) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: guideBreadcrumbJsonLd(guide) }}
      />
      {guide.faq ? <div dangerouslySetInnerHTML={{ __html: faqPageJsonLd(guide.faq) }} /> : null}

      <nav className="breadcrumbs" aria-label="Breadcrumb">
        <Link href="/">SigmaCV</Link> <span aria-hidden="true">›</span>{" "}
        <Link href="/guides">Guides</Link>
      </nav>

      <h1>{guide.title}</h1>
      <p className="guide-byline muted">
        By{" "}
        <a href={GUIDE_AUTHOR.orcid} target="_blank" rel="noopener noreferrer">
          {GUIDE_AUTHOR.name}
        </a>{" "}
        · {GUIDE_AUTHOR.credentials} ·{" "}
        <time dateTime={guide.datePublished}>{formatDate(guide.datePublished)}</time> · {minutes}{" "}
        min read
      </p>
      <p className="doc-lede">{guide.description}</p>

      {guide.blocks.map(renderContentBlock)}

      {guide.faq && guide.faq.length > 0 ? (
        <section className="guide-faq">
          <h2 id="faq">Frequently asked questions</h2>
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
          <h2>Related</h2>
          <ul>
            {relatedGuides.map((g) => (
              <li key={g.slug}>
                <Link href={`/guides/${g.slug}`}>{g.title}</Link>
              </li>
            ))}
            {(guide.relatedPages ?? []).map((id) => (
              <li key={id}>
                <Link href={localeLandingPagePath(id, LOCALE)}>
                  {landingPageStrings(id, LOCALE).navLabel}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <p className="doc-back muted">
        <Link href="/guides">← All guides</Link>
      </p>
    </main>
  );
}
