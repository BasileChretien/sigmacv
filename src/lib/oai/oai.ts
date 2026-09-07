import { licenseInfo } from "@/lib/canonical/license";
import type { CanonicalCv, CvItem } from "@/lib/canonical/schema";
import { citationItems } from "@/lib/render/citationItems";
import { cslForRender } from "@/lib/render/cslOverride";
import { absoluteUrl } from "@/lib/siteUrl";
import type { CslItem } from "@/types/csl";

/**
 * OAI-PMH 2.0 provider for SigmaCV's indexable public CVs.
 *
 * This module is PURE: it turns already-fetched records + validated request args
 * into the response XML (or an OAI error). The route (`app/api/oai`) does the
 * arg parsing, gating (published + publicIndexable) and DB reads, then calls
 * these builders. Metadata format: `oai_dc` (Dublin Core).
 *
 * Records. Each indexable CV yields one CV-level record (`oai:sigmacv.org:<slug>`)
 * PLUS one record per work the public page lists (`…:<slug>/w/<itemId>`), the
 * selection being exactly the page's (`citationItems`: the owner's curation, the
 * per-view exclusions, "peer-reviewed only", the publications cap) minus every
 * retracted work — a harvester must never ingest a retracted work as a fresh
 * record, whether or not the page still lists it with its badge.
 *
 * Sets. One set per institution, `ror:<id>`, containing ONLY the CVs whose owner
 * opted into "list under my current affiliation" — a consent SEPARATE from
 * search indexing (an institution-keyed harvest is systematic processing the
 * indexing consent never covered). The set is named as a self-declared current
 * affiliation, never as institutional output: it is what each researcher wrote
 * on their own CV.
 *
 * Consent model, in one line: nothing is harvestable without `publicIndexable`
 * (whose consent copy names this endpoint), and nothing is in a set without
 * `listUnderAffiliation`.
 *
 * Spec: https://www.openarchives.org/OAI/openarchivesprotocol.html
 */

/** The OAI repository identifier (the host part of `oai:<repo>:<localId>`). */
const OAI_REPO_ID = "sigmacv.org";
/** Repository inception — a valid `earliestDatestamp` (≤ every record's stamp). */
const OAI_EARLIEST_DATESTAMP = "2026-06-08T00:00:00Z";
/** CVs per ListRecords/ListIdentifiers page (offset-based resumption). A page
 *  is cut at CV boundaries: a CV's per-work records always ride with it. */
export const OAI_PAGE_SIZE = 100;
/** The single supported metadata prefix. */
const OAI_METADATA_PREFIX = "oai_dc";
/** Separator between a CV slug and a work id inside a per-work identifier. */
const WORK_ID_SEPARATOR = "/w/";
/** Set-spec prefix for the affiliation sets. */
const ROR_SET_PREFIX = "ror:";
/** A bare ROR id (the ror.org path segment): lowercase alphanumerics. */
const ROR_ID = /^[0-9a-z]+$/;

export interface OaiRecordInput {
  slug: string;
  datestamp: Date;
  cv: CanonicalCv;
  /** The `ror:<id>` set this CV opted into, if any (the route derives it from
   *  `listUnderAffiliation` + `currentRorId`; never set for a non-opted-in CV). */
  setSpec?: string;
}

/** One of a CV's per-work records: a work the public page lists. */
export interface OaiWorkRecord {
  slug: string;
  datestamp: Date;
  setSpec?: string;
  itemId: string;
  item: CvItem;
  cv: CanonicalCv;
}

/** An affiliation set as `ListSets` lists it. */
export interface OaiSet {
  /** `ror:<id>` */
  spec: string;
  /** The bare ROR id. */
  rorId: string;
  /** The institution as an opted-in researcher's CV names it. */
  name: string;
}

/** A page of CV records for a list verb (offset-resumption over CVs). */
export interface OaiListPage {
  records: OaiRecordInput[];
  /** Offset (in CVs) of this page's first record — only used to decide whether
   *  the final page must emit a closing (empty) resumption token. */
  cursor: number;
  /** Offset of the next page, or null when this is the last page. */
  nextOffset: number | null;
}

/** Request args echoed in `<request>` and used for validation. */
export interface OaiArgs {
  verb?: string;
  identifier?: string;
  metadataPrefix?: string;
  from?: string;
  until?: string;
  set?: string;
  resumptionToken?: string;
}

export type OaiErrorCode =
  | "badArgument"
  | "badResumptionToken"
  | "badVerb"
  | "cannotDisseminateFormat"
  | "idDoesNotExist"
  | "noRecordsMatch"
  | "noSetHierarchy"
  | "noMetadataFormats";

interface BuildOpts {
  baseUrl: string;
  now: Date;
}

/** XML-escape text + attribute content (covers &, <, >, ", '). */
function escapeXml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

/** UTC datestamp at seconds granularity (YYYY-MM-DDThh:mm:ssZ). */
export function oaiDatestamp(d: Date): string {
  return `${d.toISOString().slice(0, 19)}Z`;
}

/** `oai:sigmacv.org:<slug>` for a CV slug. */
export function oaiIdentifier(slug: string): string {
  return `oai:${OAI_REPO_ID}:${slug}`;
}

/** `oai:sigmacv.org:<slug>/w/<itemId>` for one of a CV's listed works. */
export function oaiWorkIdentifier(slug: string, itemId: string): string {
  return `${oaiIdentifier(slug)}${WORK_ID_SEPARATOR}${itemId}`;
}

/** The `ror:<id>` set spec for a bare ROR id. */
export function rorSetSpec(rorId: string): string {
  return `${ROR_SET_PREFIX}${rorId}`;
}

/** The bare ROR id of a well-formed `ror:<id>` set spec, or null. */
function rorIdFromSetSpec(spec: string): string | null {
  if (!spec.startsWith(ROR_SET_PREFIX)) return null;
  const id = spec.slice(ROR_SET_PREFIX.length);
  return ROR_ID.test(id) ? id : null;
}

/**
 * Split one of our identifiers into its CV slug and (for a per-work record) the
 * work's item id, or null if it isn't one of ours. The FIRST `/w/` separates
 * the slug (which never contains "/") from the item id (which may — source ids
 * such as `doi:10.1/w/x` do).
 */
export function parseOaiIdentifier(identifier: string): { slug: string; itemId?: string } | null {
  const prefix = `oai:${OAI_REPO_ID}:`;
  if (!identifier.startsWith(prefix)) return null;
  const local = identifier.slice(prefix.length);
  const at = local.indexOf(WORK_ID_SEPARATOR);
  if (at === -1) return local ? { slug: local } : null;
  const slug = local.slice(0, at);
  const itemId = local.slice(at + WORK_ID_SEPARATOR.length);
  return slug && itemId ? { slug, itemId } : null;
}

/** The `<request>` element. On badVerb/badArgument the spec wants the base URL
 *  ONLY (no attributes); otherwise the (valid) args are echoed as attributes. */
function requestEl(baseUrl: string, args: OaiArgs, bareUrlOnly: boolean): string {
  if (bareUrlOnly) return `<request>${escapeXml(baseUrl)}</request>`;
  const order: (keyof OaiArgs)[] = [
    "verb",
    "identifier",
    "metadataPrefix",
    "from",
    "until",
    "set",
    "resumptionToken",
  ];
  const attrs = order
    .filter((k) => args[k] != null && args[k] !== "")
    .map((k) => ` ${k}="${escapeXml(String(args[k]))}"`)
    .join("");
  return `<request${attrs}>${escapeXml(baseUrl)}</request>`;
}

function envelope(opts: BuildOpts, request: string, inner: string): string {
  return `<?xml version="1.0" encoding="UTF-8"?>
<OAI-PMH xmlns="http://www.openarchives.org/OAI/2.0/" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:schemaLocation="http://www.openarchives.org/OAI/2.0/ http://www.openarchives.org/OAI/2.0/OAI-PMH.xsd">
  <responseDate>${oaiDatestamp(opts.now)}</responseDate>
  ${request}
${inner}
</OAI-PMH>
`;
}

/** An OAI error response. */
export function oaiError(
  args: OaiArgs,
  code: OaiErrorCode,
  message: string,
  opts: BuildOpts,
): string {
  // badVerb / badArgument → request carries the base URL only (per spec).
  const bare = code === "badVerb" || code === "badArgument";
  return envelope(
    opts,
    requestEl(opts.baseUrl, args, bare),
    `  <error code="${code}">${escapeXml(message)}</error>`,
  );
}

// ─── oai_dc records ───────────────────────────────────────────────────────────

const OAI_DC_OPEN = `      <oai_dc:dc xmlns:oai_dc="http://www.openarchives.org/OAI/2.0/oai_dc/" xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:schemaLocation="http://www.openarchives.org/OAI/2.0/oai_dc/ http://www.openarchives.org/OAI/2.0/oai_dc.xsd">
`;
const OAI_DC_CLOSE = `      </oai_dc:dc>`;

function dcElement(tag: string, value: string | undefined): string {
  const v = value?.trim();
  return v ? `        <dc:${tag}>${escapeXml(v)}</dc:${tag}>\n` : "";
}

/** The Dublin Core `<metadata>` block for a CV record. */
export function dcMetadata(record: OaiRecordInput): string {
  const { cv, slug } = record;
  const orcidUrl = cv.owner.orcid ? `https://orcid.org/${cv.owner.orcid}` : undefined;
  const name = cv.owner.displayName || "Researcher";
  const license = licenseInfo(cv.display.cvLicense)?.url;
  const lang = (cv.display.locale || "en").split("-")[0];

  let dc = "";
  dc += dcElement("title", `${name} — Curriculum Vitae`);
  dc += dcElement("creator", name);
  if (cv.owner.headline) dc += dcElement("subject", cv.owner.headline);
  dc += dcElement(
    "description",
    cv.owner.summary || cv.owner.headline || `Academic CV of ${name}, generated by SigmaCV.`,
  );
  dc += dcElement("publisher", "SigmaCV");
  dc += dcElement("date", oaiDatestamp(record.datestamp).slice(0, 10));
  dc += dcElement("type", "Curriculum Vitae");
  dc += dcElement("format", "text/html");
  // Persistent identifiers: the ORCID (when present) + the canonical public page.
  if (orcidUrl) dc += dcElement("identifier", orcidUrl);
  dc += dcElement("identifier", absoluteUrl(`p/${slug}`));
  dc += dcElement("language", lang);
  if (license) dc += dcElement("rights", license);

  return `${OAI_DC_OPEN}${dc}${OAI_DC_CLOSE}`;
}

/** The canonical DOI IRI for a CSL `DOI` (bare, `doi:`-prefixed or a doi.org
 *  URL), always re-hosted on doi.org, or undefined when it isn't a DOI. */
function doiIri(raw: string | undefined): string | undefined {
  let s = raw?.trim().replace(/^doi:\s*/i, "");
  if (!s) return undefined;
  if (/^https?:\/\//i.test(s)) s = s.match(/10\.\d{4,9}\/\S+$/)?.[0] ?? "";
  return /^10\.\d{4,9}\/\S+$/.test(s) ? `https://doi.org/${s}` : undefined;
}

/** A CSL name as "Family, Given" (or its literal form), or undefined. */
function creatorName(n: NonNullable<CslItem["author"]>[number]): string | undefined {
  const literal = n.literal?.trim();
  if (literal) return literal;
  const family = n.family?.trim();
  const given = n.given?.trim();
  if (family && given) return `${family}, ${given}`;
  return family || given || undefined;
}

/** The publication year from the CSL `issued` date, or undefined. */
function workYear(csl: CslItem): string | undefined {
  const part = csl.issued?.["date-parts"]?.[0]?.[0];
  if (typeof part === "number") return String(part);
  if (typeof part === "string" && /^\d{4}/.test(part)) return part.slice(0, 4);
  return undefined;
}

/**
 * The Dublin Core `<metadata>` block for a per-work record. Built from the CSL
 * the page renders (`cslForRender`: the owner's year / venue corrections and
 * preferred publication name applied), so the harvested record can never say
 * something the CV does not.
 */
function workDcMetadata(work: OaiWorkRecord): string {
  const csl = cslForRender(work.item);
  const license = licenseInfo(work.cv.display.cvLicense)?.url;
  /* v8 ignore next -- citationItems only yields items that carry CSL */
  if (!csl) return `${OAI_DC_OPEN}${OAI_DC_CLOSE}`;
  let dc = "";
  dc += dcElement("title", csl.title);
  for (const author of csl.author ?? []) dc += dcElement("creator", creatorName(author));
  dc += dcElement("date", workYear(csl));
  dc += dcElement("source", csl["container-title"]);
  dc += dcElement("identifier", doiIri(csl.DOI));
  // The CV page this work is listed on — the record's provenance.
  dc += dcElement("relation", absoluteUrl(`p/${work.slug}`));
  if (license) dc += dcElement("rights", license);
  return `${OAI_DC_OPEN}${dc}${OAI_DC_CLOSE}`;
}

/**
 * A CV's per-work records: exactly the works its public page lists (the same
 * `citationItems` selection every renderer and citation export uses — the
 * owner's curation, per-view exclusions, "peer-reviewed only", "count letters",
 * the publications cap, no "not mine") MINUS every retracted work, listed or
 * not. They share the CV's datestamp and set membership.
 */
export function workRecords(record: OaiRecordInput): OaiWorkRecord[] {
  return citationItems(record.cv)
    .filter((item) => !item.meta.retracted)
    .map((item) => ({
      slug: record.slug,
      datestamp: record.datestamp,
      setSpec: record.setSpec,
      itemId: item.id,
      item,
      cv: record.cv,
    }));
}

/** The per-work record with this item id, or null when the page does not list
 *  it (hidden, "not mine", retracted, excluded from the view, or unknown). */
export function findWorkRecord(record: OaiRecordInput, itemId: string): OaiWorkRecord | null {
  return workRecords(record).find((w) => w.itemId === itemId) ?? null;
}

type OaiAnyRecord = OaiRecordInput | OaiWorkRecord;

function isWorkRecord(r: OaiAnyRecord): r is OaiWorkRecord {
  return "itemId" in r;
}

function headerXml(record: OaiAnyRecord): string {
  const identifier = isWorkRecord(record)
    ? oaiWorkIdentifier(record.slug, record.itemId)
    : oaiIdentifier(record.slug);
  const set = record.setSpec ? `\n        <setSpec>${escapeXml(record.setSpec)}</setSpec>` : "";
  return `      <header>
        <identifier>${escapeXml(identifier)}</identifier>
        <datestamp>${oaiDatestamp(record.datestamp)}</datestamp>${set}
      </header>`;
}

function recordXml(record: OaiAnyRecord): string {
  return `    <record>
${headerXml(record)}
      <metadata>
${isWorkRecord(record) ? workDcMetadata(record) : dcMetadata(record)}
      </metadata>
    </record>`;
}

/** A page's CV records expanded into the wire order: each CV record followed
 *  by its per-work records. */
function expandPage(page: OaiListPage): OaiAnyRecord[] {
  return page.records.flatMap((record) => [record, ...workRecords(record)]);
}

/**
 * `<resumptionToken>` element (offset-based, in CVs). Omitted when there's no
 * next page; on the LAST page of a multi-page list an empty token signals the
 * end. The optional `completeListSize` / `cursor` attributes are deliberately
 * NOT emitted: pages are cut at CV boundaries and a CV's per-work records ride
 * with it, so the size of the complete RECORD list is unknown without reading
 * every document — better omitted than misreported.
 */
function resumptionTokenXml(page: OaiListPage): string {
  if (page.nextOffset === null) {
    // Only emit a (closing) empty token when we paged at all. Otherwise omit
    // entirely (complete list in one go).
    if (page.cursor === 0) return "";
    return `    <resumptionToken/>`;
  }
  return `    <resumptionToken>${page.nextOffset}</resumptionToken>`;
}

// ─── Verb responses ───────────────────────────────────────────────────────────

export function identifyResponse(opts: BuildOpts): string {
  const inner = `  <Identify>
    <repositoryName>SigmaCV</repositoryName>
    <baseURL>${escapeXml(opts.baseUrl)}</baseURL>
    <protocolVersion>2.0</protocolVersion>
    <adminEmail>contact@sigmacv.org</adminEmail>
    <earliestDatestamp>${OAI_EARLIEST_DATESTAMP}</earliestDatestamp>
    <deletedRecord>no</deletedRecord>
    <granularity>YYYY-MM-DDThh:mm:ssZ</granularity>
    <description>
      <oai-identifier xmlns="http://www.openarchives.org/OAI/2.0/oai-identifier" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:schemaLocation="http://www.openarchives.org/OAI/2.0/oai-identifier http://www.openarchives.org/OAI/2.0/oai-identifier.xsd">
        <scheme>oai</scheme>
        <repositoryIdentifier>${OAI_REPO_ID}</repositoryIdentifier>
        <delimiter>:</delimiter>
        <sampleIdentifier>${oaiIdentifier("example-slug")}</sampleIdentifier>
      </oai-identifier>
    </description>
  </Identify>`;
  return envelope(opts, requestEl(opts.baseUrl, { verb: "Identify" }, false), inner);
}

/** The oai_dc format block (shared by ListMetadataFormats). */
const OAI_DC_FORMAT = `    <metadataFormat>
      <metadataPrefix>oai_dc</metadataPrefix>
      <schema>http://www.openarchives.org/OAI/2.0/oai_dc.xsd</schema>
      <metadataNamespace>http://www.openarchives.org/OAI/2.0/oai_dc/</metadataNamespace>
    </metadataFormat>`;

export function listMetadataFormatsResponse(args: OaiArgs, opts: BuildOpts): string {
  return envelope(
    opts,
    requestEl(opts.baseUrl, args, false),
    `  <ListMetadataFormats>
${OAI_DC_FORMAT}
  </ListMetadataFormats>`,
  );
}

/**
 * `ListSets`: the affiliation sets. Each is labelled as what it is — the
 * researchers who chose to list a SELF-DECLARED current affiliation — so a
 * harvester never mistakes it for an institution's record of its output. The
 * caller answers `noSetHierarchy` when the list is empty (the schema requires
 * at least one set).
 */
export function listSetsResponse(args: OaiArgs, sets: readonly OaiSet[], opts: BuildOpts): string {
  const body = sets
    .map(
      (set) => `    <set>
      <setSpec>${escapeXml(set.spec)}</setSpec>
      <setName>${escapeXml(`Researchers listing ${set.name} as current affiliation`)}</setName>
      <setDescription>
${OAI_DC_OPEN}${dcElement(
        "description",
        `Researchers who opted in to being listed under ${set.name} (https://ror.org/${set.rorId}), the current affiliation self-declared on their own SigmaCV CV. Membership is each researcher's own choice and reflects their CV, not an institutional record of affiliation or output.`,
      )}${OAI_DC_CLOSE}
      </setDescription>
    </set>`,
    )
    .join("\n");
  return envelope(
    opts,
    requestEl(opts.baseUrl, args, false),
    `  <ListSets>
${body}
  </ListSets>`,
  );
}

export function listIdentifiersResponse(args: OaiArgs, page: OaiListPage, opts: BuildOpts): string {
  const headers = expandPage(page).map(headerXml).join("\n");
  const token = resumptionTokenXml(page);
  return envelope(
    opts,
    requestEl(opts.baseUrl, args, false),
    `  <ListIdentifiers>
${headers}${token ? `\n${token}` : ""}
  </ListIdentifiers>`,
  );
}

export function listRecordsResponse(args: OaiArgs, page: OaiListPage, opts: BuildOpts): string {
  const records = expandPage(page).map(recordXml).join("\n");
  const token = resumptionTokenXml(page);
  return envelope(
    opts,
    requestEl(opts.baseUrl, args, false),
    `  <ListRecords>
${records}${token ? `\n${token}` : ""}
  </ListRecords>`,
  );
}

export function getRecordResponse(args: OaiArgs, record: OaiAnyRecord, opts: BuildOpts): string {
  return envelope(
    opts,
    requestEl(opts.baseUrl, args, false),
    `  <GetRecord>
${recordXml(record)}
  </GetRecord>`,
  );
}

// ─── Request validation / planning (pure) ─────────────────────────────────────

/** What the route should do for a request, or an error to return. The route
 *  executes the DB reads for `getRecord` / `list` / `listSets`; everything here
 *  is pure. */
export type OaiPlan =
  | { kind: "error"; code: OaiErrorCode; message: string }
  | { kind: "identify" }
  | { kind: "listMetadataFormats" }
  | { kind: "listSets" }
  | { kind: "getRecord"; slug: string; itemId?: string }
  | {
      kind: "list";
      verb: "ListRecords" | "ListIdentifiers";
      offset: number;
      from?: Date;
      until?: Date;
      /** The bare ROR id of the requested `ror:<id>` set. */
      set?: string;
    };

const DATE_DAY = /^\d{4}-\d{2}-\d{2}$/;
const DATE_SECONDS = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/;

function parseOaiDate(s: string): Date | null {
  if (!DATE_DAY.test(s) && !DATE_SECONDS.test(s)) return null;
  const d = new Date(s);
  return Number.isNaN(d.getTime()) ? null : d;
}

/** Offset-based resumption token: a non-negative integer, or null if malformed. */
function parseResumptionToken(token: string): number | null {
  return /^\d+$/.test(token) ? Number(token) : null;
}

function hasUnexpectedArgs(args: OaiArgs, allowed: (keyof OaiArgs)[]): boolean {
  const ok = new Set<keyof OaiArgs>(["verb", ...allowed]);
  return (Object.keys(args) as (keyof OaiArgs)[]).some(
    (k) => args[k] != null && args[k] !== "" && !ok.has(k),
  );
}

const error = (code: OaiErrorCode, message: string): OaiPlan => ({ kind: "error", code, message });

/**
 * Validate an OAI request into a plan (or an error). Enforces the per-verb
 * argument rules, the single supported `metadataPrefix` (oai_dc), the `ror:<id>`
 * set-spec shape, and `from`/`until` granularity.
 */
export function validateOaiRequest(args: OaiArgs): OaiPlan {
  const verb = args.verb;
  if (!verb) return error("badVerb", "Missing required argument: verb");

  switch (verb) {
    case "Identify":
      if (hasUnexpectedArgs(args, []))
        return error("badArgument", "Identify takes no other arguments");
      return { kind: "identify" };

    case "ListMetadataFormats":
      if (hasUnexpectedArgs(args, ["identifier"]))
        return error("badArgument", "Unexpected argument for ListMetadataFormats");
      if (args.identifier && parseOaiIdentifier(args.identifier) === null)
        return error("idDoesNotExist", `Unknown identifier: ${args.identifier}`);
      return { kind: "listMetadataFormats" };

    case "ListSets":
      if (hasUnexpectedArgs(args, ["resumptionToken"]))
        return error("badArgument", "Unexpected argument for ListSets");
      // The set list is small and complete in one response — no token is ever
      // issued, so any token presented is invalid.
      if (args.resumptionToken != null && args.resumptionToken !== "")
        return error("badResumptionToken", "ListSets never issues a resumptionToken");
      return { kind: "listSets" };

    case "GetRecord": {
      if (hasUnexpectedArgs(args, ["identifier", "metadataPrefix"]))
        return error("badArgument", "Unexpected argument for GetRecord");
      if (!args.identifier || !args.metadataPrefix)
        return error("badArgument", "GetRecord requires identifier and metadataPrefix");
      if (args.metadataPrefix !== OAI_METADATA_PREFIX)
        return error(
          "cannotDisseminateFormat",
          `Unsupported metadataPrefix: ${args.metadataPrefix}`,
        );
      const parsed = parseOaiIdentifier(args.identifier);
      if (!parsed) return error("idDoesNotExist", `Unknown identifier: ${args.identifier}`);
      return parsed.itemId
        ? { kind: "getRecord", slug: parsed.slug, itemId: parsed.itemId }
        : { kind: "getRecord", slug: parsed.slug };
    }

    case "ListRecords":
    case "ListIdentifiers": {
      if (args.resumptionToken != null && args.resumptionToken !== "") {
        if (hasUnexpectedArgs(args, ["resumptionToken"]))
          return error("badArgument", "resumptionToken is an exclusive argument");
        const offset = parseResumptionToken(args.resumptionToken);
        if (offset === null) return error("badResumptionToken", "Invalid resumptionToken");
        return { kind: "list", verb, offset };
      }
      if (hasUnexpectedArgs(args, ["metadataPrefix", "from", "until", "set"]))
        return error("badArgument", `Unexpected argument for ${verb}`);
      if (!args.metadataPrefix) return error("badArgument", `${verb} requires metadataPrefix`);
      if (args.metadataPrefix !== OAI_METADATA_PREFIX)
        return error(
          "cannotDisseminateFormat",
          `Unsupported metadataPrefix: ${args.metadataPrefix}`,
        );
      let set: string | undefined;
      if (args.set != null && args.set !== "") {
        const rorId = rorIdFromSetSpec(args.set);
        if (!rorId) return error("badArgument", "Invalid set: expected ror:<id>");
        set = rorId;
      }
      let from: Date | undefined;
      let until: Date | undefined;
      if (args.from != null && args.from !== "") {
        const d = parseOaiDate(args.from);
        if (!d) return error("badArgument", "Invalid 'from' datestamp");
        from = d;
      }
      if (args.until != null && args.until !== "") {
        const d = parseOaiDate(args.until);
        if (!d) return error("badArgument", "Invalid 'until' datestamp");
        until = d;
      }
      return { kind: "list", verb, offset: 0, from, until, set };
    }

    default:
      return error("badVerb", `Illegal OAI verb: ${verb}`);
  }
}
