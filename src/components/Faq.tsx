import Link from "next/link";
import { faqPageJsonLd } from "@/lib/faqJsonLd";
import { asLocale } from "@/lib/i18n";
import { faqStrings } from "@/lib/i18n/faq";
import { localeFaqPath, localeHomePath } from "@/lib/seo";
import DocJsonLd from "./DocJsonLd";
import SiteLinks from "./SiteLinks";
import SiteFooter from "./SiteFooter";
import SiteHeader from "./SiteHeader";

/**
 * The FAQ markup, localized. Shared by the default `/faq` (en-US) and the
 * localized `/[locale]/faq` routes. `lang` is set on the subtree so the content
 * is read in the correct language even though the single root <html> stays en.
 *
 * Emits both a WebPage JSON-LD (via DocJsonLd) and a schema.org FAQPage block
 * built from the same question/answer pairs that are rendered visibly.
 */
export default function Faq({ locale }: { locale: string }) {
  const loc = asLocale(locale);
  const s = faqStrings(loc);
  return (
    <div className="site-shell" lang={loc}>
      <SiteHeader locale={loc} />
      <main className="doc-page" id="site-main">
        <DocJsonLd
          path={localeFaqPath(loc).replace(/^\//, "")}
          name={s.heading}
          description={s.metaDescription}
          locale={loc}
        />
        {/* FAQPage structured data — the builder returns the full <script> tag. */}
        <div dangerouslySetInnerHTML={{ __html: faqPageJsonLd(s.items) }} />

        <h1>{s.heading}</h1>

        {s.items.map((item) => (
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
      <SiteFooter locale={loc} />
    </div>
  );
}
