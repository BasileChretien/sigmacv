import Link from "next/link";
import { asLocale } from "@/lib/i18n";
import { CONTACT_EMAIL, contactStrings } from "@/lib/i18n/contact";
import { localeContactPath, localeHomePath } from "@/lib/seo";
import DocJsonLd from "./DocJsonLd";
import SiteFooter from "./SiteFooter";
import SiteHeader from "./SiteHeader";

/**
 * The contact page, localized. Shared by the default `/contact` (en-US) and the
 * localized `/[locale]/contact` routes. Names the data controller and links the
 * single contact address (a `mailto:`); data-protection self-service lives in the
 * app, so this page stays a thin static document.
 */
export default function Contact({ locale }: { locale: string }) {
  const loc = asLocale(locale);
  const s = contactStrings(loc);
  return (
    <div className="site-shell" lang={loc}>
      <SiteHeader locale={loc} />
      <main className="doc-page" id="site-main">
        <DocJsonLd
          path={localeContactPath(loc).replace(/^\//, "")}
          name={s.heading}
          description={s.metaDescription}
          locale={loc}
        />
        <h1>{s.heading}</h1>
        <p>{s.intro}</p>
        <p>
          <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>
        </p>
        <p>{s.dataNote}</p>

        <p className="doc-back muted">
          <Link href={localeHomePath(loc)}>{s.backLink}</Link>
        </p>
      </main>
      <SiteFooter locale={loc} />
    </div>
  );
}
