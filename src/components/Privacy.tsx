import Link from "next/link";
import { asLocale } from "@/lib/i18n";
import { CONTACT_EMAIL, contactStrings } from "@/lib/i18n/contact";
import { privacyStrings } from "@/lib/i18n/privacy";
import { localeContactPath, localeHomePath, localePrivacyPath } from "@/lib/seo";
import DocJsonLd from "./DocJsonLd";

/**
 * The privacy-notice markup, localized. Shared by the default `/privacy`
 * (en-US) and the localized `/[locale]/privacy` routes. `lang` is set on the
 * subtree so the content is read in the correct language even though the single
 * root <html> stays en.
 */
export default function Privacy({ locale }: { locale: string }) {
  const loc = asLocale(locale);
  const s = privacyStrings(loc);
  return (
    <main className="doc-page" lang={loc}>
      <DocJsonLd
        path={localePrivacyPath(loc).replace(/^\//, "")}
        name={s.heading}
        description={s.metaDescription}
        locale={loc}
      />
      <h1>{s.heading}</h1>
      <p>{s.intro}</p>

      <h2>{s.controllerHeading}</h2>
      <p>{s.controller}</p>

      <h2>{s.dataHeading}</h2>
      <p>{s.data}</p>

      <h2>{s.purposeHeading}</h2>
      <p>{s.purpose}</p>

      <h2>{s.sharingHeading}</h2>
      <p>{s.sharing}</p>

      <h2>{s.researchHeading}</h2>
      <p>{s.research}</p>

      <h2>{s.retentionHeading}</h2>
      <p>{s.retention}</p>

      <h2>{s.securityHeading}</h2>
      <p>{s.security}</p>

      <h2>{s.rightsHeading}</h2>
      <p>{s.rights}</p>

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
  );
}
