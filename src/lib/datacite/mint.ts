import type { CanonicalCv } from "@/lib/canonical/schema";
import { affiliationOrg, fundingEntities, visibleWorkDois } from "@/lib/cv/publicJsonLd";
import { getEnv, type Env } from "@/lib/env";
import { resilientFetch } from "@/lib/http";
import { logger } from "@/lib/log";
import { absoluteUrl } from "@/lib/siteUrl";

/**
 * DataCite DOI minting for FROZEN CV snapshots (open-science roadmap C5) — the
 * write side of the DataCite integration (`client.ts` is the read side).
 *
 * FLAG-GATED + DORMANT: unless ALL of `DATACITE_REPOSITORY_ID`,
 * `DATACITE_PASSWORD` and `DATACITE_PREFIX` are set, {@link mintSnapshotDoi}
 * and {@link tombstoneSnapshotDoi} return `{ ok: false, reason: "disabled" }`
 * WITHOUT touching the network (the same spirit as the OpenAlex curation push
 * and the EPO client). The credentials are read server-side only and never
 * reach the client or the logs.
 *
 * FAIL-SOFT: a network error / non-2xx / unparseable body yields `ok: false`
 * with a short machine reason (logged, never thrown) — the caller records
 * `doiState: "failed"` and the owner can retry. The POST is sent with NO retry:
 * a DOI registration is not idempotent, and a retried 5xx could double-mint.
 *
 * ERASURE SEMANTICS (GDPR Art. 17 vs. persistent identifiers): a DOI record
 * names the owner (name + ORCID) and is held by DataCite as an independent
 * controller. It cannot simply vanish — a DOI is a promise of persistence — so
 * on account deletion the record is TOMBSTONED, not deleted: the DOI moves
 * from `findable` to `registered` (`event: "hide"`, out of DataCite search and
 * metadata APIs) and its landing URL is repointed at the static
 * {@link WITHDRAWN_PATH} page, which says the version was withdrawn by its
 * owner. The owner consents to exactly this at mint time (the mint endpoint
 * requires `{ consent: true }`) and the privacy notice discloses it.
 *
 * TODO(verify-live): the request/response shapes below follow the DataCite
 * REST API v2 docs (https://support.datacite.org/docs/api-create-dois,
 * https://support.datacite.org/docs/updating-metadata-with-the-rest-api) —
 * `POST https://api.datacite.org/dois`, JSON:API body
 * `{ data: { type: "dois", attributes: { prefix | doi, event, creators, titles,
 * publisher, publicationYear, types, url, relatedIdentifiers } } }`, basic auth
 * `REPOSITORY_ID:PASSWORD`, and a `201` whose body carries the minted DOI at
 * `data.id` / `data.attributes.doi`; `PUT https://api.datacite.org/dois/<doi>`
 * with `{ data: { type: "dois", attributes: { event: "hide", url, … } } }` to
 * hide and repoint. Still to confirm on the test endpoint: (a) that
 * `event: "hide"` on a PUT moves a `findable` DOI to `registered` (and that a
 * retried PUT on an already-`registered` DOI is accepted, not rejected — the
 * cron retry depends on it); (b) that `relatedIdentifiers: []` /
 * `fundingReferences: []` CLEAR those lists rather than being ignored.
 * Written offline; parsed defensively (several plausible shapes accepted).
 * Check against the live API — ideally the test endpoint
 * `https://api.test.datacite.org` first — before setting creds.
 */

/** Production DataCite REST API. */
export const DATACITE_DOIS_URL = "https://api.datacite.org/dois";

/**
 * Site-relative path of the static tombstone page a withdrawn DOI resolves to.
 * Deliberately OUTSIDE `/p/` so it can never collide with a public CV slug.
 */
export const WITHDRAWN_PATH = "withdrawn";

/** Upper bound on `References` related identifiers (the shown works' DOIs). */
export const MAX_RELATED_WORK_DOIS = 200;

/** What a minted DOI describes — one frozen CV version. */
export interface SnapshotDoiInput {
  ownerName: string;
  /** Bare ORCID iD (e.g. "0000-0002-7483-2489"); omitted when unknown. */
  orcid?: string;
  /** The snapshot's per-CV version number. */
  version: number;
  /** Year the snapshot was frozen (DataCite `publicationYear`). */
  year: number;
  /** The public frozen-version page the DOI resolves to. */
  url: string;
  /** The previous snapshot's DOI (→ `IsNewVersionOf`), when one was minted. */
  previousDoi?: string | null;
  /**
   * The frozen document, PUBLIC-projected (hidden items already dropped), for
   * the optional public-data enrichment: affiliation, referenced works, funding.
   */
  cv?: CanonicalCv;
}

export type MintResult = { ok: true; doi: string } | { ok: false; reason: string };
export type TombstoneResult = { ok: true } | { ok: false; reason: string };

/** True when all three DataCite settings are present (minting live). */
export function doiMintingEnabled(env: Env = getEnv()): boolean {
  return Boolean(env.DATACITE_REPOSITORY_ID && env.DATACITE_PASSWORD && env.DATACITE_PREFIX);
}

/** The DataCite title for a snapshot: "<name> — academic CV, snapshot v<n>". */
export function snapshotDoiTitle(ownerName: string, version: number): string {
  return `${ownerName.trim() || "Researcher"} — academic CV, snapshot v${version}`;
}

/**
 * DataCite `creators[].affiliation` from the owner's primary current position —
 * the same position + ROR validation the public JSON-LD uses (`affiliationOrg`),
 * so a crafted `meta.rorId` can no more reach DataCite than it can the page.
 */
function creatorAffiliation(cv: CanonicalCv | undefined): Record<string, unknown>[] | undefined {
  const org = cv ? affiliationOrg(cv) : undefined;
  if (!org) return undefined;
  const affiliation: Record<string, unknown> = { name: org.name };
  const ror = org["@id"];
  if (typeof ror === "string") {
    affiliation.affiliationIdentifier = ror;
    affiliation.affiliationIdentifierScheme = "ROR";
    affiliation.schemeUri = "https://ror.org";
  }
  return [affiliation];
}

/** DataCite `funderIdentifierType` for a safe funder IRI the JSON-LD already vetted. */
function funderIdentifierType(iri: string): string {
  if (/^https:\/\/doi\.org\/10\.13039\//.test(iri)) return "Crossref Funder ID";
  if (/^https:\/\/ror\.org\//.test(iri)) return "ROR";
  return "Other";
}

/**
 * DataCite `fundingReferences` from the shown grants, via the JSON-LD's
 * `MonetaryGrant` nodes (`fundingEntities`). DataCite requires `funderName`, and
 * a reference with nothing to resolve is noise — so a grant is included only
 * when it names its funder AND carries a funder identifier or an award number.
 */
function fundingReferences(cv: CanonicalCv | undefined): Record<string, unknown>[] {
  if (!cv) return [];
  const out: Record<string, unknown>[] = [];
  for (const grant of fundingEntities(cv)) {
    const funder = grant.funder as Record<string, unknown> | undefined;
    const funderName = funder?.name;
    if (typeof funderName !== "string") continue;
    const funderIri = funder?.["@id"];
    const awardNumber = grant.identifier;
    if (typeof funderIri !== "string" && typeof awardNumber !== "string") continue;
    const ref: Record<string, unknown> = { funderName };
    if (typeof funderIri === "string") {
      ref.funderIdentifier = funderIri;
      ref.funderIdentifierType = funderIdentifierType(funderIri);
    }
    if (typeof awardNumber === "string") ref.awardNumber = awardNumber;
    ref.awardTitle = grant.name;
    out.push(ref);
  }
  return out;
}

/**
 * The DataCite JSON:API payload for one snapshot. Pure — the unit test pins the
 * shape. `event: "publish"` registers a FINDABLE DOI at once (a draft would not
 * resolve). The DOI suffix is left to DataCite (auto-generated under `prefix`)
 * so the app never has to reserve or guess one.
 *
 * Everything beyond the minimal record is ALREADY PUBLIC data from the frozen
 * page: the creator's ROR-identified affiliation, the shown works' DOIs, and
 * the grants' funder / award identifiers. Relation type for the works is
 * `References`, not `HasPart`: a CV is a document that CITES the researcher's
 * outputs — the articles are not parts of the CV text, and `HasPart` would
 * assert a whole/part composition that DataCite consumers (and the works'
 * own registrants) would rightly reject. `References` is the DataCite relation
 * for "this resource cites that one", which is exactly what a CV does.
 */
export function buildDataciteDoiPayload(
  input: SnapshotDoiInput,
  prefix: string,
): Record<string, unknown> {
  const creator: Record<string, unknown> = {
    name: input.ownerName.trim() || "Researcher",
    nameType: "Personal",
  };
  if (input.orcid) {
    creator.nameIdentifiers = [
      {
        nameIdentifier: `https://orcid.org/${input.orcid}`,
        nameIdentifierScheme: "ORCID",
        schemeUri: "https://orcid.org",
      },
    ];
  }
  const affiliation = creatorAffiliation(input.cv);
  if (affiliation) creator.affiliation = affiliation;

  const attributes: Record<string, unknown> = {
    prefix,
    event: "publish",
    creators: [creator],
    titles: [{ title: snapshotDoiTitle(input.ownerName, input.version) }],
    publisher: "SigmaCV",
    publicationYear: input.year,
    types: { resourceTypeGeneral: "Text", resourceType: "Curriculum vitae" },
    url: input.url,
    version: String(input.version),
  };

  const related: Record<string, unknown>[] = [];
  if (input.previousDoi) {
    related.push({
      relatedIdentifier: input.previousDoi,
      relatedIdentifierType: "DOI",
      relationType: "IsNewVersionOf",
    });
  }
  for (const doi of input.cv ? visibleWorkDois(input.cv, MAX_RELATED_WORK_DOIS) : []) {
    related.push({
      relatedIdentifier: doi,
      relatedIdentifierType: "DOI",
      relationType: "References",
    });
  }
  if (related.length > 0) attributes.relatedIdentifiers = related;

  const funding = fundingReferences(input.cv);
  if (funding.length > 0) attributes.fundingReferences = funding;

  return { data: { type: "dois", attributes } };
}

/** Pull the minted DOI out of a DataCite response body, whatever plausible
 *  shape it takes (`data.id`, `data.attributes.doi`); null when absent. */
function doiFromResponse(body: unknown): string | null {
  if (!body || typeof body !== "object") return null;
  const data = (body as { data?: unknown }).data;
  if (!data || typeof data !== "object") return null;
  const d = data as { id?: unknown; attributes?: { doi?: unknown } };
  const candidate = d.attributes?.doi ?? d.id;
  return typeof candidate === "string" && candidate.includes("/") ? candidate.toLowerCase() : null;
}

/** Request headers shared by the mint and the tombstone calls. */
function dataciteHeaders(env: Env): Record<string, string> {
  const auth = Buffer.from(`${env.DATACITE_REPOSITORY_ID}:${env.DATACITE_PASSWORD}`).toString(
    "base64",
  );
  return {
    Authorization: `Basic ${auth}`,
    "Content-Type": "application/vnd.api+json",
    Accept: "application/vnd.api+json",
    "User-Agent": `SigmaCV (mailto:${env.OPENALEX_MAILTO})`,
  };
}

/**
 * Register a findable DOI for one snapshot. Never throws; see the module notes
 * for the disabled + fail-soft contract. `env` is injectable for tests.
 */
export async function mintSnapshotDoi(
  input: SnapshotDoiInput,
  env: Env = getEnv(),
): Promise<MintResult> {
  if (!doiMintingEnabled(env)) return { ok: false, reason: "disabled" };
  const payload = buildDataciteDoiPayload(input, env.DATACITE_PREFIX!);
  try {
    const res = await resilientFetch(DATACITE_DOIS_URL, {
      method: "POST",
      // A mint is not idempotent — never retry a POST that may have succeeded.
      retries: 0,
      timeoutMs: 20_000,
      headers: dataciteHeaders(env),
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      // Status only — a DataCite error body can echo the request, never log it
      // alongside anything that could identify the credentials.
      logger.warn("datacite.mint_failed", { status: res.status, version: input.version });
      return { ok: false, reason: `http-${res.status}` };
    }
    const body: unknown = await res.json().catch(() => null);
    const doi = doiFromResponse(body);
    if (!doi) {
      logger.warn("datacite.mint_no_doi_in_response", { version: input.version });
      return { ok: false, reason: "no-doi-in-response" };
    }
    logger.info("datacite.mint_ok", { doi, version: input.version });
    return { ok: true, doi };
  } catch (err) {
    logger.warn("datacite.mint_error", { err, version: input.version });
    return { ok: false, reason: "network" };
  }
}

/** A stored DOI must look like `10.<4-9 digits>/<non-blank suffix>` before it
 *  is ever spliced into a request path. */
const DOI_RE = /^(10\.\d{4,9})\/(\S+)$/;

/** What a withdrawal needs: the DOI, and the owner's name while it is still
 *  known (the cron retry queue holds none — see `cv/doiWithdrawals.ts`). */
export interface TombstoneInput {
  doi: string;
  ownerName?: string;
}

/** The neutral title a withdrawn record carries instead of the owner's. */
const WITHDRAWN_TITLE = "Withdrawn CV version";

/**
 * Withdraw a minted snapshot DOI on account deletion: hide the record
 * (findable → registered, so it leaves DataCite search and the metadata APIs
 * but keeps resolving), repoint it at the static {@link WITHDRAWN_PATH} page,
 * and MINIMISE it. The record itself stays with DataCite — a DOI is a
 * persistence promise — which is the state the owner consented to when
 * minting and the privacy notice describes; but nothing beyond DataCite's
 * mandatory fields need survive. So the same PUT clears the referenced works
 * and the funding (`relatedIdentifiers: []`, `fundingReferences: []`),
 * replaces the title with {@link WITHDRAWN_TITLE}, and reduces the creator to
 * a bare name — no ORCID, no affiliation. `publisher` / `publicationYear` /
 * `types` are untouched, so the record stays schema-valid (`creators` and
 * `titles` stay non-empty). When the name is no longer known (a cron retry
 * from the queue, which holds no personal data) the creator becomes the
 * "Researcher" placeholder: minimised further, never left as it was.
 *
 * Never throws and never blocks the deletion it precedes: disabled → no-op,
 * malformed DOI → refused before any request, HTTP / network failure → logged
 * and reported (the caller queues the DOI for retry). The update IS idempotent
 * (same target state), so transient errors are retried, unlike the mint.
 * `env` is injectable for tests.
 *
 * TODO(verify-live): the `findable → registered` transition via
 * `event: "hide"` on a PUT, and clearing list attributes with `[]`, follow the
 * DataCite REST docs; confirm both against `api.test.datacite.org` before
 * setting credentials.
 */
export async function tombstoneSnapshotDoi(
  input: TombstoneInput,
  env: Env = getEnv(),
): Promise<TombstoneResult> {
  if (!doiMintingEnabled(env)) return { ok: false, reason: "disabled" };
  const doi = input.doi;
  const m = DOI_RE.exec(doi.trim().toLowerCase());
  if (!m) {
    logger.warn("datacite.tombstone_bad_doi");
    return { ok: false, reason: "bad-doi" };
  }
  const path = `${m[1]}/${encodeURIComponent(m[2]!)}`;
  const payload = {
    data: {
      type: "dois",
      attributes: {
        event: "hide",
        url: absoluteUrl(WITHDRAWN_PATH),
        creators: [{ name: input.ownerName?.trim() || "Researcher" }],
        titles: [{ title: WITHDRAWN_TITLE }],
        relatedIdentifiers: [],
        fundingReferences: [],
      },
    },
  };
  try {
    const res = await resilientFetch(`${DATACITE_DOIS_URL}/${path}`, {
      method: "PUT",
      retries: 1,
      timeoutMs: 15_000,
      headers: dataciteHeaders(env),
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      logger.warn("datacite.tombstone_failed", { status: res.status, doi });
      return { ok: false, reason: `http-${res.status}` };
    }
    logger.info("datacite.tombstone_ok", { doi });
    return { ok: true };
  } catch (err) {
    logger.warn("datacite.tombstone_error", { err, doi });
    return { ok: false, reason: "network" };
  }
}
