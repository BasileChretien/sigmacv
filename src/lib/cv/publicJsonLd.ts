import type { CanonicalCv } from "@/lib/canonical/schema";
import { absoluteUrl } from "@/lib/siteUrl";

/**
 * ProfilePage + Person JSON-LD for an opt-in indexable public CV. Only the
 * account holder's own already-public identity (name, headline, ORCID) is
 * described — never anyone else's. Returned as a JSON string with "<" escaped
 * to "<" so it is safe to embed inside an HTML <script> element even if a
 * field contained "</script>".
 */
export function profilePageJsonLd(cv: CanonicalCv, slug: string): string {
  const owner = cv.owner;
  const orcidUrl = owner.orcid ? `https://orcid.org/${owner.orcid}` : undefined;

  const person: Record<string, unknown> = {
    "@type": "Person",
    name: owner.displayName || "Researcher",
  };
  if (owner.headline) person.jobTitle = owner.headline;
  if (orcidUrl) {
    person.identifier = orcidUrl;
    person.sameAs = [orcidUrl];
  }

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "ProfilePage",
    url: absoluteUrl(`p/${slug}`),
    inLanguage: cv.display.locale,
    mainEntity: person,
  };

  return JSON.stringify(jsonLd).replace(/</g, "\\u003c");
}
