import { getSiteLinks } from "@/lib/siteLinks";

/**
 * A small row of site-owner links (GitHub, LinkedIn, Buy me a coffee) for the
 * landing/footer/About chrome. Renders nothing if none are configured.
 */
export default function SiteLinks({ className }: { className?: string }) {
  const { github, linkedin, coffee } = getSiteLinks();
  if (!github && !linkedin && !coffee) return null;
  return (
    <nav className={className ?? "site-links"} aria-label="Links">
      {github ? (
        <a href={github} target="_blank" rel="noopener noreferrer">
          GitHub
        </a>
      ) : null}
      {linkedin ? (
        <a href={linkedin} target="_blank" rel="noopener noreferrer">
          LinkedIn
        </a>
      ) : null}
      {coffee ? (
        <a href={coffee} target="_blank" rel="noopener noreferrer" className="coffee-btn">
          ☕ Buy me a coffee
        </a>
      ) : null}
    </nav>
  );
}
