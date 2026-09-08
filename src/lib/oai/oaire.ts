import { licenseInfo } from "@/lib/canonical/license";
import type { CvSectionType } from "@/lib/canonical/schema";
import { currentAffiliation } from "@/lib/cv/publicJsonLd";
import { cslForRender } from "@/lib/render/cslOverride";
import { absoluteUrl } from "@/lib/siteUrl";
import type { CslItem } from "@/types/csl";
import type { OaiRecordInput, OaiWorkRecord } from "./oai";
import { creatorName, doiIri, escapeXml, workYear } from "./shared";

/**
 * The `oaire` metadata format: OpenAIRE Guidelines for Literature Repositories
 * v4 (`oaire:resource`, DataCite kernel-4 elements, COAR vocabularies). The
 * second format the OAI-PMH provider disseminates, beside `oai_dc`, so a CRIS
 * or OpenAIRE can match a harvested work BY IDENTIFIER: the owner's ORCID on
 * their own author entry, the DOI, the COAR access right and resource type.
 *
 * What it says, and what it deliberately does not:
 *
 *  - **Owner only.** Exactly one `datacite:nameIdentifier` (ORCID) can appear
 *    per work: the account holder's, on the author entry located by the
 *    identifier-derived `meta.authorPosition` — never by name. Co-author ORCIDs
 *    are stripped from the public projection (`meta.coauthorOrcids`) and stay
 *    out here; the co-authors are names, as on the page.
 *  - **Access right, honestly.** `oaIsOpen === true` (OpenAlex found an open
 *    copy) → COAR "open access"; `=== false` (no open copy indexed) → COAR
 *    "metadata only access" — what a reader of this record can actually get,
 *    not a claim that the work is paywalled or embargoed, which open data does
 *    not know; `undefined` (no determination) → the element is omitted rather
 *    than guessed. No "compliant"/"non-compliant" state exists in any output.
 *  - **Licence only when named.** `meta.license` is OpenAlex's own slug; a known
 *    Creative Commons slug is spelled out (versionless, since the source is),
 *    anything else is omitted.
 *  - **No per-work affiliation.** The owner's affiliation on THIS work is not
 *    public (`meta.workInstitutions` is stripped from the projection), and a
 *    2026 current affiliation on a 2010 paper would be false provenance. The
 *    self-declared current affiliation (with its ROR identifier) rides the
 *    CV-level record's creator instead, where it is exactly what the page's
 *    JSON-LD asserts; every work links back to that record's page.
 *  - **Version and funders omitted.** `oaire:version` is unknown today;
 *    funders are not stored per work yet.
 *
 * Every field is already public on `/p/<slug>` or its `.json`: this format
 * discloses nothing the Dublin Core one did not, it only keys it.
 *
 * Element order per the v4 guidelines (each element only when known):
 *   datacite:titles · datacite:creators · datacite:relatedIdentifiers ·
 *   dc:publisher · datacite:dates · oaire:resourceType · datacite:identifier ·
 *   datacite:rights · oaire:licenseCondition · oaire:citationTitle ·
 *   oaire:citationVolume · oaire:citationIssue · oaire:citationStartPage ·
 *   oaire:citationEndPage.
 * Sample per-work record (a 2019 journal article, owner second author):
 *
 *   <oaire:resource xmlns:oaire=… xmlns:datacite=… xmlns:dc=… xsi:schemaLocation=…>
 *     <datacite:titles><datacite:title>A test paper</datacite:title></datacite:titles>
 *     <datacite:creators>
 *       <datacite:creator>
 *         <datacite:creatorName nameType="Personal">Doe, John</datacite:creatorName>
 *         <datacite:givenName>John</datacite:givenName>
 *         <datacite:familyName>Doe</datacite:familyName>
 *       </datacite:creator>
 *       <datacite:creator>
 *         <datacite:creatorName nameType="Personal">Lovelace, Ada</datacite:creatorName>
 *         <datacite:givenName>Ada</datacite:givenName>
 *         <datacite:familyName>Lovelace</datacite:familyName>
 *         <datacite:nameIdentifier nameIdentifierScheme="ORCID" schemeURI="https://orcid.org/">https://orcid.org/0000-0002-7483-2489</datacite:nameIdentifier>
 *       </datacite:creator>
 *     </datacite:creators>
 *     <datacite:relatedIdentifiers>
 *       <datacite:relatedIdentifier relatedIdentifierType="URL" relationType="IsReferencedBy">https://sigmacv.org/p/ada-x7</datacite:relatedIdentifier>
 *     </datacite:relatedIdentifiers>
 *     <dc:publisher>Test Press</dc:publisher>
 *     <datacite:dates><datacite:date dateType="Issued">2019</datacite:date></datacite:dates>
 *     <oaire:resourceType resourceTypeGeneral="literature" uri="http://purl.org/coar/resource_type/c_6501">journal article</oaire:resourceType>
 *     <datacite:identifier identifierType="DOI">https://doi.org/10.1000/test.1</datacite:identifier>
 *     <datacite:rights rightsURI="http://purl.org/coar/access_right/c_abf2">open access</datacite:rights>
 *     <oaire:licenseCondition>CC BY</oaire:licenseCondition>
 *     <oaire:citationTitle>Journal of Tests</oaire:citationTitle>
 *     <oaire:citationVolume>12</oaire:citationVolume>
 *     <oaire:citationIssue>3</oaire:citationIssue>
 *     <oaire:citationStartPage>100</oaire:citationStartPage>
 *     <oaire:citationEndPage>110</oaire:citationEndPage>
 *   </oaire:resource>
 *
 * Spec: https://guidelines.openaire.eu/en/latest/literature/
 */

/** The format as `ListMetadataFormats` advertises it. */
export const OAIRE_SCHEMA = "https://www.openaire.eu/schema/repo-lit/4.0/openaire.xsd";
export const OAIRE_NAMESPACE = "http://namespace.openaire.eu/schema/oaire/";

const OAIRE_OPEN = `      <oaire:resource xmlns:oaire="${OAIRE_NAMESPACE}" xmlns:datacite="http://datacite.org/schema/kernel-4" xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:schemaLocation="${OAIRE_NAMESPACE} ${OAIRE_SCHEMA}">
`;
const OAIRE_CLOSE = `      </oaire:resource>`;
const INDENT = "        ";

/** One element line, or nothing when the value is blank. */
function el(tag: string, value: string | undefined, attrs = "", indent = INDENT): string {
  const v = value?.trim();
  return v ? `${indent}<${tag}${attrs}>${escapeXml(v)}</${tag}>\n` : "";
}

/** `<tag>…children…</tag>` on their own lines, or nothing when there are no children. */
function wrap(tag: string, children: string, indent = INDENT): string {
  return children ? `${indent}<${tag}>\n${children}${indent}</${tag}>\n` : "";
}

// ─── COAR vocabularies ────────────────────────────────────────────────────────

export interface CoarAccessRight {
  uri: string;
  label: string;
}

const COAR_ACCESS_RIGHT = "http://purl.org/coar/access_right/";

/**
 * The COAR access right for a stored OA determination. `true` → open access;
 * `false` → "metadata only access" (no open copy is indexed, so the metadata is
 * what this record gives access to — NOT "restricted", which would assert a
 * paywall or group the data knows nothing about); `undefined` → none (omitted).
 */
export function coarAccessRight(oaIsOpen: boolean | undefined): CoarAccessRight | undefined {
  if (oaIsOpen === true) return { uri: `${COAR_ACCESS_RIGHT}c_abf2`, label: "open access" };
  if (oaIsOpen === false)
    return { uri: `${COAR_ACCESS_RIGHT}c_14cb`, label: "metadata only access" };
  return undefined;
}

export interface CoarResourceType {
  uri: string;
  label: string;
  /** The `resourceTypeGeneral` attribute. */
  general: "literature" | "dataset" | "software" | "other";
}

const COAR_RESOURCE_TYPE = "http://purl.org/coar/resource_type/";

const rt = (id: string, label: string, general: CoarResourceType["general"] = "literature") =>
  ({ uri: `${COAR_RESOURCE_TYPE}${id}`, label, general }) as const;

const RT_PREPRINT = rt("c_816b", "preprint");
const RT_DATASET = rt("c_ddb1", "dataset", "dataset");
const RT_SOFTWARE = rt("c_5ce6", "software", "software");
const RT_OTHER = rt("c_1843", "other", "other");

/** CSL type → COAR resource type, for works the CV routes to a literature section. */
const CSL_TYPE_TO_COAR: Record<string, CoarResourceType> = {
  "article-journal": rt("c_6501", "journal article"),
  "paper-conference": rt("c_5794", "conference paper"),
  chapter: rt("c_3248", "book part"),
  book: rt("c_2f33", "book"),
  thesis: rt("c_46ec", "thesis"),
  report: rt("c_93fc", "report"),
  review: rt("c_ba08", "peer review"),
  dataset: RT_DATASET,
  software: RT_SOFTWARE,
};

/**
 * The COAR resource type of a work. The CV's OWN routing decides first — a work
 * the owner's CV lists under Preprints / Datasets / Software is that, whatever
 * the CSL type says (OpenAlex maps preprints to the generic CSL "article") —
 * then the CSL type; a bare CSL "article" elsewhere, or anything unknown, is
 * "other" rather than a guess.
 */
export function coarResourceType(sectionType: CvSectionType, cslType: string): CoarResourceType {
  if (sectionType === "preprints") return RT_PREPRINT;
  if (sectionType === "datasets") return RT_DATASET;
  if (sectionType === "software") return RT_SOFTWARE;
  return CSL_TYPE_TO_COAR[cslType] ?? RT_OTHER;
}

export interface LicenseCondition {
  label: string;
  /** Only when the licence has a single canonical deed (CC0); the CC BY family
   *  is versionless in the source slug, so no version-bearing URI is asserted. */
  uri?: string;
}

/** OpenAlex licence slug → a spelled-out Creative Commons licence, else undefined. */
const CC_SLUGS: Record<string, LicenseCondition> = {
  "cc-by": { label: "CC BY" },
  "cc-by-sa": { label: "CC BY-SA" },
  "cc-by-nc": { label: "CC BY-NC" },
  "cc-by-nc-sa": { label: "CC BY-NC-SA" },
  "cc-by-nd": { label: "CC BY-ND" },
  "cc-by-nc-nd": { label: "CC BY-NC-ND" },
  cc0: { label: "CC0", uri: "https://creativecommons.org/publicdomain/zero/1.0/" },
  "public-domain": { label: "public domain" },
};

/** The work's reuse licence when the stored slug names a known CC licence. */
export function licenseCondition(slug: string | undefined): LicenseCondition | undefined {
  const key = slug?.trim().toLowerCase();
  return key ? CC_SLUGS[key] : undefined;
}

// ─── Creators ─────────────────────────────────────────────────────────────────

const ORCID_ATTRS = ` nameIdentifierScheme="ORCID" schemeURI="https://orcid.org/"`;

function orcidIdentifierXml(orcid: string): string {
  return el("datacite:nameIdentifier", `https://orcid.org/${orcid}`, ORCID_ATTRS, `${INDENT}    `);
}

/** One `datacite:creator` for a CSL name; the ORCID only for the owner's own entry. */
function workCreatorXml(n: NonNullable<CslItem["author"]>[number], orcid?: string): string {
  const name = creatorName(n);
  if (!name) return "";
  const inner = `${INDENT}    `;
  const personal = !n.literal?.trim();
  let body = el("datacite:creatorName", name, personal ? ` nameType="Personal"` : "", inner);
  if (personal) {
    body += el("datacite:givenName", n.given, "", inner);
    body += el("datacite:familyName", n.family, "", inner);
  }
  if (orcid) body += orcidIdentifierXml(orcid);
  return wrap("datacite:creator", body, `${INDENT}  `);
}

/**
 * The index of the owner's own author entry, or -1. Identifier-first: only a
 * work the identifier match attributed to the owner (`authoredBySelf`), with an
 * in-range identifier-derived `authorPosition`, and only when the owner has an
 * ORCID to attach. A name is never matched.
 */
function ownerAuthorIndex(work: OaiWorkRecord, authors: readonly unknown[]): number {
  const pos = work.item.meta.authorPosition;
  if (!work.item.authoredBySelf || !work.cv.owner.orcid || !pos) return -1;
  return pos >= 1 && pos <= authors.length ? pos - 1 : -1;
}

function workCreatorsXml(work: OaiWorkRecord, csl: CslItem): string {
  const authors = csl.author ?? [];
  const ownerIdx = ownerAuthorIndex(work, authors);
  const creators = authors
    .map((a, i) => workCreatorXml(a, i === ownerIdx ? work.cv.owner.orcid : undefined))
    .join("");
  return wrap("datacite:creators", creators);
}

// ─── Records ──────────────────────────────────────────────────────────────────

/** `datacite:relatedIdentifier` to the CV page a work is listed on — the record's provenance. */
function pageRelationXml(slug: string): string {
  return wrap(
    "datacite:relatedIdentifiers",
    el(
      "datacite:relatedIdentifier",
      absoluteUrl(`p/${slug}`),
      ` relatedIdentifierType="URL" relationType="IsReferencedBy"`,
      `${INDENT}  `,
    ),
  );
}

function resourceTypeXml(t: CoarResourceType): string {
  return el(
    "oaire:resourceType",
    t.label,
    ` resourceTypeGeneral="${t.general}" uri="${escapeXml(t.uri)}"`,
  );
}

function rightsXml(right: CoarAccessRight | undefined): string {
  return right ? el("datacite:rights", right.label, ` rightsURI="${escapeXml(right.uri)}"`) : "";
}

function licenseConditionXml(lic: LicenseCondition | undefined): string {
  if (!lic) return "";
  return el("oaire:licenseCondition", lic.label, lic.uri ? ` uri="${escapeXml(lic.uri)}"` : "");
}

/** Start/end page of a CSL `page` RANGE ("100-110", "5–9"); an article number is neither. */
function pageRange(page: string | undefined): { start: string; end: string } | undefined {
  const m = page?.trim().match(/^(\S+?)\s*[-–—]\s*(\S+)$/);
  return m ? { start: m[1]!, end: m[2]! } : undefined;
}

/** The citation block: venue, volume, issue, pages — as `oaire:citation*`. */
function citationXml(csl: CslItem): string {
  const pages = pageRange(csl.page);
  return (
    el("oaire:citationTitle", csl["container-title"]) +
    el("oaire:citationVolume", csl.volume) +
    el("oaire:citationIssue", csl.issue) +
    el("oaire:citationStartPage", pages?.start) +
    el("oaire:citationEndPage", pages?.end)
  );
}

/**
 * The `oaire:resource` `<metadata>` block for a per-work record. Built from the
 * CSL the page renders (`cslForRender`: the owner's year / venue corrections
 * and preferred publication name applied), so the harvested record can never
 * say something the CV does not.
 */
export function oaireWorkMetadata(work: OaiWorkRecord): string {
  const csl = cslForRender(work.item);
  /* v8 ignore next -- citationItems only yields items that carry CSL */
  if (!csl) return `${OAIRE_OPEN}${OAIRE_CLOSE}`;
  const { meta } = work.item;
  let x = "";
  x += wrap("datacite:titles", el("datacite:title", csl.title, "", `${INDENT}  `));
  x += workCreatorsXml(work, csl);
  x += pageRelationXml(work.slug);
  x += el("dc:publisher", csl.publisher);
  x += wrap(
    "datacite:dates",
    el("datacite:date", workYear(csl), ` dateType="Issued"`, `${INDENT}  `),
  );
  x += resourceTypeXml(coarResourceType(work.sectionType, csl.type));
  x += el("datacite:identifier", doiIri(csl.DOI), ` identifierType="DOI"`);
  x += rightsXml(coarAccessRight(meta.oaIsOpen));
  x += licenseConditionXml(licenseCondition(meta.license));
  x += citationXml(csl);
  return `${OAIRE_OPEN}${x}${OAIRE_CLOSE}`;
}

/** The owner's self-declared current affiliation as a `datacite:affiliation`
 *  with its ROR identifier — the SAME position and ROR validation as the public
 *  JSON-LD `affiliation`, so this can never say more than the page. */
function ownerAffiliationXml(record: OaiRecordInput): string {
  const aff = currentAffiliation(record.cv);
  if (!aff) return "";
  const ror = `https://ror.org/${aff.rorId}`;
  return el(
    "datacite:affiliation",
    aff.name,
    ` affiliationIdentifier="${escapeXml(ror)}" affiliationIdentifierScheme="ROR" schemeURI="https://ror.org/"`,
    `${INDENT}    `,
  );
}

/**
 * The `oaire:resource` `<metadata>` block for a CV-level record: minimal —
 * the title, the owner as creator (ORCID + self-declared current affiliation),
 * the public page as identifier, resource type "other". A public page is open
 * access; the CV licence the owner chose is its licence condition.
 */
export function oaireCvMetadata(record: OaiRecordInput): string {
  const { cv, slug } = record;
  const name = cv.owner.displayName || "Researcher";
  const license = licenseInfo(cv.display.cvLicense);
  const inner = `${INDENT}    `;
  let creator = el("datacite:creatorName", name, ` nameType="Personal"`, inner);
  if (cv.owner.orcid) creator += orcidIdentifierXml(cv.owner.orcid);
  creator += ownerAffiliationXml(record);

  let x = "";
  x += wrap(
    "datacite:titles",
    el("datacite:title", `${name} — Curriculum Vitae`, "", `${INDENT}  `),
  );
  x += wrap("datacite:creators", wrap("datacite:creator", creator, `${INDENT}  `));
  x += el("dc:publisher", "SigmaCV");
  x += wrap(
    "datacite:dates",
    el(
      "datacite:date",
      record.datestamp.toISOString().slice(0, 10),
      ` dateType="Issued"`,
      `${INDENT}  `,
    ),
  );
  x += resourceTypeXml(RT_OTHER);
  x += el("datacite:identifier", absoluteUrl(`p/${slug}`), ` identifierType="URL"`);
  x += rightsXml(coarAccessRight(true));
  if (license) x += licenseConditionXml({ label: license.name, uri: license.url });
  return `${OAIRE_OPEN}${x}${OAIRE_CLOSE}`;
}
