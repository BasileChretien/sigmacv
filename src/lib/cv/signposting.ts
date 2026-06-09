import { licenseInfo } from "@/lib/canonical/license";
import type { CanonicalCv } from "@/lib/canonical/schema";
import { absoluteUrl } from "@/lib/siteUrl";
import { PUBLIC_FORMAT_META } from "./publicFormats";

/** A bare ORCID iD: four 4-digit groups, the last char a digit or the X checksum. */
const ORCID_RE = /^\d{4}-\d{4}-\d{4}-\d{3}[\dX]$/;
/** A bare OpenAlex author id: "A" followed by digits (e.g. "A5001069481"). */
const OPENALEX_AUTHOR_RE = /^A\d+$/;

/**
 * FAIR Signposting (https://signposting.org) typed links for a published public
 * CV page, returned as an HTTP `Link` header value (RFC 8288).
 *
 * Signposting lets a machine agent that lands on the human page discover — from
 * the response headers alone — the author identifier(s), the typed machine
 * representations, the resource type, and the reuse license. It is the
 * lightweight, recognised complement to the `Accept` content negotiation the
 * route already does, and it advertises exactly the representations that route
 * already serves, so it exposes nothing a published page didn't already serve.
 *
 * Typed links emitted (all absolute URLs):
 *   - `type`        → https://schema.org/ProfilePage  (what this resource IS)
 *   - `author`      → the owner's ORCID + OpenAlex author profile(s)
 *   - `describedby` → each machine representation (.jsonld / .csl.json / .bib /
 *                     .json), each tagged with its media `type`
 *   - `license`     → the CV reuse-license URL, when the owner chose a linkable one
 *
 * `cite-as` (the resource's OWN persistent identifier) is intentionally NOT
 * emitted yet: a CV has no DOI until the snapshot-DOI feature (open-science
 * roadmap C5). ORCID is the AUTHOR pid and is surfaced under `author`, never as
 * the resource's `cite-as`.
 *
 * HEADER SAFETY: `owner.orcid` / `owner.openAlexAuthorIds` are `z.string()` in the
 * schema (length-capped only) and `safeHref` does not strip CRLF, so both are
 * validated here against strict patterns before going into a header. The slug is
 * already validated by the route (`isValidPublicSlug`, `^[a-z0-9][a-z0-9-]*$`)
 * before this runs, and the license URL is a fixed SPDX constant — so the format
 * and license links are inherently header-safe.
 *
 * Pure; operates on the PUBLIC-projected `CanonicalCv` (the same input as the
 * JSON-LD). Always returns a non-empty value (the `type` + format links are
 * unconditional).
 */
export function signpostingLinkHeader(cv: CanonicalCv, slug: string): string {
  const links: string[] = ['<https://schema.org/ProfilePage>; rel="type"'];

  // Author persistent identifiers — strictly validated for header safety.
  const authors = new Set<string>();
  const orcid = cv.owner.orcid.trim();
  if (orcid && ORCID_RE.test(orcid)) authors.add(`https://orcid.org/${orcid}`);
  for (const rawId of cv.owner.openAlexAuthorIds) {
    const id = rawId.trim().replace(/^https?:\/\/openalex\.org\//i, "");
    if (OPENALEX_AUTHOR_RE.test(id)) authors.add(`https://openalex.org/${id}`);
  }
  for (const url of authors) links.push(`<${url}>; rel="author"`);

  // Typed machine representations (the formats the route content-negotiates).
  for (const meta of Object.values(PUBLIC_FORMAT_META)) {
    const url = absoluteUrl(`p/${slug}.${meta.extension}`);
    links.push(`<${url}>; rel="describedby"; type="${meta.mediaType}"`);
  }

  // Whole-CV reuse license (a fixed SPDX URL), when the owner chose a linkable one.
  const license = licenseInfo(cv.display.cvLicense)?.url;
  if (license) links.push(`<${license}>; rel="license"`);

  return links.join(", ");
}
