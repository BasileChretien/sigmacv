import { getEnv } from "@/lib/env";
import { resilientFetch } from "@/lib/http";
import { logger } from "@/lib/log";
import { normalizeOrcid } from "@/lib/openalex/types";

/**
 * ORCID public-API client for the user's self-asserted **employments** and
 * **fundings**. These are the reliable, person-attributable sources for the CV's
 * Positions and Grants sections — unlike OpenAlex `awards`, which list funding
 * acknowledged on a paper (often a co-author's).
 *
 * Uses a client_credentials `/read-public` token (the app's ORCID API client).
 * Reads only PUBLIC records. Every call fails soft (returns []), so a transient
 * ORCID outage never breaks a sync.
 */

export interface OrcidPosition {
  /** ORCID put-code — stable id for this record (used for re-sync dedupe). */
  putCode: string;
  organization: string;
  roleTitle?: string;
  department?: string;
  startYear?: number;
  endYear?: number;
  /** ROR id of the canonicalized organization, set during ROR enrichment. */
  rorId?: string;
}

export interface OrcidFunding {
  putCode: string;
  title: string;
  organization?: string;
  /** ORCID funding type: grant | contract | award | salary-award. */
  type?: string;
  startYear?: number;
  endYear?: number;
  /**
   * Disambiguated funding-organization identifier when ORCID has one, prefixed
   * with its source — e.g. "FUNDREF:http://dx.doi.org/10.13039/501100001665",
   * "ROR:https://ror.org/…", "GRID:grid.…". Undefined when the funder is a
   * free-text org with no disambiguation. Drives the interoperable `funderId`.
   */
  funderId?: string;
  /** Grant / award number from the funding's external identifiers, if present. */
  awardId?: string;
}

function bases(): { token: string; pub: string } {
  const sandbox = getEnv().ORCID_ENVIRONMENT === "sandbox";
  return sandbox
    ? { token: "https://sandbox.orcid.org/oauth/token", pub: "https://pub.sandbox.orcid.org/v3.0" }
    : { token: "https://orcid.org/oauth/token", pub: "https://pub.orcid.org/v3.0" };
}

// read-public tokens are extremely long-lived; cache per process (keyed by env).
let cachedToken: { key: string; token: string } | null = null;

async function getReadPublicToken(): Promise<string> {
  const env = getEnv();
  const key = `${env.ORCID_ENVIRONMENT}:${env.ORCID_CLIENT_ID}`;
  if (cachedToken?.key === key) return cachedToken.token;

  const res = await resilientFetch(bases().token, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Accept: "application/json",
    },
    body: new URLSearchParams({
      client_id: env.ORCID_CLIENT_ID,
      client_secret: env.ORCID_CLIENT_SECRET,
      grant_type: "client_credentials",
      scope: "/read-public",
    }),
    timeoutMs: 12_000,
  });
  if (!res.ok) throw new Error(`ORCID token request failed (${res.status})`);
  const data = (await res.json()) as { access_token?: string };
  if (!data.access_token) throw new Error("ORCID token response had no access_token");
  cachedToken = { key, token: data.access_token };
  return data.access_token;
}

async function orcidGet<T>(orcid: string, path: string): Promise<T> {
  const token = await getReadPublicToken();
  const url = `${bases().pub}/${normalizeOrcid(orcid)}/${path}`;
  const res = await resilientFetch(url, {
    headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
    next: { revalidate: 3600 },
    timeoutMs: 12_000,
  });
  if (!res.ok) throw new Error(`ORCID ${path} request failed (${res.status})`);
  return (await res.json()) as T;
}

/* eslint-disable @typescript-eslint/no-explicit-any */
function toArray<T>(v: T | T[] | null | undefined): T[] {
  return Array.isArray(v) ? v : v ? [v] : [];
}

function yearOf(date: any): number | undefined {
  const raw = date?.year?.value;
  if (raw == null) return undefined;
  const n = Number(raw);
  return Number.isFinite(n) ? n : undefined;
}

function nonEmpty(s: unknown): string | undefined {
  return typeof s === "string" && s.trim() ? s.trim() : undefined;
}

/**
 * Generic reader for ORCID's "affiliation" endpoints, which all share the same
 * shape: affiliation-group[].summaries[].<summaryKey> with organization +
 * role-title + department + dates + put-code. Covers employments, educations,
 * qualifications, distinctions, memberships, services, invited-positions.
 * Fails soft → [].
 */
async function fetchOrcidAffiliations(
  orcid: string,
  path: string,
  summaryKey: string,
): Promise<OrcidPosition[]> {
  try {
    const data = await orcidGet<any>(orcid, path);
    const out: OrcidPosition[] = [];
    for (const group of toArray(data?.["affiliation-group"])) {
      for (const s of toArray(group?.summaries)) {
        const e = s?.[summaryKey];
        const org = nonEmpty(e?.organization?.name);
        const putCode = e?.["put-code"];
        if (!org || putCode == null) continue;
        out.push({
          putCode: String(putCode),
          organization: org,
          roleTitle: nonEmpty(e?.["role-title"]),
          department: nonEmpty(e?.["department-name"]),
          startYear: yearOf(e?.["start-date"]),
          endYear: yearOf(e?.["end-date"]),
        });
      }
    }
    return out;
  } catch (err) {
    logger.warn("orcid.affiliations_fetch_failed", { path, err });
    return [];
  }
}

/** PUBLIC employment history (fails soft → []). */
export function fetchOrcidPositions(orcid: string): Promise<OrcidPosition[]> {
  return fetchOrcidAffiliations(orcid, "employments", "employment-summary");
}

/** PUBLIC education + qualification records. */
export async function fetchOrcidEducation(orcid: string): Promise<OrcidPosition[]> {
  const [edu, quals] = await Promise.all([
    fetchOrcidAffiliations(orcid, "educations", "education-summary"),
    fetchOrcidAffiliations(orcid, "qualifications", "qualification-summary"),
  ]);
  return [...edu, ...quals];
}

/** PUBLIC awards / distinctions. */
export function fetchOrcidDistinctions(orcid: string): Promise<OrcidPosition[]> {
  return fetchOrcidAffiliations(orcid, "distinctions", "distinction-summary");
}

/** PUBLIC memberships + service roles. */
export async function fetchOrcidService(orcid: string): Promise<OrcidPosition[]> {
  const [memberships, services] = await Promise.all([
    fetchOrcidAffiliations(orcid, "memberships", "membership-summary"),
    fetchOrcidAffiliations(orcid, "services", "service-summary"),
  ]);
  return [...memberships, ...services];
}

/** PUBLIC invited positions (visiting roles etc.). */
export function fetchOrcidInvitedPositions(orcid: string): Promise<OrcidPosition[]> {
  return fetchOrcidAffiliations(orcid, "invited-positions", "invited-position-summary");
}

/**
 * PUBLIC peer-review activity. ORCID already groups reviews per VENUE (each
 * `group`'s external-id is the journal's ISSN), so we count per group and keep
 * that ISSN. The convening-organization (often the publisher / Publons-Clarivate)
 * is only a FALLBACK label — the journal NAME isn't in ORCID and is resolved
 * downstream from the ISSN (see fetchJournalNamesByIssn).
 */
export interface OrcidPeerReviewGroup {
  /** Journal ISSN from the ORCID group external-id / review-group-id, if any. */
  issn?: string;
  /** Resolved journal name (filled downstream); falls back to `organization`. */
  journal?: string;
  /** Convening organization / publisher — the fallback display label. */
  organization: string;
  count: number;
}

function issnFromGroupId(value: unknown): string | undefined {
  const v = nonEmpty(value as string | undefined);
  return v && /^issn:/i.test(v) ? v.slice(5).trim() : undefined;
}

export async function fetchOrcidPeerReviews(
  orcid: string,
): Promise<OrcidPeerReviewGroup[]> {
  try {
    const data = await orcidGet<any>(orcid, "peer-reviews");
    const out: OrcidPeerReviewGroup[] = [];
    for (const g of toArray(data?.group)) {
      // The group-level external-id is normally the journal ISSN.
      let issn: string | undefined;
      for (const eid of toArray(g?.["external-ids"]?.["external-id"])) {
        issn = issnFromGroupId(eid?.["external-id-value"]);
        if (issn) break;
      }
      let count = 0;
      let organization: string | undefined;
      for (const prg of toArray(g?.["peer-review-group"])) {
        for (const s of toArray(prg?.["peer-review-summary"])) {
          count += 1;
          organization ??= nonEmpty(s?.["convening-organization"]?.name);
          issn ??= issnFromGroupId(s?.["review-group-id"]);
        }
      }
      if (count > 0) {
        out.push({
          issn,
          organization: organization ?? "Journals & conferences",
          count,
        });
      }
    }
    return out.sort((a, b) => b.count - a.count);
  } catch (err) {
    logger.warn("orcid.peer_reviews_fetch_failed", { err });
    return [];
  }
}

/**
 * Disambiguated funder identifier from an ORCID organization block, prefixed
 * with its source (FUNDREF / ROR / GRID / RINGGOLD) so the identifier scheme is
 * unambiguous downstream. Undefined for a free-text organization with no
 * disambiguation — we never fabricate an id.
 */
function funderIdOf(org: any): string | undefined {
  const d = org?.["disambiguated-organization"];
  const id = nonEmpty(d?.["disambiguated-organization-identifier"]);
  if (!id) return undefined;
  const source = nonEmpty(d?.["disambiguation-source"]);
  return source ? `${source}:${id}` : id;
}

/** First grant/award number from a funding's external identifiers, if any. */
function awardIdOf(f: any): string | undefined {
  for (const e of toArray(f?.["external-ids"]?.["external-id"])) {
    const type = nonEmpty(e?.["external-id-type"])?.toLowerCase();
    // ORCID uses "grant_number" for the award number; accept it (or any value).
    if (type === "grant_number") {
      const v = nonEmpty(e?.["external-id-value"]);
      if (v) return v;
    }
  }
  // Fall back to the first external-id value of any type (still a real award ref).
  for (const e of toArray(f?.["external-ids"]?.["external-id"])) {
    const v = nonEmpty(e?.["external-id-value"]);
    if (v) return v;
  }
  return undefined;
}

/** Fetch the user's PUBLIC funding/grants from ORCID (fails soft → []). */
export async function fetchOrcidFundings(orcid: string): Promise<OrcidFunding[]> {
  try {
    const data = await orcidGet<any>(orcid, "fundings");
    const out: OrcidFunding[] = [];
    for (const group of toArray(data?.group)) {
      for (const f of toArray(group?.["funding-summary"])) {
        const title = nonEmpty(f?.title?.title?.value);
        const putCode = f?.["put-code"];
        if (!title || putCode == null) continue;
        out.push({
          putCode: String(putCode),
          title,
          organization: nonEmpty(f?.organization?.name),
          type: nonEmpty(f?.type),
          startYear: yearOf(f?.["start-date"]),
          endYear: yearOf(f?.["end-date"]),
          funderId: funderIdOf(f?.organization),
          awardId: awardIdOf(f),
        });
      }
    }
    return out;
  } catch (err) {
    logger.warn("orcid.fundings_fetch_failed", { err });
    return [];
  }
}
