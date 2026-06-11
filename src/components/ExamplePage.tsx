import Link from "next/link";
import type { ReactNode } from "react";
import type { CvExample } from "@/lib/examples/examples";
import { anyLandingPageStrings } from "@/lib/i18n/landingAll";
import { serializeJsonLd } from "@/lib/jsonLd";
import { localeLandingPagePath } from "@/lib/seo";
import { absoluteUrl, SITE_URL } from "@/lib/siteUrl";
import DocJsonLd from "./DocJsonLd";

/**
 * One illustrative academic-CV example. Renders the fictional CV inline (indexable,
 * so the page literally contains a formatted academic CV — the strongest "academic
 * CV example" signal) inside the `doc-page` chrome, with a clear illustrative
 * disclaimer, a build CTA, and hub-and-spoke links to the relevant persona/landing
 * pages. Emits WebPage (DocJsonLd) + BreadcrumbList JSON-LD. English-only.
 */
const LOCALE = "en-US";

/** Bold the researcher's surname wherever it appears (the self-name highlight). */
function withName(text: string, surname: string): ReactNode {
  if (!surname) return text;
  const parts = text.split(surname);
  if (parts.length === 1) return text;
  return parts.flatMap((part, i) =>
    i === 0 ? [part] : [<strong key={i}>{surname}</strong>, part],
  );
}

export default function ExamplePage({ example }: { example: CvExample }) {
  const surname = example.person.name.trim().split(/\s+/).pop() ?? "";
  const url = absoluteUrl(`examples/${example.slug}`);

  const breadcrumbJsonLd = serializeJsonLd({
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "SigmaCV", item: `${SITE_URL}/` },
      { "@type": "ListItem", position: 2, name: "Examples", item: absoluteUrl("examples") },
      { "@type": "ListItem", position: 3, name: example.navLabel, item: url },
    ],
  });

  return (
    <main className="doc-page" lang="en">
      <DocJsonLd
        path={`examples/${example.slug}`}
        name={example.heading}
        description={example.metaDescription}
        locale={LOCALE}
      />
      <script
        type="application/ld+json"
        // Server-rendered from static, non-user data — safe to inline.
        dangerouslySetInnerHTML={{ __html: breadcrumbJsonLd }}
      />

      <nav className="breadcrumbs" aria-label="Breadcrumb">
        <Link href="/">SigmaCV</Link> <span aria-hidden="true">›</span>{" "}
        <Link href="/examples">Examples</Link>
      </nav>

      <h1>{example.heading}</h1>
      <p className="guide-byline muted">
        {example.field} · {example.stage} · {example.citationStyle} citations ·{" "}
        {example.templateLabel} template
      </p>
      {example.intro.map((para) => (
        <p key={para} className="doc-lede">
          {para}
        </p>
      ))}

      <p className="example-disclaimer muted">
        <strong>Illustrative example.</strong> {example.person.name} is a fictional researcher and
        the publications below are fabricated for demonstration — any resemblance to a real person
        or work is coincidental.
      </p>

      <article className="cv-example" aria-label={`Example CV: ${example.navLabel}`}>
        <header className="cv-example-head">
          <h2 className="cv-example-name">
            {example.person.name}
            {example.person.credentials ? (
              <span className="cv-example-creds">, {example.person.credentials}</span>
            ) : null}
          </h2>
          <p className="cv-example-headline">{example.person.headline}</p>
          <p className="cv-example-affil muted">
            {example.person.affiliation} · {example.person.location}
          </p>
        </header>
        {example.sections.map((section) => (
          <section key={section.title} className="cv-example-section">
            <h3>{section.title}</h3>
            <ul>
              {section.items.map((item) => (
                <li key={item}>{withName(item, surname)}</li>
              ))}
            </ul>
          </section>
        ))}
      </article>

      <section className="example-cta">
        <h2>Build your own academic CV</h2>
        <p>
          SigmaCV builds a clean, citation-formatted CV like this from your ORCID and OpenAlex
          record — free and open source. You curate what appears and export to PDF, DOCX, LaTeX or
          Markdown.
        </p>
        <p>
          <Link className="btn btn-primary" href="/">
            Build your academic CV free
          </Link>
        </p>
      </section>

      <section className="landing-related">
        <h2>Related</h2>
        <ul>
          {example.related.map((id) => (
            <li key={id}>
              <Link href={localeLandingPagePath(id, LOCALE)}>
                {anyLandingPageStrings(id, LOCALE).navLabel}
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <p className="doc-back muted">
        <Link href="/examples">← All examples</Link>
      </p>
    </main>
  );
}
