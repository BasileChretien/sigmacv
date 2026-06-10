import Link from "next/link";
import { getGuide } from "@/lib/guides/guides";
import { faqPageJsonLd } from "@/lib/faqJsonLd";
import { type GlossaryTerm, getTerm } from "@/lib/glossary/glossary";
import { definedTermJsonLd, glossaryTermBreadcrumbJsonLd } from "@/lib/glossary/jsonLd";
import { landingPageStrings } from "@/lib/i18n/landingPages";
import { localeLandingPagePath } from "@/lib/seo";
import { renderContentBlock } from "./contentBlocks";

/**
 * Renders one glossary term (English-only) with the `doc-page` chrome. Emits
 * DefinedTerm + BreadcrumbList + (optional) FAQPage JSON-LD, a one-line
 * definition lede, the structured body, and hub-and-spoke links to related
 * terms, guides and landing pages.
 */
const LOCALE = "en-US";

export default function GlossaryTermPage({ term }: { term: GlossaryTerm }) {
  const relatedTerms = (term.relatedTerms ?? [])
    .map((slug) => getTerm(slug))
    .filter((t): t is GlossaryTerm => Boolean(t));
  const relatedGuides = (term.relatedGuides ?? [])
    .map((slug) => getGuide(slug))
    .filter((g): g is NonNullable<ReturnType<typeof getGuide>> => Boolean(g));
  const relatedPages = term.relatedPages ?? [];
  const hasRelated = relatedTerms.length + relatedGuides.length + relatedPages.length > 0;

  return (
    <main className="doc-page" lang="en">
      <script
        type="application/ld+json"
        // Server-rendered from static, non-user data — safe to inline.
        dangerouslySetInnerHTML={{ __html: definedTermJsonLd(term) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: glossaryTermBreadcrumbJsonLd(term) }}
      />
      {term.faq ? <div dangerouslySetInnerHTML={{ __html: faqPageJsonLd(term.faq) }} /> : null}

      <nav className="breadcrumbs" aria-label="Breadcrumb">
        <Link href="/">SigmaCV</Link> <span aria-hidden="true">›</span>{" "}
        <Link href="/glossary">Glossary</Link>
      </nav>

      <h1>{term.title}</h1>
      <p className="doc-lede">{term.short}</p>

      {term.blocks.map(renderContentBlock)}

      {term.faq && term.faq.length > 0 ? (
        <section className="guide-faq">
          <h2 id="faq">Frequently asked questions</h2>
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
          <h2>Related</h2>
          <ul>
            {relatedTerms.map((t) => (
              <li key={t.slug}>
                <Link href={`/glossary/${t.slug}`}>{t.term}</Link>
              </li>
            ))}
            {relatedGuides.map((g) => (
              <li key={g.slug}>
                <Link href={`/guides/${g.slug}`}>{g.title}</Link>
              </li>
            ))}
            {relatedPages.map((id) => (
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
        <Link href="/glossary">← All terms</Link>
      </p>
    </main>
  );
}
