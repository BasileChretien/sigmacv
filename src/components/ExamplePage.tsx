import Link from "next/link";
import type { ReactNode } from "react";
import type { CvExample } from "@/lib/examples/examples";
import { localeLanguageCode } from "@/lib/i18n";
import { examplesChrome, fillChrome } from "@/lib/i18n/examplesChrome";
import { examplesNavLabel } from "@/lib/i18n/guidesNav";
import { anyLandingPageStrings } from "@/lib/i18n/landingAll";
import { serializeJsonLd } from "@/lib/jsonLd";
import { localeHomePath, localeLandingPagePath } from "@/lib/seo";
import { absoluteUrl, SITE_URL } from "@/lib/siteUrl";
import DocJsonLd from "./DocJsonLd";
import SiteFooter from "./SiteFooter";
import SiteHeader from "./SiteHeader";

/**
 * One illustrative academic-CV example. Renders the fictional CV inline (indexable,
 * so the page literally contains a formatted academic CV — the strongest "academic
 * CV example" signal) inside the `doc-page` chrome, with a clear illustrative
 * disclaimer, a build CTA, and hub-and-spoke links to the relevant persona/landing
 * pages. Emits WebPage (DocJsonLd) + BreadcrumbList JSON-LD. The page speaks the
 * example's language (`ExampleMeta.locale`, English by default): the CV content
 * is written in it and the chrome around it follows (`examplesChrome`).
 */

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
  const locale = example.locale ?? "en-US";
  const chrome = examplesChrome(locale);
  const examplesLabel = examplesNavLabel(locale);
  const surname = example.person.name.trim().split(/\s+/).pop() ?? "";
  const url = absoluteUrl(`examples/${example.slug}`);
  const byline =
    example.byline ??
    [
      example.field,
      example.stage,
      fillChrome(chrome.citations, { style: example.citationStyle }),
      fillChrome(chrome.template, { template: example.templateLabel }),
    ].join(" · ");

  const breadcrumbJsonLd = serializeJsonLd({
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "SigmaCV", item: `${SITE_URL}/` },
      { "@type": "ListItem", position: 2, name: examplesLabel, item: absoluteUrl("examples") },
      { "@type": "ListItem", position: 3, name: example.navLabel, item: url },
    ],
  });

  return (
    <div className="site-shell" lang={localeLanguageCode(locale)}>
      <SiteHeader locale={locale} />
      <main className="doc-page" id="site-main">
        <DocJsonLd
          path={`examples/${example.slug}`}
          name={example.heading}
          description={example.metaDescription}
          locale={locale}
        />
        <script
          type="application/ld+json"
          // Server-rendered from static, non-user data — safe to inline.
          dangerouslySetInnerHTML={{ __html: breadcrumbJsonLd }}
        />

        <nav className="breadcrumbs" aria-label="Breadcrumb">
          <Link href="/">SigmaCV</Link> <span aria-hidden="true">›</span>{" "}
          <Link href="/examples">{examplesLabel}</Link>
        </nav>

        <h1>{example.heading}</h1>
        <p className="guide-byline muted">{byline}</p>
        {example.intro.map((para) => (
          <p key={para} className="doc-lede">
            {para}
          </p>
        ))}

        {example.sources && example.sources.length > 0 ? (
          <section className="example-sources">
            <h2>{chrome.sourcesHeading}</h2>
            <ul className="guide-links">
              {example.sources.map((s) => (
                <li key={s.href}>
                  {s.href.startsWith("/") ? (
                    <Link href={s.href}>{s.label}</Link>
                  ) : (
                    <a href={s.href} target="_blank" rel="noopener noreferrer">
                      {s.label}
                    </a>
                  )}
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        <p className="example-disclaimer muted">
          <strong>{chrome.disclaimerLead}</strong>{" "}
          {fillChrome(chrome.disclaimerBody, { name: example.person.name })}
        </p>

        <article
          className="cv-example"
          aria-label={fillChrome(chrome.exampleAria, { label: example.navLabel })}
        >
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
          <h2>{chrome.buildHeading}</h2>
          <p>{chrome.buildBody}</p>
          <p>
            <Link className="btn btn-primary" href={localeHomePath(locale)}>
              {chrome.buildCta}
            </Link>
          </p>
        </section>

        <section className="landing-related">
          <h2>{chrome.relatedHeading}</h2>
          <ul>
            {example.related.map((id) => (
              <li key={id}>
                <Link href={localeLandingPagePath(id, locale)}>
                  {anyLandingPageStrings(id, locale).navLabel}
                </Link>
              </li>
            ))}
          </ul>
        </section>

        <p className="doc-back muted">
          <Link href="/examples">← {chrome.allExamples}</Link>
        </p>
      </main>
      <SiteFooter locale={locale} />
    </div>
  );
}
