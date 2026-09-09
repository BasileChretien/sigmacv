import Link from "next/link";
import { objectWithOrcid } from "@/app/object/actions";
import { getEnv } from "@/lib/env";
import { asLocale } from "@/lib/i18n";
import { landingStrings } from "@/lib/i18n/landing";
import { objectionStrings } from "@/lib/i18n/objection";
import { privacyStrings } from "@/lib/i18n/privacy";
import { localeHomePath, localePrivacyPath } from "@/lib/seo";
import SignInButton from "./SignInButton";
import SiteFooter from "./SiteFooter";
import SiteHeader from "./SiteHeader";

/**
 * `/object` — the self-service objection page for people who never used
 * SigmaCV (and for anyone else). Explains what objecting does, then offers ONE
 * explicit action: verify the ORCID iD at ORCID and hide the preview. The email
 * route stays as the fallback the privacy notice promises.
 */
export default function ObjectionPage({ locale }: { locale: string }) {
  const loc = asLocale(locale);
  const s = objectionStrings(loc);
  // Nothing could be recorded without the key: say so here rather than after a
  // pointless ORCID round trip.
  const available = Boolean(getEnv().PREVIEW_SUPPRESSION_KEY);
  return (
    <div className="site-shell" lang={loc}>
      <SiteHeader locale={loc} />
      <main className="doc-page" id="site-main">
        <h1>{s.heading}</h1>
        <p>{s.intro}</p>

        <h2>{s.whatHeading}</h2>
        <ul>
          <li>{s.what1}</li>
          <li>{s.what2}</li>
          <li>{s.what3}</li>
        </ul>

        {available ? (
          <form action={objectWithOrcid} className="objection-form">
            <SignInButton
              method="orcid-object"
              className="hp2-btn hp2-btn-primary"
              pendingLabel={landingStrings(loc).signingIn}
            >
              {s.cta}
            </SignInButton>
            <p className="muted">{s.ctaNote}</p>
          </form>
        ) : (
          <div className="objection-unavailable">
            <h2>{s.doneUnavailableHeading}</h2>
            <p>{s.doneUnavailableBody}</p>
          </div>
        )}

        <p className="muted">
          {s.emailFallback}{" "}
          <Link href={localePrivacyPath(loc)}>{privacyStrings(loc).metaTitle}</Link>
        </p>

        <p className="doc-back muted">
          <Link href={localeHomePath(loc)}>{s.back}</Link>
        </p>
      </main>
      <SiteFooter locale={loc} />
    </div>
  );
}
