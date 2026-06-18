import Link from "next/link";
import { asLocale } from "@/lib/i18n";
import { CONTACT_EMAIL, contactStrings } from "@/lib/i18n/contact";
import { privacyStrings } from "@/lib/i18n/privacy";
import { termsStrings } from "@/lib/i18n/terms";
import { localeContactPath, localeHomePath, localePrivacyPath, localeTermsPath } from "@/lib/seo";
import DocJsonLd from "./DocJsonLd";
import SiteFooter from "./SiteFooter";
import SiteHeader from "./SiteHeader";

/**
 * The terms-of-use markup, localized. Shared by the default `/terms` (en-US)
 * and the localized `/[locale]/terms` routes. `lang` is set on the subtree so
 * the content is read in the correct language even though the single root
 * <html> stays en. Mirrors `Privacy` — same shell, JSON-LD, and back link.
 */
export default function Terms({ locale }: { locale: string }) {
  const loc = asLocale(locale);
  const s = termsStrings(loc);
  return (
    <div className="site-shell" lang={loc}>
      <SiteHeader locale={loc} />
      <main className="doc-page" id="site-main">
        <DocJsonLd
          path={localeTermsPath(loc).replace(/^\//, "")}
          name={s.heading}
          description={s.metaDescription}
          locale={loc}
        />
        <h1>{s.heading}</h1>
        <p>{s.intro}</p>

        <h2>{s.serviceHeading}</h2>
        <p>{s.service}</p>

        <h2>{s.eligibilityHeading}</h2>
        <p>{s.eligibility}</p>

        <h2>{s.contentHeading}</h2>
        <p>{s.content}</p>

        <h2>{s.acceptableUseHeading}</h2>
        <p>{s.acceptableUse}</p>

        <h2>{s.accuracyHeading}</h2>
        <p>{s.accuracy}</p>

        <h2>{s.warrantyHeading}</h2>
        <p>{s.warranty}</p>

        <h2>{s.liabilityHeading}</h2>
        <p>{s.liability}</p>

        <h2>{s.terminationHeading}</h2>
        <p>{s.termination}</p>

        <h2>{s.changesHeading}</h2>
        <p>{s.changes}</p>

        <h2>{s.ipHeading}</h2>
        <p>{s.ip}</p>

        <h2>{s.privacyHeading}</h2>
        <p>
          {s.privacyBody} <Link href={localePrivacyPath(loc)}>{privacyStrings(loc).heading}</Link>
        </p>

        <h2>{s.lawHeading}</h2>
        <p>{s.law}</p>

        <h2>{s.contactHeading}</h2>
        <p>{s.contact}</p>
        <p>
          <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>
          {" · "}
          <Link href={localeContactPath(loc)}>{contactStrings(loc).heading}</Link>
        </p>

        <p className="muted">{s.authoritativeNote}</p>
        <p className="muted">{s.updatedNote}</p>

        <p className="doc-back muted">
          <Link href={localeHomePath(loc)}>{s.backLink}</Link>
        </p>
      </main>
      <SiteFooter locale={loc} />
    </div>
  );
}
