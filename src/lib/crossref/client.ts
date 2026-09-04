import { resilientFetch } from "@/lib/http";
import { logger } from "@/lib/log";
import { normalizeOrcid } from "@/lib/openalex/types";
import { normDoi, type DoiRelation } from "@/lib/canonical/duplicates";
import { extractCreditRoles, type CreditRole } from "@/lib/canonical/credit";
import type { CslItem } from "@/types/csl";

/**
 * Crossref REST API — bibliographic metadata GAP-FILL by DOI.
 *
 * OpenAlex is the primary works source, but it occasionally lacks the journal
 * name, volume/issue or page range (common for chapters, conference papers and
 * older records). Crossref can return CSL-JSON directly via content negotiation,
 * so we fetch it for works that have a DOI but are missing those fields and fill
 * ONLY the gaps — never overwriting data OpenAlex already provided.
 *
 * Free, no auth. We join the polite pool with a `mailto`. Every call fails soft
 * (returns null) so a Crossref hiccup never breaks a sync.
 */

const CROSSREF_API = "https://api.crossref.org/works";
const CSL_ACCEPT = "application/vnd.citationstyles.csl+json";
// A single CSL record is small; cap the body to reject a pathological response.
const MAX_BYTES = 200_000;

/** A DOI is "10.<registrant>/<suffix>". Reject anything else before building a URL. */
const DOI_RE = /^10\.\d{4,9}\/\S+$/;

/** The subset of CSL fields we trust Crossref to supply as gap-fill. */
export type CrossrefGapFields = Pick<
  CslItem,
  "container-title" | "volume" | "issue" | "page" | "ISSN" | "publisher"
>;

function firstString(value: unknown): string | undefined {
  if (typeof value === "string") return value.trim() || undefined;
  if (Array.isArray(value)) {
    const first = value.find((v) => typeof v === "string" && v.trim());
    return typeof first === "string" ? first.trim() : undefined;
  }
  return undefined;
}

function issnList(value: unknown): string | string[] | undefined {
  if (typeof value === "string") return value.trim() || undefined;
  if (Array.isArray(value)) {
    const list = value.filter((v): v is string => typeof v === "string" && !!v.trim());
    return list.length ? list : undefined;
  }
  return undefined;
}

/**
 * Fetch Crossref CSL-JSON for a DOI and return only the bibliographic gap-fill
 * fields (or null on any failure / non-CSL response).
 */
export async function fetchCrossrefGapFields(
  doi: string,
  mailto: string,
): Promise<CrossrefGapFields | null> {
  const bare = doi
    .trim()
    .toLowerCase()
    .replace(/^https?:\/\/(dx\.)?doi\.org\//i, "");
  if (!DOI_RE.test(bare)) return null;

  const url = new URL(`${CROSSREF_API}/${encodeURIComponent(bare)}`);
  url.searchParams.set("mailto", mailto);

  try {
    const res = await resilientFetch(url, {
      headers: { Accept: CSL_ACCEPT },
      next: { revalidate: 86_400 }, // bibliographic metadata is effectively static
      timeoutMs: 12_000,
    });
    if (!res.ok) return null;

    const len = Number(res.headers.get("content-length"));
    if (Number.isFinite(len) && len > MAX_BYTES) return null;
    const body = await res.text();
    if (body.length > MAX_BYTES) return null;

    const data = JSON.parse(body) as Record<string, unknown>;
    const out: CrossrefGapFields = {};
    const container = firstString(data["container-title"]);
    if (container) out["container-title"] = container;
    const volume = firstString(data.volume);
    if (volume) out.volume = volume;
    const issue = firstString(data.issue);
    if (issue) out.issue = issue;
    const page = firstString(data.page);
    if (page) out.page = page;
    const issn = issnList(data.ISSN);
    if (issn) out.ISSN = issn;
    const publisher = firstString(data.publisher);
    if (publisher) out.publisher = publisher;

    return Object.keys(out).length > 0 ? out : null;
  } catch (err) {
    logger.warn("crossref.fetch_failed", { err });
    return null;
  }
}

// ── Abstract gap-fill (Crossref JATS abstract → bounded plain text) ───────────

/** Cap on the extracted abstract (chars) — matches the OpenAlex reconstruction cap. */
const ABSTRACT_MAX = 5000;

/** A single code point from a numeric entity, or a space for an invalid value. */
function safeCodePoint(n: number): string {
  if (!Number.isInteger(n) || n < 0 || n > 0x10ffff) return " ";
  try {
    return String.fromCodePoint(n);
  } catch {
    /* v8 ignore next -- the range guard above already excludes the throwing cases */
    return " ";
  }
}

/**
 * Crossref's `message.abstract` is JATS XML (e.g. `<jats:p>Background…</jats:p>`).
 * Reduce it to bounded plain text: drop a redundant leading "Abstract" heading, strip
 * all tags, decode the basic + numeric entities, collapse whitespace, cap. Pure;
 * exported for testing.
 */
export function crossrefAbstractText(jats: string): string {
  const decoded = jats
    .replace(/<jats:title>\s*abstract\s*<\/jats:title>/gi, " ")
    .replace(/<[^>]+>/g, " ") // strip JATS / HTML tags
    .replace(/&#x([0-9a-fA-F]+);/g, (_, h: string) => safeCodePoint(parseInt(h, 16)))
    .replace(/&#(\d+);/g, (_, d: string) => safeCodePoint(Number(d)))
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&amp;/g, "&") // decode &amp; LAST so "&amp;lt;" → "&lt;", never "<"
    .replace(/\s+/g, " ")
    .trim();
  if (!decoded) return "";
  return decoded.length > ABSTRACT_MAX ? `${decoded.slice(0, ABSTRACT_MAX).trimEnd()}…` : decoded;
}

/**
 * Fetch a work's abstract from Crossref by DOI — gap-fill for works OpenAlex has no
 * abstract for. Uses `select=abstract` so the response is tiny (many may be issued
 * per sync). Returns bounded plain text, or null on miss / failure / no abstract.
 * Joins the polite pool; fails soft.
 */
export async function fetchCrossrefAbstract(doi: string, mailto: string): Promise<string | null> {
  const bare = doi
    .trim()
    .toLowerCase()
    .replace(/^https?:\/\/(dx\.)?doi\.org\//i, "");
  if (!DOI_RE.test(bare)) return null;

  const url = new URL(`${CROSSREF_API}/${encodeURIComponent(bare)}`);
  url.searchParams.set("select", "abstract");
  url.searchParams.set("mailto", mailto);

  try {
    const res = await resilientFetch(url, {
      next: { revalidate: 86_400 },
      timeoutMs: 12_000,
    });
    if (!res.ok) return null;
    const body = await res.text();
    if (body.length > MAX_BYTES) return null;
    const data = JSON.parse(body) as { message?: { abstract?: unknown } };
    const raw = data.message?.abstract;
    if (typeof raw !== "string" || !raw.trim()) return null;
    return crossrefAbstractText(raw) || null;
  } catch (err) {
    logger.warn("crossref.abstract_fetch_failed", { err });
    return null;
  }
}

/**
 * Whether Crossref records this DOI as RETRACTED. Checks both retraction
 * pathways in the default Crossref JSON (not CSL): `message.updated-by[]` with
 * `type === "retraction"` (publisher- or Retraction-Watch-sourced) and
 * `message.relation["is-retracted-by"]`. Joins the polite pool and fails soft
 * (returns false) so a Crossref hiccup never breaks a sync.
 */
export async function fetchRetractionStatus(doi: string, mailto: string): Promise<boolean> {
  const bare = doi
    .trim()
    .toLowerCase()
    .replace(/^https?:\/\/(dx\.)?doi\.org\//i, "");
  if (!DOI_RE.test(bare)) return false;

  const url = new URL(`${CROSSREF_API}/${encodeURIComponent(bare)}`);
  url.searchParams.set("mailto", mailto);

  try {
    const res = await resilientFetch(url, {
      next: { revalidate: 86_400 },
      timeoutMs: 12_000,
    });
    if (!res.ok) return false;
    const message =
      (JSON.parse(await res.text()) as { message?: Record<string, unknown> }).message ?? {};
    const updatedBy = message["updated-by"];
    if (
      Array.isArray(updatedBy) &&
      updatedBy.some((u) => (u as { type?: unknown } | null)?.type === "retraction")
    ) {
      return true;
    }
    const relation = message.relation as Record<string, unknown> | undefined;
    const retractedBy = relation?.["is-retracted-by"];
    return Array.isArray(retractedBy) ? retractedBy.length > 0 : Boolean(retractedBy);
  } catch (err) {
    logger.warn("crossref.retraction_fetch_failed", { err });
    return false;
  }
}

// ── Relation lookup: preprint ↔ published-version links (duplicate detection) ─

/** Crossref `relation` keys that mean "the same work, a different version". */
const RELATION_KINDS: Record<string, DoiRelation["kind"]> = {
  "is-preprint-of": "preprint-pair",
  "has-preprint": "preprint-pair",
  "is-version-of": "version",
  "has-version": "version",
};

function relationDois(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  const out: string[] = [];
  for (const entry of value) {
    const rec = asRecord(entry);
    if (rec?.["id-type"] === "doi" && typeof rec.id === "string") {
      const norm = normDoi(rec.id);
      if (norm) out.push(norm);
    }
  }
  return out;
}

/**
 * The publisher-asserted preprint/version relationships for a DOI, from
 * Crossref's `message.relation`. This is the gold-standard signal for the
 * preprint↔published-version duplicate (different DOIs, so identifier matching
 * can't catch it). Normalized DOIs out. Fails soft → [] (a miss just leaves the
 * pair to the heuristic tiers). Cached 24h (bibliographic data is static).
 */
export async function fetchCrossrefRelations(doi: string, mailto: string): Promise<DoiRelation[]> {
  const bare = normDoi(doi);
  if (!bare || !DOI_RE.test(bare)) return [];

  const url = new URL(`${CROSSREF_API}/${encodeURIComponent(bare)}`);
  url.searchParams.set("mailto", mailto);
  // Only the relation field is needed — keep the response tiny (a full work
  // record is tens of kB; we may issue dozens of these per sync).
  url.searchParams.set("select", "relation");

  try {
    const res = await resilientFetch(url, {
      next: { revalidate: 86_400 },
      timeoutMs: 12_000,
    });
    if (!res.ok) return [];
    const body = await res.text();
    if (body.length > MAX_BYTES) return [];
    const data = JSON.parse(body) as { message?: { relation?: Record<string, unknown> } };
    const relation = data.message?.relation;
    if (!relation) return [];
    const out: DoiRelation[] = [];
    const seen = new Set<string>();
    for (const [key, kind] of Object.entries(RELATION_KINDS)) {
      for (const target of relationDois(relation[key])) {
        if (seen.has(target)) continue;
        seen.add(target);
        out.push({ target, kind });
      }
    }
    return out;
  } catch (err) {
    logger.warn("crossref.relations_fetch_failed", { err });
    return [];
  }
}

// ── Grant Linking System: grants registered against a researcher's ORCID ─────

/** Cap for the grant LIST response (≤50 small records). */
const MAX_GRANT_LIST_BYTES = 2_000_000;

/** A registered grant from the Crossref Grant Linking System (`type:grant`). */
export interface CrossrefGrant {
  /** The grant's own DOI (e.g. "10.35802/218300"). */
  doi: string;
  /** The funder's award number, when present. */
  award?: string;
  title: string;
  funderName?: string;
  /** Open Funder Registry DOI (e.g. "10.13039/100010269"), when present. */
  funderId?: string;
  startYear?: number;
  endYear?: number;
}

function asRecord(v: unknown): Record<string, unknown> | undefined {
  return typeof v === "object" && v !== null && !Array.isArray(v)
    ? (v as Record<string, unknown>)
    : undefined;
}

/** Year from a Crossref `{ "date-parts": [[YYYY, MM, DD]] }` value. */
function firstYearFromDateParts(v: unknown): number | undefined {
  const dateParts = asRecord(v)?.["date-parts"];
  const first = Array.isArray(dateParts) ? dateParts[0] : undefined;
  const year = Array.isArray(first) ? first[0] : undefined;
  return typeof year === "number" ? year : undefined;
}

/** Map one Crossref `type:grant` work to a normalized {@link CrossrefGrant}. */
function parseGrantItem(raw: unknown): CrossrefGrant | null {
  const work = asRecord(raw);
  const doi = typeof work?.DOI === "string" ? work.DOI : undefined;
  if (!work || !doi) return null;
  // `project` is an array (always one element in practice); its fields optional.
  const project = Array.isArray(work.project) ? asRecord(work.project[0]) : undefined;
  const titleEntry =
    project && Array.isArray(project["project-title"])
      ? asRecord(project["project-title"][0])
      : undefined;
  const title = typeof titleEntry?.title === "string" ? titleEntry.title : undefined;
  if (!title) return null;
  const funding =
    project && Array.isArray(project.funding) ? asRecord(project.funding[0]) : undefined;
  const funder = asRecord(funding?.funder);
  const funderName = typeof funder?.name === "string" ? funder.name : undefined;
  const funderIds = Array.isArray(funder?.id) ? funder.id : [];
  const funderDoiEntry = funderIds.map(asRecord).find((e) => e?.["id-type"] === "DOI");
  const funderId = typeof funderDoiEntry?.id === "string" ? funderDoiEntry.id : undefined;
  return {
    doi,
    award: typeof work.award === "string" ? work.award : undefined,
    title,
    funderName,
    funderId,
    startYear:
      firstYearFromDateParts(project?.["award-start"]) ?? firstYearFromDateParts(work.issued),
    endYear: firstYearFromDateParts(project?.["award-end"]),
  };
}

/**
 * Grants registered against the person's ORCID in the Crossref Grant Linking
 * System (`type:grant`). ORCID-matched (the funder deposited the iD), so these
 * are reliable enough to auto-include. Fails soft → []. Coverage is sparse (a
 * growing set of funders), so this SUPPLEMENTS the ORCID-funding + OpenAlex
 * grant signals — it never replaces them.
 */
export async function fetchCrossrefGrantsByOrcid(
  orcid: string,
  mailto: string,
): Promise<CrossrefGrant[]> {
  const bare = normalizeOrcid(orcid);
  if (!bare) return [];

  const url = new URL(CROSSREF_API);
  url.searchParams.set("filter", `orcid:${bare},type:grant`);
  url.searchParams.set("rows", "50");
  url.searchParams.set("mailto", mailto);

  try {
    const res = await resilientFetch(url, {
      next: { revalidate: 86_400 },
      timeoutMs: 12_000,
    });
    if (!res.ok) return [];
    const body = await res.text();
    /* v8 ignore next -- defensive cap on a pathological response */
    if (body.length > MAX_GRANT_LIST_BYTES) return [];
    const data = JSON.parse(body) as { message?: { items?: unknown[] } };
    const items = data.message?.items;
    const list = Array.isArray(items) ? items : [];
    const out: CrossrefGrant[] = [];
    for (const item of list) {
      const grant = parseGrantItem(item);
      if (grant) out.push(grant);
    }
    return out;
  } catch (err) {
    logger.warn("crossref.grants_fetch_failed", { err });
    return [];
  }
}

// ── Open peer reviews registered against a researcher's ORCID ────────────────

/**
 * ASSUMED response shape (the dev machine has no outbound internet, so this
 * was written against the public Crossref REST API docs, not a live call).
 * TODO(verify-live): confirm against
 *   GET https://api.crossref.org/works?filter=orcid:<iD>,type:peer-review&rows=200&cursor=*
 * that each `message.items[]` peer-review work carries:
 *   DOI, title[] (string[]), container-title[] (string[]), URL,
 *   issued / created { "date-parts": [[YYYY, M, D]] },
 *   author[] with `ORCID` ("http://orcid.org/…") + given/family,
 *   review { type, stage, recommendation, "competing-interest-statement", … },
 *   relation { "is-review-of": [{ id, "id-type": "doi" }] },
 * and that `message["next-cursor"]` is present for deep paging. Every field is
 * read defensively: a missing/odd one is simply left undefined; only the DOI
 * is required.
 */

/** Rows per page; Crossref caps `rows` at 1000, 200 keeps each body small. */
const PEER_REVIEW_ROWS = 200;
/** Deep-paging guard (200 × 3 = 600 reviews — far beyond any real reviewer). */
const PEER_REVIEW_MAX_PAGES = 3;
/** Cap on one LIST page (≤200 small records). */
const MAX_PEER_REVIEW_LIST_BYTES = 4_000_000;

/** A DOI-bearing open peer review from Crossref (`type:peer-review`). */
export interface CrossrefPeerReview {
  /** The review's own DOI (bare, lower-cased). */
  doi: string;
  title?: string;
  /** The venue / platform the review was published on (`container-title`). */
  venue?: string;
  year?: number;
  url?: string;
  /** `review.type` (e.g. "referee-report", "editor-report"), when present. */
  reviewType?: string;
  /** `review.stage` ("pre-publication" / "post-publication"), when present. */
  stage?: string;
  /** `review.recommendation` ("major-revision", "accept", …), when present. */
  recommendation?: string;
  /** DOI of the work reviewed (`relation["is-review-of"]`), bare + lower-cased. */
  reviewOf?: string;
  /** The account holder's name as printed on the review (matched by ORCID). */
  reviewer?: { given?: string; family?: string };
}

/** The first DOI-typed target of a Crossref `relation[<key>]` list, normalized. */
function firstRelationDoi(relation: unknown, key: string): string | undefined {
  return relationDois(asRecord(relation)?.[key])[0];
}

/** The contributor entry whose ORCID is the account holder's (identifier match only). */
function findContributorByOrcid(
  authors: unknown,
  bareOrcid: string,
): Record<string, unknown> | undefined {
  if (!Array.isArray(authors)) return undefined;
  for (const a of authors) {
    const rec = asRecord(a);
    const id = typeof rec?.ORCID === "string" ? normalizeOrcid(rec.ORCID) : "";
    if (rec && id && id === bareOrcid) return rec;
  }
  return undefined;
}

/** Map one Crossref `type:peer-review` work to a {@link CrossrefPeerReview}. */
function parsePeerReviewItem(raw: unknown, bareOrcid: string): CrossrefPeerReview | null {
  const work = asRecord(raw);
  const doi = typeof work?.DOI === "string" ? normDoi(work.DOI) : undefined;
  if (!work || !doi) return null;
  const review = asRecord(work.review);
  const self = findContributorByOrcid(work.author, bareOrcid);
  const given = typeof self?.given === "string" ? self.given.trim() : "";
  const family = typeof self?.family === "string" ? self.family.trim() : "";
  const out: CrossrefPeerReview = {
    doi,
    title: firstString(work.title),
    venue: firstString(work["container-title"]),
    year: firstYearFromDateParts(work.issued) ?? firstYearFromDateParts(work.created),
    url: typeof work.URL === "string" && /^https?:\/\//i.test(work.URL) ? work.URL : undefined,
    reviewType: firstString(review?.type),
    stage: firstString(review?.stage),
    recommendation: firstString(review?.recommendation),
    reviewOf: firstRelationDoi(work.relation, "is-review-of"),
  };
  if (given || family) {
    out.reviewer = { ...(given ? { given } : {}), ...(family ? { family } : {}) };
  }
  return out;
}

/**
 * DOI-bearing open peer reviews (`type:peer-review`) registered against the
 * person's ORCID in Crossref — publisher-deposited referee reports (eLife, PeerJ,
 * F1000, BMC, MDPI …). ORCID-matched (the publisher deposited the iD), so these
 * auto-include like the Crossref grants. Cursor-paginated (≤3 pages of 200),
 * de-duplicated by DOI, fails soft → []. Coverage is small (few publishers
 * register reviews), so this SUPPLEMENTS the ORCID per-venue counts.
 */
export async function fetchCrossrefPeerReviewsByOrcid(
  orcid: string,
  mailto: string,
): Promise<CrossrefPeerReview[]> {
  const bare = normalizeOrcid(orcid);
  if (!bare) return [];

  const out: CrossrefPeerReview[] = [];
  const seen = new Set<string>();
  let cursor: string | null = "*";
  try {
    for (let page = 0; page < PEER_REVIEW_MAX_PAGES && cursor; page += 1) {
      const url = new URL(CROSSREF_API);
      url.searchParams.set("filter", `orcid:${bare},type:peer-review`);
      url.searchParams.set("rows", String(PEER_REVIEW_ROWS));
      url.searchParams.set("cursor", cursor);
      url.searchParams.set("mailto", mailto);
      const res = await resilientFetch(url, {
        next: { revalidate: 86_400 },
        timeoutMs: 12_000,
      });
      if (!res.ok) break;
      const body = await res.text();
      if (body.length > MAX_PEER_REVIEW_LIST_BYTES) break;
      const data = JSON.parse(body) as { message?: unknown };
      const message = asRecord(data.message);
      const items = Array.isArray(message?.items) ? message.items : [];
      for (const item of items) {
        const review = parsePeerReviewItem(item, bare);
        if (review && !seen.has(review.doi)) {
          seen.add(review.doi);
          out.push(review);
        }
      }
      const next = message?.["next-cursor"];
      // A short page is the last one; Crossref also keeps returning a cursor on
      // an exhausted result set, so the row count is the reliable stop signal.
      cursor = items.length >= PEER_REVIEW_ROWS && typeof next === "string" && next ? next : null;
    }
  } catch (err) {
    logger.warn("crossref.peer_reviews_fetch_failed", { err });
  }
  return out;
}

// ── CRediT contributor roles for the account holder on one deposited work ────

/**
 * ASSUMED response shape — TODO(verify-live): Crossref's metadata schema 5.4
 * accepts CRediT roles per contributor, but the JSON API's rendering of them is
 * not yet documented; this reads `message.author[]` (selected with
 * `select=author`) and hands the OWNER's entry (matched by `ORCID`, never by
 * name) to {@link extractCreditRoles}, which accepts every plausible shape:
 * `role: string[]`, `role: {value|role|name, vocab}[]`, `contributor-role`,
 * `roles`. Returns `null` when the work has no roles for the owner (or on any
 * failure), so the caller never overwrites anything on a miss. Fails soft.
 */
export async function fetchCrossrefCreditRoles(
  doi: string,
  orcid: string,
  mailto: string,
): Promise<CreditRole[] | null> {
  const bare = normDoi(doi);
  const bareOrcid = normalizeOrcid(orcid);
  if (!bare || !DOI_RE.test(bare) || !bareOrcid) return null;

  const url = new URL(`${CROSSREF_API}/${encodeURIComponent(bare)}`);
  url.searchParams.set("select", "author");
  url.searchParams.set("mailto", mailto);

  try {
    const res = await resilientFetch(url, {
      next: { revalidate: 86_400 },
      timeoutMs: 12_000,
    });
    if (!res.ok) return null;
    const body = await res.text();
    if (body.length > MAX_BYTES) return null;
    const data = JSON.parse(body) as { message?: { author?: unknown } };
    const self = findContributorByOrcid(data.message?.author, bareOrcid);
    if (!self) return null;
    const roles = extractCreditRoles(self);
    return roles.length > 0 ? roles : null;
  } catch (err) {
    logger.warn("crossref.credit_fetch_failed", { err });
    return null;
  }
}
