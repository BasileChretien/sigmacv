import { getEnv, type Env } from "@/lib/env";
import { resilientFetch } from "@/lib/http";
import { logger } from "@/lib/log";

/**
 * DataCite DOI minting for FROZEN CV snapshots (open-science roadmap C5) — the
 * write side of the DataCite integration (`client.ts` is the read side).
 *
 * FLAG-GATED + DORMANT: unless ALL of `DATACITE_REPOSITORY_ID`,
 * `DATACITE_PASSWORD` and `DATACITE_PREFIX` are set, {@link mintSnapshotDoi}
 * returns `{ ok: false, reason: "disabled" }` WITHOUT touching the network
 * (the same spirit as the OpenAlex curation push and the EPO client). The
 * credentials are read server-side only and never reach the client or the logs.
 *
 * FAIL-SOFT: a network error / non-2xx / unparseable body yields `ok: false`
 * with a short machine reason (logged, never thrown) — the caller records
 * `doiState: "failed"` and the owner can retry. The POST is sent with NO retry:
 * a DOI registration is not idempotent, and a retried 5xx could double-mint.
 *
 * TODO(verify-live): the request/response shapes below follow the DataCite
 * REST API v2 docs (https://support.datacite.org/docs/api-create-dois) —
 * `POST https://api.datacite.org/dois`, JSON:API body
 * `{ data: { type: "dois", attributes: { prefix | doi, event, creators, titles,
 * publisher, publicationYear, types, url, relatedIdentifiers } } }`, basic auth
 * `REPOSITORY_ID:PASSWORD`, and a `201` whose body carries the minted DOI at
 * `data.id` / `data.attributes.doi`. Written offline; parsed defensively
 * (several plausible shapes accepted). Check against the live API — ideally the
 * test endpoint `https://api.test.datacite.org` first — before setting creds.
 */

/** Production DataCite REST API. */
export const DATACITE_DOIS_URL = "https://api.datacite.org/dois";

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
}

export type MintResult = { ok: true; doi: string } | { ok: false; reason: string };

/** True when all three DataCite settings are present (minting live). */
export function doiMintingEnabled(env: Env = getEnv()): boolean {
  return Boolean(env.DATACITE_REPOSITORY_ID && env.DATACITE_PASSWORD && env.DATACITE_PREFIX);
}

/** The DataCite title for a snapshot: "<name> — academic CV, snapshot v<n>". */
export function snapshotDoiTitle(ownerName: string, version: number): string {
  return `${ownerName.trim() || "Researcher"} — academic CV, snapshot v${version}`;
}

/**
 * The minimal DataCite JSON:API payload for one snapshot. Pure — the unit test
 * pins the shape. `event: "publish"` registers a FINDABLE DOI at once (a draft
 * would not resolve). The DOI suffix is left to DataCite (auto-generated under
 * `prefix`) so the app never has to reserve or guess one.
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
  if (input.previousDoi) {
    attributes.relatedIdentifiers = [
      {
        relatedIdentifier: input.previousDoi,
        relatedIdentifierType: "DOI",
        relationType: "IsNewVersionOf",
      },
    ];
  }
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
  const auth = Buffer.from(`${env.DATACITE_REPOSITORY_ID}:${env.DATACITE_PASSWORD}`).toString(
    "base64",
  );
  try {
    const res = await resilientFetch(DATACITE_DOIS_URL, {
      method: "POST",
      // A mint is not idempotent — never retry a POST that may have succeeded.
      retries: 0,
      timeoutMs: 20_000,
      headers: {
        Authorization: `Basic ${auth}`,
        "Content-Type": "application/vnd.api+json",
        Accept: "application/vnd.api+json",
        "User-Agent": `SigmaCV (mailto:${env.OPENALEX_MAILTO})`,
      },
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
