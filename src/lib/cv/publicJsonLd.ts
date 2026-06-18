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
import type { CoauthorCvLink } from "@/lib/cv/coauthorLinks";

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
 * schema.org `knows` Person nodes for co-authors who have their OWN published,
 * search-indexable SigmaCV CV (resolved by ORCID identifier upstream, never by
 * name). Each carries the co-author's ORCID IRI (`@id`-style `identifier` +
 * `sameAs`) and the URL of their SigmaCV profile — the cross-CV collaboration
 * graph for search / answer engines. Every URL passes the `safeHref` scheme
 * guard; a node without a safe ORCID IRI AND profile URL is dropped.
 */
function knowsEntities(links: readonly CoauthorCvLink[]): Record<string, unknown>[] {
  const out: Record<string, unknown>[] = [];
  for (const link of links) {
    const orcidIri = safeHref(`https://orcid.org/${link.orcid}`);
    const profileUrl = safeHref(absoluteUrl(`p/${link.slug}`));
    /* v8 ignore next -- defensive: resolveCoauthorCvs already guarantees a URL-safe ORCID iD + slug */
    if (!orcidIri || !profileUrl) continue;
    out.push({
      "@type": "Person",
      name: link.name,
      identifier: orcidIri,
      sameAs: [orcidIri],
      url: profileUrl,
    });
  }
  return out;
}

/** The canonical DOI IRI shape: `https://doi.org/10.<registrant>/<suffix>`. */
const DOI_IRI = /^https:\/\/doi\.org\/10\.\d{4,9}\/\S+$/;

/**
 * Normalise a stored DOI to its canonical, ATTACKER-PROOF IRI
 * `https://doi.org/<doi>`, or undefined. Accepts a bare DOI ("10.1/x"), a
 * "doi:"-prefixed one, or a full doi.org / dx.doi.org URL. Mirrors `rorIri`: a
 * full URL is reduced to its `10.<reg>/<suffix>` body and ALWAYS re-hosted on
 * doi.org, so a crafted `meta.doi` can never emit an arbitrary-host `@id`.
 * `safeHref` is the additional scheme guard.
 */
function doiIri(raw: string | undefined): string | undefined {
  let s = raw?.trim().replace(/^doi:\s*/i, "");
  if (!s) return undefined;
  if (/^https?:\/\//i.test(s)) {
    const m = s.match(/10\.\d{4,9}\/\S+$/);
    if (!m) return undefined;
    s = m[0];
  }
  const iri = `https://doi.org/${s}`;
  if (!DOI_IRI.test(iri)) return undefined;
  return safeHref(iri) || undefined;
}

/** Publication year as a string (schema.org `datePublished`), from `meta.year`
 *  or the CSL `issued` date, or undefined. */
function workYear(item: CvItem): string | undefined {
  if (typeof item.meta.year === "number") return String(item.meta.year);
  const part = item.csl?.issued?.["date-parts"]?.[0]?.[0];
  if (typeof part === "number") return String(part);
  if (typeof part === "string" && /^\d{4}/.test(part)) return part.slice(0, 4);
  return undefined;
}

/** The work-bearing citation sections turned into per-work schema.org entities. */
const WORK_SECTION_TYPES = new Set<string>(["publications", "preprints", "conference", "datasets"]);

/**
 * Per-work schema.org entities for the visible work sections: publications,
 * preprints and conference papers → `ScholarlyArticle`; the datasets/software
 * section → `Dataset` (or `SoftwareSourceCode` when the item is software). Each
 * node carries the DOI as its `@id`/`identifier`/`url`/`sameAs` when known, the
 * publication year, the venue, and an open-access flag — making the CV's outputs
 * machine-readable (Google Dataset Search, answer engines), not just the bare
 * Person identity. Attached to the Person via `@reverse.author` by the caller, so
 * each work is asserted to have the account holder as an author.
 *
 * Operates on the PUBLIC-projected CV via `visibleSections`/`visibleItems`, so a
 * hidden or "not mine" work is never described here. A work with no clean title
 * (`csl.title`) is skipped — without one there is no useful node to emit.
 */
function scholarlyEntities(cv: CanonicalCv): Record<string, unknown>[] {
  const out: Record<string, unknown>[] = [];
  for (const section of visibleSections(cv)) {
    if (!WORK_SECTION_TYPES.has(section.type)) continue;
    for (const item of visibleItems(section)) {
      const name = item.csl?.title?.trim();
      if (!name) continue;

      let schemaType = "ScholarlyArticle";
      if (section.type === "datasets") {
        const t = `${item.csl?.type ?? ""} ${item.meta.type ?? ""}`.toLowerCase();
        schemaType = /soft|code/.test(t) ? "SoftwareSourceCode" : "Dataset";
      }
      const node: Record<string, unknown> = { "@type": schemaType, name };

      const iri = doiIri(item.meta.doi ?? item.csl?.DOI);
      if (iri) {
        node["@id"] = iri;
        node.identifier = iri;
        node.url = iri;
        node.sameAs = [iri];
      }
      const year = workYear(item);
      if (year) node.datePublished = year;

      const venue = item.csl?.["container-title"]?.trim();
      if (venue && schemaType === "ScholarlyArticle") {
        node.isPartOf = { "@type": "Periodical", name: venue };
      }

      // Open-access location: use it as the page `url` only when there is no DOI
      // (the DOI is the canonical landing page), and flag free availability.
      const oa = safeHref(item.meta.oaUrl);
      if (oa && !node.url) node.url = oa;
      if (item.meta.oaIsOpen) node.isAccessibleForFree = true;

      out.push(node);
    }
  }
  return out;
}

/**
 * ProfilePage + Person JSON-LD for a published public CV (emitted whether or not
 * the owner opted into search indexing — it's structured data, not a crawl
 * permission; the page's `noindex` robots tag governs search inclusion). Only the
 * account holder's own already-public identity (name, headline, ORCID, current
 * affiliation, profile links) is described — never anyone else's. Operates on
 * the PUBLIC-projected CV, so contact/personal fields the owner has not opted to
 * publish are already stripped (notably: no email ever appears here).
 *
 * Returned as a JSON string with "<" escaped to "<" so it is safe to embed
 * inside an HTML <script> element even if a field contained "</script>".
 */
export function profilePageJsonLd(
  cv: CanonicalCv,
  slug: string,
  coauthorCvs: readonly CoauthorCvLink[] = [],
): string {
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

  // Co-authors who also have a public, indexable SigmaCV CV → schema.org `knows`
  // (the cross-CV collaboration graph). Empty for almost every CV today; grows
  // with adoption. Resolved by ORCID, server-side, gated on the co-author's own
  // indexing consent — see resolveCoauthorCvs.
  const knows = knowsEntities(coauthorCvs);
  if (knows.length > 0) person.knows = knows;

  // The owner's outputs as per-work entities (ScholarlyArticle / Dataset /
  // SoftwareSourceCode), attached via `@reverse.author` so each is asserted to
  // have this Person as an author — a machine-readable publication/dataset graph
  // for search and answer engines, keyed by DOI when known.
  const works = scholarlyEntities(cv);
  if (works.length > 0) person["@reverse"] = { author: works };

  const jsonLd: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "ProfilePage",
    url: absoluteUrl(`p/${slug}`),
    inLanguage: cv.display.locale,
    mainEntity: person,
  };

  // When the living page last re-synced from the open record (ISO 8601). Surfaces
  // the page's "freshness" to consumers — the core value of a living CV.
  if (cv.provenance.lastSyncedAt) jsonLd.dateModified = cv.provenance.lastSyncedAt;

  // Whole-CV reuse license (FAIR): the SPDX URL when the owner chose a linkable
  // license; "none"/"all-rights-reserved" have no URL and are simply omitted.
  const license = licenseInfo(cv.display.cvLicense)?.url;
  if (license) jsonLd.license = license;

  return serializeJsonLd(jsonLd);
}
