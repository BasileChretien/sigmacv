import { safeHref } from "@/lib/render/escape";

/**
 * Site-owner links for the app chrome (footer / landing / About), configured
 * via public env vars. Each is sanitized (http/https only) and empty when
 * unset, so the open-source build stays generic and a deployer opts in.
 *
 * These belong to the SITE/creator — never to a user's CV. They are NEVER
 * injected into a rendered or published CV.
 */
export interface SiteLinks {
  github: string;
  linkedin: string;
  coffee: string;
}

export function getSiteLinks(): SiteLinks {
  return {
    github: safeHref(process.env.NEXT_PUBLIC_GITHUB_URL),
    linkedin: safeHref(process.env.NEXT_PUBLIC_LINKEDIN_URL),
    coffee: safeHref(process.env.NEXT_PUBLIC_BUYMEACOFFEE_URL),
  };
}
