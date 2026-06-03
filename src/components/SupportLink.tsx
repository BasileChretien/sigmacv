import { safeHref } from "@/lib/render/escape";

/**
 * "Buy me a coffee" support link for the site owner. Configured via the public
 * env var NEXT_PUBLIC_BUYMEACOFFEE_URL — renders nothing when unset, so the
 * open-source build stays generic and a deployer opts in by setting their own
 * link. The URL is sanitized (http/https only) as defence-in-depth.
 *
 * Deliberately part of the app chrome (editor / landing), NOT the rendered CV —
 * it must never appear on a user's exported or published CV.
 */
const RAW_URL = process.env.NEXT_PUBLIC_BUYMEACOFFEE_URL ?? "";

export default function SupportLink({ className }: { className?: string }) {
  const url = safeHref(RAW_URL);
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
