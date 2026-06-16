import Link from "next/link";
import { asLocale } from "@/lib/i18n";
import { accessibilityStrings } from "@/lib/i18n/accessibility";
import { localeAccessibilityPath, localeHomePath } from "@/lib/seo";
import DocJsonLd from "./DocJsonLd";
import SiteLinks from "./SiteLinks";
import SiteFooter from "./SiteFooter";
import SiteHeader from "./SiteHeader";

/**
 * The Accessibility-statement markup, localized. Shared by the default
 * `/accessibility` (en-US) and the localized `/[locale]/accessibility` routes.
 * `lang` is set on the subtree so the content is read in the correct language
 * even though the single root <html> stays en.
 */
export default function Accessibility({ locale }: { locale: string }) {
  const loc = asLocale(locale);
  const s = accessibilityStrings(loc);
  return (
    <div className="site-shell" lang={loc}>
      <SiteHeader locale={loc} />
      <main className="doc-page" id="site-main">
        <DocJsonLd
          path={localeAccessibilityPath(loc).replace(/^\//, "")}
          name={s.heading}
          description={s.metaDescription}
          locale={loc}
        />
        <h1>{s.heading}</h1>
        <p>{s.intro}</p>

        <h2>{s.commitmentHeading}</h2>
        <p>{s.commitment}</p>

        <h2>{s.knownHeading}</h2>
        <p>{s.known}</p>

        <h2>{s.reportHeading}</h2>
        <p>{s.report}</p>

        <SiteLinks className="site-links about-links" locale={loc} />

        <p className="doc-back muted">
          <Link href={localeHomePath(loc)}>{s.backLink}</Link>
        </p>
      </main>
      <SiteFooter locale={loc} />
    </div>
  );
}
