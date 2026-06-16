import Link from "next/link";
import { asLocale, t } from "@/lib/i18n";
import { landingStrings } from "@/lib/i18n/landing";
import { localeHomePath } from "@/lib/seo";
import { siteHeaderLinks } from "@/lib/siteNav";
import LanguageSwitcher from "./LanguageSwitcher";

/**
 * Shared top bar for every public page EXCEPT the homepage (which keeps its own
 * hero-integrated nav). Gives the previously dead-end content pages — SEO landing
 * pages, guides, glossary, examples, and the trust/info pages — a clickable brand
 * back to home, the content-hub links, the language switcher, and a primary
 * "Build my CV" call to action.
 *
 * A server component, so it adds no client JS (LanguageSwitcher is the only
 * island). The CTA simply links to the localized homepage: a logged-out visitor
 * lands on the sign-in card, and a logged-in one is redirected to their editor by
 * the homepage itself — so the header stays statically renderable (no `auth()`
 * call that would force these crawlable pages dynamic).
 */
export default function SiteHeader({ locale }: { locale: string }) {
  const loc = asLocale(locale);
  const s = landingStrings(loc);
  const home = localeHomePath(loc);
  const links = siteHeaderLinks(loc);

  return (
    <>
      <a href="#site-main" className="skip-link">
        {t(loc, "skipToContent")}
      </a>
      <header className="site-header">
        <Link href={home} className="site-brand" aria-label="SigmaCV — home">
          <span className="site-brand-mark" aria-hidden="true">
            Σ
          </span>
          SigmaCV
        </Link>
        <nav className="site-nav" aria-label="Primary">
          {links.map((l) => (
            <Link key={l.href} href={l.href}>
              {l.label}
            </Link>
          ))}
          <LanguageSwitcher current={loc} label={s.languageLabel} />
          <Link href={home} className="site-nav-cta">
            {s.ctaBuild}
          </Link>
        </nav>
      </header>
    </>
  );
}
