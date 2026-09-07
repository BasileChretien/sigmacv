import { METADATA_LICENSE_URL, licenseInfo } from "@/lib/canonical/license";
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
 *   - `license`     → the CC0 metadata-reuse URL (always; the exposed records are
 *                     CC0), plus the CV CONTENT license URL when the owner chose one
 *
 * `cite-as` (the resource's OWN persistent identifier) is emitted ONLY for a
 * frozen snapshot that has a minted DOI (`opts.citeAsDoi`, roadmap C5); the
 * living page has no DOI. ORCID is the AUTHOR pid and is surfaced under
 * `author`, never as the resource's `cite-as`.
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
/** Snapshot-page variant: point the `describedby` links at the frozen page's
 *  OWN machine formats and, once a DOI is minted, advertise it as `cite-as`. */
export interface SignpostingOpts {
  /** Site-relative path of the resource (no leading slash), e.g.
   *  `p/<slug>/v/<token>`; defaults to the living page `p/<slug>`. */
  resourcePath?: string;
  /** A bare DOI ("10.1234/abcd") → `<https://doi.org/…>; rel="cite-as"`. */
  citeAsDoi?: string | null;
}

/** A bare DOI: "10.<4–9 digits>/<suffix>" with header-safe characters only. */
const DOI_RE = /^10\.\d{4,9}\/[A-Za-z0-9._;()/:-]+$/;

export function signpostingLinkHeader(
  cv: CanonicalCv,
  slug: string,
  opts: SignpostingOpts = {},
): string {
  const links: string[] = ['<https://schema.org/ProfilePage>; rel="type"'];

  // The resource's OWN persistent identifier — only a minted snapshot has one.
  // Strictly validated (it goes into a header); the living page has no DOI.
  if (opts.citeAsDoi && DOI_RE.test(opts.citeAsDoi)) {
    links.push(`<https://doi.org/${opts.citeAsDoi}>; rel="cite-as"`);
  }

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
  const resourcePath = opts.resourcePath ?? `p/${slug}`;
  for (const meta of Object.values(PUBLIC_FORMAT_META)) {
    const url = absoluteUrl(`${resourcePath}.${meta.extension}`);
    links.push(`<${url}>; rel="describedby"; type="${meta.mediaType}"`);
  }

  // Reuse licenses (fixed SPDX URLs → inherently header-safe). The exposed
  // METADATA is always CC0 (open-science norm; freely reusable records); the
  // owner's chosen CV CONTENT license is advertised alongside it when set.
  // De-duplicated so a CC0 content license isn't listed twice.
  const licenses = new Set<string>([METADATA_LICENSE_URL]);
  const content = licenseInfo(cv.display.cvLicense)?.url;
  if (content) licenses.add(content);
  for (const url of licenses) links.push(`<${url}>; rel="license"`);

  return links.join(", ");
}
