import Link from "next/link";
import { enabledProviders } from "@/auth.config";
import {
  signInWithEmail,
  signInWithGoogle,
  signInWithOrcid,
} from "@/app/auth-actions";
import { asLocale } from "@/lib/i18n";
import { landingStrings } from "@/lib/i18n/landing";
import { localeAboutPath } from "@/lib/seo";
import LanguageSwitcher from "./LanguageSwitcher";
import SiteLinks from "./SiteLinks";
import StructuredData from "./StructuredData";

/**
 * The public marketing/landing markup, fully localized. Shared by the default
 * homepage ("/") and every localized variant ("/[locale]"). A server component:
 * it wires the shared sign-in server actions directly into the forms.
 *
 * `lang` is set on the root element so assistive tech and crawlers read the
 * subtree in the correct language even though the single root <html> stays en
 * (App Router allows only one <html>).
 */
interface LandingProps {
  /** The BCP-47 locale to render (e.g. "fr-FR"). */
  locale: string;
}

export default function Landing({ locale }: LandingProps) {
  const loc = asLocale(locale);
  const s = landingStrings(loc);

  return (
    <div className="auth-shell" lang={loc}>
      <StructuredData locale={loc} description={s.metaDescription} />
      <header className="auth-nav">
        <span className="brand">
          <span className="brand-mark" aria-hidden="true">
            Σ
          </span>
          SigmaCV
        </span>
        <div className="auth-nav-right">
          <Link href={localeAboutPath(loc)}>{s.about}</Link>
          <LanguageSwitcher current={loc} label={s.languageLabel} />
        </div>
      </header>

      <main className="auth-main">
        <section className="hero">
          <span className="eyebrow">{s.eyebrow}</span>
          <h1 className="hero-title">{s.heroTitle}</h1>
          <p className="hero-sub">{s.heroSub}</p>
          <ol className="hero-steps">
            <li>
              <span className="step-n">1</span>
              {s.step1}
            </li>
            <li>
              <span className="step-n">2</span>
              {s.step2}
            </li>
            <li>
              <span className="step-n">3</span>
              {s.step3}
            </li>
          </ol>
        </section>

        <section className="auth-card card">
          <h2 className="auth-card-title">{s.signInTitle}</h2>
          <p className="auth-card-sub muted">{s.signInSub}</p>

          <form action={signInWithOrcid}>
            <button type="submit" className="btn btn-primary btn-lg auth-btn">
              <OrcidMark />
              {s.signInOrcid}
            </button>
          </form>

          {enabledProviders.google || enabledProviders.email ? (
            <div className="auth-divider">
              <span>{s.orDivider}</span>
            </div>
          ) : null}

          {enabledProviders.google ? (
            <form action={signInWithGoogle}>
              <button type="submit" className="btn auth-btn">
                {s.continueGoogle}
              </button>
            </form>
          ) : null}

          {enabledProviders.email ? (
            <form action={signInWithEmail} className="auth-email-row">
              <input
                type="email"
                name="email"
                required
                placeholder={s.emailPlaceholder}
              />
              <button type="submit" className="btn">
                {s.emailButton}
              </button>
            </form>
          ) : null}

          <p className="auth-fineprint muted">{s.fineprint}</p>
        </section>
      </main>

      <footer className="auth-footer">
        <span className="muted">{s.footer}</span>
        <SiteLinks locale={loc} />
      </footer>
    </div>
  );
}

function OrcidMark() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 256 256"
      aria-hidden="true"
      style={{ display: "inline-block" }}
    >
      <circle cx="128" cy="128" r="128" fill="#ffffff" opacity="0.18" />
      <path
        fill="currentColor"
        d="M86 70a14 14 0 1 1-28 0 14 14 0 0 1 28 0zM72 96h22v98H72zM118 96h42c34 0 52 24 52 49 0 27-21 49-52 49h-42zm22 20v58h18c24 0 30-18 30-29 0-18-11-29-31-29z"
      />
    </svg>
  );
}
