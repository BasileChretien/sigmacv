import Link from "next/link";
import { faqPageJsonLd } from "@/lib/faqJsonLd";
import { asLocale } from "@/lib/i18n";
import { landingStrings } from "@/lib/i18n/landing";
import { headTermPageForLocale } from "@/lib/i18n/headTermPages";
import {
  type AnyLandingPageId,
  anyLandingPageContent,
  anyLandingPageStrings,
  anyLandingRelated,
} from "@/lib/i18n/landingAll";
import { serializeJsonLd } from "@/lib/jsonLd";
import { localeHomePath, localeLandingPagePath } from "@/lib/seo";
import { absoluteUrl, SITE_URL } from "@/lib/siteUrl";
import DocJsonLd from "./DocJsonLd";
import OrcidPreviewForm from "./OrcidPreviewForm";
import SiteLinks from "./SiteLinks";
import SiteFooter from "./SiteFooter";
import SiteHeader from "./SiteHeader";

/**
 * A high-intent SEO landing page, localized. Shared by the bare routes
 * (`/orcid-to-cv`, `/nih-biosketch`, en-US) and their localized
 * `/[locale]/…` variants. `lang` is set on the subtree so the content is read
 * in the correct language even though the single root <html> stays en.
 *
 * Reuses the existing `doc-page` chrome (no new design). Renders comprehensive,
 * crawlable content (intro → benefits → CTA → step-by-step → why → FAQ → related
 * links) and emits four kinds of structured data:
 *  - WebPage (via DocJsonLd),
 *  - BreadcrumbList (SigmaCV → this page),
 *  - HowTo (the step-by-step section — also aids LLM extraction), and
 *  - FAQPage (the base + extra Q&A, matching what's rendered visibly).
 * The primary CTA funnels to the homepage sign-in card.
 */
export default function LandingPage({ page, locale }: { page: AnyLandingPageId; locale: string }) {
  const loc = asLocale(locale);
  const s = anyLandingPageStrings(page, loc);
  const c = anyLandingPageContent(page, loc);
  const path = localeLandingPagePath(page, loc).replace(/^\//, "");

  // The visible FAQ (and its JSON-LD) is the base 2 Q&A plus the 3 extra entries.
  const faq = [...s.faq, ...c.faqExtra];

  // BreadcrumbList: SigmaCV → this page, for a breadcrumb rich result in SERPs.
  const breadcrumbJsonLd = serializeJsonLd({
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "SigmaCV", item: `${SITE_URL}/` },
      { "@type": "ListItem", position: 2, name: s.navLabel, item: absoluteUrl(path) },
    ],
  });

  // HowTo: the step-by-step section as structured data (clean machine extraction).
  const howToJsonLd = serializeJsonLd({
    "@context": "https://schema.org",
    "@type": "HowTo",
    name: c.stepsHeading,
    description: s.metaDescription,
    inLanguage: loc,
    step: c.steps.map((st, i) => ({
      "@type": "HowToStep",
      position: i + 1,
      name: st.title,
      text: st.body,
    })),
  });

  // Hub-and-spoke related links, plus this locale's native head-term page (if any)
  // so it isn't an orphan — every localized landing/persona/topic page links to it.
  const headTerm = headTermPageForLocale(loc);
  const related: readonly AnyLandingPageId[] =
    headTerm && headTerm !== page
      ? [...anyLandingRelated(page), headTerm]
      : anyLandingRelated(page);

  return (
    <div className="site-shell" lang={loc}>
      <SiteHeader locale={loc} />
      <main className="doc-page" id="site-main">
        <DocJsonLd path={path} name={s.heading} description={s.metaDescription} locale={loc} />
        {/* FAQPage structured data — the builder returns the full <script> tag. */}
        <div dangerouslySetInnerHTML={{ __html: faqPageJsonLd(faq) }} />
        <script
          type="application/ld+json"
          // Server-rendered from static, non-user data — safe to inline.
          dangerouslySetInnerHTML={{ __html: breadcrumbJsonLd }}
        />
        <script
          type="application/ld+json"
          // Server-rendered from static, non-user data — safe to inline.
          dangerouslySetInnerHTML={{ __html: howToJsonLd }}
        />

        <nav className="breadcrumbs" aria-label="Breadcrumb">
          <Link href={localeHomePath(loc)}>SigmaCV</Link> <span aria-hidden="true">›</span>{" "}
          {s.navLabel}
        </nav>

        <h1>{s.heading}</h1>
        <p className="doc-lede">{s.subhead}</p>

        {c.intro.map((para) => (
          <p key={para}>{para}</p>
        ))}

        <ul>
          {s.bullets.map((bullet) => (
            <li key={bullet}>{bullet}</li>
          ))}
        </ul>

        <p>
          <Link className="btn btn-primary" href={localeHomePath(loc)}>
            {s.cta}
          </Link>
        </p>

        {/* Reuse the homepage's ORCID trust line so the sign-in CTA carries the
            same read-only reassurance here. */}
        <p className="muted doc-trust">{landingStrings(loc).orcidTrust}</p>

        {/* The ORCID→CV page is the natural home for the no-login preview: paste
            an iD and see the result before signing in. */}
        {page === "orcid-to-cv" ? <OrcidPreviewForm locale={loc} /> : null}

        <section>
          <h2>{c.stepsHeading}</h2>
          <ol>
            {c.steps.map((step) => (
              <li key={step.title}>
                <strong>{step.title}.</strong> {step.body}
              </li>
            ))}
          </ol>
        </section>

        <section>
          <h2>{c.whyHeading}</h2>
          {c.why.map((para) => (
            <p key={para}>{para}</p>
          ))}
        </section>

        {faq.map((item) => (
          <section key={item.q}>
            <h2>{item.q}</h2>
            <p>{item.a}</p>
          </section>
        ))}

        <section className="landing-related">
          <h2>{c.relatedHeading}</h2>
          <ul>
            {related.map((id) => (
              <li key={id}>
                <Link href={localeLandingPagePath(id, loc)}>
                  {anyLandingPageStrings(id, loc).navLabel}
                </Link>
              </li>
            ))}
          </ul>
        </section>

        <SiteLinks className="site-links about-links" locale={loc} />

        <p className="doc-back muted">
          <Link href={localeHomePath(loc)}>{s.backLink}</Link>
        </p>
      </main>
      <SiteFooter locale={loc} />
    </div>
  );
}
