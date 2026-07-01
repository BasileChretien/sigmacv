import type { Metadata } from "next";
import Link from "next/link";
import { signInWithOrcid } from "@/app/auth-actions";
import OrcidPreviewForm from "@/components/OrcidPreviewForm";
import PreviewWorkspace from "@/components/PreviewWorkspace";
import SignInButton from "@/components/SignInButton";
import SiteFooter from "@/components/SiteFooter";
import SiteHeader from "@/components/SiteHeader";
import { asLocale, DEFAULT_UI_LOCALE, type Locale } from "@/lib/i18n";
import { landingStrings } from "@/lib/i18n/landing";
import { previewStrings } from "@/lib/i18n/preview";
import { previewCvFromOrcid } from "@/lib/cv/previewFromOrcid";
import { listAvailableStyles } from "@/lib/citeproc/assets";
import { enforcePreviewRateLimit } from "./previewRateLimit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// The preview builds live from ~20 upstream sources — never a static/cacheable
// route. en-US for now; a localized /[locale]/preview variant is a trivial later
// add (the copy already exists for all ten locales in i18n/preview.ts).
const LOCALE = DEFAULT_UI_LOCALE;

export function generateMetadata(): Metadata {
  return {
    title: previewStrings(LOCALE).metaTitle,
    // Ephemeral, generated on demand for ANY pasted ORCID: never index or follow.
    // Reinforced by the robots.txt `/preview` disallow.
    robots: { index: false, follow: false },
  };
}

interface PreviewPageProps {
  params: Promise<{ orcid: string }>;
}

export default async function PreviewPage({ params }: PreviewPageProps) {
  const loc = asLocale(LOCALE);
  const s = previewStrings(loc);
  const { orcid: raw } = await params;

  // Rate-limit before any build (heavy: 20-source fetch + citeproc). Invalid
  // input still costs budget, which is intentional flood protection.
  const gate = await enforcePreviewRateLimit();
  if (!gate.ok) {
    return <PreviewNotice locale={loc} heading={s.rateLimitedHeading} body={s.rateLimitedBody} />;
  }

  const result = await previewCvFromOrcid(decodeURIComponent(raw));

  if (result.status === "invalid") {
    return <PreviewNotice locale={loc} heading={s.invalidHeading} body={s.invalidBody} showForm />;
  }
  if (result.status === "empty") {
    return <PreviewNotice locale={loc} heading={s.emptyHeading} body={s.emptyBody} signIn />;
  }
  if (result.status === "error") {
    // Transient upstream failure — a plain retry (reload) usually clears it.
    return <PreviewNotice locale={loc} heading={s.errorHeading} body={s.errorBody} />;
  }

  // status === "ok": the REAL editor, interactive and anonymous — curate + restyle
  // with a live preview, seeded from the CV built off the public ORCID iD. Save /
  // publish / export are the only account-gated actions (a sign-in CTA in its bar).
  return (
    <PreviewWorkspace
      initialCv={result.cv}
      initialHtml={result.html}
      name={result.name}
      locale={loc}
      availableStyles={listAvailableStyles()}
    />
  );
}

/** The "Sign in with ORCID to save, edit & publish" button (real OAuth via the
 *  shared server action + funnel analytics). */
function SignInCta({ locale }: { locale: Locale }) {
  const s = previewStrings(locale);
  const ls = landingStrings(locale);
  return (
    <form action={signInWithOrcid}>
      <SignInButton method="orcid" className="hp2-btn hp2-btn-primary" pendingLabel={ls.signingIn}>
        {s.ctaSignIn}
      </SignInButton>
    </form>
  );
}

/** A centred notice for the non-rendered states: rate-limited, malformed iD
 *  (offers the form again), or a valid iD with no public record (offers sign-in). */
function PreviewNotice({
  locale,
  heading,
  body,
  signIn,
  showForm,
}: {
  locale: Locale;
  heading: string;
  body: string;
  signIn?: boolean;
  showForm?: boolean;
}) {
  const s = previewStrings(locale);
  return (
    <div className="site-shell" lang={locale}>
      <SiteHeader locale={locale} />
      <main className="doc-page" id="site-main">
        <div className="preview-empty">
          <h1>{heading}</h1>
          <p>{body}</p>
          {signIn ? <SignInCta locale={locale} /> : null}
          {showForm ? <OrcidPreviewForm locale={locale} /> : null}
          <p className="doc-back muted">
            <Link href="/">{s.back}</Link>
          </p>
        </div>
      </main>
      <SiteFooter locale={locale} />
    </div>
  );
}
