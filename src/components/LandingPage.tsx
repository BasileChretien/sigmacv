import Link from "next/link";
import { faqPageJsonLd } from "@/lib/faqJsonLd";
import { asLocale } from "@/lib/i18n";
import { type LandingPageId, landingPageStrings } from "@/lib/i18n/landingPages";
import {
  localeHomePath,
  localeLandingPagePath,
} from "@/lib/seo";
import DocJsonLd from "./DocJsonLd";
import SiteLinks from "./SiteLinks";

/**
 * A high-intent SEO landing page, localized. Shared by the bare routes
 * (`/orcid-to-cv`, `/nih-biosketch`, en-US) and their localized
 * `/[locale]/…` variants. `lang` is set on the subtree so the content is read
 * in the correct language even though the single root <html> stays en.
 *
 * Reuses the existing `doc-page` chrome (no new design). Emits a WebPage
 * JSON-LD (via DocJsonLd) and a schema.org FAQPage block built from the same
 * Q&A pairs rendered visibly. The primary CTA funnels to the homepage sign-in
 * card (matching how the other static pages link back home).
 */
export default function LandingPage({
  page,
  locale,
}: {
  page: LandingPageId;
  locale: string;
}) {
  const loc = asLocale(locale);
  const s = landingPageStrings(page, loc);
  return (
    <main className="doc-page" lang={loc}>
      <DocJsonLd
        path={localeLandingPagePath(page, loc).replace(/^\//, "")}
        name={s.heading}
        description={s.metaDescription}
        locale={loc}
      />
      {/* FAQPage structured data — the builder returns the full <script> tag. */}
      <div dangerouslySetInnerHTML={{ __html: faqPageJsonLd(s.faq) }} />

      <h1>{s.heading}</h1>
      <p>{s.subhead}</p>

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

      {s.faq.map((item) => (
        <section key={item.q}>
          <h2>{item.q}</h2>
          <p>{item.a}</p>
        </section>
      ))}

      <SiteLinks className="site-links about-links" locale={loc} />

      <p className="doc-back muted">
        <Link href={localeHomePath(loc)}>{s.backLink}</Link>
      </p>
    </main>
  );
}
