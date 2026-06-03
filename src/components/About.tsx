import Link from "next/link";
import { asLocale } from "@/lib/i18n";
import { aboutStrings } from "@/lib/i18n/about";
import { localeHomePath } from "@/lib/seo";
import SiteLinks from "./SiteLinks";

/**
 * The About page markup, localized. Shared by the default `/about` (en-US) and
 * the localized `/[locale]/about` routes. `lang` is set on the subtree so the
 * content is read in the correct language even though the single root <html>
 * stays en.
 */
export default function About({ locale }: { locale: string }) {
  const loc = asLocale(locale);
  const s = aboutStrings(loc);
  return (
    <main className="doc-page" lang={loc}>
      <h1>{s.heading}</h1>
      <p>{s.intro}</p>
      <p>{s.privacy}</p>
      <h2>{s.whoHeading}</h2>
      <p>{s.maintainer}</p>

      <SiteLinks className="site-links about-links" locale={loc} />

      <p className="doc-back muted">
        <Link href={localeHomePath(loc)}>{s.backLink}</Link>
      </p>
    </main>
  );
}
