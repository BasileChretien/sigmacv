import Link from "next/link";
import { asLocale } from "@/lib/i18n";
import { landingStrings } from "@/lib/i18n/landing";
import { getSiteLinks } from "@/lib/siteLinks";
import { siteFooterLinks } from "@/lib/siteNav";

/**
 * Shared footer for every public page except the homepage (which keeps its own).
 * Carries the full secondary-link set — privacy, contact, FAQ, guides, glossary,
 * examples, principles, FAIR, transparency, accessibility — so any content page
 * can reach every other, plus the copyright line and the GitHub link. Mirrors the
 * homepage footer (same links via `siteFooterLinks`) for a consistent feel.
 */
export default function SiteFooter({ locale }: { locale: string }) {
  const loc = asLocale(locale);
  const s = landingStrings(loc);
  const links = getSiteLinks();
  const footerLinks = siteFooterLinks(loc);

  return (
    <footer className="site-footer">
      <span className="site-footer-copy">{s.footer}</span>
      <nav className="site-footer-links" aria-label="Footer">
        {footerLinks.map((l) => (
          <Link key={l.href} href={l.href}>
            {l.label}
          </Link>
        ))}
      </nav>
      {links.github ? (
        <a className="site-footer-gh" href={links.github} target="_blank" rel="noopener noreferrer">
          <GitHubMark /> GitHub
        </a>
      ) : null}
    </footer>
  );
}

function GitHubMark() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
      <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82a7.65 7.65 0 0 1 2-.27c.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.01 8.01 0 0 0 16 8c0-4.42-3.58-8-8-8z" />
    </svg>
  );
}
