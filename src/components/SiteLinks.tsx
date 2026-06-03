import { getSiteLinks } from "@/lib/siteLinks";

/** GitHub mark. */
function GithubIcon() {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor" aria-hidden="true">
      <path d="M12 .5C5.37.5 0 5.78 0 12.29c0 5.2 3.44 9.6 8.21 11.16.6.11.82-.26.82-.58 0-.29-.01-1.04-.02-2.04-3.34.71-4.04-1.58-4.04-1.58-.55-1.38-1.34-1.75-1.34-1.75-1.09-.73.08-.72.08-.72 1.2.08 1.83 1.21 1.83 1.21 1.07 1.8 2.81 1.28 3.5.98.11-.76.42-1.28.76-1.57-2.67-.3-5.47-1.31-5.47-5.84 0-1.29.47-2.34 1.24-3.17-.12-.3-.54-1.52.12-3.17 0 0 1.01-.32 3.3 1.21.96-.26 1.98-.39 3-.4 1.02.01 2.04.14 3 .4 2.29-1.53 3.3-1.21 3.3-1.21.66 1.65.24 2.87.12 3.17.77.83 1.24 1.88 1.24 3.17 0 4.54-2.81 5.53-5.49 5.83.43.36.81 1.08.81 2.18 0 1.57-.01 2.84-.01 3.23 0 .32.22.7.83.58A11.8 11.8 0 0 0 24 12.29C24 5.78 18.63.5 12 .5z" />
    </svg>
  );
}

/** LinkedIn "in" mark. */
function LinkedinIcon() {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor" aria-hidden="true">
      <path d="M20.45 20.45h-3.56v-5.57c0-1.33-.02-3.04-1.85-3.04-1.85 0-2.14 1.45-2.14 2.94v5.67H9.34V9h3.42v1.56h.05c.48-.9 1.64-1.85 3.37-1.85 3.6 0 4.27 2.37 4.27 5.45v6.29zM5.34 7.43a2.07 2.07 0 1 1 0-4.14 2.07 2.07 0 0 1 0 4.14zM7.12 20.45H3.56V9h3.56v11.45zM22.22 0H1.77C.79 0 0 .77 0 1.72v20.56C0 23.23.79 24 1.77 24h20.45c.98 0 1.78-.77 1.78-1.72V1.72C24 .77 23.2 0 22.22 0z" />
    </svg>
  );
}

/**
 * A small row of site-owner links for the landing/footer/About chrome.
 * GitHub + LinkedIn render as icons; Buy me a coffee stays a labelled button.
 * Renders nothing if none are configured.
 */
export default function SiteLinks({ className }: { className?: string }) {
  const { github, linkedin, coffee } = getSiteLinks();
  if (!github && !linkedin && !coffee) return null;
  return (
    <nav className={className ?? "site-links"} aria-label="Links">
      {github ? (
        <a
          href={github}
          target="_blank"
          rel="noopener noreferrer"
          className="icon-link"
          aria-label="GitHub"
          title="GitHub"
        >
          <GithubIcon />
        </a>
      ) : null}
      {linkedin ? (
        <a
          href={linkedin}
          target="_blank"
          rel="noopener noreferrer"
          className="icon-link"
          aria-label="LinkedIn"
          title="LinkedIn"
        >
          <LinkedinIcon />
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
