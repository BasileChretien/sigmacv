import { licenseInfo } from "@/lib/canonical/license";
import {
  itemDisplayText,
  type CanonicalCv,
  type CvItem,
  type CvSection,
} from "@/lib/canonical/schema";
import { visibleItems, visibleSections } from "@/lib/canonical/curate";
import { serializeJsonLd } from "@/lib/jsonLd";
import { safeHref } from "@/lib/render/escape";
import { absoluteUrl } from "@/lib/siteUrl";

/** The canonical ROR IRI shape: `https://ror.org/<id>` (lowercase alnum body). */
const ROR_IRI = /^https:\/\/ror\.org\/[0-9a-z]+$/;

/**
 * Normalise a stored ROR id to its canonical, ATTACKER-PROOF IRI, or undefined.
 *
 * `safeHref` only blocks `javascript:`/`data:`; a stored full URL would
 * otherwise pass through verbatim, letting a crafted `meta.rorId` emit any
 * `https://…` `@id`/`identifier`. So we validate strictly against the ROR domain
 * pattern: a full URL is accepted ONLY if it already is `https://ror.org/<id>`;
 * a bare id becomes `https://ror.org/<id>` and is re-validated. Anything else
 * (foreign host, http, junk) returns undefined and the caller omits the field.
 */
function rorIri(rorId: string): string | undefined {
  if (ROR_IRI.test(rorId)) return rorId;
  if (/^https?:\/\//i.test(rorId)) return undefined;
  const built = `https://ror.org/${rorId}`;
  return ROR_IRI.test(built) ? built : undefined;
}

/**
 * The owner's most recent / top-most VISIBLE position, used to build the
 * schema.org affiliation Organization. We take the first visible item of the
 * visible `positions` section — items there are recency-ordered at build (and
 * the user's own ordering wins after that), so position 0 is the current/most
 * recent role. Returns null when there's no visible positions section/item.
 */
function primaryPosition(cv: CanonicalCv): CvItem | null {
  const section: CvSection | undefined = visibleSections(cv).find((s) => s.type === "positions");
  if (!section) return null;
  const items = visibleItems(section);
  return items[0] ?? null;
}

/**
 * schema.org Organization for the owner's current affiliation, or undefined.
 * `@id` is the ROR IRI (`https://ror.org/<id>`) when the position carries a
 * `meta.rorId` — a stable, linkable identifier for the institution; `identifier`
 * mirrors it. `name` is the position's display string (the only label we have).
 */
function affiliationOrg(cv: CanonicalCv): Record<string, unknown> | undefined {
  const pos = primaryPosition(cv);
  const name = pos ? itemDisplayText(pos)?.trim() : undefined;
  if (!name) return undefined;
  const org: Record<string, unknown> = { "@type": "Organization", name };
  const rorId = pos?.meta.rorId?.trim();
  if (rorId) {
    // ROR ids are stored bare ("01abc23") or as a full URL — normalise to the
    // canonical ror.org IRI and emit it only if it validates against the ROR
    // domain pattern. A foreign/non-ror URL is dropped (never an attacker-
    // controllable @id); `safeHref` is the additional scheme guard.
    const iri = rorIri(rorId);
    if (iri && safeHref(iri)) {
      org["@id"] = iri;
      org.identifier = iri;
    }
  }
  return org;
}

/** Visible items of the first visible section of `type`, or []. */
function visibleSectionItems(cv: CanonicalCv, type: CvSection["type"]): CvItem[] {
  const section = visibleSections(cv).find((s) => s.type === type);
  return section ? visibleItems(section) : [];
}

/**
 * schema.org `MonetaryGrant` entities for the visible Grants section — funding the
 * researcher received, with the funder Organization (`@id` only when the stored
 * funder id is a safe http(s) IRI) and the award id as `identifier`.
 */
function fundingEntities(cv: CanonicalCv): Record<string, unknown>[] {
  const out: Record<string, unknown>[] = [];
  for (const item of visibleSectionItems(cv, "grants")) {
    const name = itemDisplayText(item)?.trim();
    if (!name) continue;
    const grant: Record<string, unknown> = { "@type": "MonetaryGrant", name };
    const award = item.meta.awardId?.trim();
    if (award) grant.identifier = award;
    const funderName = item.meta.funderName?.trim();
    if (funderName) {
      const funder: Record<string, unknown> = { "@type": "Organization", name: funderName };
      const fid = item.meta.funderId?.trim();
      const href = fid ? safeHref(fid) : "";
      if (href) funder["@id"] = href;
      grant.funder = funder;
    }
    out.push(grant);
  }
  return out;
}

/** schema.org entities (one `@type` per item) from a section's visible item labels. */
function labelledEntities(cv: CanonicalCv, type: CvSection["type"], schemaType: string) {
  return visibleSectionItems(cv, type)
    .map((it) => itemDisplayText(it)?.trim())
    .filter((n): n is string => Boolean(n))
    .map((name) => ({ "@type": schemaType, name }));
}

/**
 * `sameAs` URLs for the Person: the ORCID profile, the OpenAlex author
 * profile(s), the owner's explicit profile links, and a public website — every
 * one a URL the owner deliberately surfaced or that is their own canonical
 * scholarly identity. NEVER an email (mailto): `sameAs` is for public web
 * identities, and the email is gated behind a separate per-field publish
 * consent. De-duplicated; only safe http(s) URLs survive (drops
 * javascript:/data:/… from stored links).
 */
function sameAsUrls(cv: CanonicalCv, orcidUrl: string | undefined): string[] {
  const out = new Set<string>();
  if (orcidUrl) out.add(orcidUrl);
  // OpenAlex author ids are the owner's canonical bibliometric identity, so
  // they belong in sameAs. They are stored as bare short ids ("A5001069481") or
  // occasionally as a full URL — normalise to the canonical IRI either way, then
  // run the same safe-http(s) guard so nothing unexpected reaches the output.
  for (const rawId of cv.owner.openAlexAuthorIds ?? []) {
    const id = rawId.trim();
    if (!id) continue;
    const iri = /^https?:\/\//i.test(id) ? id : `https://openalex.org/${id}`;
    const href = safeHref(iri);
    if (href) out.add(href);
  }
  for (const link of cv.owner.links ?? []) {
    const href = safeHref(link.url);
    if (href) out.add(href);
  }
  const website = safeHref(cv.owner.contact?.website);
  if (website) out.add(website);
  // Wikidata entity + any VIAF / ISNI authority-file links it surfaced — the
  // owner's canonical authority identities (matched by ORCID). Same safe-http(s)
  // guard as the rest; the Set dedupes the Wikidata URI against wikidataSameAs.
  const wikidata = safeHref(cv.owner.wikidataUri);
  if (wikidata) out.add(wikidata);
  for (const uri of cv.owner.wikidataSameAs ?? []) {
    const href = safeHref(uri);
    if (href) out.add(href);
  }
  return [...out];
}

/**
 * ProfilePage + Person JSON-LD for an opt-in indexable public CV. Only the
 * account holder's own already-public identity (name, headline, ORCID, current
 * affiliation, profile links) is described — never anyone else's. Operates on
 * the PUBLIC-projected CV, so contact/personal fields the owner has not opted to
 * publish are already stripped (notably: no email ever appears here).
 *
 * Returned as a JSON string with "<" escaped to "<" so it is safe to embed
 * inside an HTML <script> element even if a field contained "</script>".
 */
export function profilePageJsonLd(cv: CanonicalCv, slug: string): string {
  const owner = cv.owner;
  const orcidUrl = owner.orcid ? `https://orcid.org/${owner.orcid}` : undefined;

  const person: Record<string, unknown> = {
    "@type": "Person",
    name: owner.displayName || "Researcher",
  };
  if (owner.headline) person.jobTitle = owner.headline;
  if (orcidUrl) person.identifier = orcidUrl;

  const sameAs = sameAsUrls(cv, orcidUrl);
  if (sameAs.length > 0) person.sameAs = sameAs;

  const org = affiliationOrg(cv);
  if (org) {
    // Both keys are standard for a Person's institutional tie; emit both so
    // consumers keying off either pick it up.
    person.affiliation = org;
    person.worksFor = org;
  }

  // Richer entity graph: funding (grants), occupations (positions) and education
  // credentials — so a published CV's funding, roles and education are
  // machine-readable, not just the bare Person identity.
  const funding = fundingEntities(cv);
  if (funding.length > 0) person.funding = funding;
  const occupations = labelledEntities(cv, "positions", "Occupation");
  if (occupations.length > 0) person.hasOccupation = occupations;
  const credentials = labelledEntities(cv, "education", "EducationalOccupationalCredential");
  if (credentials.length > 0) person.hasCredential = credentials;

  const jsonLd: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "ProfilePage",
    url: absoluteUrl(`p/${slug}`),
    inLanguage: cv.display.locale,
    mainEntity: person,
  };

  // Whole-CV reuse license (FAIR): the SPDX URL when the owner chose a linkable
  // license; "none"/"all-rights-reserved" have no URL and are simply omitted.
  const license = licenseInfo(cv.display.cvLicense)?.url;
  if (license) jsonLd.license = license;

  return serializeJsonLd(jsonLd);
}
