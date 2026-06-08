import Link from "next/link";
import { enabledProviders } from "@/auth.config";
import { signInWithEmail, signInWithGoogle, signInWithOrcid } from "@/app/auth-actions";
import { asLocale, t } from "@/lib/i18n";
import { accessibilityStrings } from "@/lib/i18n/accessibility";
import { contactStrings } from "@/lib/i18n/contact";
import { faqStrings } from "@/lib/i18n/faq";
import { landingStrings } from "@/lib/i18n/landing";
import { LANDING_PAGE_IDS, landingPageStrings } from "@/lib/i18n/landingPages";
import {
  localeAboutPath,
  localeAccessibilityPath,
  localeContactPath,
  localeFaqPath,
  localeLandingPagePath,
  localePrivacyPath,
} from "@/lib/seo";
import { getSiteLinks } from "@/lib/siteLinks";
import LanguageSwitcher from "./LanguageSwitcher";
import SiteLinks from "./SiteLinks";
import StructuredData from "./StructuredData";

/** ORCID profile URL of SigmaCV's creator (links the "Built by a researcher" credit). */
const CREATOR_ORCID_URL = "https://orcid.org/0000-0002-7483-2489";

/**
 * The open-data sources the CV is built from, with their canonical homepages.
 * Rendered as the linked "source strip" under the hero (proper-noun brand names,
 * never translated). Order ≈ prominence.
 */
const SOURCE_LINKS: { name: string; url: string }[] = [
  { name: "OpenAlex", url: "https://openalex.org" },
  { name: "ORCID", url: "https://orcid.org" },
  { name: "Crossref", url: "https://www.crossref.org" },
  { name: "DataCite", url: "https://datacite.org" },
  { name: "OpenAIRE", url: "https://www.openaire.eu" },
  { name: "DBLP", url: "https://dblp.org" },
  { name: "Open Editors Plus", url: "https://openeditors-plus.org" },
  { name: "ClinicalTrials.gov", url: "https://clinicaltrials.gov" },
  { name: "EU CTIS", url: "https://euclinicaltrials.eu" },
  { name: "EPO", url: "https://www.epo.org" },
  { name: "Wikidata", url: "https://www.wikidata.org" },
  { name: "ROR", url: "https://ror.org" },
];

/**
 * The six floating chips in the hero brand graphic, each cross-fading between two
 * source names so all twelve sources appear over the animation loop (freezes on
 * the first name under prefers-reduced-motion). The longer names sit on the three
 * left-anchored chips (indices 0, 2, 4) so they extend into open space, not over
 * the central medallion. Decorative (the chips are aria-hidden).
 */
const HERO_CHIPS: [string, string][] = [
  ["OpenAlex", "Open Editors Plus"],
  ["ORCID", "Wikidata"],
  ["Crossref", "ClinicalTrials.gov"],
  ["DataCite", "EU CTIS"],
  ["OpenAIRE", "ROR"],
  ["DBLP", "EPO"],
];

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
      <a href="#auth-main" className="skip-link">
        {t(loc, "skipToContent")}
      </a>
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

      <main className="auth-main" id="auth-main">
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

        <div className="hero-right">
          <HeroGraphic />
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
                  aria-label={s.emailLabel}
                />
                <button type="submit" className="btn">
                  {s.emailButton}
                </button>
              </form>
            ) : null}

            <p className="auth-fineprint muted">{s.fineprint}</p>
          </section>
        </div>
      </main>

      {/* Source strip: the open data sources the CV is built from. The names are
          brand proper nouns (like "Σ"/"SigmaCV"), reinforcing the hero copy. */}
      <div className="source-strip" aria-label="Open research data sources SigmaCV builds from">
        {SOURCE_LINKS.map((src) => (
          <a
            key={src.name}
            className="source-pill"
            href={src.url}
            target="_blank"
            rel="noopener noreferrer"
          >
            {src.name}
          </a>
        ))}
      </div>

      <section className="landing-section landing-features" aria-labelledby="features-h">
        <h2 id="features-h" className="landing-section-title">
          {s.featuresTitle}
        </h2>
        <ul className="feature-grid">
          {s.features.map((f) => (
            <li key={f.title} className="feature-card card">
              <h3 className="feature-card-title">{f.title}</h3>
              <p className="feature-card-body muted">{f.body}</p>
            </li>
          ))}
        </ul>
      </section>

      <section className="landing-section landing-trust" aria-labelledby="trust-h">
        <h2 id="trust-h" className="landing-section-title">
          {s.trustTitle}
        </h2>
        <ul className="trust-grid">
          {s.trust.map((tr) => (
            <li key={tr.title} className="trust-card card">
              <h3 className="trust-card-title">{tr.title}</h3>
              <p className="trust-card-body muted">{tr.body}</p>
            </li>
          ))}
        </ul>
        <p className="creator-credit">
          <strong>{s.creatorTitle}</strong>{" "}
          <CreatorBody
            text={s.creatorBody}
            orcidUrl={CREATOR_ORCID_URL}
            aboutHref={localeAboutPath(loc)}
            githubUrl={getSiteLinks().github}
          />
        </p>
        {/* The creator is an individual DORA signatory; SigmaCV is built for
            responsible research assessment. Official badge, self-hosted; the
            black/white variants swap with the colour scheme. */}
        <a
          className="dora-badge"
          href="https://sfdora.org/"
          target="_blank"
          rel="noopener noreferrer"
          title="Supports DORA — the Declaration on Research Assessment"
        >
          <picture>
            <source media="(prefers-color-scheme: dark)" srcSet="/dora-supporter-dark.webp" />
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/dora-supporter.webp"
              alt="Supports DORA — the San Francisco Declaration on Research Assessment"
              width={56}
              height={56}
              loading="lazy"
            />
          </picture>
        </a>
      </section>

      <section className="landing-section landing-explore" aria-labelledby="explore-h">
        <h2 id="explore-h" className="landing-section-title">
          {s.exploreTitle}
        </h2>
        <ul className="explore-links">
          {LANDING_PAGE_IDS.map((page) => {
            const p = landingPageStrings(page, loc);
            return (
              <li key={page}>
                <Link href={localeLandingPagePath(page, loc)}>{p.navLabel}</Link>
                <span className="muted explore-desc">{p.subhead}</span>
              </li>
            );
          })}
        </ul>
      </section>

      <footer className="auth-footer">
        <span className="muted">{s.footer}</span>
        <Link className="footer-link" href={localePrivacyPath(loc)}>
          {t(loc, "privacy")}
        </Link>
        <Link className="footer-link" href={localeContactPath(loc)}>
          {contactStrings(loc).heading}
        </Link>
        <Link className="footer-link" href={localeFaqPath(loc)}>
          {faqStrings(loc).navLabel}
        </Link>
        <Link className="footer-link" href={localeAccessibilityPath(loc)}>
          {accessibilityStrings(loc).navLabel}
        </Link>
        <SiteLinks locale={loc} />
      </footer>
    </div>
  );
}

/** The creator name as it appears in every locale's `creatorBody` (proper noun,
 *  never translated) — split on it to turn the name into an ORCID link. */
const CREATOR_NAME = "Basile Chrétien";

/**
 * Renders the "Built by a researcher" body with the creator's name linked to
 * their ORCID, then appends a small "About · GitHub" link row. The name token is
 * identical across all ten locales (it's an untranslated proper noun), so a plain
 * split on it works for every language.
 */
function CreatorBody({
  text,
  orcidUrl,
  aboutHref,
  githubUrl,
}: {
  text: string;
  orcidUrl: string;
  aboutHref: string;
  githubUrl: string;
}) {
  const [before, after] = text.split(CREATOR_NAME);
  return (
    <>
      {before}
      <a href={orcidUrl} target="_blank" rel="noopener noreferrer">
        {CREATOR_NAME}
      </a>
      {/* When the proper noun isn't present (defensive), fall back to plain text. */}
      {after ?? ""} <Link href={aboutHref}>About</Link>
      {githubUrl ? (
        <>
          {" · "}
          <a href={githubUrl} target="_blank" rel="noopener noreferrer">
            GitHub
          </a>
        </>
      ) : null}
    </>
  );
}

/**
 * Decorative hero brand graphic: six floating open-data source chips around a
 * central Σ medallion (soft core glow) that pulses as the CV silhouette fills in
 * line by line, with a self-name highlight — open data assembling into a CV. Each
 * chip cross-fades between two of the twelve sources, so all appear over the loop.
 * Purely decorative (aria-hidden), reserved aspect-ratio (no layout shift), and
 * motion-safe (a self-contained prefers-reduced-motion block freezes it to a
 * settled state). Source names are brand proper nouns (like "Σ"/"SigmaCV"), not
 * translated copy.
 */
function HeroGraphic() {
  return (
    <div className="hero-graphic" aria-hidden="true">
      <span className="hg-blob hg-blob-1" />
      <span className="hg-blob hg-blob-2" />
      <span className="hg-blob hg-blob-3" />

      <svg
        className="hg-lines"
        viewBox="0 0 480 420"
        fill="none"
        focusable="false"
        role="presentation"
        preserveAspectRatio="xMidYMid meet"
      >
        <defs>
          <radialGradient id="hgCore" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="var(--accent-400)" stopOpacity="0.55" />
            <stop offset="100%" stopColor="var(--accent-500)" stopOpacity="0" />
          </radialGradient>
        </defs>
        <circle className="hg-core-glow" cx="240" cy="206" r="92" fill="url(#hgCore)" />
      </svg>

      <span className="hg-doc">
        <span className="hg-doc-line">
          <span className="hg-doc-fill" />
        </span>
        <span className="hg-doc-line hg-doc-name">
          <span className="hg-doc-hl" />
          <span className="hg-doc-fill" />
          <span className="hg-doc-sweep" />
        </span>
        <span className="hg-doc-line short">
          <span className="hg-doc-fill" />
        </span>
        <span className="hg-doc-line">
          <span className="hg-doc-fill" />
        </span>
        <span className="hg-doc-line short">
          <span className="hg-doc-fill" />
        </span>
      </span>

      <span className="hg-medallion">
        <span className="hg-ring" />
        <span className="hg-glyph">Σ</span>
      </span>

      {HERO_CHIPS.map(([first, second], i) => (
        <span key={first} className={`hg-chip hg-chip-${i + 1}`}>
          <span className="hg-chip-label hg-cyc-a">{first}</span>
          <span className="hg-chip-label hg-cyc-b">{second}</span>
        </span>
      ))}
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
