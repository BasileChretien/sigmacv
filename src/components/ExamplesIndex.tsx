import Link from "next/link";
import DocJsonLd from "@/components/DocJsonLd";
import { type CvExample, listExamples } from "@/lib/examples/examples";
import { serializeJsonLd } from "@/lib/jsonLd";
import { absoluteUrl, SITE_URL } from "@/lib/siteUrl";

/**
 * The /examples index — a hub of illustrative academic-CV examples by field and
 * career stage. Emits WebPage (DocJsonLd) + BreadcrumbList + ItemList. English-only.
 */
export const EXAMPLES_INDEX_TITLE = "Academic CV examples";
export const EXAMPLES_INDEX_DESCRIPTION =
  "Illustrative academic CV examples by field and career stage — biology, computer science, economics, physics, history and more — for grad-school applicants, PhD students, postdocs and faculty. See what a strong academic CV looks like, then build your own free.";

export default function ExamplesIndex() {
  const examples: CvExample[] = listExamples();

  const breadcrumbJsonLd = serializeJsonLd({
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "SigmaCV", item: `${SITE_URL}/` },
      { "@type": "ListItem", position: 2, name: "Examples", item: absoluteUrl("examples") },
    ],
  });
  const itemListJsonLd = serializeJsonLd({
    "@context": "https://schema.org",
    "@type": "ItemList",
    itemListElement: examples.map((e, i) => ({
      "@type": "ListItem",
      position: i + 1,
      url: absoluteUrl(`examples/${e.slug}`),
      name: e.navLabel,
    })),
  });

  return (
    <main className="doc-page" lang="en">
      <DocJsonLd
        path="examples"
        name={EXAMPLES_INDEX_TITLE}
        description={EXAMPLES_INDEX_DESCRIPTION}
        locale="en-US"
      />
      <script
        type="application/ld+json"
        // Server-rendered from static, non-user data — safe to inline.
        dangerouslySetInnerHTML={{ __html: breadcrumbJsonLd }}
      />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: itemListJsonLd }} />

      <nav className="breadcrumbs" aria-label="Breadcrumb">
        <Link href="/">SigmaCV</Link> <span aria-hidden="true">›</span> Examples
      </nav>

      <h1>{EXAMPLES_INDEX_TITLE}</h1>
      <p className="doc-lede">{EXAMPLES_INDEX_DESCRIPTION}</p>
      <p className="example-disclaimer muted">
        Every example shows a <strong>fictional</strong> researcher with fabricated publications,
        for illustration only.
      </p>

      <ul className="guide-list">
        {examples.map((e) => (
          <li key={e.slug} className="guide-list-item card">
            <h2 className="guide-list-title">
              <Link href={`/examples/${e.slug}`}>{e.navLabel}</Link>
            </h2>
            <p className="guide-list-desc muted">{e.person.headline}</p>
            <p className="guide-list-meta muted">
              {e.field} · {e.stage} · {e.citationStyle} · {e.templateLabel} template
            </p>
          </li>
        ))}
      </ul>

      <p className="doc-back muted">
        <Link href="/">← Back to SigmaCV</Link>
      </p>
    </main>
  );
}
