import Link from "next/link";
import DocJsonLd from "@/components/DocJsonLd";
import { type GlossaryTerm, listTerms } from "@/lib/glossary/glossary";
import { definedTermSetJsonLd, glossaryIndexBreadcrumbJsonLd } from "@/lib/glossary/jsonLd";

/**
 * The /glossary index — an English-only hub listing every term, with a WebPage +
 * BreadcrumbList + DefinedTermSet for discovery and entity coverage.
 */
export const GLOSSARY_INDEX_TITLE = "Academic CV glossary";
export const GLOSSARY_INDEX_DESCRIPTION =
  "Plain-language definitions of the key terms behind an academic CV — ORCID, OpenAlex, citation metrics (FWCI, h-index), the Citation Style Language, the NIH biosketch and more.";

export default function GlossaryIndex() {
  const terms: GlossaryTerm[] = listTerms();
  return (
    <main className="doc-page" lang="en">
      <DocJsonLd
        path="glossary"
        name={GLOSSARY_INDEX_TITLE}
        description={GLOSSARY_INDEX_DESCRIPTION}
        locale="en-US"
      />
      <script
        type="application/ld+json"
        // Server-rendered from static, non-user data — safe to inline.
        dangerouslySetInnerHTML={{ __html: glossaryIndexBreadcrumbJsonLd() }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: definedTermSetJsonLd(terms) }}
      />

      <nav className="breadcrumbs" aria-label="Breadcrumb">
        <Link href="/">SigmaCV</Link> <span aria-hidden="true">›</span> Glossary
      </nav>

      <h1>{GLOSSARY_INDEX_TITLE}</h1>
      <p className="doc-lede">{GLOSSARY_INDEX_DESCRIPTION}</p>

      <ul className="guide-list">
        {terms.map((t) => (
          <li key={t.slug} className="guide-list-item card">
            <h2 className="guide-list-title">
              <Link href={`/glossary/${t.slug}`}>{t.term}</Link>
            </h2>
            <p className="guide-list-desc muted">{t.short}</p>
          </li>
        ))}
      </ul>

      <p className="doc-back muted">
        <Link href="/">← Back to SigmaCV</Link>
      </p>
    </main>
  );
}
