import { isKnownMiss, rememberMiss } from "@/lib/cv/publicPageCache";
import { rorIri } from "@/lib/ror/id";
import {
  countListedCvs,
  countListedCvsByRor,
  trustedInstitutionNames,
  trustedInstitutionRecord,
  type TrustedInstitutionRecord,
} from "@/lib/cv/listed";
import { rorSetSpec } from "@/lib/oai/oai";
import { absoluteUrl } from "@/lib/siteUrl";
import {
  OPENALEX_INSTITUTION_ID_RE,
  parseInstitutionAggregates,
  type InstitutionAggregates,
} from "./snapshot";

/**
 * Institution pages (`/i`, `/i/[ror]`): what SigmaCV says about an institution.
 *
 * Deliberately little. A page exists only for a ROR id at least one researcher
 * chose to be listed under (the same opt-in that lists them in the OAI-PMH
 * `ror:<id>` set), and it shows ONE figure: how many did. No roster, no
 * per-person column, no ratio, no score — and nothing from OpenAlex or any other
 * external service at request time: every read here is the database, through
 * `@/lib/cv/listed` only (the "Live proxying" veto — a page per ROR would
 * otherwise turn sigmacv.org into a crawlable mirror of 110,000 institutions on
 * one polite-pool key).
 *
 * The name is the institution's TRUSTED name — ROR's own record, written during
 * sync — never text from a CV: `meta.institution` is owner-editable, so a name
 * derived from an opted-in CV would let one user title a real institution's
 * page. With no record yet, the page is named `ROR <id>`.
 */

/** The bare ROR id shape: a leading 0, six Crockford base32 characters (no
 *  i, l, o, u), then two check digits. */
const ROR_ID_RE = /^0[a-hj-km-np-tv-z0-9]{6}\d{2}$/;

/** True for a bare, well-formed ROR id (`04chrp450`) — never an IRI. */
export function isRorId(id: string): boolean {
  return ROR_ID_RE.test(id);
}

/**
 * OpenAlex's record of the organisation, as the page shows it: the stored
 * counts-only aggregates the internal resync job wrote (`snapshot.ts`), read
 * from the `Institution` row — never fetched by a request. Null until the job
 * has run for this ROR, or when the stored JSON is not the expected shape.
 */
export interface InstitutionOpenAlexSnapshot {
  /** Short OpenAlex id (`I…`) of the counted entity. */
  openalexId: string;
  aggregates: InstitutionAggregates;
  /** When the job fetched it (ISO). */
  fetchedAt: string;
}

/** What the institution page knows: the key, the trusted name, the count, and
 *  the stored OpenAlex snapshot (null until fetched). */
export interface InstitutionSummary {
  /** Bare ROR id. */
  rorId: string;
  /** The institution's trusted (ROR-recorded) name; `ROR <id>` until a sync
   *  has recorded one. Never owner-supplied text. */
  name: string;
  /** How many published, indexable CVs opted into the listing under this ROR. */
  listedCount: number;
  openalex: InstitutionOpenAlexSnapshot | null;
}

/** The snapshot on a stored row, or null when the row has none (not fetched
 *  yet, cleared, or failed before any success), it does not parse, or its
 *  `openalexId` is not an `I…` id (it becomes an href and the `sameAs`). */
function snapshotOf(record: TrustedInstitutionRecord | null): InstitutionOpenAlexSnapshot | null {
  if (!record?.openalexId || !record.openalexFetchedAt) return null;
  if (!OPENALEX_INSTITUTION_ID_RE.test(record.openalexId)) return null;
  const aggregates = parseInstitutionAggregates(record.openalexAggregates);
  if (!aggregates) return null;
  return {
    openalexId: record.openalexId,
    aggregates,
    fetchedAt: record.openalexFetchedAt.toISOString(),
  };
}

/** The OpenAlex URI of the counted entity (the JSON-LD `sameAs`). `openalexId`
 *  is the job's validated short id, so the URI is built, never passed through. */
export function openAlexInstitutionUrl(openalexId: string): string {
  return `https://openalex.org/${openalexId}`;
}

/**
 * Below this many listed researchers the page is served but NOT offered to
 * search engines (robots `noindex`, absent from the sitemap): a page for one
 * person is that person's affiliation under an institution's name in search
 * results — a profile by another route. Two is the smallest count that is a
 * count of an institution rather than a pointer to a researcher.
 */
export const MIN_INDEXABLE_LISTED = 2;

/** True when the page may be indexed and listed in the sitemap. */
export function isInstitutionIndexable(summary: Pick<InstitutionSummary, "listedCount">): boolean {
  return summary.listedCount >= MIN_INDEXABLE_LISTED;
}

/** The name shown when no trusted record exists for the id. */
function fallbackName(rorId: string): string {
  return `ROR ${rorId}`;
}

/**
 * The summary for one ROR id, or null when the id is not ROR-shaped (checked
 * before any database read) or when nobody is listed under it — an institution
 * with zero opt-ins has no page.
 */
export async function institutionSummary(rorId: string): Promise<InstitutionSummary | null> {
  if (!isRorId(rorId)) return null;
  const [listedCount, record] = await Promise.all([
    countListedCvs(rorId),
    trustedInstitutionRecord(rorId),
  ]);
  if (listedCount < 1) return null;
  return {
    rorId,
    name: record?.name ?? fallbackName(rorId),
    listedCount,
    openalex: snapshotOf(record),
  };
}

/** Every institution with at least one listed CV, with its count, by name. */
export async function institutionIndex(): Promise<InstitutionSummary[]> {
  const counts = await countListedCvsByRor();
  const rorIds = [...counts.keys()].filter(isRorId);
  const names = await trustedInstitutionNames(rorIds);
  // The index lists names and counts only; the OpenAlex snapshot is a page thing.
  const summaries: InstitutionSummary[] = rorIds.map((rorId) => ({
    rorId,
    name: names.get(rorId) ?? fallbackName(rorId),
    listedCount: counts.get(rorId)!,
    openalex: null,
  }));
  return summaries.sort((a, b) => a.name.localeCompare(b.name, "en"));
}

/** The existing OAI-PMH `ror:<id>` set, as a Dublin Core `ListRecords` URL —
 *  the page's machine-access link and the JSON-LD `subjectOf`. */
export function institutionOaiSetUrl(rorId: string): string {
  return absoluteUrl(`api/oai?verb=ListRecords&metadataPrefix=oai_dc&set=${rorSetSpec(rorId)}`);
}

/**
 * schema.org `Organization` for the page: identified by its ROR IRI (built by
 * the same validated rule as the public CV pages' `affiliation`), named by its
 * trusted name, and with the OAI set as `subjectOf`. NEVER `employee` /
 * `member` (the "Employment claims" veto): a self-declared affiliation on a CV
 * is the researcher's statement, not the organisation's roster — and the count
 * itself is prose on the page, not a structured claim. `rorId` is a validated
 * bare id (every summary comes through `isRorId`), so the IRI always resolves.
 * When the stored OpenAlex snapshot names the counted entity, its URI is the
 * Organization's `sameAs` — an identifier link, not a figure.
 */
export function institutionJsonLd(summary: InstitutionSummary): Record<string, unknown> {
  const iri = rorIri(summary.rorId);
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    "@id": iri,
    identifier: iri,
    name: summary.name,
    ...(summary.openalex ? { sameAs: openAlexInstitutionUrl(summary.openalex.openalexId) } : {}),
    subjectOf: {
      "@type": "DataFeed",
      name: `SigmaCV OAI-PMH set ${rorSetSpec(summary.rorId)}`,
      url: institutionOaiSetUrl(summary.rorId),
    },
  };
}

// Negative cache: a ROR nobody is listed under resolves to 404, and a flood of
// random ids must not hit the database on every request. Reuses the public
// page's miss cache under its own key namespace (a slug never contains ":").
const missKey = (rorId: string) => `institution:${rorId}`;

/** True if this ROR recently resolved to "no page" (skip the database). */
export function isKnownInstitutionMiss(rorId: string): boolean {
  return isKnownMiss(missKey(rorId));
}

/** Record that this ROR has no page (nobody listed under it). */
export function rememberInstitutionMiss(rorId: string): void {
  rememberMiss(missKey(rorId));
}
