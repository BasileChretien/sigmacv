import { licenseInfo } from "@/lib/canonical/license";
import type { CanonicalCv } from "@/lib/canonical/schema";
import { absoluteUrl } from "@/lib/siteUrl";

/**
 * OAI-PMH 2.0 provider for SigmaCV's indexable public CVs.
 *
 * This module is PURE: it turns already-fetched records + validated request args
 * into the response XML (or an OAI error). The route (`app/api/oai`) does the
 * arg parsing, gating (published + publicIndexable) and DB reads, then calls
 * these builders. Metadata format: `oai_dc` (Dublin Core). Sets: none.
 *
 * Spec: https://www.openarchives.org/OAI/openarchivesprotocol.html
 */

/** The OAI repository identifier (the host part of `oai:<repo>:<localId>`). */
export const OAI_REPO_ID = "sigmacv.org";
/** Repository inception — a valid `earliestDatestamp` (≤ every record's stamp). */
export const OAI_EARLIEST_DATESTAMP = "2026-06-08T00:00:00Z";
/** Records per ListRecords/ListIdentifiers page (offset-based resumption). */
export const OAI_PAGE_SIZE = 100;
/** The single supported metadata prefix. */
export const OAI_METADATA_PREFIX = "oai_dc";

export interface OaiRecordInput {
  slug: string;
  datestamp: Date;
  cv: CanonicalCv;
}

/** A page of records for a list verb (offset-resumption). */
export interface OaiListPage {
  records: OaiRecordInput[];
  total: number;
  /** Offset of this page's first record. */
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
export function escapeXml(s: string): string {
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

/** Extract the slug from an OAI identifier, or null if it isn't one of ours. */
export function slugFromOaiIdentifier(identifier: string): string | null {
  const prefix = `oai:${OAI_REPO_ID}:`;
  return identifier.startsWith(prefix) ? identifier.slice(prefix.length) : null;
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

// ─── oai_dc record ────────────────────────────────────────────────────────────

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

  return `      <oai_dc:dc xmlns:oai_dc="http://www.openarchives.org/OAI/2.0/oai_dc/" xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:schemaLocation="http://www.openarchives.org/OAI/2.0/oai_dc/ http://www.openarchives.org/OAI/2.0/oai_dc.xsd">
${dc}      </oai_dc:dc>`;
}

function headerXml(record: OaiRecordInput): string {
  return `      <header>
        <identifier>${escapeXml(oaiIdentifier(record.slug))}</identifier>
        <datestamp>${oaiDatestamp(record.datestamp)}</datestamp>
      </header>`;
}

function recordXml(record: OaiRecordInput): string {
  return `    <record>
${headerXml(record)}
      <metadata>
${dcMetadata(record)}
      </metadata>
    </record>`;
}

/** `<resumptionToken>` element (offset-based). Omitted when there's no next page;
 *  on the LAST incomplete-list page an empty token signals the end (with the
 *  completeListSize + cursor attributes). */
function resumptionTokenXml(page: OaiListPage): string {
  if (page.nextOffset === null) {
    // Only emit a (closing) empty token when we paged at all (cursor>0 or there
    // were more than a page). Otherwise omit entirely (complete list in one go).
    if (page.cursor === 0 && page.total <= OAI_PAGE_SIZE) return "";
    return `    <resumptionToken completeListSize="${page.total}" cursor="${page.cursor}"/>`;
  }
  return `    <resumptionToken completeListSize="${page.total}" cursor="${page.cursor}">${page.nextOffset}</resumptionToken>`;
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

export function listIdentifiersResponse(args: OaiArgs, page: OaiListPage, opts: BuildOpts): string {
  const headers = page.records.map(headerXml).join("\n");
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
  const records = page.records.map(recordXml).join("\n");
  const token = resumptionTokenXml(page);
  return envelope(
    opts,
    requestEl(opts.baseUrl, args, false),
    `  <ListRecords>
${records}${token ? `\n${token}` : ""}
  </ListRecords>`,
  );
}

export function getRecordResponse(args: OaiArgs, record: OaiRecordInput, opts: BuildOpts): string {
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
 *  executes the DB reads for `getRecord` / `list`; everything here is pure. */
export type OaiPlan =
  | { kind: "error"; code: OaiErrorCode; message: string }
  | { kind: "identify" }
  | { kind: "listMetadataFormats" }
  | { kind: "getRecord"; slug: string }
  | {
      kind: "list";
      verb: "ListRecords" | "ListIdentifiers";
      offset: number;
      from?: Date;
      until?: Date;
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
 * argument rules, the single supported `metadataPrefix` (oai_dc), the absence of
 * a set hierarchy, and `from`/`until` granularity.
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
      if (args.identifier && slugFromOaiIdentifier(args.identifier) === null)
        return error("idDoesNotExist", `Unknown identifier: ${args.identifier}`);
      return { kind: "listMetadataFormats" };

    case "ListSets":
      if (hasUnexpectedArgs(args, ["resumptionToken"]))
        return error("badArgument", "Unexpected argument for ListSets");
      return error("noSetHierarchy", "This repository does not support sets");

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
      const slug = slugFromOaiIdentifier(args.identifier);
      if (!slug) return error("idDoesNotExist", `Unknown identifier: ${args.identifier}`);
      return { kind: "getRecord", slug };
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
      if (args.set != null && args.set !== "")
        return error("noSetHierarchy", "This repository does not support sets");
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
      return { kind: "list", verb, offset: 0, from, until };
    }

    default:
      return error("badVerb", `Illegal OAI verb: ${verb}`);
  }
}
