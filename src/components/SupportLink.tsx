import { getSiteLinks } from "@/lib/siteLinks";

/**
 * "Buy me a coffee" support link for the site owner. Configured via the public
 * env var NEXT_PUBLIC_BUYMEACOFFEE_URL — renders nothing when unset, so the
 * open-source build stays generic and a deployer opts in by setting their own
 * link. The URL is sanitized (http/https only) as defence-in-depth.
 *
 * Deliberately part of the app chrome (editor / landing), NOT the rendered CV —
 * it must never appear on a user's exported or published CV.
 */
export default function SupportLink({ className }: { className?: string }) {
  const url = getSiteLinks().coffee;
  if (!url) return null;
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className={className ?? "btn coffee-btn"}
      title="Support SigmaCV"
    >
      ☕ Buy me a coffee
    </a>
  );
}
