import Link from "next/link";
import "./landing/beams.css";
import "./landing/home.css";
import SignInButton from "@/components/SignInButton";
import { enabledProviders } from "@/auth.config";
import { signInWithEmail, signInWithGoogle, signInWithOrcid } from "@/app/auth-actions";
import { asLocale, t } from "@/lib/i18n";
import { accessibilityStrings } from "@/lib/i18n/accessibility";
import { CONTACT_EMAIL, contactStrings } from "@/lib/i18n/contact";
import { faqStrings } from "@/lib/i18n/faq";
import { fairCvStrings } from "@/lib/i18n/fairCv";
import { examplesNavLabel, glossaryNavLabel, guidesNavLabel } from "@/lib/i18n/guidesNav";
import { landingAudience } from "@/lib/i18n/landingAudience";
import { landingFlow } from "@/lib/i18n/landingFlow";
import { landingStrings } from "@/lib/i18n/landing";
import { orcidHelp } from "@/lib/i18n/orcidHelp";
import { principlesStrings } from "@/lib/i18n/principles";
import { transparencyStrings } from "@/lib/i18n/transparency";
import {
  localeAboutPath,
  localeAccessibilityPath,
  localeContactPath,
  localeFairPath,
  localeFaqPath,
  localeGlossaryIndexPath,
  localeGuidesIndexPath,
  localeLandingPagePath,
  localePrinciplesPath,
  localePrivacyPath,
  localeTransparencyPath,
} from "@/lib/seo";
import { getSiteLinks } from "@/lib/siteLinks";
import LanguageSwitcher from "./LanguageSwitcher";
import StructuredData from "./StructuredData";
import HeroBeams from "./landing/HeroBeams";
import Curate from "./landing/Curate";
import StyleSwitch from "./landing/StyleSwitch";
import Export from "./landing/Export";
import CreatorAvatar from "./landing/CreatorAvatar";

/** ORCID profile URL of SigmaCV's creator (links the "Built by a researcher" credit). */
const CREATOR_ORCID_URL = "https://orcid.org/0000-0002-7483-2489";
/** Where "Don't have an ORCID iD yet?" sends visitors to register a free iD. */
const ORCID_REGISTER_URL = "https://orcid.org/register";

/**
 * The public marketing/landing markup, fully localized. Shared by the default
 * homepage ("/") and every localized variant ("/[locale]"). A server component:
 * it wires the shared sign-in server actions directly into the forms.
 *
 * Composition: hero (headline + sign-in card + the looping "Beams" graphic), a
 * slim "who it's for" band, three "how it works" feature rows each with a
 * self-looping animation (Curate / Style / Export), a trust section, the creator
 * credit (photo + links + DORA), a closing CTA, and the footer. The CV-assembly
 * animations are decorative (aria-hidden); all visible page copy comes from i18n.
 *
 * `lang` is set on the root so assistive tech and crawlers read the subtree in
 * the correct language even though the single root <html> stays en.
 */
interface LandingProps {
  /** The BCP-47 locale to render (e.g. "fr-FR"). */
  locale: string;
}

export default function Landing({ locale }: LandingProps) {
  const loc = asLocale(locale);
  const s = landingStrings(loc);
  const audience = landingAudience(loc);
  const flow = landingFlow(loc);
  const help = orcidHelp(loc);
  const links = getSiteLinks();

  const footerLinks: { label: string; href: string }[] = [
    { label: t(loc, "privacy"), href: localePrivacyPath(loc) },
    { label: contactStrings(loc).heading, href: localeContactPath(loc) },
    { label: faqStrings(loc).navLabel, href: localeFaqPath(loc) },
    { label: guidesNavLabel(loc), href: localeGuidesIndexPath(loc) },
    { label: glossaryNavLabel(loc), href: localeGlossaryIndexPath(loc) },
    { label: examplesNavLabel(loc), href: "/examples" },
    { label: principlesStrings(loc).navLabel, href: localePrinciplesPath(loc) },
    { label: fairCvStrings(loc).navLabel, href: localeFairPath(loc) },
    { label: transparencyStrings(loc).navLabel, href: localeTransparencyPath(loc) },
    { label: accessibilityStrings(loc).navLabel, href: localeAccessibilityPath(loc) },
  ];

  const figFor = (i: number) => (i === 0 ? <Curate /> : i === 1 ? <StyleSwitch /> : <Export />);

  return (
    <div className="hp2" lang={loc}>
      <a href="#hp2-main" className="skip-link">
        {t(loc, "skipToContent")}
      </a>
      <StructuredData locale={loc} description={s.metaDescription} />

      <header className="hp2-nav">
        <span className="hp2-brand">
          <span className="hp2-brand-mark" aria-hidden="true">
            Σ
          </span>
          SigmaCV
        </span>
        <span className="hp2-nav-links">
          <Link href={localeAboutPath(loc)}>{s.about}</Link>
          <LanguageSwitcher current={loc} label={s.languageLabel} />
        </span>
      </header>

      <main id="hp2-main">
        {/* ── Hero ───────────────────────────────────────────────── */}
        <section className="hp2-hero">
          <div className="hp2-hero-copy">
            <span className="hp2-eyebrow">{s.eyebrow}</span>
            <h1 className="hp2-h1">{s.heroTitle}</h1>
            <p className="hp2-sub">{s.heroSub}</p>

            <div className="hp2-signin">
              <div className="hp2-signin-head">
                <h2 className="hp2-signin-title">{s.signInTitle}</h2>
                <span className="hp2-signin-sub">{s.signInSub}</span>
              </div>

              <form action={signInWithOrcid}>
                <SignInButton method="orcid" className="hp2-btn hp2-btn-primary">
                  <OrcidMark />
                  {s.signInOrcid}
                </SignInButton>
              </form>
              <p className="hp2-signin-trust">{s.orcidTrust}</p>

              <details className="hp2-help">
                <summary>{help.question}</summary>
                <div className="hp2-help-body">
                  <p>{help.explainer}</p>
                  <a
                    className="hp2-help-cta"
                    href={ORCID_REGISTER_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {help.cta} <span aria-hidden="true">→</span>
                  </a>
                </div>
              </details>

              {enabledProviders.google || enabledProviders.email ? (
                <div className="auth-divider">
                  <span>{s.orDivider}</span>
                </div>
              ) : null}

              {enabledProviders.google ? (
                <form action={signInWithGoogle}>
                  <SignInButton method="google" className="hp2-btn">
                    {s.continueGoogle}
                  </SignInButton>
                </form>
              ) : null}

              {enabledProviders.email ? (
                <form action={signInWithEmail} className="auth-email-row">
                  <input
                    type="email"
                    name="email"
                    required
                    placeholder={s.emailPlaceholder}
                    aria-label={s.emailLabel}
                  />
                  <SignInButton method="email" className="hp2-btn">
                    {s.emailButton}
                  </SignInButton>
                </form>
              ) : null}

              <p className="hp2-fine">{s.fineprint}</p>
            </div>
          </div>

          <div className="hp2-hero-fig">
            <HeroBeams />
          </div>
        </section>

        {/* ── Who it's for ───────────────────────────────────────── */}
        <section className="hp2-who" aria-label={audience.heading}>
          <span className="hp2-who-label">{audience.heading}</span>
          <span className="hp2-who-chips">
            {audience.personas.map((p) => (
              <span key={p.title} className="hp2-who-chip">
                {p.title}
              </span>
            ))}
          </span>
        </section>

        {/* ── How it works ───────────────────────────────────────── */}
        <section className="hp2-howhead">
          <h2 className="hp2-howhead-title">{flow.howTitle}</h2>
          <p className="hp2-howhead-sub">{flow.howSub}</p>
        </section>

        {flow.steps.map((step, i) => (
          <section key={step.title} className={`hp2-feature${i === 1 ? " hp2-feature-rev" : ""}`}>
            <div className="hp2-feature-copy">
              <span className="hp2-step">{String(i + 1).padStart(2, "0")}</span>
              <h3 className="hp2-feature-title">{step.title}</h3>
              <p className="hp2-feature-body">{step.body}</p>
              <ul className="hp2-feature-points">
                {step.points.map((pt) => (
                  <li key={pt}>{pt}</li>
                ))}
              </ul>
              {i === 1 ? (
                <Link
                  className="hp2-feature-link"
                  href={localeLandingPagePath("funder-cv-templates", loc)}
                >
                  {flow.templatesCta} <span aria-hidden="true">→</span>
                </Link>
              ) : null}
            </div>
            <div className="hp2-feature-fig">{figFor(i)}</div>
          </section>
        ))}

        {/* ── Why / trust ────────────────────────────────────────── */}
        <section className="hp2-trust">
          <h2 className="hp2-trust-title">{s.trustTitle}</h2>
          <ul className="hp2-trust-grid">
            {s.trust.map((tr, i) => (
              <li key={tr.title} className="hp2-trust-card">
                <span className="hp2-trust-icon" aria-hidden="true">
                  {trustIcon(i)}
                </span>
                <h3>{tr.title}</h3>
                <p>{tr.body}</p>
              </li>
            ))}
          </ul>
        </section>

        {/* ── Creator credit + DORA ──────────────────────────────── */}
        <section className="hp2-creator">
          <div className="hp2-creator-card">
            <CreatorAvatar />
            <div className="hp2-creator-text">
              <strong>{s.creatorTitle}</strong>
              <p>
                {s.creatorBody} <Link href={localeAboutPath(loc)}>{s.about}</Link>
              </p>
              <div className="hp2-creator-links">
                <a
                  className="hp2-soc"
                  href={CREATOR_ORCID_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <OrcidMark /> ORCID
                </a>
                {links.linkedin ? (
                  <a
                    className="hp2-soc"
                    href={links.linkedin}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <LinkedInMark /> LinkedIn
                  </a>
                ) : null}
                <a className="hp2-soc" href={`mailto:${CONTACT_EMAIL}`}>
                  <MailMark /> Email
                </a>
                {links.coffee ? (
                  <a
                    className="hp2-coffee hp2-coffee-sm"
                    href={links.coffee}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <CoffeeMark /> Buy me a coffee
                  </a>
                ) : null}
              </div>
            </div>
            <a
              className="hp2-dora"
              href="https://sfdora.org/"
              target="_blank"
              rel="noopener noreferrer"
              title="Supports DORA — the San Francisco Declaration on Research Assessment"
            >
              <picture>
                <source media="(prefers-color-scheme: dark)" srcSet="/dora-supporter-dark.webp" />
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/dora-supporter.webp"
                  alt="Supports DORA — the San Francisco Declaration on Research Assessment"
                  width={64}
                  height={64}
                  loading="lazy"
                />
              </picture>
            </a>
          </div>
        </section>

        {/* ── Closing CTA ────────────────────────────────────────── */}
        <section className="hp2-cta">
          <h2>{flow.ctaTitle}</h2>
          <form action={signInWithOrcid}>
            <SignInButton method="orcid" className="hp2-btn hp2-btn-primary hp2-cta-btn">
              <OrcidMark />
              {s.signInOrcid}
            </SignInButton>
          </form>
          <span className="hp2-cta-fine">{s.signInSub}</span>
        </section>
      </main>

      <footer className="hp2-foot">
        <span className="hp2-foot-copy">{s.footer}</span>
        <nav className="hp2-foot-links">
          {footerLinks.map((l) => (
            <Link key={l.href} href={l.href}>
              {l.label}
            </Link>
          ))}
        </nav>
        {links.github ? (
          <a className="hp2-foot-gh" href={links.github} target="_blank" rel="noopener noreferrer">
            <GitHubMark /> GitHub
          </a>
        ) : null}
      </footer>
    </div>
  );
}

function OrcidMark() {
  return (
    <svg width="16" height="16" viewBox="0 0 256 256" aria-hidden="true">
      <circle cx="128" cy="128" r="128" fill="#A6CE39" />
      <path
        fill="#fff"
        d="M86 70a14 14 0 1 1-28 0 14 14 0 0 1 28 0zM72 96h22v98H72zM118 96h42c34 0 52 24 52 49 0 27-21 49-52 49h-42zm22 20v58h18c24 0 30-18 30-29 0-18-11-29-31-29z"
      />
    </svg>
  );
}

function LinkedInMark() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M4.98 3.5a2.5 2.5 0 1 1-.02 5 2.5 2.5 0 0 1 .02-5zM3 9h4v12H3zM9 9h3.8v1.7h.05c.53-1 1.83-2.05 3.77-2.05 4.03 0 4.78 2.65 4.78 6.1V21h-4v-5.4c0-1.29-.02-2.95-1.8-2.95-1.8 0-2.08 1.4-2.08 2.85V21H9z" />
    </svg>
  );
}

function MailMark() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <path d="m3 7 9 6 9-6" />
    </svg>
  );
}

function GitHubMark() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
      <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82a7.65 7.65 0 0 1 2-.27c.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.01 8.01 0 0 0 16 8c0-4.42-3.58-8-8-8z" />
    </svg>
  );
}

function CoffeeMark() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M17 8h1a4 4 0 1 1 0 8h-1" />
      <path d="M3 8h14v9a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4z" />
      <line x1="6" y1="2" x2="6" y2="4" />
      <line x1="10" y1="2" x2="10" y2="4" />
      <line x1="14" y1="2" x2="14" y2="4" />
    </svg>
  );
}

/** Icon for trust card `i` — Free / Private / Open source / Responsible. */
function trustIcon(i: number) {
  const common = {
    width: 22,
    height: 22,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.8,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    "aria-hidden": true,
  };
  // Free: heart (generous / not-for-profit).
  if (i === 0)
    return (
      <svg {...common}>
        <path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.6l-1-1a5.5 5.5 0 0 0-7.8 7.8l1 1 7.8 7.8 7.8-7.8 1-1a5.5 5.5 0 0 0 0-7.8z" />
      </svg>
    );
  // Private: shield.
  if (i === 1)
    return (
      <svg {...common}>
        <path d="M12 2 4 5v6c0 5 3.4 8.5 8 11 4.6-2.5 8-6 8-11V5z" />
        <path d="m9 12 2 2 4-4" />
      </svg>
    );
  // Open source: code brackets.
  if (i === 2)
    return (
      <svg {...common}>
        <path d="m16 18 4-6-4-6" />
        <path d="m8 6-4 6 4 6" />
      </svg>
    );
  // Responsible: balance scale (responsible research assessment).
  return (
    <svg {...common}>
      <path d="M12 3v18" />
      <path d="M5 7h14" />
      <path d="M7 3h10" />
      <path d="m5 7-3 6a3 3 0 0 0 6 0z" />
      <path d="m19 7-3 6a3 3 0 0 0 6 0z" />
    </svg>
  );
}
